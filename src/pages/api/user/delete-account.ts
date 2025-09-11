import type { APIRoute } from 'astro';
import type { Env } from '../../../lib/database';
import { getAuthService, getSessionFromRequest, clearSessionCookie } from '../../../lib/auth';
import { createDatabaseService } from '../../../lib/database';

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any)?.runtime?.env as Env;
  if (!env) {
    return new Response(JSON.stringify({ error: 'Environment not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get authenticated user
  const sessionId = getSessionFromRequest(request);
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const authService = getAuthService(env);
  const currentUser = await authService.getCurrentUser(sessionId);
  if (!currentUser) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const db = createDatabaseService(env);

  try {
    const body = await request.json();
    const { confirmationEmail, reason } = body;

    // Verify email confirmation
    if (confirmationEmail !== currentUser.email) {
      return new Response(JSON.stringify({ 
        error: 'Email confirmation does not match account email' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log deletion request for audit purposes
    console.log(`Account deletion requested: ${currentUser.id} (${currentUser.email}) - Reason: ${reason || 'No reason provided'}`);

    // Before deletion, handle Stripe subscription cancellation if needed
    if (currentUser.stripe_customer_id) {
      try {
        // Note: In production, you would cancel Stripe subscriptions here
        // For now, we'll just log it
        console.log(`Stripe customer ${currentUser.stripe_customer_id} needs subscription cancellation`);
        
        // Mark subscriptions as cancelled in our database
        await db.cancelUserSubscriptions(currentUser.id);
      } catch (stripeError) {
        console.error('Error handling Stripe cancellation:', stripeError);
        // Continue with deletion even if Stripe fails
      }
    }

    // Perform cascading deletion (foreign keys should handle most of this)
    // The database schema has CASCADE deletes, but let's be explicit
    
    // 1. Delete user sessions (will log user out)
    await db.deleteUserSessions(currentUser.id);
    
    // 2. Delete user projects and revisions
    await db.deleteUserProjects(currentUser.id);
    
    // 3. Delete usage records
    await db.deleteUsageRecords(currentUser.id);
    
    // 4. Delete billing records (but keep for legal compliance period)
    // Note: In production, you might want to anonymize rather than delete
    await db.anonymizeBillingRecords(currentUser.id);
    
    // 5. Finally, delete the user profile
    await db.deleteUserProfile(currentUser.id);

    // Clear session cookie in response
    const response = new Response(JSON.stringify({ 
      success: true,
      message: 'Account successfully deleted',
      deletedAt: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

    clearSessionCookie(response);
    
    return response;

  } catch (error) {
    console.error('Account deletion error:', error);
    
    // Log the error but don't expose internal details
    return new Response(JSON.stringify({ 
      error: 'Failed to delete account',
      details: 'An internal error occurred. Please contact support if this persists.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
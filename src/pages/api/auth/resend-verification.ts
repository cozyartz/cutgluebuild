import type { APIRoute } from 'astro';
import { getAuthService, getSessionFromRequest } from '../../../lib/auth';
import { getDatabase, type Env } from '../../../lib/database';
import { mailerSendService } from '../../../lib/mailersend-service';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
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

    // Check if email is already verified
    if (currentUser.profile?.email_verified) {
      return new Response(JSON.stringify({ 
        error: 'Email is already verified' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const database = getDatabase(env);

    // Check for recent verification emails (rate limiting)
    const recentVerification = await database.db
      .prepare('SELECT created_at FROM email_verifications WHERE user_id = ? AND created_at > ? ORDER BY created_at DESC LIMIT 1')
      .bind(currentUser.id, new Date(Date.now() - 5 * 60 * 1000).toISOString()) // 5 minutes ago
      .first();

    if (recentVerification) {
      return new Response(JSON.stringify({ 
        error: 'Please wait before requesting another verification email' 
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours

    // Store verification token
    await database.db
      .prepare(`
        INSERT INTO email_verifications (id, user_id, email, token, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(
        crypto.randomUUID(),
        currentUser.id,
        currentUser.email,
        verificationToken,
        expiresAt,
        new Date().toISOString()
      )
      .run();

    // Send verification email
    const success = await mailerSendService.sendEmailVerification(
      currentUser.email,
      verificationToken
    );

    if (success) {
      return new Response(JSON.stringify({ 
        message: 'Verification email sent! Please check your inbox.' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ 
        error: 'Failed to send verification email. Please try again.' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Resend verification error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
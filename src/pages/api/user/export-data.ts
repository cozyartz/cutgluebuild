import type { APIRoute } from 'astro';
import type { Env } from '../../../lib/database';
import { getAuthService, getSessionFromRequest } from '../../../lib/auth';
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
    // Collect all user data for GDPR export
    const exportData = {
      exportDate: new Date().toISOString(),
      userId: currentUser.id,
      profile: {
        id: currentUser.id,
        email: currentUser.email,
        fullName: currentUser.full_name,
        avatarUrl: currentUser.avatar_url,
        subscriptionTier: currentUser.subscription_tier,
        createdAt: currentUser.created_at
      },
      projects: [],
      usageRecords: [],
      billingData: null
    };

    // Get user projects
    const projects = await db.getUserProjects(currentUser.id);
    exportData.projects = projects.map(project => ({
      id: project.id,
      title: project.title,
      description: project.description,
      projectType: project.project_type,
      createdAt: project.created_at,
      // Note: SVG data and metadata excluded for file size reasons
      // but can be included if specifically requested
      hasRevisions: project.current_revision_id ? true : false
    }));

    // Get usage records (last 12 months)
    const twelveMonthsAgo = Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60);
    const usageRecords = await db.getUsageRecords(currentUser.id, twelveMonthsAgo);
    exportData.usageRecords = usageRecords;

    // Get billing data if user has stripe customer ID
    if (currentUser.stripe_customer_id) {
      try {
        const billingCustomer = await db.getBillingCustomer(currentUser.id);
        const subscriptions = await db.getUserSubscriptions(currentUser.id);
        const invoices = await db.getUserInvoices(currentUser.id);
        
        exportData.billingData = {
          customer: billingCustomer,
          subscriptions: subscriptions,
          invoices: invoices.map(invoice => ({
            id: invoice.id,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: invoice.status,
            periodStart: invoice.period_start,
            periodEnd: invoice.period_end,
            createdAt: invoice.created_at
          }))
        };
      } catch (error) {
        console.log('No billing data found for user');
      }
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `cutgluebuild-data-export-${timestamp}.json`;

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Data export error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to export data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Also support GET for convenience
export const GET: APIRoute = async ({ request, locals }) => {
  return POST({ request, locals });
};
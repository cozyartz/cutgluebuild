// Stripe Customer Portal API
// Creates a customer portal session for billing management

import type { APIRoute } from 'astro';
import { createStripeService } from '../../../lib/stripe-service';
import { getDatabase } from '../../../lib/database';
import { getAuthService, getSessionFromRequest } from '../../../lib/auth';
import type { Env } from '../../../lib/database';

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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const authService = getAuthService(env);
    const currentUser = await authService.getCurrentUser(sessionId);
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize services
    const stripeService = createStripeService(env);
    if (!stripeService) {
      return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const database = getDatabase(env);

    // Get billing customer
    const billingCustomer = await database.getBillingCustomer(currentUser.id);
    if (!billingCustomer) {
      return new Response(JSON.stringify({ error: 'No billing customer found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create portal session
    const returnUrl = `${env.BASE_URL || 'https://cutgluebuild.com'}/account`;
    
    const portalSession = await stripeService.createPortalSession(
      billingCustomer.stripe_customer_id,
      returnUrl
    );

    return new Response(JSON.stringify({
      portal_url: portalSession.url
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Portal creation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create portal session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
// Subscription Management API
// Get current subscription details for authenticated user

import type { APIRoute } from 'astro';
import { createStripeService } from '../../../lib/stripe-service';
import { getDatabase } from '../../../lib/database';
import { getAuthService, getSessionFromRequest } from '../../../lib/auth';
import type { Env } from '../../../lib/database';

export const GET: APIRoute = async ({ request, locals }) => {
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
    const database = getDatabase(env);

    // Get subscription from database
    const billingSubscription = await database.getBillingSubscription(currentUser.id);
    
    if (!billingSubscription) {
      return new Response(JSON.stringify({
        subscription: null,
        tier: 'free',
        status: 'free'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get fresh data from Stripe if service is available
    let stripeSubscription = null;
    if (stripeService) {
      stripeSubscription = await stripeService.getSubscription(billingSubscription.stripe_subscription_id);
    }

    // Get invoices
    const invoices = await database.getBillingInvoices(currentUser.id);

    return new Response(JSON.stringify({
      subscription: {
        id: billingSubscription.stripe_subscription_id,
        status: stripeSubscription?.status || billingSubscription.status,
        tier: billingSubscription.tier,
        current_period_start: billingSubscription.current_period_start,
        current_period_end: billingSubscription.current_period_end,
        cancel_at_period_end: billingSubscription.cancel_at_period_end,
        trial_end: billingSubscription.trial_end,
        created: billingSubscription.created_at
      },
      invoices: invoices.map(invoice => ({
        id: invoice.stripe_invoice_id,
        amount_paid: invoice.amount_paid,
        amount_due: invoice.amount_due,
        currency: invoice.currency,
        status: invoice.status,
        invoice_url: invoice.invoice_url,
        invoice_pdf: invoice.invoice_pdf,
        period_start: invoice.period_start,
        period_end: invoice.period_end,
        created: invoice.created_at
      })),
      tier: billingSubscription.tier,
      status: stripeSubscription?.status || billingSubscription.status
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Subscription fetch error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
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

    // Parse request body
    const { immediately = false } = await request.json().catch(() => ({}));

    // Initialize services
    const stripeService = createStripeService(env);
    if (!stripeService) {
      return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const database = getDatabase(env);

    // Get subscription
    const billingSubscription = await database.getBillingSubscription(currentUser.id);
    if (!billingSubscription) {
      return new Response(JSON.stringify({ error: 'No active subscription found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Cancel subscription in Stripe
    const canceledSubscription = await stripeService.cancelSubscription(
      billingSubscription.stripe_subscription_id,
      immediately
    );

    // Update subscription in database
    await database.updateBillingSubscription(billingSubscription.stripe_subscription_id, {
      status: canceledSubscription.status as any,
      cancel_at_period_end: canceledSubscription.cancel_at_period_end
    });

    return new Response(JSON.stringify({
      success: true,
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        cancel_at_period_end: canceledSubscription.cancel_at_period_end,
        current_period_end: canceledSubscription.current_period_end
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to cancel subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
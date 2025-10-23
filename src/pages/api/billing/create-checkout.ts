// Stripe Checkout Session Creation API
// Creates a checkout session for subscription billing

import type { APIRoute } from 'astro';
import { createStripeService, STRIPE_PRICES } from '../../../lib/stripe-service';
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

    // Parse request body
    const { tier, billing_cycle = 'monthly' } = await request.json();
    
    if (!tier || !['starter', 'professional'].includes(tier)) {
      return new Response(JSON.stringify({ error: 'Invalid tier specified' }), {
        status: 400,
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

    // Get or create Stripe customer
    let billingCustomer = await database.getBillingCustomer(currentUser.id);
    let stripeCustomer;

    if (!billingCustomer) {
      // Create new Stripe customer
      stripeCustomer = await stripeService.createCustomer(currentUser.profile!);
      billingCustomer = await database.getBillingCustomer(currentUser.id);
    } else {
      // Get existing Stripe customer
      stripeCustomer = await stripeService.getCustomer(billingCustomer.stripe_customer_id);
    }

    if (!stripeCustomer) {
      return new Response(JSON.stringify({ error: 'Failed to create or retrieve customer' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Determine price ID based on tier and billing cycle
    let priceId: string;
    if (tier === 'starter') {
      priceId = billing_cycle === 'yearly' ? STRIPE_PRICES.STARTER_YEARLY : STRIPE_PRICES.STARTER_MONTHLY;
    } else if (tier === 'professional') {
      priceId = billing_cycle === 'yearly' ? STRIPE_PRICES.PROFESSIONAL_YEARLY : STRIPE_PRICES.PROFESSIONAL_MONTHLY;
    } else {
      return new Response(JSON.stringify({ error: 'Invalid tier' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create checkout session
    const successUrl = `${env.BASE_URL || 'https://cutgluebuild.com'}/account?checkout=success`;
    const cancelUrl = `${env.BASE_URL || 'https://cutgluebuild.com'}/pricing?checkout=canceled`;

    const checkoutSession = await stripeService.createCheckoutSession({
      customerId: stripeCustomer.id,
      priceId,
      successUrl,
      cancelUrl,
      userId: currentUser.id,
      trialDays: 14 // 14-day free trial
    });

    return new Response(JSON.stringify({
      checkout_url: checkoutSession.url,
      session_id: checkoutSession.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Checkout creation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
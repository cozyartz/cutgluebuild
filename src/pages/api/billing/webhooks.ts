// Stripe Webhooks Handler
// Processes Stripe webhook events for subscription lifecycle management

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createStripeService } from '../../../lib/stripe-service';
import { getDatabase } from '../../../lib/database';
import type { Env } from '../../../lib/database';
import { mailerSendService } from '../../../lib/mailersend-service';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any)?.runtime?.env as Env;
    if (!env) {
      return new Response('Environment not available', { status: 500 });
    }

    // Initialize Stripe service
    const stripeService = createStripeService(env);
    if (!stripeService) {
      console.error('Stripe service not configured');
      return new Response('Stripe not configured', { status: 500 });
    }

    // Get webhook signature and payload
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      console.error('Missing Stripe signature');
      return new Response('Missing signature', { status: 400 });
    }

    const webhookSecret = env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      return new Response('Webhook secret not configured', { status: 500 });
    }

    // Get raw body
    const payload = await request.text();

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripeService.verifyWebhookSignature(payload, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return new Response('Invalid signature', { status: 400 });
    }

    // Initialize database
    const database = getDatabase(env);

    // Check for duplicate events
    const existingEvent = await database.db
      .prepare('SELECT id FROM billing_webhook_events WHERE stripe_event_id = ?')
      .bind(event.id)
      .first();

    if (existingEvent) {
      console.log('Duplicate webhook event, ignoring:', event.id);
      return new Response('OK', { status: 200 });
    }

    // Log the webhook event
    await database.db
      .prepare(`
        INSERT INTO billing_webhook_events (id, stripe_event_id, event_type, processed, created_at)
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(crypto.randomUUID(), event.id, event.type, 0, new Date().toISOString())
      .run();

    // Process webhook event
    try {
      await processWebhookEvent(event, database, stripeService);
      
      // Mark as processed
      await database.db
        .prepare('UPDATE billing_webhook_events SET processed = 1, processed_at = ? WHERE stripe_event_id = ?')
        .bind(new Date().toISOString(), event.id)
        .run();

      console.log('Successfully processed webhook:', event.type, event.id);
      
    } catch (error) {
      console.error('Error processing webhook:', event.type, event.id, error);
      
      // Log the error
      await database.db
        .prepare('UPDATE billing_webhook_events SET error_message = ? WHERE stripe_event_id = ?')
        .bind(error instanceof Error ? error.message : 'Unknown error', event.id)
        .run();

      // Don't return error to Stripe to avoid retries for unrecoverable errors
      if (error instanceof Error && error.message.includes('not found')) {
        return new Response('OK', { status: 200 });
      }
      
      return new Response('Webhook processing failed', { status: 500 });
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response('Internal server error', { status: 500 });
  }
};

async function processWebhookEvent(
  event: Stripe.Event, 
  database: any,
  stripeService: any
): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event, database);
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event, database, stripeService);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event, database);
      break;

    case 'customer.deleted':
      await handleCustomerDeleted(event, database);
      break;

    case 'invoice.created':
    case 'invoice.updated':
    case 'invoice.payment_succeeded':
    case 'invoice.payment_failed':
      await handleInvoiceEvent(event, database);
      break;

    case 'payment_method.attached':
      await handlePaymentMethodAttached(event, database);
      break;

    case 'customer.updated':
      await handleCustomerUpdated(event, database);
      break;

    default:
      console.log('Unhandled webhook event type:', event.type);
  }
}

async function handleCheckoutCompleted(event: Stripe.Event, database: any): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  
  if (session.mode !== 'subscription') {
    return;
  }

  const userId = session.metadata?.user_id;
  if (!userId) {
    throw new Error('No user_id in checkout session metadata');
  }

  console.log('Checkout completed for user:', userId, 'subscription:', session.subscription);
}

async function handleSubscriptionUpdated(event: Stripe.Event, database: any, stripeService: any): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  
  // Get customer to find user
  const customer = await stripeService.getCustomer(subscription.customer as string);
  if (!customer || !customer.metadata?.user_id) {
    throw new Error('Customer not found or missing user_id');
  }

  const userId = customer.metadata.user_id;
  const tier = stripeService.getTierFromPriceId(subscription.items.data[0]?.price.id);

  // Create or update subscription record
  const existingSubscription = await database.getBillingSubscriptionByStripeId(subscription.id);
  
  const subscriptionData = {
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    status: subscription.status as any,
    tier,
    current_period_start: subscription.current_period_start,
    current_period_end: subscription.current_period_end,
    cancel_at_period_end: subscription.cancel_at_period_end,
    trial_end: subscription.trial_end || undefined,
  };

  if (existingSubscription) {
    await database.updateBillingSubscription(subscription.id, subscriptionData);
  } else {
    await database.createBillingSubscription({
      id: crypto.randomUUID(),
      ...subscriptionData
    });
  }

  // Update user's subscription tier in profile
  await database.updateProfile(userId, {
    subscription_tier: tier
  });

  // Send subscription notification email
  try {
    const profile = await database.getProfile(userId);
    if (profile) {
      const action = event.type === 'customer.subscription.created' ? 'upgraded' : 
                     subscription.status === 'canceled' ? 'cancelled' : 'upgraded';
      const planName = tier === 'maker' ? 'Maker Plan' : 
                       tier === 'pro' ? 'Pro Plan' : 'Free Plan';
      
      await mailerSendService.sendSubscriptionNotification(
        profile.email, 
        profile.full_name || 'User',
        planName,
        action
      );
    }
  } catch (emailError) {
    console.error('Failed to send subscription notification email:', emailError);
    // Don't fail the webhook for email errors
  }

  console.log('Subscription updated for user:', userId, 'tier:', tier, 'status:', subscription.status);
}

async function handleSubscriptionDeleted(event: Stripe.Event, database: any): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  
  // Update subscription status
  await database.updateBillingSubscription(subscription.id, {
    status: 'canceled'
  });

  // Get subscription to find user and downgrade to free
  const billingSubscription = await database.getBillingSubscriptionByStripeId(subscription.id);
  if (billingSubscription) {
    // Check if this was triggered by account deletion
    const isAccountDeletion = subscription.metadata?.account_deletion === 'true';
    
    if (isAccountDeletion) {
      console.log('Subscription canceled due to account deletion for user:', billingSubscription.user_id);
      // Account deletion will be handled by customer.deleted webhook
      return;
    }
    
    // Regular subscription cancellation - downgrade to free tier
    await database.updateProfile(billingSubscription.user_id, {
      subscription_tier: 'free'
    });
    
    // Reset usage quotas to free tier limits
    await database.db
      .prepare(`
        UPDATE usage_quotas 
        SET tier = 'free', reset_date = date('now'), updated_at = ?
        WHERE user_id = ?
      `)
      .bind(new Date().toISOString(), billingSubscription.user_id)
      .run();
    
    console.log('Subscription canceled for user:', billingSubscription.user_id, 'downgraded to free tier');
  }
}

async function handleInvoiceEvent(event: Stripe.Event, database: any): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  
  if (!invoice.subscription) {
    return; // Skip non-subscription invoices
  }

  // Get subscription to find user
  const billingSubscription = await database.getBillingSubscriptionByStripeId(invoice.subscription as string);
  if (!billingSubscription) {
    console.warn('Subscription not found for invoice:', invoice.id);
    return;
  }

  // Create or update invoice record
  const invoiceData = {
    id: crypto.randomUUID(),
    user_id: billingSubscription.user_id,
    stripe_invoice_id: invoice.id,
    stripe_customer_id: invoice.customer as string,
    amount_paid: invoice.amount_paid,
    amount_due: invoice.amount_due,
    currency: invoice.currency,
    status: invoice.status as any,
    invoice_url: invoice.hosted_invoice_url,
    invoice_pdf: invoice.invoice_pdf,
    period_start: invoice.period_start,
    period_end: invoice.period_end,
  };

  // Check if invoice already exists
  const existingInvoice = await database.db
    .prepare('SELECT id FROM billing_invoices WHERE stripe_invoice_id = ?')
    .bind(invoice.id)
    .first();

  if (!existingInvoice) {
    await database.createBillingInvoice(invoiceData);
    console.log('Invoice created for user:', billingSubscription.user_id, 'amount:', invoice.amount_paid / 100);
  }

  // Handle payment success - send invoice receipt
  if (event.type === 'invoice.payment_succeeded' && invoice.status === 'paid') {
    try {
      const profile = await database.getProfile(billingSubscription.user_id);
      if (profile) {
        const subscription = await database.getBillingSubscriptionByStripeId(invoice.subscription as string);
        const planName = subscription?.tier === 'maker' ? 'Maker Plan' : 
                         subscription?.tier === 'pro' ? 'Pro Plan' : 'Free Plan';
        
        await mailerSendService.sendInvoiceReceipt(
          profile.email,
          profile.full_name || 'User',
          {
            invoiceNumber: invoice.number || invoice.id,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            planName: planName,
            periodStart: new Date(invoice.period_start * 1000).toLocaleDateString(),
            periodEnd: new Date(invoice.period_end * 1000).toLocaleDateString(),
            invoiceUrl: invoice.hosted_invoice_url || ''
          }
        );
      }
    } catch (emailError) {
      console.error('Failed to send invoice receipt email:', emailError);
    }
  }

  // Handle payment failure
  if (event.type === 'invoice.payment_failed') {
    console.warn('Payment failed for user:', billingSubscription.user_id, 'invoice:', invoice.id);
    
    try {
      const profile = await database.getProfile(billingSubscription.user_id);
      if (profile) {
        await mailerSendService.sendPaymentFailedNotification(
          profile.email,
          profile.full_name || 'User',
          invoice.amount_due / 100,
          invoice.currency
        );
      }
    } catch (emailError) {
      console.error('Failed to send payment failed notification:', emailError);
    }
  }
}

async function handlePaymentMethodAttached(event: Stripe.Event, database: any): Promise<void> {
  const paymentMethod = event.data.object as Stripe.PaymentMethod;
  
  // Get customer to find user
  const billingCustomer = await database.getBillingCustomerByStripeId(paymentMethod.customer as string);
  if (!billingCustomer) {
    return;
  }

  // Store payment method info (for display purposes)
  await database.db
    .prepare(`
      INSERT OR REPLACE INTO billing_payment_methods 
      (id, user_id, stripe_payment_method_id, stripe_customer_id, type, card_brand, card_last4, card_exp_month, card_exp_year, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      crypto.randomUUID(),
      billingCustomer.user_id,
      paymentMethod.id,
      paymentMethod.customer as string,
      paymentMethod.type,
      paymentMethod.card?.brand,
      paymentMethod.card?.last4,
      paymentMethod.card?.exp_month,
      paymentMethod.card?.exp_year,
      new Date().toISOString(),
      new Date().toISOString()
    )
    .run();
}

async function handleCustomerUpdated(event: Stripe.Event, database: any): Promise<void> {
  const customer = event.data.object as Stripe.Customer;
  
  // Update billing customer record
  const billingCustomer = await database.getBillingCustomerByStripeId(customer.id);
  if (billingCustomer) {
    await database.db
      .prepare('UPDATE billing_customers SET email = ?, name = ?, updated_at = ? WHERE stripe_customer_id = ?')
      .bind(customer.email, customer.name, new Date().toISOString(), customer.id)
      .run();
  }
}

async function handleCustomerDeleted(event: Stripe.Event, database: any): Promise<void> {
  const customer = event.data.object as Stripe.Customer;
  
  // Find the user associated with this customer
  const billingCustomer = await database.getBillingCustomerByStripeId(customer.id);
  if (!billingCustomer) {
    console.warn('Customer not found for deletion:', customer.id);
    return;
  }

  const userId = billingCustomer.user_id;
  console.log('Processing account deletion for user:', userId, 'customer:', customer.id);

  try {
    // Start transaction for account deletion
    await database.db.batch([
      // Cancel all active subscriptions
      database.db.prepare(`
        UPDATE billing_subscriptions 
        SET status = 'canceled', updated_at = ?
        WHERE user_id = ? AND status != 'canceled'
      `).bind(new Date().toISOString(), userId),
      
      // Delete user sessions (log out)
      database.db.prepare('DELETE FROM user_sessions WHERE user_id = ?').bind(userId),
      
      // Delete user projects and revisions
      database.db.prepare('DELETE FROM project_revisions WHERE project_id IN (SELECT id FROM user_projects WHERE user_id = ?)').bind(userId),
      database.db.prepare('DELETE FROM user_projects WHERE user_id = ?').bind(userId),
      
      // Delete usage records
      database.db.prepare('DELETE FROM usage_records WHERE user_id = ?').bind(userId),
      database.db.prepare('DELETE FROM usage_quotas WHERE user_id = ?').bind(userId),
      
      // Delete payment methods
      database.db.prepare('DELETE FROM billing_payment_methods WHERE user_id = ?').bind(userId),
      
      // Delete billing invoices
      database.db.prepare('DELETE FROM billing_invoices WHERE user_id = ?').bind(userId),
      
      // Delete billing subscriptions
      database.db.prepare('DELETE FROM billing_subscriptions WHERE user_id = ?').bind(userId),
      
      // Delete billing customer
      database.db.prepare('DELETE FROM billing_customers WHERE user_id = ?').bind(userId),
      
      // Finally, delete the user profile
      database.db.prepare('DELETE FROM profiles WHERE id = ?').bind(userId)
    ]);

    console.log('Successfully deleted account for user:', userId);
    
    // Log the account deletion for audit purposes
    await database.db
      .prepare(`
        INSERT INTO billing_webhook_events (id, stripe_event_id, event_type, processed, processed_at, error_message)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(
        crypto.randomUUID(),
        event.id + '_account_deletion',
        'account_deleted',
        1,
        new Date().toISOString(),
        `Account deleted for user ${userId} via customer.deleted webhook`
      )
      .run();
      
  } catch (error) {
    console.error('Error during account deletion:', error);
    throw error;
  }
}
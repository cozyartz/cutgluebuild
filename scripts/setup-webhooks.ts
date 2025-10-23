import Stripe from 'stripe';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Force reload environment variables from .env file
const envPath = join(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

// Use the parsed value or fallback to process.env
const STRIPE_SECRET_KEY = envVars.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
const SITE_URL = envVars.VITE_SITE_URL || process.env.VITE_SITE_URL || 'https://cutgluebuild.com';

if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY === 'your_stripe_secret_key_here') {
  console.error('❌ Error: Please set your STRIPE_SECRET_KEY in .env file');
  console.error('   Get your keys from: https://dashboard.stripe.com/apikeys');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

// Essential webhook events for subscription management
const WEBHOOK_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  // Checkout & Payment
  'checkout.session.completed',           // New subscription created via checkout
  'checkout.session.expired',             // Checkout session expired

  // Subscription lifecycle
  'customer.subscription.created',        // Subscription created
  'customer.subscription.updated',        // Subscription updated (plan changes, renewals)
  'customer.subscription.deleted',        // Subscription cancelled
  'customer.subscription.paused',         // Subscription paused
  'customer.subscription.resumed',        // Subscription resumed
  'customer.subscription.trial_will_end', // Trial ending soon (send reminder email)

  // Payment events
  'invoice.created',                      // Invoice created
  'invoice.finalized',                    // Invoice finalized and ready for payment
  'invoice.paid',                         // Invoice successfully paid
  'invoice.payment_succeeded',            // Payment successful
  'invoice.payment_failed',               // Payment failed (retry or notify)
  'invoice.payment_action_required',      // Payment requires additional action

  // Customer management
  'customer.created',                     // New customer created
  'customer.updated',                     // Customer details updated
  'customer.deleted',                     // Customer deleted

  // Payment method events
  'payment_method.attached',              // Payment method added
  'payment_method.detached',              // Payment method removed
  'payment_method.updated',               // Payment method updated
  'payment_method.card_automatically_updated', // Card auto-updated by issuer

  // Dispute/Chargeback events
  'charge.dispute.created',               // Dispute created (chargeback)
  'charge.dispute.updated',               // Dispute updated
  'charge.dispute.closed',                // Dispute resolved
];

async function setupWebhooks() {
  console.log('\n🔔 Setting Up Stripe Webhooks\n');
  console.log('=' .repeat(60));

  const isTestMode = STRIPE_SECRET_KEY.startsWith('sk_test_');
  console.log(`Mode: ${isTestMode ? 'TEST' : 'LIVE'}`);
  console.log(`Site URL: ${SITE_URL}\n`);

  try {
    // Check existing webhooks
    console.log('📋 Checking existing webhook endpoints...\n');
    const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });

    // Determine the webhook URL based on environment
    const webhookUrl = isTestMode
      ? 'http://localhost:4321/api/billing/webhooks'  // Local development
      : `${SITE_URL}/api/billing/webhooks`;           // Production

    // Check if webhook already exists
    let existingWebhook = existingWebhooks.data.find(webhook =>
      webhook.url === webhookUrl ||
      webhook.url.includes('/api/billing/webhooks')
    );

    if (existingWebhook) {
      console.log(`✓ Found existing webhook: ${existingWebhook.url}`);
      console.log(`  Status: ${existingWebhook.status}`);
      console.log(`  Events: ${existingWebhook.enabled_events.length} events configured`);

      // Update webhook if needed
      if (existingWebhook.status !== 'enabled') {
        console.log('\n⚠️  Webhook is disabled. Enabling...');
        existingWebhook = await stripe.webhookEndpoints.update(existingWebhook.id, {
          disabled: false,
        });
        console.log('✓ Webhook enabled');
      }

      // Check if all required events are configured
      const missingEvents = WEBHOOK_EVENTS.filter(
        event => !existingWebhook!.enabled_events.includes(event)
      );

      if (missingEvents.length > 0) {
        console.log(`\n📝 Adding ${missingEvents.length} missing events...`);
        existingWebhook = await stripe.webhookEndpoints.update(existingWebhook.id, {
          enabled_events: WEBHOOK_EVENTS,
        });
        console.log('✓ Events updated');
      }

      console.log('\n✅ Webhook configuration verified!');

      if (!process.env.STRIPE_WEBHOOK_SECRET ||
          process.env.STRIPE_WEBHOOK_SECRET === 'your_stripe_webhook_secret_here') {
        console.log('\n⚠️  IMPORTANT: Add this to your .env file:');
        console.log(`STRIPE_WEBHOOK_SECRET=${existingWebhook.secret}`);
      }

    } else {
      // Create new webhook
      console.log(`📝 Creating new webhook endpoint...\n`);
      console.log(`URL: ${webhookUrl}`);
      console.log(`Events: ${WEBHOOK_EVENTS.length} events\n`);

      const webhook = await stripe.webhookEndpoints.create({
        url: webhookUrl,
        enabled_events: WEBHOOK_EVENTS,
        description: 'CutGlueBuild subscription and payment events',
        metadata: {
          environment: isTestMode ? 'test' : 'live',
          created_by: 'setup_script',
          version: '1.0.0'
        }
      });

      console.log('✅ Webhook endpoint created successfully!\n');
      console.log('Webhook Details:');
      console.log('=' .repeat(40));
      console.log(`ID: ${webhook.id}`);
      console.log(`URL: ${webhook.url}`);
      console.log(`Status: ${webhook.status}`);
      console.log(`Events: ${webhook.enabled_events.length} events configured`);

      console.log('\n🔐 IMPORTANT - Add these to your .env file:');
      console.log('=' .repeat(40));
      console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);

      if (isTestMode) {
        console.log('\n📱 For local testing with Stripe CLI:');
        console.log('1. Install Stripe CLI: https://stripe.com/docs/stripe-cli');
        console.log('2. Run: stripe listen --forward-to localhost:4321/api/billing/webhooks');
        console.log('3. Use the webhook secret from the CLI output');
      }
    }

    // List all configured events
    console.log('\n📋 Configured Webhook Events:');
    console.log('=' .repeat(40));

    const eventCategories = {
      'Checkout': ['checkout.session.completed', 'checkout.session.expired'],
      'Subscriptions': [
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'customer.subscription.paused',
        'customer.subscription.resumed',
        'customer.subscription.trial_will_end'
      ],
      'Payments': [
        'invoice.created',
        'invoice.finalized',
        'invoice.paid',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'invoice.payment_action_required'
      ],
      'Customers': [
        'customer.created',
        'customer.updated',
        'customer.deleted'
      ],
      'Payment Methods': [
        'payment_method.attached',
        'payment_method.detached',
        'payment_method.updated',
        'payment_method.card_automatically_updated'
      ],
      'Disputes': [
        'charge.dispute.created',
        'charge.dispute.updated',
        'charge.dispute.closed'
      ]
    };

    for (const [category, events] of Object.entries(eventCategories)) {
      console.log(`\n${category}:`);
      for (const event of events) {
        if (WEBHOOK_EVENTS.includes(event as any)) {
          console.log(`  ✓ ${event}`);
        }
      }
    }

    // Production readiness checklist
    if (!isTestMode) {
      console.log('\n🚀 Production Webhook Checklist:');
      console.log('=' .repeat(40));
      console.log('✓ Webhook endpoint configured');
      console.log('✓ All essential events registered');
      console.log('✓ Using LIVE mode keys');
      console.log(`✓ Production URL: ${webhookUrl}`);

      console.log('\n⚠️  Next Steps:');
      console.log('1. Ensure STRIPE_WEBHOOK_SECRET is in your production environment');
      console.log('2. Deploy your webhook handler to production');
      console.log('3. Test with a real subscription purchase');
      console.log('4. Monitor webhook logs in Stripe Dashboard');
    }

  } catch (error) {
    console.error('\n❌ Error setting up webhooks:', error);
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe Error:', error.message);
      console.error('Error Code:', error.code);
    }
    process.exit(1);
  }
}

// Run setup
setupWebhooks();
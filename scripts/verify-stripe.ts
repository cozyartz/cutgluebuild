import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY === 'your_stripe_secret_key_here') {
  console.error('❌ Error: STRIPE_SECRET_KEY not configured');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

async function verifyStripeSetup() {
  console.log('\n🔍 Verifying Stripe Configuration\n');
  console.log('=' .repeat(50));

  // Check mode
  const isTestMode = STRIPE_SECRET_KEY.startsWith('sk_test_');
  console.log(`\n📍 Environment: ${isTestMode ? 'TEST MODE' : '🚀 LIVE MODE'}`);

  try {
    // 1. Verify API key works
    console.log('\n1️⃣  API Key Validation:');
    const account = await stripe.accounts.retrieve();
    console.log(`   ✓ Connected to account: ${account.email || account.id}`);
    console.log(`   ✓ Country: ${account.country}`);
    console.log(`   ✓ Default currency: ${account.default_currency?.toUpperCase()}`);

    // 2. Check products
    console.log('\n2️⃣  Products:');
    const products = await stripe.products.list({ active: true, limit: 10 });

    if (products.data.length === 0) {
      console.log('   ⚠️  No active products found');
    } else {
      for (const product of products.data) {
        console.log(`   ✓ ${product.name} (${product.id})`);
        if (product.description) {
          console.log(`     ${product.description}`);
        }
      }
    }

    // 3. Check prices
    console.log('\n3️⃣  Active Prices:');
    const prices = await stripe.prices.list({ active: true, limit: 20 });

    if (prices.data.length === 0) {
      console.log('   ⚠️  No active prices found');
    } else {
      const sortedPrices = prices.data.sort((a, b) =>
        (a.unit_amount || 0) - (b.unit_amount || 0)
      );

      for (const price of sortedPrices) {
        const amount = price.unit_amount ? `$${(price.unit_amount / 100).toFixed(2)}` : 'Free';
        const interval = price.recurring ? `/${price.recurring.interval}` : '';
        const product = typeof price.product === 'string'
          ? price.product
          : (price.product as Stripe.Product).name;

        console.log(`   ✓ ${price.nickname || 'Unnamed'}: ${amount}${interval}`);
        console.log(`     ID: ${price.id}`);
        console.log(`     Product: ${product}`);
        if (price.metadata && Object.keys(price.metadata).length > 0) {
          console.log(`     Metadata: ${JSON.stringify(price.metadata)}`);
        }
        console.log('');
      }
    }

    // 4. Check webhooks
    console.log('4️⃣  Webhook Endpoints:');
    const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });

    if (webhooks.data.length === 0) {
      console.log('   ⚠️  No webhook endpoints configured');
      console.log('   ℹ️  Run setup-stripe.ts to create webhook endpoint');
    } else {
      for (const webhook of webhooks.data) {
        const status = webhook.status === 'enabled' ? '✓' : '⚠️';
        console.log(`   ${status} ${webhook.url}`);
        console.log(`     Status: ${webhook.status}`);
        console.log(`     Events: ${webhook.enabled_events.length} events configured`);

        if (webhook.status !== 'enabled') {
          console.log('     ⚠️  Webhook is not enabled!');
        }
      }
    }

    // 5. Check recent subscriptions
    console.log('\n5️⃣  Recent Subscriptions:');
    const subscriptions = await stripe.subscriptions.list({ limit: 5 });

    if (subscriptions.data.length === 0) {
      console.log('   ℹ️  No subscriptions found');
    } else {
      for (const sub of subscriptions.data) {
        const customer = typeof sub.customer === 'string'
          ? sub.customer
          : (sub.customer as Stripe.Customer).email || 'Unknown';
        console.log(`   • ${customer}: ${sub.status}`);

        for (const item of sub.items.data) {
          const price = item.price;
          const amount = price.unit_amount ? `$${(price.unit_amount / 100).toFixed(2)}` : 'Free';
          const interval = price.recurring ? `/${price.recurring.interval}` : '';
          console.log(`     - ${price.nickname || 'Subscription'}: ${amount}${interval}`);
        }
      }
    }

    // 6. Configuration recommendations
    console.log('\n6️⃣  Configuration Check:');

    const hasProducts = products.data.length > 0;
    const hasPrices = prices.data.length > 0;
    const hasWebhooks = webhooks.data.length > 0;
    const hasEnabledWebhooks = webhooks.data.some(w => w.status === 'enabled');

    if (!hasProducts || !hasPrices) {
      console.log('   ⚠️  Missing products or prices. Run setup-stripe.ts to configure.');
    } else {
      console.log('   ✓ Products and prices configured');
    }

    if (!hasWebhooks || !hasEnabledWebhooks) {
      console.log('   ⚠️  Webhook endpoint missing or disabled');
    } else {
      console.log('   ✓ Webhook endpoint configured and enabled');
    }

    // Check environment variables
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const publishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;

    if (!webhookSecret || webhookSecret === 'your_stripe_webhook_secret_here') {
      console.log('   ⚠️  STRIPE_WEBHOOK_SECRET not configured in .env');
    } else {
      console.log('   ✓ Webhook secret configured');
    }

    if (!publishableKey || publishableKey === 'your_stripe_publishable_key_here') {
      console.log('   ⚠️  VITE_STRIPE_PUBLISHABLE_KEY not configured in .env');
    } else {
      console.log('   ✓ Publishable key configured');
    }

    // Final status
    console.log('\n' + '=' .repeat(50));

    const isReady = hasProducts && hasPrices && hasEnabledWebhooks &&
                    webhookSecret && webhookSecret !== 'your_stripe_webhook_secret_here' &&
                    publishableKey && publishableKey !== 'your_stripe_publishable_key_here';

    if (isReady) {
      if (isTestMode) {
        console.log('✅ Stripe TEST environment is fully configured!');
        console.log('\nNext steps:');
        console.log('1. Test the checkout flow with test card: 4242 4242 4242 4242');
        console.log('2. When ready, switch to live keys and run setup again');
      } else {
        console.log('🚀 Stripe LIVE environment is ready for production!');
        console.log('\n⚠️  Remember: You are using LIVE keys - real charges will occur!');
      }
    } else {
      console.log('⚠️  Stripe setup is incomplete. Please:');
      console.log('1. Run scripts/setup-stripe.ts to configure products and prices');
      console.log('2. Update your .env file with the correct keys');
      console.log('3. Run this verification again');
    }

  } catch (error) {
    console.error('\n❌ Error verifying Stripe setup:', error);

    if (error instanceof Stripe.errors.StripeError) {
      if (error.type === 'StripeAuthenticationError') {
        console.error('\n⚠️  Authentication failed. Please check your STRIPE_SECRET_KEY.');
      } else {
        console.error(`Stripe Error: ${error.message}`);
      }
    }
  }
}

// Run verification
verifyStripeSetup();
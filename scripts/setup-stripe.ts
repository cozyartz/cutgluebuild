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

if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY === 'your_stripe_secret_key_here') {
  console.error('❌ Error: Please set your STRIPE_SECRET_KEY in .env file');
  console.error('   Get your keys from: https://dashboard.stripe.com/apikeys');
  process.exit(1);
}

// Check if we're using test or live keys
const isTestMode = STRIPE_SECRET_KEY.startsWith('sk_test_');
console.log(`\n🔑 Using ${isTestMode ? 'TEST' : 'LIVE'} Stripe keys\n`);

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

// Product and price configuration
const PRODUCTS = {
  cutgluebuild: {
    name: 'CutGlueBuild Subscription',
    description: 'AI-powered design tools for laser cutting and CNC projects',
    metadata: {
      product_type: 'subscription'
    }
  }
};

const PRICES = {
  maker_monthly: {
    product_key: 'cutgluebuild',
    unit_amount: 1900, // $19.00
    currency: 'usd',
    recurring: { interval: 'month' as const },
    nickname: 'Maker Monthly',
    metadata: {
      tier: 'maker',
      billing_period: 'monthly'
    }
  },
  maker_yearly: {
    product_key: 'cutgluebuild',
    unit_amount: 19000, // $190.00 (2 months free)
    currency: 'usd',
    recurring: { interval: 'year' as const },
    nickname: 'Maker Yearly',
    metadata: {
      tier: 'maker',
      billing_period: 'yearly'
    }
  },
  pro_monthly: {
    product_key: 'cutgluebuild',
    unit_amount: 4900, // $49.00
    currency: 'usd',
    recurring: { interval: 'month' as const },
    nickname: 'Pro Monthly',
    metadata: {
      tier: 'pro',
      billing_period: 'monthly'
    }
  },
  pro_yearly: {
    product_key: 'cutgluebuild',
    unit_amount: 49000, // $490.00 (2 months free)
    currency: 'usd',
    recurring: { interval: 'year' as const },
    nickname: 'Pro Yearly',
    metadata: {
      tier: 'pro',
      billing_period: 'yearly'
    }
  }
};

async function setupStripe() {
  try {
    console.log('🔍 Checking existing Stripe configuration...\n');

    // Check existing products
    console.log('📦 Checking products...');
    const existingProducts = await stripe.products.list({ limit: 100 });
    const productMap = new Map<string, Stripe.Product>();

    for (const product of existingProducts.data) {
      if (product.metadata?.product_type === 'subscription') {
        productMap.set(product.name, product);
        console.log(`   ✓ Found existing product: ${product.name} (${product.id})`);
      }
    }

    // Create or get products
    const products: Record<string, Stripe.Product> = {};

    for (const [key, config] of Object.entries(PRODUCTS)) {
      const existingProduct = productMap.get(config.name);

      if (existingProduct) {
        products[key] = existingProduct;
        console.log(`   ↳ Using existing product for ${key}`);
      } else {
        console.log(`   + Creating product: ${config.name}`);
        products[key] = await stripe.products.create(config);
        console.log(`   ✓ Created product: ${products[key].id}`);
      }
    }

    console.log('\n💰 Checking prices...');

    // Check existing prices
    const existingPrices = await stripe.prices.list({
      limit: 100,
      active: true
    });

    const priceMap = new Map<string, Stripe.Price>();

    for (const price of existingPrices.data) {
      const key = `${price.nickname}_${price.unit_amount}`;
      priceMap.set(key, price);

      if (price.nickname && price.metadata?.tier) {
        console.log(`   ✓ Found existing price: ${price.nickname} - $${(price.unit_amount || 0) / 100} (${price.id})`);
      }
    }

    // Create or verify prices
    const createdPrices: Record<string, string> = {};

    for (const [key, config] of Object.entries(PRICES)) {
      const priceKey = `${config.nickname}_${config.unit_amount}`;
      const existingPrice = priceMap.get(priceKey);

      if (existingPrice) {
        createdPrices[key] = existingPrice.id;
        console.log(`   ↳ Using existing price: ${existingPrice.id}`);
      } else {
        console.log(`   + Creating price: ${config.nickname}`);
        const price = await stripe.prices.create({
          product: products[config.product_key].id,
          unit_amount: config.unit_amount,
          currency: config.currency,
          recurring: config.recurring,
          nickname: config.nickname,
          metadata: config.metadata
        });
        createdPrices[key] = price.id;
        console.log(`   ✓ Created price: ${price.id}`);
      }
    }

    // Configure webhook endpoint if not exists
    console.log('\n🔔 Checking webhook configuration...');
    const webhookEndpoints = await stripe.webhookEndpoints.list({ limit: 10 });
    const siteUrl = process.env.VITE_SITE_URL || 'https://cutgluebuild.com';
    const webhookUrl = `${siteUrl}/api/billing/webhooks`;

    const existingWebhook = webhookEndpoints.data.find(ep =>
      ep.url === webhookUrl || ep.url.includes('/api/billing/webhooks')
    );

    if (existingWebhook) {
      console.log(`   ✓ Found existing webhook: ${existingWebhook.url}`);
      console.log(`   ↳ Status: ${existingWebhook.status}`);
      if (existingWebhook.status !== 'enabled') {
        console.log('   ⚠️  Warning: Webhook is not enabled');
      }
    } else {
      console.log(`   + Creating webhook endpoint: ${webhookUrl}`);
      const webhook = await stripe.webhookEndpoints.create({
        url: webhookUrl,
        enabled_events: [
          'checkout.session.completed',
          'customer.subscription.created',
          'customer.subscription.updated',
          'customer.subscription.deleted',
          'invoice.payment_succeeded',
          'invoice.payment_failed',
          'customer.updated',
          'payment_method.attached',
          'payment_method.detached'
        ]
      });
      console.log(`   ✓ Created webhook: ${webhook.id}`);
      console.log(`   ⚠️  IMPORTANT: Add this webhook secret to your .env file:`);
      console.log(`      STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
    }

    // Output configuration summary
    console.log('\n✅ Stripe Setup Complete!\n');
    console.log('📋 Configuration Summary:');
    console.log('========================');
    console.log(`Mode: ${isTestMode ? 'TEST' : 'LIVE'}`);
    console.log('\nPrice IDs for your application:');
    console.log('--------------------------------');

    for (const [key, priceId] of Object.entries(createdPrices)) {
      const envKey = `STRIPE_PRICE_${key.toUpperCase()}`;
      console.log(`${envKey}=${priceId}`);
    }

    console.log('\n💡 Next Steps:');
    console.log('1. Update your .env file with the price IDs above');
    console.log('2. Ensure STRIPE_WEBHOOK_SECRET is set if you created a new webhook');
    console.log('3. Test the checkout flow with a test card (4242 4242 4242 4242)');

    if (isTestMode) {
      console.log('\n⚠️  You are using TEST keys. When ready for production:');
      console.log('   1. Switch to your LIVE secret key in .env');
      console.log('   2. Run this script again to set up live products/prices');
      console.log('   3. Update your webhook endpoint for the live environment');
    } else {
      console.log('\n🚀 You are using LIVE keys. Your Stripe integration is ready for production!');
    }

  } catch (error) {
    console.error('\n❌ Error setting up Stripe:', error);
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe Error Code:', error.code);
      console.error('Stripe Error Type:', error.type);
    }
    process.exit(1);
  }
}

// Run the setup
setupStripe();
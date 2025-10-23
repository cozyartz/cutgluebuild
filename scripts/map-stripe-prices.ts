import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY === 'your_stripe_secret_key_here') {
  console.error('❌ Error: Please set your STRIPE_SECRET_KEY in .env file');
  console.error('   Get your test keys from: https://dashboard.stripe.com/test/apikeys');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

async function mapExistingPrices() {
  console.log('\n🔍 Mapping Existing Stripe Products and Prices\n');
  console.log('=' .repeat(60));

  try {
    // Get all active prices
    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ['data.product']
    });

    // Group prices by product
    const productMap = new Map<string, any[]>();

    for (const price of prices.data) {
      const product = price.product as Stripe.Product;
      const productName = product.name;

      if (!productMap.has(productName)) {
        productMap.set(productName, []);
      }

      productMap.get(productName)?.push({
        id: price.id,
        nickname: price.nickname,
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
        metadata: price.metadata
      });
    }

    console.log('\n📦 Found Products and Prices:\n');

    // Look for CutGlueBuild specific prices
    let makerMonthlyId = '';
    let makerYearlyId = '';
    let proMonthlyId = '';
    let proYearlyId = '';

    for (const [productName, productPrices] of productMap.entries()) {
      console.log(`\n${productName}:`);

      for (const price of productPrices) {
        const amount = price.amount ? `$${(price.amount / 100).toFixed(2)}` : 'Free';
        const interval = price.interval ? `/${price.interval}` : '';
        console.log(`  • ${price.nickname || 'Unnamed'}: ${amount}${interval}`);
        console.log(`    ID: ${price.id}`);

        // Try to identify the right prices based on amount
        if (price.amount === 1900 && price.interval === 'month') {
          console.log(`    ✓ Possible Maker Monthly`);
          if (!makerMonthlyId) makerMonthlyId = price.id;
        } else if (price.amount === 19000 && price.interval === 'year') {
          console.log(`    ✓ Possible Maker Yearly`);
          if (!makerYearlyId) makerYearlyId = price.id;
        } else if (price.amount === 4900 && price.interval === 'month') {
          console.log(`    ✓ Possible Pro Monthly`);
          if (!proMonthlyId) proMonthlyId = price.id;
        } else if (price.amount === 49000 && price.interval === 'year') {
          console.log(`    ✓ Possible Pro Yearly`);
          if (!proYearlyId) proYearlyId = price.id;
        }
      }
    }

    // Output configuration suggestions
    console.log('\n' + '=' .repeat(60));
    console.log('\n💡 Suggested Configuration:\n');

    if (makerMonthlyId || proMonthlyId) {
      console.log('Add these to your .env file:\n');

      if (makerMonthlyId) {
        console.log(`STRIPE_PRICE_MAKER_MONTHLY=${makerMonthlyId}`);
      }
      if (makerYearlyId) {
        console.log(`STRIPE_PRICE_MAKER_YEARLY=${makerYearlyId}`);
      }
      if (proMonthlyId) {
        console.log(`STRIPE_PRICE_PRO_MONTHLY=${proMonthlyId}`);
      }
      if (proYearlyId) {
        console.log(`STRIPE_PRICE_PRO_YEARLY=${proYearlyId}`);
      }

      console.log('\nThen update src/lib/stripe.ts with these price IDs:');
      console.log('\nFor Maker tier:');
      console.log(`  priceId: '${makerMonthlyId || 'price_maker_monthly'}',`);
      console.log('\nFor Pro tier:');
      console.log(`  priceId: '${proMonthlyId || 'price_pro_monthly'}',`);
    } else {
      console.log('No matching prices found for standard tiers.');
      console.log('\nYou can either:');
      console.log('1. Run npm run stripe:setup to create the standard prices');
      console.log('2. Manually select from the prices above and update your configuration');
    }

    // Check for webhook endpoints
    console.log('\n🔔 Checking Webhook Endpoints:\n');
    const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });

    if (webhooks.data.length === 0) {
      console.log('No webhook endpoints configured.');
      console.log('Run npm run stripe:setup to create one.');
    } else {
      for (const webhook of webhooks.data) {
        console.log(`• ${webhook.url}`);
        console.log(`  Status: ${webhook.status}`);
        if (webhook.secret) {
          console.log(`  Secret: ${webhook.secret}`);
          console.log(`  Add to .env: STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error instanceof Stripe.errors.StripeError) {
      console.error('\nMake sure your STRIPE_SECRET_KEY is correct in .env');
    }
  }
}

// Run the mapping
mapExistingPrices();
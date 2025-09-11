// Comprehensive Stripe service for SaaS billing
// Handles subscriptions, customers, payments, and usage metering

import Stripe from 'stripe';
import { getDatabase, type Env, type Profile } from './database';

export interface StripeCustomer extends Stripe.Customer {}
export interface StripeSubscription extends Stripe.Subscription {}
export interface StripePrice extends Stripe.Price {}
export interface StripeProduct extends Stripe.Product {}

export interface BillingCustomer {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface BillingSubscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  tier: 'free' | 'maker' | 'pro';
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  trial_end?: number;
  created_at: string;
  updated_at: string;
}

export interface BillingInvoice {
  id: string;
  user_id: string;
  stripe_invoice_id: string;
  stripe_customer_id: string;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  invoice_url?: string;
  invoice_pdf?: string;
  created_at: string;
}

export interface UsageRecord {
  id: string;
  user_id: string;
  feature: 'ai_generation' | 'ai_analysis' | 'template_download' | 'export_operation';
  quantity: number;
  timestamp: number;
  metadata?: string; // JSON
  created_at: string;
}

// Stripe pricing configuration
export const STRIPE_PRICES = {
  MAKER_MONTHLY: process.env.STRIPE_PRICE_MAKER_MONTHLY || 'price_maker_monthly',
  MAKER_YEARLY: process.env.STRIPE_PRICE_MAKER_YEARLY || 'price_maker_yearly',
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
  PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
  AI_USAGE: process.env.STRIPE_PRICE_AI_USAGE || 'price_ai_usage_metered',
} as const;

export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    limits: {
      ai_calls_per_day: 5,
      projects: 3,
      templates: 'basic',
      export_formats: ['svg']
    }
  },
  maker: {
    name: 'Maker',
    price_monthly: 1900, // $19.00 in cents
    limits: {
      ai_calls_per_day: 100,
      projects: 25,
      templates: 'premium',
      export_formats: ['svg', 'dxf', 'gcode']
    }
  },
  pro: {
    name: 'Pro',
    price_monthly: 4900, // $49.00 in cents
    limits: {
      ai_calls_per_day: -1, // unlimited
      projects: -1, // unlimited
      templates: 'all',
      export_formats: ['svg', 'dxf', 'gcode', 'ai', 'eps']
    }
  }
} as const;

export class StripeService {
  private stripe: Stripe;
  private env?: Env;

  constructor(secretKey: string, env?: Env) {
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    });
    this.env = env;
  }

  // Customer Management
  async createCustomer(profile: Profile): Promise<StripeCustomer> {
    const customer = await this.stripe.customers.create({
      email: profile.email,
      name: profile.full_name,
      metadata: {
        user_id: profile.id,
      }
    });

    // Save customer to database
    if (this.env) {
      const database = getDatabase(this.env);
      await database.createBillingCustomer({
        id: crypto.randomUUID(),
        user_id: profile.id,
        stripe_customer_id: customer.id,
        email: customer.email!,
        name: customer.name,
      });
    }

    return customer;
  }

  async getCustomer(customerId: string): Promise<StripeCustomer | null> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer as StripeCustomer;
    } catch (error) {
      console.error('Error retrieving customer:', error);
      return null;
    }
  }

  async updateCustomer(customerId: string, updates: Partial<Stripe.CustomerUpdateParams>): Promise<StripeCustomer> {
    return await this.stripe.customers.update(customerId, updates);
  }

  // Subscription Management
  async createCheckoutSession({
    customerId,
    priceId,
    successUrl,
    cancelUrl,
    trialDays = 14,
    userId
  }: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    trialDays?: number;
    userId: string;
  }): Promise<Stripe.Checkout.Session> {
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          user_id: userId,
        }
      },
      metadata: {
        user_id: userId,
      }
    });

    return session;
  }

  async createSubscription({
    customerId,
    priceId,
    trialDays = 14,
    userId
  }: {
    customerId: string;
    priceId: string;
    trialDays?: number;
    userId: string;
  }): Promise<StripeSubscription> {
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price: priceId,
      }],
      trial_period_days: trialDays,
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        user_id: userId,
      }
    });

    return subscription;
  }

  async getSubscription(subscriptionId: string): Promise<StripeSubscription | null> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['customer', 'latest_invoice']
      });
      return subscription;
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      return null;
    }
  }

  async updateSubscription(subscriptionId: string, updates: Stripe.SubscriptionUpdateParams): Promise<StripeSubscription> {
    return await this.stripe.subscriptions.update(subscriptionId, updates);
  }

  async cancelSubscription(subscriptionId: string, immediately = false): Promise<StripeSubscription> {
    if (immediately) {
      return await this.stripe.subscriptions.cancel(subscriptionId);
    } else {
      return await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });
    }
  }

  // Customer Portal
  async createPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    return await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  // Usage Metering
  async recordUsage(subscriptionItemId: string, quantity: number, timestamp?: number): Promise<Stripe.UsageRecord> {
    return await this.stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
      quantity,
      timestamp: timestamp || Math.floor(Date.now() / 1000),
    });
  }

  async getUsageSummary(subscriptionItemId: string): Promise<Stripe.UsageRecordSummary[]> {
    const summaries = await this.stripe.subscriptionItems.listUsageRecordSummaries(subscriptionItemId);
    return summaries.data;
  }

  // Webhook Verification
  verifyWebhookSignature(payload: string, signature: string, secret: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }

  // Invoice Management
  async getInvoice(invoiceId: string): Promise<Stripe.Invoice | null> {
    try {
      return await this.stripe.invoices.retrieve(invoiceId);
    } catch (error) {
      console.error('Error retrieving invoice:', error);
      return null;
    }
  }

  async listInvoices(customerId: string, limit = 10): Promise<Stripe.Invoice[]> {
    const invoices = await this.stripe.invoices.list({
      customer: customerId,
      limit,
    });
    return invoices.data;
  }

  // Payment Methods
  async listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    return paymentMethods.data;
  }

  // Price and Product Management
  async getPrice(priceId: string): Promise<StripePrice | null> {
    try {
      return await this.stripe.prices.retrieve(priceId);
    } catch (error) {
      console.error('Error retrieving price:', error);
      return null;
    }
  }

  async listPrices(productId?: string): Promise<StripePrice[]> {
    const prices = await this.stripe.prices.list({
      product: productId,
      active: true,
    });
    return prices.data;
  }

  // Utility Methods
  getTierFromPriceId(priceId: string): 'free' | 'maker' | 'pro' {
    if (priceId === STRIPE_PRICES.MAKER_MONTHLY || priceId === STRIPE_PRICES.MAKER_YEARLY) {
      return 'maker';
    }
    if (priceId === STRIPE_PRICES.PRO_MONTHLY || priceId === STRIPE_PRICES.PRO_YEARLY) {
      return 'pro';
    }
    return 'free';
  }

  formatAmount(amount: number, currency = 'usd'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }

  // Analytics Helpers
  async getSubscriptionMetrics(startDate: Date, endDate: Date) {
    // This would typically query your database for aggregated metrics
    // For now, we'll use Stripe's reporting API as an example
    return {
      new_subscriptions: 0,
      canceled_subscriptions: 0,
      mrr: 0,
      churn_rate: 0,
    };
  }
}

// Factory function to create Stripe service
export function createStripeService(env?: Env): StripeService | null {
  const secretKey = env?.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    console.warn('Stripe secret key not configured');
    return null;
  }

  return new StripeService(secretKey, env);
}

// Mock service for development/testing
export class MockStripeService {
  async createCustomer(profile: Profile) {
    return {
      id: 'cus_mock_' + profile.id,
      email: profile.email,
      name: profile.full_name,
    } as StripeCustomer;
  }

  async createCheckoutSession(params: any) {
    return {
      id: 'cs_mock_checkout',
      url: 'https://checkout.stripe.com/mock',
    } as Stripe.Checkout.Session;
  }

  async createPortalSession(customerId: string, returnUrl: string) {
    return {
      url: 'https://billing.stripe.com/mock',
    } as Stripe.BillingPortal.Session;
  }

  async getSubscription(subscriptionId: string) {
    return {
      id: subscriptionId,
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    } as StripeSubscription;
  }

  getTierFromPriceId(priceId: string): 'free' | 'maker' | 'pro' {
    return 'free';
  }

  formatAmount(amount: number): string {
    return `$${(amount / 100).toFixed(2)}`;
  }
}
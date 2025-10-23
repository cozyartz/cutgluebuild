import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error('Missing Stripe publishable key');
}

export const stripePromise = loadStripe(stripePublishableKey);

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  priceId: string;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
  aiToolLimit: number;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Starter',
    price: 0,
    priceId: '',
    interval: 'month',
    aiToolLimit: 5,
    features: [
      '5 AI tool uses per day',
      'Basic templates',
      'Community support',
      'Export to SVG'
    ]
  },
  {
    id: 'maker',
    name: 'Maker',
    price: 19,
    priceId: 'price_1SAyP72f9v7xz1zBobbPaT18',
    interval: 'month',
    aiToolLimit: 100,
    popular: true,
    features: [
      '100 AI tool uses per day',
      'Premium templates',
      'Project history',
      'Priority support',
      'Advanced vectorization',
      'Material recommendations'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    priceId: 'price_1SAyP72f9v7xz1zBpnNVyl2w',
    interval: 'month',
    aiToolLimit: -1, // unlimited
    features: [
      'Unlimited AI tool uses',
      'All premium templates',
      'Private community access',
      'Early feature access',
      'Custom templates',
      'API access',
      'White-label options'
    ]
  }
];

export class StripeService {
  async createCheckoutSession(priceId: string, customerId?: string) {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        customerId,
        successUrl: `${window.location.origin}/account?success=true`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    return response.json();
  }

  async createPortalSession(customerId: string) {
    const response = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        returnUrl: `${window.location.origin}/account`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create portal session');
    }

    return response.json();
  }

  getTierById(tierId: string): PricingTier | undefined {
    return PRICING_TIERS.find(tier => tier.id === tierId);
  }

  getTierByPriceId(priceId: string): PricingTier | undefined {
    return PRICING_TIERS.find(tier => tier.priceId === priceId);
  }
}

export const stripeService = new StripeService();
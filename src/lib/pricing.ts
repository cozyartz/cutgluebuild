// Centralized pricing configuration for CutGlueBuild
// Updated pricing strategy: Starter ($49) -> Professional ($99) - No Free Tier

export interface PricingTier {
  id: 'starter' | 'professional';
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  description: string;
  features: string[];
  limits: {
    ai_designs: number; // -1 = unlimited
    templates: number; // -1 = unlimited
    exports: number; // -1 = unlimited
    duration_days: number; // -1 = unlimited
  };
  stripe_price_ids: {
    monthly?: string;
    yearly?: string;
  };
  highlighted?: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    billingCycle: 'monthly',
    description: 'For makers & small workshops',
    features: [
      '25 AI designs per month',
      '100 template downloads',
      '50 exports per month',
      'Commercial license',
      'Priority support',
      '7-day money-back guarantee'
    ],
    limits: {
      ai_designs: 25,
      templates: 100,
      exports: 50,
      duration_days: -1
    },
    stripe_price_ids: {
      monthly: 'price_starter_monthly', // Replace with actual Stripe price IDs
      yearly: 'price_starter_yearly'
    },
    highlighted: true
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 99,
    billingCycle: 'monthly',
    description: 'For design professionals',
    features: [
      'Unlimited AI designs',
      'Unlimited templates & exports',
      'G-code generation',
      'Premium templates',
      'API access',
      'White-label options',
      'Priority phone support'
    ],
    limits: {
      ai_designs: -1,
      templates: -1,
      exports: -1,
      duration_days: -1
    },
    stripe_price_ids: {
      monthly: 'price_professional_monthly', // Replace with actual Stripe price IDs
      yearly: 'price_professional_yearly'
    }
  }
];

// Yearly pricing (20% discount)
export const YEARLY_PRICING_TIERS: PricingTier[] = [
  {
    ...PRICING_TIERS[0],
    price: 39, // $468/year = $39/month equivalent
    billingCycle: 'yearly',
    description: 'For makers & small workshops (Save 20%)'
  },
  {
    ...PRICING_TIERS[1],
    price: 79, // $948/year = $79/month equivalent
    billingCycle: 'yearly',
    description: 'For design professionals (Save 20%)'
  }
];

// Feature access mapping
export const FEATURE_ACCESS: Record<string, string[]> = {
  'ai_generation_unlimited': ['professional'],
  'premium_templates': ['professional'],
  'gcode_generation': ['professional'],
  'priority_support': ['starter', 'professional'],
  'commercial_license': ['starter', 'professional'],
  'api_access': ['professional'],
  'white_label': ['professional'],
  'bulk_operations': ['professional'],
  'team_collaboration': ['professional'],
  'custom_integrations': ['professional'],
  'phone_support': ['professional']
};

// Usage limits by tier
export const USAGE_LIMITS = {
  starter: {
    ai_designs: 25,
    templates: 100,
    exports: 50,
    projects: 25,
    duration_days: -1 // unlimited
  },
  professional: {
    ai_designs: -1, // unlimited
    templates: -1, // unlimited
    exports: -1, // unlimited
    projects: -1, // unlimited
    duration_days: -1 // unlimited
  }
} as const;

// Stripe webhook event types we handle
export const STRIPE_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.created',
  'customer.updated'
] as const;

// Helper functions
export function getTier(tierId: string): PricingTier | undefined {
  return PRICING_TIERS.find(tier => tier.id === tierId);
}

export function getYearlyTier(tierId: string): PricingTier | undefined {
  return YEARLY_PRICING_TIERS.find(tier => tier.id === tierId);
}

export function hasFeatureAccess(tier: string, feature: string): boolean {
  return FEATURE_ACCESS[feature]?.includes(tier) || false;
}

export function getUsageLimit(tier: string, feature: string): number {
  const limits = USAGE_LIMITS[tier as keyof typeof USAGE_LIMITS];
  return limits?.[feature as keyof typeof limits] || 0;
}

export function calculateYearlyPrice(monthlyPrice: number, discount = 0.2): number {
  return Math.round(monthlyPrice * 12 * (1 - discount));
}

export function calculateMonthlySavings(monthlyPrice: number, discount = 0.2): number {
  return Math.round(monthlyPrice * discount);
}

// ROI calculation helpers
export function calculateROI(designsPerMonth: number, hoursSavedPerDesign = 2, hourlyRate = 50): {
  monthlySavings: number;
  starterROI: number; // percentage
  professionalROI: number; // percentage
} {
  const monthlySavings = designsPerMonth * hoursSavedPerDesign * hourlyRate;
  const starterCost = 49;
  const professionalCost = 99;
  
  return {
    monthlySavings,
    starterROI: ((monthlySavings - starterCost) / starterCost) * 100,
    professionalROI: ((monthlySavings - professionalCost) / professionalCost) * 100
  };
}

// Export default configuration
export default {
  PRICING_TIERS,
  YEARLY_PRICING_TIERS,
  FEATURE_ACCESS,
  USAGE_LIMITS,
  STRIPE_WEBHOOK_EVENTS,
  getTier,
  getYearlyTier,
  hasFeatureAccess,
  getUsageLimit,
  calculateROI
};

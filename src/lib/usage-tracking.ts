// Usage Tracking and Quota Management
// Handles feature usage limits and billing integration

import { getDatabase } from './database';
import { createStripeService, SUBSCRIPTION_TIERS } from './stripe-service';
import type { Env } from './database';

export interface UsageCheck {
  allowed: boolean;
  remaining?: number;
  limit?: number;
  resetDate?: string;
  upgradeRequired?: boolean;
  message?: string;
}

export interface UsageStats {
  feature: string;
  used_today: number;
  used_this_month: number;
  limit_daily: number;
  limit_monthly: number;
  tier: string;
  reset_date: string;
}

export class UsageTracker {
  private env: Env;
  private database: any;
  private stripeService: any;

  constructor(env: Env) {
    this.env = env;
    this.database = getDatabase(env);
    this.stripeService = createStripeService(env);
  }

  async checkUsageLimit(
    userId: string, 
    feature: 'ai_generation' | 'ai_analysis' | 'template_download' | 'export_operation' | 'project_creation',
    tier?: string
  ): Promise<UsageCheck> {
    try {
      // Get user's current tier if not provided
      if (!tier) {
        const profile = await this.database.getProfile(userId);
        tier = profile?.subscription_tier || 'free';
      }

      const tierLimits = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
      if (!tierLimits) {
        return { allowed: false, message: 'Invalid subscription tier' };
      }

      // Get feature limits
      const limits = tierLimits.limits;
      let dailyLimit: number;
      let monthlyLimit: number;

      switch (feature) {
        case 'ai_generation':
        case 'ai_analysis':
          dailyLimit = limits.ai_calls_per_day;
          monthlyLimit = dailyLimit === -1 ? -1 : dailyLimit * 30; // rough monthly estimate
          break;
        case 'project_creation':
          dailyLimit = limits.projects === -1 ? -1 : Math.max(5, limits.projects / 30);
          monthlyLimit = limits.projects;
          break;
        case 'template_download':
          // Templates are based on subscription tier, not usage limits
          if (limits.templates === 'all' || limits.templates === 'premium') {
            return { allowed: true };
          } else {
            return { allowed: false, upgradeRequired: true, message: 'Premium templates require a paid plan' };
          }
        case 'export_operation':
          // Export limits based on available formats
          return { allowed: true }; // Basic exports always allowed
        default:
          return { allowed: false, message: 'Unknown feature' };
      }

      // Unlimited usage for pro tier
      if (dailyLimit === -1) {
        return { allowed: true };
      }

      // Get current usage
      const quota = await this.database.getUsageQuota(userId, feature);
      const usedToday = quota?.used_today || 0;
      const usedThisMonth = quota?.used_this_month || 0;

      // Check daily limit
      if (usedToday >= dailyLimit) {
        return {
          allowed: false,
          remaining: 0,
          limit: dailyLimit,
          resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          upgradeRequired: tier === 'free',
          message: `Daily limit of ${dailyLimit} ${feature.replace('_', ' ')} reached`
        };
      }

      // Check monthly limit (if applicable)
      if (monthlyLimit > 0 && usedThisMonth >= monthlyLimit) {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        
        return {
          allowed: false,
          remaining: 0,
          limit: monthlyLimit,
          resetDate: nextMonth.toISOString().split('T')[0],
          upgradeRequired: tier === 'free',
          message: `Monthly limit of ${monthlyLimit} ${feature.replace('_', ' ')} reached`
        };
      }

      // Usage allowed
      return {
        allowed: true,
        remaining: dailyLimit - usedToday,
        limit: dailyLimit,
        resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

    } catch (error) {
      console.error('Usage check error:', error);
      return { allowed: false, message: 'Error checking usage limits' };
    }
  }

  async recordUsage(
    userId: string,
    feature: 'ai_generation' | 'ai_analysis' | 'template_download' | 'export_operation' | 'project_creation',
    quantity = 1,
    metadata?: any
  ): Promise<boolean> {
    try {
      // Get user's tier
      const profile = await this.database.getProfile(userId);
      const tier = profile?.subscription_tier || 'free';

      // Record usage event
      const timestamp = Math.floor(Date.now() / 1000);
      await this.database.recordUsage({
        user_id: userId,
        feature,
        quantity,
        timestamp,
        metadata: metadata ? JSON.stringify(metadata) : undefined
      });

      // Update quota counters
      await this.database.updateUsageQuota(userId, feature, tier, quantity);

      // If this is a paid feature on a paid tier, report to Stripe for metered billing
      if (this.stripeService && (tier === 'maker' || tier === 'pro') && (feature === 'ai_generation' || feature === 'ai_analysis')) {
        await this.reportMeteredUsage(userId, feature, quantity);
      }

      return true;
    } catch (error) {
      console.error('Usage recording error:', error);
      return false;
    }
  }

  async getUsageStats(userId: string): Promise<UsageStats[]> {
    try {
      const profile = await this.database.getProfile(userId);
      const tier = profile?.subscription_tier || 'free';
      const tierLimits = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];

      const features = ['ai_generation', 'ai_analysis', 'project_creation'];
      const stats: UsageStats[] = [];

      for (const feature of features) {
        const quota = await this.database.getUsageQuota(userId, feature);
        
        let dailyLimit = -1;
        let monthlyLimit = -1;

        if (feature === 'ai_generation' || feature === 'ai_analysis') {
          dailyLimit = tierLimits.limits.ai_calls_per_day;
        } else if (feature === 'project_creation') {
          dailyLimit = tierLimits.limits.projects === -1 ? -1 : Math.max(5, tierLimits.limits.projects / 30);
          monthlyLimit = tierLimits.limits.projects;
        }

        stats.push({
          feature,
          used_today: quota?.used_today || 0,
          used_this_month: quota?.used_this_month || 0,
          limit_daily: dailyLimit,
          limit_monthly: monthlyLimit,
          tier,
          reset_date: quota?.reset_date || new Date().toISOString().split('T')[0]
        });
      }

      return stats;
    } catch (error) {
      console.error('Usage stats error:', error);
      return [];
    }
  }

  private async reportMeteredUsage(userId: string, feature: string, quantity: number): Promise<void> {
    try {
      // Get user's subscription
      const subscription = await this.database.getBillingSubscription(userId);
      if (!subscription || subscription.status !== 'active') {
        return; // No active subscription
      }

      // In a real implementation, you would:
      // 1. Get the subscription item ID for the metered component
      // 2. Report usage to Stripe
      // For now, we'll just log it
      console.log('Metered usage:', {
        userId,
        feature,
        quantity,
        subscription: subscription.stripe_subscription_id
      });

      // Example of how to report to Stripe:
      // const subscriptionItems = await this.stripeService.getSubscription(subscription.stripe_subscription_id);
      // const meteredItem = subscriptionItems.items.data.find(item => 
      //   item.price.id === STRIPE_PRICES.AI_USAGE
      // );
      // if (meteredItem) {
      //   await this.stripeService.recordUsage(meteredItem.id, quantity);
      // }

    } catch (error) {
      console.error('Metered usage reporting error:', error);
    }
  }

  // Utility method to check if user can access a feature type
  async canAccessFeature(userId: string, feature: string): Promise<boolean> {
    try {
      const profile = await this.database.getProfile(userId);
      const tier = profile?.subscription_tier || 'free';
      const tierLimits = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];

      switch (feature) {
        case 'premium_templates':
          return tierLimits.limits.templates === 'premium' || tierLimits.limits.templates === 'all';
        case 'advanced_export':
          return tierLimits.limits.export_formats.includes('gcode') || 
                 tierLimits.limits.export_formats.includes('ai');
        case 'unlimited_ai':
          return tierLimits.limits.ai_calls_per_day === -1;
        default:
          return true;
      }
    } catch (error) {
      console.error('Feature access check error:', error);
      return false;
    }
  }

  // Reset daily quotas (would be called by a cron job)
  async resetDailyQuotas(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Reset all quotas for current date
      await this.database.db
        .prepare('UPDATE usage_quotas SET used_today = 0 WHERE reset_date < ?')
        .bind(today)
        .run();

      console.log('Daily quotas reset for:', today);
    } catch (error) {
      console.error('Daily quota reset error:', error);
    }
  }

  // Clean up old usage records (would be called periodically)
  async cleanupOldRecords(daysToKeep = 90): Promise<void> {
    try {
      const cutoffDate = Math.floor((Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)) / 1000);
      
      await this.database.db
        .prepare('DELETE FROM usage_records WHERE timestamp < ?')
        .bind(cutoffDate)
        .run();

      console.log('Cleaned up usage records older than', daysToKeep, 'days');
    } catch (error) {
      console.error('Usage cleanup error:', error);
    }
  }
}

// Factory function
export function createUsageTracker(env?: Env): UsageTracker | null {
  if (!env) {
    return null;
  }
  return new UsageTracker(env);
}

// Usage middleware helper for API endpoints
export async function withUsageCheck(
  env: Env,
  userId: string,
  feature: 'ai_generation' | 'ai_analysis' | 'template_download' | 'export_operation' | 'project_creation',
  handler: () => Promise<Response>
): Promise<Response> {
  const tracker = createUsageTracker(env);
  if (!tracker) {
    return new Response(JSON.stringify({ error: 'Usage tracking not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const usageCheck = await tracker.checkUsageLimit(userId, feature);
  
  if (!usageCheck.allowed) {
    return new Response(JSON.stringify({
      error: 'Usage limit exceeded',
      message: usageCheck.message,
      limit: usageCheck.limit,
      remaining: usageCheck.remaining,
      reset_date: usageCheck.resetDate,
      upgrade_required: usageCheck.upgradeRequired
    }), {
      status: 429, // Too Many Requests
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Execute the handler
  const response = await handler();
  
  // If successful (200 range), record the usage
  if (response.status >= 200 && response.status < 300) {
    await tracker.recordUsage(userId, feature);
  }

  return response;
}
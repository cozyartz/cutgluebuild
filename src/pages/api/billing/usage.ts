// Usage Statistics API
// Returns usage data and limits for authenticated user

import type { APIRoute } from 'astro';
import { createUsageTracker } from '../../../lib/usage-tracking';
import { getAuthService, getSessionFromRequest } from '../../../lib/auth';
import type { Env } from '../../../lib/database';

export const GET: APIRoute = async ({ request, locals }) => {
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

    // Get usage tracker
    const tracker = createUsageTracker(env);
    if (!tracker) {
      return new Response(JSON.stringify({ error: 'Usage tracking not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get usage statistics
    const usageStats = await tracker.getUsageStats(currentUser.id);

    return new Response(JSON.stringify({
      usage_stats: usageStats,
      user_id: currentUser.id,
      tier: currentUser.profile?.subscription_tier || 'free'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Usage stats error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch usage statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
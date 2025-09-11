import type { APIRoute } from 'astro';
import { aiUsageTracker } from '../../../lib/ai-usage-tracker';
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

    // Check if user is authenticated and has appropriate permissions
    const sessionId = getSessionFromRequest(request);
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const authService = getAuthService(env);
    const currentUser = await authService.getCurrentUser(sessionId);
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get usage statistics
    const stats = aiUsageTracker.getUsageStats();
    const recommendations = aiUsageTracker.getOptimizationRecommendations();
    
    // Calculate cost estimates (rough estimates based on model usage)
    const estimatedCosts = {
      gpt120b: (stats.modelBreakdown['@cf/openai/gpt-oss-120b'] || 0) * 0.002, // rough estimate
      gpt20b: (stats.modelBreakdown['@cf/openai/gpt-oss-20b'] || 0) * 0.001,   // rough estimate
      total: ((stats.modelBreakdown['@cf/openai/gpt-oss-120b'] || 0) * 0.002) + 
             ((stats.modelBreakdown['@cf/openai/gpt-oss-20b'] || 0) * 0.001)
    };

    return new Response(JSON.stringify({
      usage: stats,
      recommendations,
      estimatedCosts,
      rateLimit: {
        callsPerMinute: 250,
        recommendation: 'Use gpt-oss-20b for faster tasks to stay under limits'
      },
      modelGuidance: {
        'SVG Generation': 'Use gpt-oss-20b with low reasoning effort',
        'Workshop Guidance': 'Use gpt-oss-20b with low reasoning effort', 
        'Quality Analysis': 'Use gpt-oss-20b with medium reasoning effort',
        'G-code Generation': 'Use gpt-oss-120b with high reasoning effort',
        'Material Optimization': 'Use gpt-oss-120b with high reasoning effort'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('AI usage stats error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to get usage statistics',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

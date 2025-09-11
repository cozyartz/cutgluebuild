import type { APIRoute } from 'astro';
import type { Env } from '../../../lib/database';
import { createAgentsAIService } from '../../../lib/agents-ai';
import { MaterialNestingOptimizer } from '../../../lib/material-nesting';
import { withUsageCheck } from '../../../lib/usage-tracking';
import { getAuthService, getSessionFromRequest } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, locals }) => {
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

  return withUsageCheck(env, currentUser.id, 'ai_generation', async () => {
    const body = await request.json();
    const { 
      parts = [], 
      sheets = [],
      options = {}
    } = body;

    if (!parts.length || !sheets.length) {
      return new Response(JSON.stringify({ 
        error: 'Parts and sheets are required',
        example: {
          parts: [
            {
              id: 'panel1',
              name: 'Front Panel',
              svg: '<svg>...</svg>',
              width: 100,
              height: 80,
              quantity: 2,
              rotation: 0,
              priority: 8,
              materialType: 'plywood',
              thickness: 6
            }
          ],
          sheets: [
            {
              id: 'sheet1',
              name: 'Plywood Sheet',
              width: 600,
              height: 400,
              thickness: 6,
              materialType: 'plywood',
              costPerSheet: 25.00,
              usableArea: 95,
              margin: 5
            }
          ],
          options: {
            algorithm: 'efficiency',
            allowRotation: true,
            minimumSpacing: 2,
            prioritizeOrder: false
          }
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const optimizer = new MaterialNestingOptimizer(env.AI);

    try {
      const nestingResult = await optimizer.optimizeLayout(parts, sheets, options);
      
      return new Response(JSON.stringify({
        ...nestingResult,
        message: `Optimized nesting layout for ${parts.length} part types across ${sheets.length} sheet options`,
        timestamp: new Date().toISOString(),
        optimization: {
          algorithm: options.algorithm || 'efficiency',
          partsProcessed: nestingResult.summary.totalParts,
          utilizationAchieved: `${nestingResult.summary.averageUtilization.toFixed(1)}%`,
          estimatedSavings: `$${(nestingResult.costAnalysis.wasteCosts * 0.2).toFixed(2)}`,
          processingTime: `${nestingResult.optimizationMetrics.processingTime}ms`
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Material nesting optimization error:', error);
      
      return new Response(JSON.stringify({ 
        error: 'Failed to optimize material nesting',
        details: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });
};

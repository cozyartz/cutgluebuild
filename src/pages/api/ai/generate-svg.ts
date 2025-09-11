import type { APIRoute } from 'astro';
import type { Env } from '../../../lib/database';
import { createAgentsAIService } from '../../../lib/agents-ai';
import type { SVGGenerationRequest } from '../../../lib/agents-ai';
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

  // Use usage tracking middleware
  return withUsageCheck(env, currentUser.id, 'ai_generation', async () => {

    const body = await request.json();
    const { 
      description, 
      material = 'plywood', 
      width = 100, 
      height = 100, 
      style = 'modern',
      complexity = 'medium'
    } = body;

    if (!description) {
      return new Response(JSON.stringify({ error: 'Description is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get AI service (will use mock in development)
    const aiService = createAgentsAIService(env);

    const request_data: SVGGenerationRequest = {
      description,
      material,
      width,
      height,
      style,
      complexity
    };

    try {
      const svgData = await aiService.generateSVG(request_data);
      
      return new Response(JSON.stringify({ svgData }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (aiError) {
      console.error('AI service error:', aiError);
      
      // Return fallback SVG if AI service fails
      const fallbackSVG = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Fallback design: ${description} -->
  <rect x="5" y="5" width="${width-10}" height="${height-10}" 
        fill="none" stroke="#000" stroke-width="0.1"/>
  <circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height)/4}" 
          fill="none" stroke="#000" stroke-width="0.1"/>
  <text x="5" y="${height-5}" font-family="Arial" font-size="4" fill="#666">
    Fallback: ${description} (${material})
  </text>
  <!-- Cut layer -->
  <g id="cuts" stroke="#000" stroke-width="0.1" fill="none">
    <rect x="5" y="5" width="${width-10}" height="${height-10}"/>
  </g>
  <!-- Engrave layer -->
  <g id="engrave" stroke="#666" stroke-width="0.05" fill="none">
    <circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height)/4}"/>
  </g>
</svg>`;

      return new Response(JSON.stringify({ svgData: fallbackSVG }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('SVG generation API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate SVG' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  }); // Close withUsageCheck
};
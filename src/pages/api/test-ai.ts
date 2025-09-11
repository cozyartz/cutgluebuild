import type { APIRoute } from 'astro';
import type { Env } from '../../../lib/database';
import { createAIService } from '../../../lib/cloudflare-ai';

export const GET: APIRoute = async ({ locals }) => {
  const env = (locals as any)?.runtime?.env as Env;
  
  if (!env?.AI) {
    return new Response(JSON.stringify({ 
      error: 'AI binding not available',
      hasAI: !!env?.AI,
      envKeys: Object.keys(env || {})
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const aiService = createAIService(env);

  try {
    // Test simple SVG generation with optimized settings
    const testRequest = {
      description: 'Simple test circle for AI binding verification',
      material: 'plywood',
      width: 50,
      height: 50,
      style: 'minimal',
      complexity: 'simple'
    };

    const startTime = Date.now();
    const svgResult = await aiService.generateContextualSVG(testRequest);
    const endTime = Date.now();

    return new Response(JSON.stringify({ 
      success: true,
      model_used: 'gpt-oss-20b (fast task)',
      reasoning_effort: 'low',
      response_time_ms: endTime - startTime,
      svg_length: svgResult.length,
      svg_preview: svgResult.substring(0, 200) + '...',
      binding_status: 'working',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'AI service failed',
      details: error.message,
      binding_status: 'error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

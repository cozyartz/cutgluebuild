import type { APIRoute } from 'astro';
import type { Env } from '../../../lib/database';
import { createAIService } from '../../../lib/cloudflare-ai';
import type { SVGGenerationRequest } from '../../../lib/cloudflare-ai';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
    const env = locals.runtime?.env as Env;
    const aiService = createAIService(env);

    const request_data: SVGGenerationRequest = {
      description,
      material,
      width,
      height,
      style,
      complexity
    };

    try {
      const svgData = await aiService.generateContextualSVG(request_data);
      
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
};
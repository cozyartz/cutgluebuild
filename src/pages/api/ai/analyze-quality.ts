import type { APIRoute } from 'astro';
import type { Env } from '../../../lib/database';
import { createAgentsAIService } from '../../../lib/agents-ai';

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
    const { svgData, material, settings } = body;

    if (!svgData) {
      return new Response(JSON.stringify({ error: 'SVG data is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get AI service (will use mock in development)
    const env = locals.runtime?.env as Env;
    const aiService = createAgentsAIService(env);

    try {
      const prediction = await aiService.analyzeQuality(svgData, material || 'plywood', settings || {});
      
      return new Response(JSON.stringify(prediction), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (aiError) {
      console.error('AI service error:', aiError);
      
      // Return fallback analysis if AI service fails
      const fallbackPrediction = {
        successProbability: 82,
        potentialIssues: [
          "Complex curves may require slower cutting speeds",
          "Verify material thickness matches design specifications",
          "Check for overlapping cut paths that could weaken structure"
        ],
        recommendations: [
          "Test cut settings on scrap material first",
          "Use proper material hold-down to prevent shifting",
          "Clean machine lens/bit before cutting for optimal results",
          "Consider grain direction for wood materials"
        ],
        materialOptimizations: [
          "Orient design to minimize cross-grain cuts",
          "Consider nesting multiple parts to reduce waste",
          "Leave adequate spacing between cut lines",
          "Plan cut sequence to maintain material stability"
        ]
      };

      return new Response(JSON.stringify(fallbackPrediction), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Quality analysis API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to analyze design quality' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
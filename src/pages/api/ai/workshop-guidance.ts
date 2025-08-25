import type { APIRoute } from 'astro';
import type { Env } from '../../../lib/database';
import { createAIService } from '../../../lib/cloudflare-ai';

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
    const { project } = body;

    if (!project) {
      return new Response(JSON.stringify({ error: 'Project data is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get AI service (will use mock in development)
    const env = locals.runtime?.env as Env;
    const aiService = createAIService(env);

    try {
      const guidance = await aiService.generateWorkshopGuidance(project);
      
      return new Response(JSON.stringify(guidance), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (aiError) {
      console.error('AI service error:', aiError);
      
      // Return fallback guidance if AI service fails
      const fallbackGuidance = {
        safetyTips: [
          "Wear appropriate safety equipment including safety glasses",
          "Ensure proper ventilation in your workspace",
          "Check material is properly secured before starting",
          "Keep emergency stop accessible at all times"
        ],
        stepByStep: [
          "Review design and material specifications",
          "Prepare and secure material on machine bed",
          "Configure machine settings for material type",
          "Run test cut on scrap material if possible",
          "Execute main cutting operation",
          "Clean up workspace and inspect finished parts"
        ],
        toolsNeeded: [
          "Laser cutter or CNC machine",
          "Safety glasses",
          "Material (plywood, acrylic, etc.)",
          "Measuring tools",
          "Cleaning supplies"
        ],
        timeEstimate: "30-60 minutes",
        difficultyRating: 5,
        troubleshooting: [
          "If cuts are incomplete, check laser power/spindle speed settings",
          "If edges are rough, try reducing feed rate",
          "For burning or melting, reduce power or increase speed",
          "Clean lens/bit if cut quality degrades during operation"
        ]
      };

      return new Response(JSON.stringify(fallbackGuidance), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Workshop guidance API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate workshop guidance' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
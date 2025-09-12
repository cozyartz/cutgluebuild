import type { APIRoute } from 'astro';
import { getAuthService, getSessionFromRequest } from '../../../lib/auth';
import { openaiService, mockAIService, isOpenAIConfigured } from '../../../lib/openai';
import type { ShaperSVGRequest } from '../../../lib/openai';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Validate session
    const sessionId = getSessionFromRequest(request);
    
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const authService = getAuthService();
    const session = await authService.validateSession(sessionId);
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { svgData, material, settings } = body;

    if (!material || !settings) {
      return new Response(
        JSON.stringify({ error: 'Material and settings are required' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Prepare Shaper SVG request
    const shaperRequest: ShaperSVGRequest = {
      svgData: svgData || undefined,
      description: body.description,
      material: material,
      thickness: settings.thickness || 3,
      cutTypes: settings.cutTypes || {
        exterior: true,
        online: true,
        interior: false,
        pocket: false,
        guide: true
      },
      optimizeForShaper: settings.optimizeForShaper !== false,
      includeGuides: settings.includeGuides !== false,
      width: settings.width,
      height: settings.height
    };

    // Use appropriate service based on configuration
    const aiService = isOpenAIConfigured() ? openaiService : mockAIService;
    
    // Generate Shaper SVG
    const svg = await aiService.generateShaperSVG(shaperRequest);

    // Prepare response with additional metadata
    const response = {
      svg,
      material: material,
      thickness: settings.thickness,
      cutTypes: Object.entries(settings.cutTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type, _]) => type),
      shaperReady: true,
      instructions: [
        'Transfer this SVG file to your Shaper Origin device',
        'Colors indicate different cut operations:',
        '• Red (#FF0000) - Exterior cuts',
        '• Green (#00FF00) - Interior cuts',
        '• Blue (#0066FF) - Engraving operations',
        '• Magenta (#FF00FF) - Pocket cuts',
        '• Gray (#888888) - Guide marks',
        'Set cut depths manually on the device',
        'Test settings on scrap material first'
      ]
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Shaper SVG generation error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate Shaper SVG',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
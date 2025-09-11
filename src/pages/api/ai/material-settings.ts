import type { APIRoute } from 'astro';
import type { Env } from '../../../lib/database';
import { createAIService } from '../../../lib/cloudflare-ai';
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

  try {
    const body = await request.json();
    const { material, thickness, machine } = body;

    if (!material || !thickness || !machine) {
      return new Response(JSON.stringify({ 
        error: 'Material, thickness, and machine are required',
        supportedMachines: ['glowforge', 'shaper'],
        example: {
          material: 'plywood',
          thickness: 6,
          machine: 'glowforge'
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!['glowforge', 'shaper'].includes(machine)) {
      return new Response(JSON.stringify({ 
        error: 'Unsupported machine type',
        supportedMachines: ['glowforge', 'shaper']
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const aiService = createAIService(env);

    try {
      const settings = await (aiService as any).generateMaterialSettings(material, thickness, machine);
      
      return new Response(JSON.stringify({ 
        ...settings,
        material,
        thickness,
        machine,
        message: `Optimized ${machine} settings for ${thickness}mm ${material}`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (aiError) {
      console.error('Material settings generation error:', aiError);
      
      return new Response(JSON.stringify({ 
        error: 'Failed to generate material settings',
        details: aiError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Material settings API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Invalid request format',
      details: error.message 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
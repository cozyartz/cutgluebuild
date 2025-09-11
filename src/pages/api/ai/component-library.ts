import type { APIRoute } from 'astro';
import type { Env } from '../../../lib/database';
import { createAIService } from '../../../lib/cloudflare-ai';
import { StandardComponentLibrary } from '../../../lib/component-library';
import { withUsageCheck } from '../../../lib/usage-tracking';
import { getAuthService, getSessionFromRequest } from '../../../lib/auth';

export const GET: APIRoute = async ({ url }) => {
  // Get all available component specifications
  const library = new StandardComponentLibrary(null);
  const specs = library.getComponentSpecs();
  
  const category = url.searchParams.get('category');
  const machine = url.searchParams.get('machine');
  
  let filteredSpecs = specs;
  
  if (category) {
    filteredSpecs = filteredSpecs.filter(spec => spec.category === category);
  }
  
  if (machine) {
    filteredSpecs = filteredSpecs.filter(spec => spec.machines.includes(machine as any));
  }
  
  return new Response(JSON.stringify({
    components: filteredSpecs,
    categories: [...new Set(specs.map(s => s.category))],
    machines: ['glowforge', 'shaper', 'cnc'],
    total: filteredSpecs.length
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

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
    const { componentId, parameters, machine = 'glowforge' } = body;

    if (!componentId) {
      return new Response(JSON.stringify({ 
        error: 'Component ID is required',
        availableComponents: new StandardComponentLibrary(null).getComponentSpecs().map(s => s.id)
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const aiService = createAIService(env);
    const library = new StandardComponentLibrary(env.AI);

    try {
      const component = await library.generateComponent(componentId, parameters || {}, machine);
      
      return new Response(JSON.stringify({
        ...component,
        componentId,
        machine,
        message: `Generated ${componentId} for ${machine}`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Component generation error:', error);
      
      return new Response(JSON.stringify({ 
        error: 'Failed to generate component',
        details: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });
};

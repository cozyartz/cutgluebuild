// API endpoint for getting template by ID
import type { APIRoute } from 'astro';
import { getDatabase, type Env } from '../../../lib/database';
import { getAuthService, getSessionFromRequest } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ params, request, locals }) => {
  try {
    const templateId = params.id;
    if (!templateId) {
      return new Response(JSON.stringify({ error: 'Template ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get environment from locals
    const env = (locals as any)?.runtime?.env as Env;

    // Check authentication
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
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get database service from environment
    const database = getDatabase(env);
    
    // Get template
    const template = await database.getTemplate(templateId);
    
    if (!template) {
      return new Response(JSON.stringify({ error: 'Template not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(template), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching template:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch template' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
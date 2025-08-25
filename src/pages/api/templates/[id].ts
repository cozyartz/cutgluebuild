// API endpoint for getting template by ID
import type { APIRoute } from 'astro';
import { getDatabase, type Env } from '../../../lib/database';

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const templateId = params.id;
    if (!templateId) {
      return new Response(JSON.stringify({ error: 'Template ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get database service from environment
    const env = (globalThis as any).process?.env as Env;
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
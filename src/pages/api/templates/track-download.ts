// API endpoint for tracking template downloads
import type { APIRoute } from 'astro';
import { getDatabase, type Env } from '../../../lib/database';
import { getSessionFromRequest, getAuthService } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { templateId, userId } = body;

    if (!templateId || !userId) {
      return new Response(JSON.stringify({ error: 'Template ID and User ID are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get session from request
    const sessionId = getSessionFromRequest(request);
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get database and auth services from environment
    const env = (globalThis as any).process?.env as Env;
    const database = getDatabase(env);
    const authService = getAuthService(env);
    
    // Verify user session
    const user = await authService.getCurrentUser(sessionId);
    if (!user || user.id !== userId) {
      return new Response(JSON.stringify({ error: 'Invalid session or user mismatch' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Increment template download count
    const success = await database.incrementTemplateDownloads(templateId);
    
    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to track download' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error tracking download:', error);
    return new Response(JSON.stringify({ error: 'Failed to track download' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
// API endpoint for getting project revisions
import type { APIRoute } from 'astro';
import { getDatabase, type Env } from '../../../../lib/database';
import { getSessionFromRequest, getAuthService } from '../../../../lib/auth';

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const projectId = params.projectId;
    if (!projectId) {
      return new Response(JSON.stringify({ error: 'Project ID is required' }), {
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
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify user owns the project
    const project = await database.getUserProject(projectId, user.id);
    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found or access denied' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get project revisions
    const revisions = await database.getProjectRevisions(projectId);

    return new Response(JSON.stringify(revisions), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching revisions:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch revisions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
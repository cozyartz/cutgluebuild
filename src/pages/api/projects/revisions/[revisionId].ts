// API endpoint for getting a specific revision
import type { APIRoute } from 'astro';
import { getDatabase, type Env } from '../../../../lib/database';
import { getSessionFromRequest, getAuthService } from '../../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const revisionId = params.revisionId;
    if (!revisionId) {
      return new Response(JSON.stringify({ error: 'Revision ID is required' }), {
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

    // Get the revision
    const revision = await database.getProjectRevision(revisionId);
    if (!revision) {
      return new Response(JSON.stringify({ error: 'Revision not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify user owns the project by checking the revision's project
    const project = await database.getUserProject(revision.project_id, user.id);
    if (!project) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(revision), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching revision:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch revision' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
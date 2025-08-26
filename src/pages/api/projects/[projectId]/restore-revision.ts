// API endpoint for restoring a project revision
import type { APIRoute } from 'astro';
import { getDatabase, type Env } from '../../../../lib/database';
import { getSessionFromRequest, getAuthService } from '../../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const projectId = params.projectId;
    if (!projectId) {
      return new Response(JSON.stringify({ error: 'Project ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { revisionId } = body;

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

    // Verify user owns the project
    const project = await database.getUserProject(projectId, user.id);
    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found or access denied' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the revision to restore
    const revisions = await database.getProjectRevisions(projectId);
    const revisionToRestore = revisions.find(r => r.id === revisionId);
    
    if (!revisionToRestore) {
      return new Response(JSON.stringify({ error: 'Revision not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create a new revision with the restored content
    const nextRevisionNumber = await database.getNextRevisionNumber(projectId);
    const newRevisionId = crypto.randomUUID();
    
    const newRevision = await database.createProjectRevision({
      id: newRevisionId,
      project_id: projectId,
      revision_number: nextRevisionNumber,
      svg_data: revisionToRestore.svg_data,
      changes_description: `Restored from revision #${revisionToRestore.revision_number}`,
      metadata: revisionToRestore.metadata
    });

    if (!newRevision) {
      return new Response(JSON.stringify({ error: 'Failed to create restoration revision' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the project to point to the new current revision
    const updatedProject = await database.updateUserProject(projectId, user.id, {
      current_revision_id: newRevisionId,
      svg_data: revisionToRestore.svg_data
    });

    if (!updatedProject) {
      return new Response(JSON.stringify({ error: 'Failed to update project' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      newRevisionId: newRevisionId,
      project: updatedProject
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error restoring revision:', error);
    return new Response(JSON.stringify({ error: 'Failed to restore revision' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
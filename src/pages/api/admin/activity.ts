// Admin Activity Log API
import type { APIRoute } from 'astro';
import { getDatabase } from '../../../lib/database';
import { GitHubAuthService } from '../../../lib/github-auth';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any)?.runtime?.env;

    // Check authentication
    const cookies = request.headers.get('cookie');
    const userId = cookies
      ?.split(';')
      .find(c => c.trim().startsWith('cutglue_user_id='))
      ?.split('=')[1];

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check admin permissions
    const githubAuth = new GitHubAuthService(env);
    const hasPermission = await githubAuth.hasPermission(userId, 'analytics_view');

    if (!hasPermission) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const database = getDatabase(env);

    // Get recent admin activity
    const activity = await database.db
      .prepare(`
        SELECT
          al.id,
          al.admin_id,
          al.action,
          al.resource_type,
          al.resource_id,
          al.details,
          al.created_at,
          p.full_name as admin_name,
          p.email as admin_email
        FROM admin_activity_log al
        LEFT JOIN profiles p ON al.admin_id = p.id
        ORDER BY al.created_at DESC
        LIMIT 50
      `)
      .all<{
        id: string;
        admin_id: string;
        action: string;
        resource_type: string;
        resource_id: string;
        details: string;
        created_at: string;
        admin_name: string;
        admin_email: string;
      }>();

    // Format the response
    const formattedActivity = activity.map(item => ({
      id: item.id,
      admin_id: item.admin_id,
      admin_name: item.admin_name || item.admin_email || 'Unknown Admin',
      action: item.action,
      resource_type: item.resource_type,
      resource_id: item.resource_id,
      details: item.details,
      created_at: item.created_at
    }));

    return new Response(JSON.stringify(formattedActivity), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Admin activity error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
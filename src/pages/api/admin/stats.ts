// Admin Dashboard Stats API
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

    // Get user statistics
    const userStats = await Promise.all([
      database.db.prepare('SELECT COUNT(*) as count FROM profiles').first<{ count: number }>(),
      database.db.prepare('SELECT COUNT(*) as count FROM profiles WHERE last_login > datetime("now", "-30 days")').first<{ count: number }>(),
      database.db.prepare('SELECT COUNT(*) as count FROM profiles WHERE created_at > datetime("now", "-30 days")').first<{ count: number }>(),
      database.db.prepare(`
        SELECT subscription_tier, COUNT(*) as count
        FROM profiles
        GROUP BY subscription_tier
      `).all<{ subscription_tier: string; count: number }>()
    ]);

    // Get template statistics
    const templateStats = await Promise.all([
      database.db.prepare('SELECT COUNT(*) as count FROM templates').first<{ count: number }>(),
      database.db.prepare('SELECT SUM(download_count) as total FROM templates').first<{ total: number }>(),
      database.db.prepare(`
        SELECT title, download_count
        FROM templates
        ORDER BY download_count DESC
        LIMIT 5
      `).all<{ title: string; download_count: number }>()
    ]);

    // Get AI usage statistics
    const aiStats = await Promise.all([
      database.db.prepare(`
        SELECT COUNT(*) as count
        FROM ai_usage_stats
        WHERE DATE(created_at) = DATE('now')
      `).first<{ count: number }>(),
      database.db.prepare('SELECT COUNT(*) as count FROM ai_usage_stats').first<{ count: number }>(),
      database.db.prepare(`
        SELECT AVG(response_time_ms) as avg_time
        FROM ai_usage_stats
        WHERE created_at > datetime('now', '-24 hours')
      `).first<{ avg_time: number }>(),
      database.db.prepare(`
        SELECT
          CAST(SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / COUNT(*) as error_rate
        FROM ai_usage_stats
        WHERE created_at > datetime('now', '-24 hours')
      `).first<{ error_rate: number }>()
    ]);

    // Get system statistics
    const systemStats = await Promise.all([
      database.db.prepare('SELECT COUNT(*) as count FROM user_sessions WHERE expires_at > unixepoch()').first<{ count: number }>()
    ]);

    // Build response
    const stats = {
      users: {
        total: userStats[0]?.count || 0,
        active: userStats[1]?.count || 0,
        new_this_month: userStats[2]?.count || 0,
        by_tier: userStats[3].reduce((acc: Record<string, number>, curr) => {
          acc[curr.subscription_tier] = curr.count;
          return acc;
        }, {})
      },
      templates: {
        total: templateStats[0]?.count || 0,
        downloads: templateStats[1]?.total || 0,
        popular: templateStats[2].map(t => ({
          name: t.title,
          downloads: t.download_count
        }))
      },
      ai: {
        generations_today: aiStats[0]?.count || 0,
        total_generations: aiStats[1]?.count || 0,
        average_response_time: Math.round(aiStats[2]?.avg_time || 0),
        error_rate: aiStats[3]?.error_rate || 0
      },
      system: {
        uptime: '99.9%', // This would come from system monitoring
        database_size: '2.1 GB', // This would come from system monitoring
        cache_hit_rate: 94, // This would come from system monitoring
        active_sessions: systemStats[0]?.count || 0
      }
    };

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
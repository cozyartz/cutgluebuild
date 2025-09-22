// GitHub OAuth initiation endpoint
import type { APIRoute } from 'astro';
import { GitHubAuthService } from '../../../lib/github-auth';

export const GET: APIRoute = async ({ request, redirect, locals }) => {
  try {
    const env = (locals as any)?.runtime?.env;

    if (!env?.GITHUB_CLIENT_ID) {
      return new Response(JSON.stringify({ error: 'GitHub OAuth not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const githubAuth = new GitHubAuthService(env);

    // Generate state for CSRF protection
    const state = crypto.randomUUID();

    // Store state in a secure cookie (expires in 10 minutes)
    const response = redirect(githubAuth.generateAuthURL(state));
    response.headers.set('Set-Cookie',
      `github_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`
    );

    return response;

  } catch (error) {
    console.error('GitHub OAuth initiation error:', error);
    return new Response(JSON.stringify({ error: 'OAuth initiation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
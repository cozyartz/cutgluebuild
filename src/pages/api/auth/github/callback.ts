// GitHub OAuth callback endpoint
import type { APIRoute } from 'astro';
import { GitHubAuthService } from '../../../../lib/github-auth';

export const GET: APIRoute = async ({ request, redirect, locals }) => {
  try {
    const env = (locals as any)?.runtime?.env;
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      console.error('GitHub OAuth error:', error);
      return redirect('/login?error=oauth_error');
    }

    if (!code || !state) {
      return redirect('/login?error=missing_code');
    }

    // Verify state parameter (CSRF protection)
    const cookies = request.headers.get('cookie');
    const stateCookie = cookies
      ?.split(';')
      .find(c => c.trim().startsWith('github_oauth_state='))
      ?.split('=')[1];

    if (stateCookie !== state) {
      console.error('GitHub OAuth state mismatch');
      return redirect('/login?error=state_mismatch');
    }

    // Handle GitHub authentication
    const githubAuth = new GitHubAuthService(env);
    const result = await githubAuth.handleCallback(code);

    if (!result.success) {
      console.error('GitHub authentication failed:', result.error);
      return redirect('/login?error=auth_failed');
    }

    // Create session and set cookies
    const response = result.user?.role === 'superadmin' || result.user?.role === 'admin'
      ? redirect('/admin/dashboard')
      : redirect('/tools');

    // Set authentication cookies
    if (result.tokens) {
      response.headers.set('Set-Cookie', [
        `cutglue_access_token=${result.tokens.accessToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${15 * 60}; Path=/`,
        `cutglue_refresh_token=${result.tokens.refreshToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}; Path=/`,
        `cutglue_user_id=${result.user?.id}; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}; Path=/`
      ].join(', '));
    }

    // Clear OAuth state cookie
    response.headers.append('Set-Cookie',
      'github_oauth_state=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/'
    );

    return response;

  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return redirect('/login?error=callback_error');
  }
};
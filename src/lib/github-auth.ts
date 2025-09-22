// GitHub OAuth integration for CutGlueBuild
// Provides secure GitHub authentication with admin role management

import { getDatabase, type Profile, type Env, type DatabaseService } from './database';
import { createJWTManager, type TokenPair } from './jwt';

export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubAuthResult {
  success: boolean;
  user?: Profile;
  tokens?: TokenPair;
  error?: string;
  isNewUser?: boolean;
}

export class GitHubAuthService {
  private env: Env;
  private jwtManager: any;

  constructor(env: Env) {
    this.env = env;
    this.jwtManager = createJWTManager(env);
  }

  /**
   * Generate GitHub OAuth URL for authentication
   */
  generateAuthURL(state?: string): string {
    const clientId = this.env.GITHUB_CLIENT_ID;
    const baseUrl = this.env.BASE_URL || 'http://localhost:4322';
    const redirectUri = `${baseUrl}/api/auth/github/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'user:email',
      state: state || crypto.randomUUID()
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange GitHub code for access token
   */
  private async exchangeCodeForToken(code: string): Promise<string> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: this.env.GITHUB_CLIENT_ID,
        client_secret: this.env.GITHUB_CLIENT_SECRET,
        code: code
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`GitHub OAuth error: ${data.error_description}`);
    }

    return data.access_token;
  }

  /**
   * Get GitHub user data using access token
   */
  private async getGitHubUser(accessToken: string): Promise<GitHubUser> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch GitHub user data');
    }

    const userData = await response.json();

    // Get primary email if not public
    if (!userData.email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        const primaryEmail = emails.find((email: any) => email.primary);
        userData.email = primaryEmail?.email || `${userData.login}@github.local`;
      }
    }

    return userData;
  }

  /**
   * Handle GitHub OAuth callback
   */
  async handleCallback(code: string): Promise<GitHubAuthResult> {
    try {
      // Exchange code for access token
      const accessToken = await this.exchangeCodeForToken(code);

      // Get GitHub user data
      const githubUser = await this.getGitHubUser(accessToken);

      // Check if user exists or create new one
      const database = getDatabase(this.env);
      const result = await this.findOrCreateUser(githubUser, database);

      return result;

    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  /**
   * Find existing user or create new one from GitHub data
   */
  private async findOrCreateUser(githubUser: GitHubUser, database: DatabaseService): Promise<GitHubAuthResult> {
    try {
      // First, check if user exists by GitHub ID
      let existingUser = await database.getProfileByGitHubId(githubUser.id.toString());

      // If not found by GitHub ID, check by email
      if (!existingUser) {
        existingUser = await database.getProfileByEmail(githubUser.email);

        // If found by email, update with GitHub info
        if (existingUser) {
          await database.updateProfileWithGitHubInfo(
            existingUser.id,
            githubUser.id.toString(),
            githubUser.login,
            githubUser.avatar_url
          );
        }
      }

      let user: Profile;
      let isNewUser = false;

      if (!existingUser) {
        // Create new user
        const userId = crypto.randomUUID();
        const role = this.determineUserRole(githubUser);

        user = {
          id: userId,
          email: githubUser.email,
          full_name: githubUser.name || githubUser.login,
          avatar_url: githubUser.avatar_url,
          github_id: githubUser.id.toString(),
          github_username: githubUser.login,
          role: role,
          subscription_tier: role === 'superadmin' ? 'pro' : 'free',
          is_active: true,
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await database.createGitHubProfile(user);

        // Grant admin permissions if needed
        if (role === 'superadmin' || role === 'admin') {
          await this.grantAdminPermissions(userId, role, database);
        }

        isNewUser = true;
      } else {
        // Update last login
        await database.updateLastLogin(existingUser.id);

        user = existingUser;
      }

      // Generate JWT tokens
      const tokens = await this.jwtManager.createTokenPair(user.id, user.email, crypto.randomUUID());

      // Log authentication
      await this.logAdminActivity(user.id, 'github_login', 'authentication', null, {
        github_username: githubUser.login,
        is_new_user: isNewUser
      }, database);

      return {
        success: true,
        user,
        tokens,
        isNewUser
      };

    } catch (error) {
      console.error('User creation/update error:', error);
      return {
        success: false,
        error: 'Failed to create or update user'
      };
    }
  }

  /**
   * Determine user role based on GitHub info
   * You can customize this logic based on your GitHub username or organization membership
   */
  private determineUserRole(githubUser: GitHubUser): 'user' | 'admin' | 'superadmin' {
    // Define admin GitHub usernames (customize this list)
    const superAdmins = ['cozyartz']; // Andrea Cozart-Lundin (project owner)
    const admins = ['admin-user-1', 'admin-user-2']; // Add other admin usernames

    if (superAdmins.includes(githubUser.login)) {
      return 'superadmin';
    }

    if (admins.includes(githubUser.login)) {
      return 'admin';
    }

    return 'user';
  }

  /**
   * Grant admin permissions to user
   */
  private async grantAdminPermissions(userId: string, role: string, database: DatabaseService): Promise<void> {
    const permissions = role === 'superadmin'
      ? [
          'user_management',
          'template_management',
          'system_settings',
          'analytics_view',
          'ai_usage_monitoring',
          'billing_management',
          'content_management',
          'super_admin'
        ]
      : [
          'template_management',
          'analytics_view',
          'content_management'
        ];

    await database.grantAdminPermissions(userId, permissions);
  }

  /**
   * Log admin activity
   */
  private async logAdminActivity(
    adminId: string,
    action: string,
    resourceType: string,
    resourceId: string | null,
    details: Record<string, any>,
    database: DatabaseService
  ): Promise<void> {
    await database.logAdminActivity(adminId, action, resourceType, resourceId, details);
  }

  /**
   * Check if user has admin permissions
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const database = getDatabase(this.env);
    return await database.hasPermission(userId, permission);
  }

  /**
   * Get user's admin permissions
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const database = getDatabase(this.env);
    return await database.getUserPermissions(userId);
  }
}

// Helper function to get GitHub user (can be used independently)
async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch GitHub user data');
  }

  const userData = await response.json();

  // Get primary email if not public
  if (!userData.email) {
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (emailResponse.ok) {
      const emails = await emailResponse.json();
      const primaryEmail = emails.find((email: any) => email.primary);
      userData.email = primaryEmail?.email || `${userData.login}@github.local`;
    }
  }

  return userData;
}

export { getGitHubUser };
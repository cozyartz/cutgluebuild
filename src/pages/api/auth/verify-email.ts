import type { APIRoute } from 'astro';
import { getAuthService } from '../../../lib/auth';
import { getDatabase, type Env } from '../../../lib/database';
import { InputValidator, SecurityError } from '../../../lib/security';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any)?.runtime?.env as Env;
    if (!env) {
      return new Response(JSON.stringify({ error: 'Environment not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return new Response(JSON.stringify({ error: 'Verification token is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const database = getDatabase(env);

    // Find verification token in database
    const verification = await database.db
      .prepare('SELECT * FROM email_verifications WHERE token = ? AND expires_at > ? AND used_at IS NULL')
      .bind(token, Math.floor(Date.now() / 1000))
      .first();

    if (!verification) {
      return new Response(JSON.stringify({ 
        error: 'Invalid or expired verification token' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Mark email as verified
    await database.db.batch([
      // Update profile to mark email as verified
      database.db.prepare('UPDATE profiles SET email_verified = 1, updated_at = ? WHERE id = ?')
        .bind(new Date().toISOString(), verification.user_id),
      
      // Mark verification token as used
      database.db.prepare('UPDATE email_verifications SET used_at = ? WHERE id = ?')
        .bind(new Date().toISOString(), verification.id)
    ]);

    return new Response(JSON.stringify({ 
      message: 'Email successfully verified!' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    
    if (error instanceof SecurityError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ url, locals }) => {
  // Handle verification via GET request (email links)
  try {
    const env = (locals as any)?.runtime?.env as Env;
    if (!env) {
      return new Response('Environment not available', { status: 500 });
    }

    const token = url.searchParams.get('token');
    if (!token) {
      // Redirect to verification page with error
      return new Response(null, {
        status: 302,
        headers: { 'Location': '/verify-email?error=missing-token' }
      });
    }

    const database = getDatabase(env);

    // Find and verify token
    const verification = await database.db
      .prepare('SELECT * FROM email_verifications WHERE token = ? AND expires_at > ? AND used_at IS NULL')
      .bind(token, Math.floor(Date.now() / 1000))
      .first();

    if (!verification) {
      // Redirect to verification page with error
      return new Response(null, {
        status: 302,
        headers: { 'Location': '/verify-email?error=invalid-token' }
      });
    }

    // Mark email as verified
    await database.db.batch([
      database.db.prepare('UPDATE profiles SET email_verified = 1, updated_at = ? WHERE id = ?')
        .bind(new Date().toISOString(), verification.user_id),
      
      database.db.prepare('UPDATE email_verifications SET used_at = ? WHERE id = ?')
        .bind(new Date().toISOString(), verification.id)
    ]);

    // Redirect to success page
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/verify-email?success=true' }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/verify-email?error=server-error' }
    });
  }
};
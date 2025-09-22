import type { APIRoute } from 'astro';
import { getAuthService } from '../../../lib/auth';
import { InputValidator, SecurityError } from '../../../lib/security';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate input
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Sanitize email input
    const sanitizedEmail = InputValidator.validateEmail(email);

    // Get auth service with environment
    const authService = getAuthService(request.cf?.env);

    // Request password reset
    const success = await authService.requestPasswordReset(sanitizedEmail);

    if (success) {
      return new Response(JSON.stringify({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ 
        error: 'Failed to process password reset request' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Forgot password API error:', error);
    
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
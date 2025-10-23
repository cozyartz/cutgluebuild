import type { APIRoute } from 'astro';
import { emailService } from '../../lib/email-service';
import { InputValidator, SecurityError } from '../../lib/security';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email) {
      return new Response(JSON.stringify({ 
        error: 'Email address is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Sanitize email input
    const sanitizedEmail = InputValidator.validateEmail(email);

    // Send newsletter confirmation email
    const success = await emailService.sendNewsletterConfirmation(sanitizedEmail);

    if (success) {
      return new Response(JSON.stringify({ 
        message: 'Thanks for subscribing! Please check your email to confirm your subscription.' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ 
        error: 'Failed to subscribe to newsletter. Please try again.' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    
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
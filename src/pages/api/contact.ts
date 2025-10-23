import type { APIRoute } from 'astro';
import { emailService } from '../../lib/email-service';
import { InputValidator, SecurityError } from '../../lib/security';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, email, requestType, message } = body;

    // Validate required fields
    if (!name || !email || !requestType) {
      return new Response(JSON.stringify({ 
        error: 'Name, email, and request type are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Sanitize inputs
    const sanitizedName = InputValidator.sanitizeString(name, 100);
    const sanitizedEmail = InputValidator.validateEmail(email);
    const sanitizedRequestType = InputValidator.sanitizeString(requestType, 50);
    const sanitizedMessage = message ? InputValidator.sanitizeString(message, 2000) : '';

    // Send contact email
    const success = await emailService.sendContactEmail(
      sanitizedName,
      sanitizedEmail,
      `Contact Form: ${sanitizedRequestType}`,
      `Request Type: ${sanitizedRequestType}\n\nMessage:\n${sanitizedMessage}`
    );

    if (success) {
      return new Response(JSON.stringify({ 
        message: 'Your message has been sent successfully. We will get back to you soon!' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ 
        error: 'Failed to send message. Please try again or contact us directly.' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Contact form API error:', error);
    
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
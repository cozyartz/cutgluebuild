import type { APIRoute } from 'astro';
import { emailService } from '../../lib/email-service';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Get status of Email service
    const status = emailService.getStatus();

    if (!status.configured) {
      return new Response(JSON.stringify({
        error: 'Email service is not configured. Please set SMTP_PASSWORD environment variable.',
        status: status
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({
        error: 'Email address is required for testing'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Send test email
    const success = await emailService.sendNotification(
      email,
      'Email Service Test',
      'This is a test email to verify that the email service is working correctly with CutGlueBuild.'
    );

    if (success) {
      return new Response(JSON.stringify({
        message: 'Test email sent successfully!',
        status: status
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        error: 'Failed to send test email. Check your email configuration.',
        status: status
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Test email API error:', error);

    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async () => {
  try {
    // Just return email service status
    const status = emailService.getStatus();

    return new Response(JSON.stringify({
      message: 'Email service configuration status',
      status: status,
      ready: emailService.isReady()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Email service status check error:', error);

    return new Response(JSON.stringify({
      error: 'Failed to check email service status',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
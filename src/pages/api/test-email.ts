import type { APIRoute } from 'astro';
import { mailerSendService } from '../../lib/mailersend-service';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Get status of MailerSend service
    const status = mailerSendService.getStatus();
    
    if (!status.configured) {
      return new Response(JSON.stringify({ 
        error: 'MailerSend is not configured. Please set MAILERSEND_API_KEY environment variable.',
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
    const success = await mailerSendService.sendNotification(
      email,
      'MailerSend Test Email',
      'This is a test email to verify that MailerSend is working correctly with CutGlueBuild.'
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
        error: 'Failed to send test email. Check your MailerSend configuration.',
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
    // Just return MailerSend status
    const status = mailerSendService.getStatus();
    
    return new Response(JSON.stringify({ 
      message: 'MailerSend configuration status',
      status: status,
      ready: mailerSendService.isReady()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('MailerSend status check error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to check MailerSend status',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
import type { APIRoute } from 'astro';
import { TenantService } from '../../../../lib/tenant';
import type { Env } from '../../../../lib/database';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, params }) => {
  try {
    const { tenantId } = params;
    
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { hostname } = body;

    if (!hostname || typeof hostname !== 'string') {
      return new Response(JSON.stringify({ error: 'Hostname is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate hostname format
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!hostnameRegex.test(hostname)) {
      return new Response(JSON.stringify({ error: 'Invalid hostname format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const env = locals.runtime?.env as Env;
    const tenantService = new TenantService(env);

    // Check if user has access to this tenant (implement proper authorization)
    const tenant = await tenantService.getTenant(tenantId!);
    if (!tenant) {
      return new Response(JSON.stringify({ error: 'Tenant not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if tenant plan supports custom domains
    if (!tenantService.canAccessFeature(tenant, 'custom_domain')) {
      return new Response(JSON.stringify({ 
        error: 'Custom domains not available on current plan',
        required_plan: 'pro'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const success = await tenantService.addCustomHostname(tenantId!, hostname);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to add custom domain' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      message: 'Custom domain added successfully',
      hostname,
      instructions: [
        `Add a CNAME record for ${hostname} pointing to ${tenant.subdomain}`,
        'SSL certificate will be automatically provisioned',
        'Domain will be active within 24 hours'
      ]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Custom domain setup error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
import type { APIRoute } from 'astro';
import { TenantService } from '../../../lib/tenant';
import type { Env } from '../../../lib/database';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Only allow admin users to create tenants (implement admin check as needed)
    if (!locals.user || !isAdminUser(locals.user)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { name, plan = 'free' } = body;

    if (!name || typeof name !== 'string') {
      return new Response(JSON.stringify({ error: 'Tenant name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const env = locals.runtime?.env as Env;
    const tenantService = new TenantService(env);

    const tenant = await tenantService.createTenant(name, plan);

    if (!tenant) {
      return new Response(JSON.stringify({ error: 'Failed to create tenant' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      tenant,
      subdomain_url: `https://${tenant.subdomain}`,
      message: 'Tenant created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Tenant creation error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Placeholder for admin user check - implement based on your auth system
function isAdminUser(user: any): boolean {
  // For now, return true for development
  // In production, check if user has admin role
  return true;
}
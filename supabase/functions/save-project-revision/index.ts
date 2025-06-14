import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SaveRevisionRequest {
  projectId: string;
  svgData: string;
  changesDescription?: string;
  metadata?: any;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { projectId, svgData, changesDescription, metadata }: SaveRevisionRequest = await req.json();

    if (!projectId || !svgData) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: projectId, svgData' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabaseClient
      .from('user_projects')
      .select('id, user_id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found or access denied' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get next revision number
    const { data: nextRevisionData, error: revisionError } = await supabaseClient
      .rpc('get_next_revision_number', { project_uuid: projectId });

    if (revisionError) {
      return new Response(
        JSON.stringify({ error: 'Failed to get revision number' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const revisionNumber = nextRevisionData;

    // Create new revision
    const { data: revision, error: insertError } = await supabaseClient
      .from('project_revisions')
      .insert({
        project_id: projectId,
        revision_number: revisionNumber,
        svg_data: svgData,
        changes_description: changesDescription || `Revision ${revisionNumber}`,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create revision' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update project to point to new revision
    const { error: updateError } = await supabaseClient
      .from('user_projects')
      .update({
        current_revision_id: revision.id,
        svg_data: svgData, // Keep for backward compatibility
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update project' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        revision: {
          id: revision.id,
          revisionNumber: revision.revision_number,
          createdAt: revision.created_at,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
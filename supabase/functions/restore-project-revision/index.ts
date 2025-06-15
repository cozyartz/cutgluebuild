import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RestoreRevisionRequest {
  projectId: string;
  revisionId: string;
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

    const { projectId, revisionId }: RestoreRevisionRequest = await req.json();

    if (!projectId || !revisionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: projectId, revisionId' }),
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

    // Get the revision to restore
    const { data: revision, error: revisionError } = await supabaseClient
      .from('project_revisions')
      .select('*')
      .eq('id', revisionId)
      .eq('project_id', projectId)
      .single();

    if (revisionError || !revision) {
      return new Response(
        JSON.stringify({ error: 'Revision not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create a new revision from the restored one
    const { data: nextRevisionData, error: nextRevisionError } = await supabaseClient
      .rpc('get_next_revision_number', { project_uuid: projectId });

    if (nextRevisionError) {
      return new Response(
        JSON.stringify({ error: 'Failed to get next revision number' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const nextRevisionNumber = nextRevisionData;

    // Create new revision with restored content
    const { data: newRevision, error: insertError } = await supabaseClient
      .from('project_revisions')
      .insert({
        project_id: projectId,
        revision_number: nextRevisionNumber,
        svg_data: revision.svg_data,
        changes_description: `Restored from revision #${revision.revision_number}`,
        metadata: revision.metadata || {},
      })
      .select()
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create restored revision' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update project to point to the new revision
    const { error: updateError } = await supabaseClient
      .from('user_projects')
      .update({
        current_revision_id: newRevision.id,
        svg_data: revision.svg_data, // Keep for backward compatibility
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
        restoredRevision: {
          id: newRevision.id,
          revisionNumber: newRevision.revision_number,
          originalRevisionNumber: revision.revision_number,
          createdAt: newRevision.created_at,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Restore revision error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
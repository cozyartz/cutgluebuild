import type { APIRoute } from 'astro';
import type { Env } from '../../../lib/database';
import { createAIService } from '../../../lib/cloudflare-ai';
import { DocumentationGenerator } from '../../../lib/documentation-generator';
import { withUsageCheck } from '../../../lib/usage-tracking';
import { getAuthService, getSessionFromRequest } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any)?.runtime?.env as Env;
  if (!env) {
    return new Response(JSON.stringify({ error: 'Environment not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get authenticated user
  const sessionId = getSessionFromRequest(request);
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const authService = getAuthService(env);
  const currentUser = await authService.getCurrentUser(sessionId);
  if (!currentUser) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return withUsageCheck(env, currentUser.id, 'ai_generation', async () => {
    const body = await request.json();
    const { 
      projectTitle, 
      projectDescription, 
      components = [], 
      materials = [], 
      tools = [],
      difficulty = 5,
      estimatedTime = '1-2 hours',
      safetyNotes = []
    } = body;

    if (!projectTitle || !projectDescription) {
      return new Response(JSON.stringify({ 
        error: 'Project title and description are required',
        example: {
          projectTitle: 'Wooden Storage Box',
          projectDescription: 'A simple box with finger joints for organizing small items',
          components: [
            { name: 'Front panel', quantity: 1, dimensions: '200x100x6mm', material: 'plywood' },
            { name: 'Back panel', quantity: 1, dimensions: '200x100x6mm', material: 'plywood' }
          ],
          materials: [
            { type: 'plywood', thickness: 6, dimensions: '300x200mm', quantity: 1 }
          ],
          tools: ['laser cutter', 'sandpaper', 'wood glue'],
          difficulty: 4,
          estimatedTime: '2 hours'
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const documentationRequest = {
      projectTitle,
      projectDescription,
      components,
      materials,
      tools,
      difficulty,
      estimatedTime,
      safetyNotes
    };

    const docGenerator = new DocumentationGenerator(env.AI);

    try {
      // Generate comprehensive documentation
      const documentation = await docGenerator.generateComprehensiveDocumentation(documentationRequest);
      
      // Generate detailed assembly instructions
      if (components.length > 0) {
        documentation.assemblyInstructions = await docGenerator.generateAssemblySequence(
          components, 
          projectTitle
        );
      }
      
      // Generate troubleshooting guide
      if (materials.length > 0) {
        documentation.troubleshooting = await docGenerator.generateTroubleshootingGuide(
          projectTitle,
          materials
        );
      }
      
      return new Response(JSON.stringify({
        ...documentation,
        message: `Comprehensive documentation generated for ${projectTitle}`,
        generatedAt: new Date().toISOString(),
        sections: {
          overview: 'Project overview and requirements',
          materials: 'Complete bill of materials',
          tools: 'Required tools and equipment',
          safety: 'Safety guidelines and precautions',
          preparation: 'Setup and preparation steps',
          assembly: `${documentation.assemblyInstructions.length} detailed assembly steps`,
          quality: 'Quality control checkpoints',
          troubleshooting: `${documentation.troubleshooting.length} troubleshooting solutions`,
          finishing: 'Finishing options and techniques',
          maintenance: 'Long-term care instructions',
          variations: 'Project modification ideas'
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Documentation generation error:', error);
      
      return new Response(JSON.stringify({ 
        error: 'Failed to generate documentation',
        details: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });
};

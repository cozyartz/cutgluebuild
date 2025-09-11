import { createSecureAPI, parseSecureRequestBody, createSecureResponse, InputValidator, SecurityError } from '../../../lib/secure-api';
import { createAgentsAIService } from '../../../lib/agents-ai';
import type { SVGGenerationRequest } from '../../../lib/agents-ai';
import { withUsageCheck } from '../../../lib/usage-tracking';

export const POST = createSecureAPI(async ({ request, locals, secureDb, currentUser }) => {
  const env = (locals as any)?.runtime?.env;
  
  if (!currentUser) {
    throw new SecurityError('Authentication required');
  }

  // Use usage tracking middleware with security wrapper
  return withUsageCheck(env, currentUser.id, 'ai_generation', async () => {
    try {
      // Parse and validate request body securely
      const body = await parseSecureRequestBody(request, 5000); // 5KB limit for SVG requests
      
      // Validate and sanitize input parameters
      const description = InputValidator.validateProjectDescription(body.description);
      if (!description) {
        throw new SecurityError('Description is required and cannot be empty');
      }
      
      const material = InputValidator.sanitizeString(body.material || 'plywood', 50);
      const width = InputValidator.validateNumeric(body.width || 100, 10, 2000);  // 10mm to 2000mm
      const height = InputValidator.validateNumeric(body.height || 100, 10, 2000);
      const style = InputValidator.sanitizeString(body.style || 'modern', 50);
      const complexity = InputValidator.sanitizeString(body.complexity || 'medium', 50);
      
      // Validate style and complexity values
      const validStyles = ['modern', 'traditional', 'minimal', 'ornate', 'rustic', 'industrial'];
      const validComplexity = ['simple', 'medium', 'complex'];
      
      if (!validStyles.includes(style)) {
        throw new SecurityError('Invalid style parameter');
      }
      
      if (!validComplexity.includes(complexity)) {
        throw new SecurityError('Invalid complexity parameter');
      }

      // Get user project history for contextual generation (optional)
      const userHistory = await secureDb.getUserProjects(currentUser.id, 5); // Last 5 projects for context

      const aiService = createAgentsAIService(env);

      const requestData: SVGGenerationRequest = {
        description,
        material,
        width,
        height,
        style,
        complexity,
        userHistory
      };

      const svgData = await aiService.generateSVG(requestData);
      
      // Validate generated SVG content
      const validatedSVG = InputValidator.validateSVGContent(svgData);
      
      return createSecureResponse({ 
        svgData: validatedSVG,
        metadata: {
          generated_at: new Date().toISOString(),
          parameters: {
            material,
            dimensions: `${width}x${height}mm`,
            style,
            complexity
          }
        }
      }, 200, request);
      
    } catch (aiError) {
      console.error('AI service error:', aiError);
      
      // Generate secure fallback SVG
      const sanitizedDescription = InputValidator.sanitizeString(body?.description || 'design', 100);
      const sanitizedMaterial = InputValidator.sanitizeString(body?.material || 'plywood', 50);
      const safeWidth = Math.max(10, Math.min(2000, parseInt(body?.width) || 100));
      const safeHeight = Math.max(10, Math.min(2000, parseInt(body?.height) || 100));
      
      const fallbackSVG = `<svg width="${safeWidth}" height="${safeHeight}" viewBox="0 0 ${safeWidth} ${safeHeight}" xmlns="http://www.w3.org/2000/svg">
  <!-- Secure fallback design -->
  <rect x="5" y="5" width="${safeWidth-10}" height="${safeHeight-10}" 
        fill="none" stroke="#FF0000" stroke-width="0.025"/>
  <circle cx="${safeWidth/2}" cy="${safeHeight/2}" r="${Math.min(safeWidth, safeHeight)/6}" 
          fill="none" stroke="#0000FF" stroke-width="0.025"/>
  <text x="5" y="${safeHeight-5}" font-family="Arial" font-size="6" fill="#666">
    Fallback: ${sanitizedDescription.substring(0, 20)} (${sanitizedMaterial})
  </text>
  <g id="cuts" stroke="#FF0000" stroke-width="0.025" fill="none">
    <rect x="5" y="5" width="${safeWidth-10}" height="${safeHeight-10}"/>
  </g>
  <g id="engrave" stroke="#0000FF" stroke-width="0.025" fill="none">
    <circle cx="${safeWidth/2}" cy="${safeHeight/2}" r="${Math.min(safeWidth, safeHeight)/6}"/>
  </g>
</svg>`;

      return createSecureResponse({ 
        svgData: fallbackSVG,
        fallback: true,
        message: 'AI service temporarily unavailable, using fallback design'
      }, 200, request);
    }
  });
}, {
  requireAuth: true,
  strictEndpoint: true,
  allowedMethods: ['POST'],
  allowedContentTypes: ['application/json']
});
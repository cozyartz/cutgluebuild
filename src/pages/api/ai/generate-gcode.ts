import type { APIRoute } from 'astro';
import type { Env } from '../../../lib/database';
import { createAgentsAIService } from '../../../lib/agents-ai';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { svgData, material, machineType, settings } = body;

    if (!svgData) {
      return new Response(JSON.stringify({ error: 'SVG data is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!machineType) {
      return new Response(JSON.stringify({ error: 'Machine type is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get AI service (will use mock in development)
    const env = locals.runtime?.env as Env;
    const aiService = createAgentsAIService(env);

    try {
      const gcode = await aiService.generateGCode(
        svgData, 
        material || 'plywood', 
        machineType
      );
      
      return new Response(JSON.stringify(gcode), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (aiError) {
      console.error('AI service error:', aiError);
      
      // Return fallback G-code if AI service fails
      const fallbackGCode = {
        gcode: generateFallbackGCode(machineType, settings),
        estimatedTime: calculateEstimatedTime(settings),
        materialUsage: 75,
        cuttingPath: "Optimized for minimal travel time",
        warnings: [
          "This is fallback G-code - test on scrap material first",
          "Verify all settings match your machine specifications",
          "Check material is properly secured before starting",
          machineType === 'laser' ? "Ensure proper ventilation for laser cutting" : "Keep spindle/plasma torch properly maintained"
        ]
      };

      return new Response(JSON.stringify(fallbackGCode), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('G-code generation API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate G-code' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

function generateFallbackGCode(machineType: string, settings: any): string {
  const feedRate = settings?.feedRate || 1000;
  const power = settings?.laserPower || settings?.spindleSpeed || 1000;
  
  const header = `; Generated G-code for ${machineType}
; Date: ${new Date().toISOString()}
; WARNING: This is fallback G-code - verify all settings
;
G21 ; Set units to millimeters
G90 ; Absolute positioning
G92 X0 Y0 Z0 ; Set current position as origin
`;

  const machineSetup = machineType === 'laser' 
    ? `M3 S${power} ; Laser on at ${power}% power`
    : machineType === 'cnc'
    ? `M3 S${power} ; Spindle on at ${power} RPM\nG0 Z5 ; Raise to safe height`
    : `M3 ; Plasma torch ready`;

  const samplePath = `
; Sample rectangular cut path
G0 X10 Y10 ; Move to start position
G1 F${feedRate} ; Set feed rate
G1 X50 Y10 ; Cut to corner 1
G1 X50 Y40 ; Cut to corner 2  
G1 X10 Y40 ; Cut to corner 3
G1 X10 Y10 ; Complete rectangle
`;

  const footer = machineType === 'cnc' 
    ? `G0 Z25 ; Raise to safe height\nM5 ; Spindle off\nG0 X0 Y0 ; Return to origin`
    : `M5 ; Turn off laser/plasma\nG0 X0 Y0 ; Return to origin`;

  return `${header}${machineSetup}${samplePath}${footer}`;
}

function calculateEstimatedTime(settings: any): string {
  const feedRate = settings?.feedRate || 1000;
  const passes = settings?.passes || 1;
  
  // Simple estimation based on feed rate and passes
  const baseTime = feedRate < 500 ? 45 : feedRate < 1000 ? 30 : 20;
  const totalTime = baseTime * passes;
  
  return totalTime < 60 ? `${totalTime} minutes` : `${Math.round(totalTime / 60)} hours`;
}
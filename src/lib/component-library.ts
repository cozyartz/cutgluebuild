// Standard Component Library for makerspace parts
import type { Env, UserProject } from './database';
import { trackAICall, aiRateLimiter } from './ai-usage-tracker';

export interface ComponentSpec {
  id: string;
  name: string;
  category: 'joints' | 'hardware' | 'enclosures' | 'mechanisms' | 'decorative';
  description: string;
  parameters: ComponentParameter[];
  defaultValues: Record<string, number | string>;
  materials: string[];
  machines: ('glowforge' | 'shaper' | 'cnc')[];
  tags: string[];
}

export interface ComponentParameter {
  name: string;
  type: 'number' | 'select' | 'boolean';
  description: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  default: number | string | boolean;
  required: boolean;
}

export interface GeneratedComponent {
  svg: string;
  gcode?: string;
  script: string;
  documentation: string;
  materialSettings: any;
  assemblyInstructions: string[];
  partsList: string[];
  estimatedTime: string;
  difficulty: number;
}

export class StandardComponentLibrary {
  private ai: any;

  constructor(ai: any) {
    this.ai = ai;
  }

  // Standard component definitions
  getComponentSpecs(): ComponentSpec[] {
    return [
      {
        id: 'finger-joint-box',
        name: 'Finger Joint Box',
        category: 'enclosures',
        description: 'Customizable box with finger joints for laser cutting',
        parameters: [
          { name: 'width', type: 'number', description: 'Box width', unit: 'mm', min: 10, max: 500, step: 1, default: 100, required: true },
          { name: 'height', type: 'number', description: 'Box height', unit: 'mm', min: 10, max: 500, step: 1, default: 80, required: true },
          { name: 'depth', type: 'number', description: 'Box depth', unit: 'mm', min: 10, max: 500, step: 1, default: 60, required: true },
          { name: 'thickness', type: 'number', description: 'Material thickness', unit: 'mm', min: 1, max: 20, step: 0.1, default: 3, required: true },
          { name: 'fingerWidth', type: 'number', description: 'Finger width', unit: 'mm', min: 5, max: 50, step: 1, default: 15, required: true },
          { name: 'hasLid', type: 'boolean', description: 'Include removable lid', default: true, required: false },
          { name: 'lidStyle', type: 'select', description: 'Lid attachment style', options: ['friction', 'hinged', 'sliding'], default: 'friction', required: false }
        ],
        defaultValues: { width: 100, height: 80, depth: 60, thickness: 3, fingerWidth: 15, hasLid: true, lidStyle: 'friction' },
        materials: ['plywood', 'mdf', 'acrylic', 'cardboard'],
        machines: ['glowforge', 'cnc'],
        tags: ['storage', 'enclosure', 'beginner', 'functional']
      },
      {
        id: 'living-hinge',
        name: 'Living Hinge',
        category: 'joints',
        description: 'Flexible connection allowing controlled bending',
        parameters: [
          { name: 'length', type: 'number', description: 'Hinge length', unit: 'mm', min: 10, max: 300, step: 1, default: 50, required: true },
          { name: 'width', type: 'number', description: 'Hinge width', unit: 'mm', min: 5, max: 50, step: 1, default: 20, required: true },
          { name: 'cutWidth', type: 'number', description: 'Cut line width', unit: 'mm', min: 0.1, max: 2, step: 0.1, default: 0.3, required: true },
          { name: 'spacing', type: 'number', description: 'Cut line spacing', unit: 'mm', min: 0.5, max: 5, step: 0.1, default: 1.5, required: true },
          { name: 'pattern', type: 'select', description: 'Hinge pattern', options: ['straight', 'curved', 'wavy'], default: 'straight', required: false }
        ],
        defaultValues: { length: 50, width: 20, cutWidth: 0.3, spacing: 1.5, pattern: 'straight' },
        materials: ['plywood', 'cardboard', 'leather', 'fabric'],
        machines: ['glowforge'],
        tags: ['flexible', 'connection', 'intermediate', 'mechanical']
      },
      {
        id: 'gear-set',
        name: 'Involute Gear Set',
        category: 'mechanisms',
        description: 'Precision involute gears for mechanical projects',
        parameters: [
          { name: 'teeth1', type: 'number', description: 'First gear teeth', min: 8, max: 100, step: 1, default: 20, required: true },
          { name: 'teeth2', type: 'number', description: 'Second gear teeth', min: 8, max: 100, step: 1, default: 40, required: true },
          { name: 'module', type: 'number', description: 'Gear module', unit: 'mm', min: 0.5, max: 5, step: 0.1, default: 2, required: true },
          { name: 'shaftDiameter', type: 'number', description: 'Central shaft diameter', unit: 'mm', min: 2, max: 20, step: 0.5, default: 6, required: true },
          { name: 'spokeStyle', type: 'select', description: 'Spoke design', options: ['solid', '3-spoke', '4-spoke', '5-spoke'], default: '4-spoke', required: false }
        ],
        defaultValues: { teeth1: 20, teeth2: 40, module: 2, shaftDiameter: 6, spokeStyle: '4-spoke' },
        materials: ['plywood', 'mdf', 'acrylic', 'delrin'],
        machines: ['glowforge', 'cnc'],
        tags: ['mechanical', 'precision', 'advanced', 'functional']
      },
      {
        id: 'dovetail-joint',
        name: 'Dovetail Joint',
        category: 'joints',
        description: 'Strong interlocking joint for woodworking',
        parameters: [
          { name: 'boardWidth', type: 'number', description: 'Board width', unit: 'mm', min: 20, max: 200, step: 1, default: 80, required: true },
          { name: 'thickness', type: 'number', description: 'Material thickness', unit: 'mm', min: 3, max: 25, step: 0.5, default: 12, required: true },
          { name: 'pinCount', type: 'number', description: 'Number of pins', min: 1, max: 10, step: 1, default: 3, required: true },
          { name: 'angle', type: 'number', description: 'Dovetail angle', unit: 'degrees', min: 5, max: 15, step: 1, default: 8, required: true },
          { name: 'style', type: 'select', description: 'Joint style', options: ['through', 'half-blind', 'sliding'], default: 'through', required: false }
        ],
        defaultValues: { boardWidth: 80, thickness: 12, pinCount: 3, angle: 8, style: 'through' },
        materials: ['hardwood', 'plywood', 'mdf'],
        machines: ['cnc', 'shaper'],
        tags: ['woodworking', 'strong', 'traditional', 'advanced']
      },
      {
        id: 'kerf-bend',
        name: 'Kerf Bending Pattern',
        category: 'joints',
        description: 'Scored pattern allowing wood to bend around curves',
        parameters: [
          { name: 'length', type: 'number', description: 'Pattern length', unit: 'mm', min: 50, max: 500, step: 1, default: 200, required: true },
          { name: 'bendRadius', type: 'number', description: 'Desired bend radius', unit: 'mm', min: 10, max: 500, step: 1, default: 50, required: true },
          { name: 'thickness', type: 'number', description: 'Material thickness', unit: 'mm', min: 3, max: 25, step: 0.5, default: 6, required: true },
          { name: 'kerfWidth', type: 'number', description: 'Kerf cut width', unit: 'mm', min: 1, max: 5, step: 0.1, default: 2, required: true },
          { name: 'pattern', type: 'select', description: 'Kerf pattern', options: ['straight', 'v-groove', 'curved'], default: 'straight', required: false }
        ],
        defaultValues: { length: 200, bendRadius: 50, thickness: 6, kerfWidth: 2, pattern: 'straight' },
        materials: ['plywood', 'mdf', 'solid wood'],
        machines: ['glowforge', 'cnc'],
        tags: ['bending', 'curved', 'flexible', 'intermediate']
      },
      {
        id: 'cam-lever',
        name: 'Cam Lever Mechanism',
        category: 'mechanisms',
        description: 'Quick-release cam lever for clamping applications',
        parameters: [
          { name: 'leverLength', type: 'number', description: 'Lever arm length', unit: 'mm', min: 30, max: 150, step: 1, default: 80, required: true },
          { name: 'camRadius', type: 'number', description: 'Cam base radius', unit: 'mm', min: 10, max: 40, step: 1, default: 20, required: true },
          { name: 'shaftDiameter', type: 'number', description: 'Shaft diameter', unit: 'mm', min: 4, max: 12, step: 0.5, default: 6, required: true },
          { name: 'clampTravel', type: 'number', description: 'Clamping travel distance', unit: 'mm', min: 2, max: 20, step: 0.5, default: 8, required: true },
          { name: 'handleStyle', type: 'select', description: 'Handle style', options: ['basic', 'ergonomic', 'folding'], default: 'ergonomic', required: false }
        ],
        defaultValues: { leverLength: 80, camRadius: 20, shaftDiameter: 6, clampTravel: 8, handleStyle: 'ergonomic' },
        materials: ['plywood', 'mdf', 'acrylic', 'aluminum'],
        machines: ['glowforge', 'cnc'],
        tags: ['clamping', 'quick-release', 'mechanical', 'functional']
      }
    ];
  }

  async generateComponent(
    componentId: string, 
    parameters: Record<string, any>,
    machine: 'glowforge' | 'shaper' | 'cnc' = 'glowforge'
  ): Promise<GeneratedComponent> {
    if (!aiRateLimiter.canMakeCall()) {
      const waitTime = aiRateLimiter.getTimeUntilNextCall();
      throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    const spec = this.getComponentSpecs().find(s => s.id === componentId);
    if (!spec) {
      throw new Error(`Component ${componentId} not found`);
    }

    // Validate parameters
    this.validateParameters(spec, parameters);

    const model = '@cf/openai/gpt-oss-120b'; // Use complex model for precision components
    
    return trackAICall(model, 'Standard Component Generation', async () => {
      aiRateLimiter.recordCall();
      
      const prompt = this.createComponentPrompt(spec, parameters, machine);

      const response = await this.ai.run(model, {
        reasoning: { effort: \"high\" },
        messages: [
          {
            role: \"system\",
            content: `You are a precision mechanical design expert specializing in ${machine} fabrication. Generate production-ready standard components with complete documentation.`
          },
          {
            role: \"user\",
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.2
      });

      try {
        const result = JSON.parse(response.response);
        return this.processComponentResult(result, spec, parameters, machine);
      } catch {
        // Fallback if JSON parsing fails
        return this.createFallbackComponent(spec, parameters, machine);
      }
    });
  }

  private createComponentPrompt(spec: ComponentSpec, parameters: Record<string, any>, machine: string): string {
    return `Generate a precision ${spec.name} component for ${machine}:

Component Specifications:
- Type: ${spec.name} (${spec.category})
- Description: ${spec.description}
- Target Machine: ${machine}

Parameters:
${spec.parameters.map(p => `- ${p.name}: ${parameters[p.name] || p.default} ${p.unit || ''} - ${p.description}`).join('\\n')}

Generate complete fabrication package:

1. **SVG Design**: Production-ready vector file with:
   ${machine === 'glowforge' 
     ? '- Red (#FF0000) cut lines (0.025mm stroke)\n   - Blue (#0000FF) score lines (0.25mm stroke)\n   - Black (#000000) engrave lines\n   - Proper kerf compensation'
     : '- Single-stroke vectors for CNC routing\n   - Tool radius compensation\n   - Optimized toolpath ordering\n   - Tool change markers'
   }

2. **Python Script**: Parametric generator using svgwrite that:
   - Accepts all parameters as variables
   - Generates mathematically precise geometry
   - Includes error checking and validation
   - Has clear documentation and examples

3. **Assembly Instructions**: Step-by-step guide with:
   - Required tools and materials
   - Safety precautions
   - Assembly sequence with diagrams
   - Common issues and troubleshooting
   - Quality check points

4. **Parts List**: Complete BOM including:
   - Cut pieces with dimensions
   - Hardware requirements (screws, pins, etc.)
   - Material specifications
   - Finishing requirements

5. **Manufacturing Notes**: 
   - Material-specific settings
   - Test cut recommendations  
   - Tolerance specifications
   - Quality control checkpoints

Return as JSON:
{
  "svg": "complete SVG code",
  "script": "complete Python script",
  "assemblyInstructions": ["step 1", "step 2", ...],
  "partsList": ["part 1: description", "part 2: description", ...],
  "manufacturingNotes": ["note 1", "note 2", ...],
  "estimatedTime": "fabrication time estimate",
  "difficulty": 1-10,
  "tolerances": "critical dimension tolerances",
  "testingProcedure": ["test 1", "test 2", ...]
}`;
  }

  private validateParameters(spec: ComponentSpec, parameters: Record<string, any>): void {
    for (const param of spec.parameters) {
      const value = parameters[param.name];
      
      if (param.required && (value === undefined || value === null)) {
        throw new Error(`Required parameter ${param.name} is missing`);
      }

      if (value !== undefined && param.type === 'number') {
        if (param.min !== undefined && value < param.min) {
          throw new Error(`Parameter ${param.name} (${value}) is below minimum (${param.min})`);
        }
        if (param.max !== undefined && value > param.max) {
          throw new Error(`Parameter ${param.name} (${value}) exceeds maximum (${param.max})`);
        }
      }

      if (value !== undefined && param.type === 'select' && param.options) {
        if (!param.options.includes(value)) {
          throw new Error(`Parameter ${param.name} value "${value}" not in allowed options: ${param.options.join(', ')}`);
        }
      }
    }
  }

  private processComponentResult(result: any, spec: ComponentSpec, parameters: Record<string, any>, machine: string): GeneratedComponent {
    return {
      svg: result.svg || this.createFallbackSVG(spec, parameters),
      script: result.script || this.createFallbackScript(spec),
      documentation: this.createDocumentation(spec, parameters, result),
      materialSettings: this.getMaterialSettings(spec, parameters, machine),
      assemblyInstructions: result.assemblyInstructions || ['Assembly instructions not generated'],
      partsList: result.partsList || ['Parts list not generated'],
      estimatedTime: result.estimatedTime || '30-60 minutes',
      difficulty: result.difficulty || 5
    };
  }

  private createFallbackComponent(spec: ComponentSpec, parameters: Record<string, any>, machine: string): GeneratedComponent {
    return {
      svg: this.createFallbackSVG(spec, parameters),
      script: this.createFallbackScript(spec),
      documentation: this.createDocumentation(spec, parameters, {}),
      materialSettings: this.getMaterialSettings(spec, parameters, machine),
      assemblyInstructions: [
        'Fallback component generated',
        'Review design before fabrication',
        'Test with scrap material first'
      ],
      partsList: ['Main component', 'Hardware as needed'],
      estimatedTime: '30-60 minutes',
      difficulty: 5
    };
  }

  private createFallbackSVG(spec: ComponentSpec, parameters: Record<string, any>): string {
    const width = parameters.width || parameters.length || 100;
    const height = parameters.height || parameters.width || 80;
    
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- ${spec.name} - Generated Component -->
  <rect x="5" y="5" width="${width-10}" height="${height-10}" fill="none" stroke="#FF0000" stroke-width="0.025"/>
  <text x="10" y="20" font-family="Arial" font-size="8" fill="#000">${spec.name}</text>
  <text x="10" y="35" font-family="Arial" font-size="6" fill="#666">Auto-generated component</text>
</svg>`;
  }

  private createFallbackScript(spec: ComponentSpec): string {
    return `#!/usr/bin/env python3
"""
${spec.name} Generator
Category: ${spec.category}
${spec.description}
"""

import svgwrite
import math

def generate_${spec.id.replace('-', '_')}(**params):
    \"\"\"Generate ${spec.name} with given parameters\"\"\"
    
    # Default parameters
    defaults = {
${spec.parameters.map(p => `        '${p.name}': ${JSON.stringify(p.default)}`).join(',\\n')}
    }
    
    # Merge with provided parameters
    p = {**defaults, **params}
    
    # Create SVG
    dwg = svgwrite.Drawing(size=(f"{p['width']}mm", f"{p['height']}mm"))
    
    # Add your component generation logic here
    dwg.add(dwg.rect(
        insert=(5, 5),
        size=(p['width']-10, p['height']-10),
        fill='none',
        stroke='red',
        stroke_width='0.025mm'
    ))
    
    return dwg

if __name__ == "__main__":
    # Example usage
    component = generate_${spec.id.replace('-', '_')}()
    component.saveas('${spec.id}.svg')
    print("Generated ${spec.name}")
`;
  }

  private createDocumentation(spec: ComponentSpec, parameters: Record<string, any>, result: any): string {
    return `# ${spec.name} Documentation

## Overview
${spec.description}

**Category**: ${spec.category}
**Complexity**: ${result.difficulty || 5}/10
**Estimated Time**: ${result.estimatedTime || '30-60 minutes'}

## Parameters Used
${spec.parameters.map(p => `- **${p.name}**: ${parameters[p.name] || p.default} ${p.unit || ''} - ${p.description}`).join('\\n')}

## Materials
Compatible with: ${spec.materials.join(', ')}

## Machine Compatibility  
${spec.machines.join(', ')}

## Safety Notes
- Always wear appropriate safety equipment
- Test settings on scrap material first
- Ensure proper ventilation when cutting
- Check material grain direction

## Quality Control
- Verify all dimensions before final cut
- Check joint fit with test pieces
- Inspect cut quality and adjust settings if needed

Generated on: ${new Date().toISOString()}
`;
  }

  private getMaterialSettings(spec: ComponentSpec, parameters: Record<string, any>, machine: string): any {
    // Simplified material settings - could be enhanced with AI generation
    return {
      machine,
      recommended: spec.materials[0] || 'plywood',
      thickness: parameters.thickness || 3,
      notes: `Optimized settings for ${spec.name} fabrication`
    };
  }
}

export const standardComponentLibrary = new StandardComponentLibrary(null);

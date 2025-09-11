// Cloudflare Workers AI service for gpt-oss models
// Replaces OpenAI SDK for hackathon submission

import type { Env, UserProject } from './database';
import { trackAICall, aiRateLimiter } from './ai-usage-tracker';

export interface SVGGenerationRequest {
  description: string;
  material: string;
  width: number;
  height: number;
  style: string;
  complexity: string;
  userHistory?: UserProject[];
}

export interface ProjectIdeaRequest {
  skill: string;
  materials: string[];
  tools: string[];
  category: string;
  timeAvailable: string;
}

export interface WorkshopGuidance {
  safetyTips: string[];
  stepByStep: string[];
  toolsNeeded: string[];
  timeEstimate: string;
  difficultyRating: number;
  troubleshooting: string[];
}

export interface GCodeOutput {
  gcode: string;
  estimatedTime: string;
  materialUsage: number;
  cuttingPath: string;
  warnings: string[];
}

export interface QualityPrediction {
  successProbability: number;
  potentialIssues: string[];
  recommendations: string[];
  materialOptimizations: string[];
}

export class CloudflareAIService {
  private ai: any;

  constructor(ai: any) {
    this.ai = ai;
  }

  // Test AI binding connectivity
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.ai.run('@cf/openai/gpt-oss-20b', {
        reasoning: { effort: "low" },
        messages: [{ role: "user", content: "Hello, respond with just 'OK'" }],
        max_tokens: 10
      });
      return response && response.response;
    } catch (error) {
      console.error('AI binding test failed:', error);
      return false;
    }
  }

  // Select optimal model based on task complexity
  private selectModel(taskType: 'simple' | 'complex' | 'balanced'): string {
    switch (taskType) {
      case 'complex': return '@cf/openai/gpt-oss-120b';  // Complex reasoning, analysis
      case 'simple': return '@cf/openai/gpt-oss-20b';    // Fast SVG generation, guidance
      case 'balanced': return '@cf/openai/gpt-oss-20b';   // Default to faster model
      default: return '@cf/openai/gpt-oss-20b';
    }
  }

  // Select reasoning effort based on task complexity and response time needs
  private selectReasoningEffort(taskType: 'simple' | 'complex' | 'balanced'): 'low' | 'medium' | 'high' {
    switch (taskType) {
      case 'simple': return 'low';     // Fast responses
      case 'complex': return 'high';   // Deep reasoning
      case 'balanced': return 'medium'; // Good balance
      default: return 'low';
    }
  }

  // Log model usage for optimization tracking
  private logModelUsage(model: string, taskType: string, tokens?: number) {
    console.log(`AI Model Usage: ${model} for ${taskType}, tokens: ${tokens || 'unknown'}`);
  }

  async generateContextualSVG(request: SVGGenerationRequest): Promise<string> {
    // Check rate limits
    if (!aiRateLimiter.canMakeCall()) {
      const waitTime = aiRateLimiter.getTimeUntilNextCall();
      throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }
    
    const model = this.selectModel('simple'); // SVG generation is fast task
    const reasoningEffort = this.selectReasoningEffort('simple');
    
    return trackAICall(model, 'SVG Generation', async () => {
      aiRateLimiter.recordCall();
      
      const prompt = this.createContextualSVGPrompt(request);
      this.logModelUsage(model, 'SVG Generation');
      
      const response = await this.ai.run(model, {
        reasoning: { effort: reasoningEffort },
        messages: [
          {
            role: "system",
            content: "You are an expert SVG designer specializing in laser cutting and CNC fabrication. Generate clean, optimized SVG code with proper cut and engrave layers. Always consider user's skill level and previous project patterns."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2500,
        temperature: 0.7
      });

      const svgContent = response.response;
      
      if (!svgContent) {
        throw new Error('No SVG content generated');
      }

      // Extract SVG from response if wrapped in markdown
      const svgMatch = svgContent.match(/<svg[\s\S]*?<\/svg>/i);
      return svgMatch ? svgMatch[0] : svgContent;
    });
  }

  async generateGCode(svgData: string, material: string, machineType: string): Promise<GCodeOutput> {
    if (!aiRateLimiter.canMakeCall()) {
      const waitTime = aiRateLimiter.getTimeUntilNextCall();
      throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }
    
    const model = this.selectModel('complex'); // G-code requires complex reasoning
    const reasoningEffort = this.selectReasoningEffort('complex');
    
    return trackAICall(model, 'G-code Generation', async () => {
      aiRateLimiter.recordCall();
      
      const prompt = `Convert this SVG design to optimized G-code for ${machineType}:

SVG Data: ${svgData}
Material: ${material}
Machine: ${machineType}

Generate G-code with:
- Optimized cutting paths to minimize travel time
- Appropriate feed rates and speeds for ${material}
- Safety checks and tool changes
- Material usage calculations
- Estimated completion time

Return as JSON with: gcode, estimatedTime, materialUsage, cuttingPath, warnings`;

      this.logModelUsage(model, 'G-code Generation');

      const response = await this.ai.run(model, {
        reasoning: { effort: reasoningEffort },
        messages: [
          {
            role: "system",
            content: "You are a CNC/laser cutting expert. Generate optimized G-code from SVG designs with safety considerations and efficiency optimizations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.3
      });

      try {
        return JSON.parse(response.response);
      } catch {
        // Fallback if not JSON
        return {
          gcode: response.response,
          estimatedTime: "15-30 minutes",
          materialUsage: 75,
          cuttingPath: "Optimized for minimal travel",
          warnings: ["Test settings on scrap material first"]
        };
      }
    });
  }

  async analyzeQuality(svgData: string, material: string, settings: any): Promise<QualityPrediction> {
    try {
      const prompt = `Analyze this design for fabrication quality:

Design: ${svgData}
Material: ${material}
Settings: ${JSON.stringify(settings)}

Predict:
- Success probability (0-100)
- Potential fabrication issues
- Design recommendations
- Material optimizations

Return as JSON with: successProbability, potentialIssues, recommendations, materialOptimizations`;

      const model = this.selectModel('balanced'); // Quality analysis - balanced approach
      const reasoningEffort = this.selectReasoningEffort('balanced');
      this.logModelUsage(model, 'Quality Analysis');

      const response = await this.ai.run(model, {
        reasoning: { effort: reasoningEffort },
        messages: [
          {
            role: "system",
            content: "You are a fabrication quality expert. Analyze designs and predict potential issues before cutting."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.4
      });

      try {
        return JSON.parse(response.response);
      } catch {
        // Fallback analysis
        return {
          successProbability: 85,
          potentialIssues: ["Check material thickness", "Verify cut settings"],
          recommendations: ["Test on scrap material", "Double-check dimensions"],
          materialOptimizations: ["Consider grain direction", "Optimize nesting layout"]
        };
      }
      
    } catch (error) {
      console.error('Quality analysis error:', error);
      throw new Error('Failed to analyze design quality');
    }
  }

  async generateWorkshopGuidance(project: UserProject): Promise<WorkshopGuidance> {
    try {
      const prompt = `Generate workshop guidance for this project:

Title: ${project.title}
Description: ${project.description}
Type: ${project.project_type}
Metadata: ${project.metadata}

Provide:
- Safety tips specific to this project
- Step-by-step instructions
- Required tools
- Time estimate
- Difficulty rating (1-10)
- Common troubleshooting issues

Return as JSON.`;

      const model = this.selectModel('simple'); // Workshop guidance is straightforward
      const reasoningEffort = this.selectReasoningEffort('simple');
      this.logModelUsage(model, 'Workshop Guidance');

      const response = await this.ai.run(model, {
        reasoning: { effort: reasoningEffort },
        messages: [
          {
            role: "system",
            content: "You are an expert workshop instructor. Provide clear, safety-focused guidance for fabrication projects."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.6
      });

      try {
        return JSON.parse(response.response);
      } catch {
        // Fallback guidance
        return {
          safetyTips: ["Wear safety glasses", "Ensure proper ventilation", "Check material security"],
          stepByStep: ["Prepare materials", "Set up machine", "Test settings", "Execute cuts", "Finish edges"],
          toolsNeeded: ["Laser cutter", "Safety equipment", "Measuring tools"],
          timeEstimate: "30-60 minutes",
          difficultyRating: 5,
          troubleshooting: ["If cut is incomplete, increase power slightly", "If edges are rough, decrease speed"]
        };
      }
      
    } catch (error) {
      console.error('Workshop guidance generation error:', error);
      throw new Error('Failed to generate workshop guidance');
    }
  }

  async optimizeMaterial(designs: string[], materialDimensions: { width: number, height: number }): Promise<{
    layout: string;
    efficiency: number;
    wastePercentage: number;
    recommendations: string[];
  }> {
    try {
      const prompt = `Optimize material layout for these designs:

Designs: ${JSON.stringify(designs)}
Material: ${materialDimensions.width}mm x ${materialDimensions.height}mm

Calculate:
- Optimal nesting layout
- Material efficiency percentage
- Waste percentage
- Layout recommendations

Return as JSON with: layout, efficiency, wastePercentage, recommendations`;

      const model = this.selectModel('complex'); // Material optimization requires complex calculations
      const reasoningEffort = this.selectReasoningEffort('complex');
      this.logModelUsage(model, 'Material Optimization');

      const response = await this.ai.run(model, {
        reasoning: { effort: reasoningEffort },
        messages: [
          {
            role: "system",
            content: "You are a material optimization expert. Calculate efficient nesting layouts to minimize waste."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      });

      try {
        return JSON.parse(response.response);
      } catch {
        return {
          layout: "Rectangular grid layout with 5mm spacing",
          efficiency: 78,
          wastePercentage: 22,
          recommendations: ["Rotate pieces for better fit", "Consider smaller material sheet"]
        };
      }
      
    } catch (error) {
      console.error('Material optimization error:', error);
      throw new Error('Failed to optimize material layout');
    }
  }

  async generateShaperOriginSVG(svgData: string, toolDiameter: number = 3.175): Promise<string> {
    if (!aiRateLimiter.canMakeCall()) {
      const waitTime = aiRateLimiter.getTimeUntilNextCall();
      throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }
    
    const model = this.selectModel('balanced');
    const reasoningEffort = this.selectReasoningEffort('balanced');
    
    return trackAICall(model, 'Shaper Origin Conversion', async () => {
      aiRateLimiter.recordCall();
      
      const prompt = `Convert this SVG for Shaper Origin CNC router compatibility:

Input SVG: ${svgData}
Tool Diameter: ${toolDiameter}mm

Requirements for Shaper Origin:
- Convert all shapes to single-stroke vectors (no fills)
- Apply tool radius compensation (inset paths by ${toolDiameter/2}mm for interior cuts)
- Use only stroke paths, no complex shapes
- Add tool-change markers as comments: <!-- TOOL_CHANGE: 1/8_ROUTER_BIT -->
- Ensure all paths are continuous and optimized for CNC routing
- Remove any elements that can't be cut with a router bit
- Maintain proper scaling and dimensions
- Group related operations together

Return optimized SVG for Shaper Origin.`;

      this.logModelUsage(model, 'Shaper Origin Conversion');

      const response = await this.ai.run(model, {
        reasoning: { effort: reasoningEffort },
        messages: [
          {
            role: "system",
            content: "You are a CNC routing expert specializing in Shaper Origin. Convert SVG designs for optimal CNC router compatibility with proper tool compensation."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2500,
        temperature: 0.3
      });

      const shaperSVG = response.response;
      
      if (!shaperSVG) {
        throw new Error('No Shaper-compatible SVG generated');
      }

      // Extract SVG from response if wrapped in markdown
      const svgMatch = shaperSVG.match(/<svg[\s\S]*?<\/svg>/i);
      return svgMatch ? svgMatch[0] : shaperSVG;
    });
  }

  async generateParametricDesign(params: {
    type: 'box' | 'joint' | 'gear' | 'hinge';
    dimensions: Record<string, number>;
    material: string;
    style?: string;
  }): Promise<{ svg: string; script: string }> {
    if (!aiRateLimiter.canMakeCall()) {
      const waitTime = aiRateLimiter.getTimeUntilNextCall();
      throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }
    
    const model = this.selectModel('complex'); // Parametric design requires complex reasoning
    const reasoningEffort = this.selectReasoningEffort('complex');
    
    return trackAICall(model, 'Parametric Design', async () => {
      aiRateLimiter.recordCall();
      
      const prompt = `Generate a parametric ${params.type} design:

Type: ${params.type}
Dimensions: ${JSON.stringify(params.dimensions)}
Material: ${params.material}
Style: ${params.style || 'functional'}

Create:
1. A Python script using svgwrite that generates the SVG based on parameters
2. The resulting SVG with current parameters
3. Clear parameter documentation

For ${params.type}:
${this.getParametricRequirements(params.type)}

Return as JSON: { "svg": "...", "script": "...", "documentation": "..." }`;

      this.logModelUsage(model, 'Parametric Design');

      const response = await this.ai.run(model, {
        reasoning: { effort: reasoningEffort },
        messages: [
          {
            role: "system",
            content: "You are an expert parametric designer. Create reusable, customizable designs with clean Python scripts."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 3500,
        temperature: 0.4
      });

      try {
        const result = JSON.parse(response.response);
        return {
          svg: result.svg,
          script: result.script
        };
      } catch {
        // Fallback if not JSON
        return {
          svg: `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="none" stroke="red"/></svg>`,
          script: `# Parametric ${params.type} generator\nimport svgwrite\n# Add your parameters here`
        };
      }
    });
  }

  private getParametricRequirements(type: string): string {
    switch (type) {
      case 'box':
        return '- Finger joints with configurable tooth size\n- Adjustable material thickness\n- Optional lid design\n- Kerf compensation';
      case 'joint':
        return '- Configurable joint type (finger, dovetail, mortise)\n- Material thickness compensation\n- Tolerance settings';
      case 'gear':
        return '- Configurable tooth count and module\n- Center hole sizing\n- Involute gear profile';
      case 'hinge':
        return '- Pin diameter and hole spacing\n- Material thickness\n- Number of knuckles';
      default:
        return '- Configurable dimensions\n- Material-specific settings\n- Manufacturing tolerances';
    }
  }

  async generateMaterialSettings(material: string, thickness: number, machine: 'glowforge' | 'shaper'): Promise<{
    powerSettings?: { power: number; speed: number; passes: number };
    toolSettings?: { rpm: number; feedRate: number; plungeRate: number };
    recommendations: string[];
  }> {
    if (!aiRateLimiter.canMakeCall()) {
      const waitTime = aiRateLimiter.getTimeUntilNextCall();
      throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }
    
    const model = this.selectModel('balanced');
    const reasoningEffort = this.selectReasoningEffort('balanced');
    
    return trackAICall(model, 'Material Settings', async () => {
      aiRateLimiter.recordCall();
      
      const prompt = `Generate optimal ${machine} settings for:

Material: ${material}
Thickness: ${thickness}mm
Machine: ${machine}

Provide:
${machine === 'glowforge' 
  ? '- Power percentage (1-100)\n- Speed setting (1-10)\n- Number of passes\n- Focus height adjustment'
  : '- Spindle RPM\n- Feed rate (mm/min)\n- Plunge rate (mm/min)\n- Recommended bit type'
}
- Safety recommendations
- Test cut suggestions
- Common issues and solutions

Return as JSON with appropriate settings and recommendations.`;

      this.logModelUsage(model, 'Material Settings');

      const response = await this.ai.run(model, {
        reasoning: { effort: reasoningEffort },
        messages: [
          {
            role: "system",
            content: `You are an expert in ${machine} settings and material properties. Provide safe, tested settings.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      });

      try {
        return JSON.parse(response.response);
      } catch {
        // Fallback settings
        return {
          recommendations: [
            `Test settings on scrap ${material} first`,
            `Start with conservative settings and increase gradually`,
            `Ensure proper ventilation and safety equipment`
          ]
        };
      }
    });
  }

  private createContextualSVGPrompt(request: SVGGenerationRequest): string {
    let contextPrompt = `Create a laser-ready SVG design with the following specifications:

Description: ${request.description}
Material: ${request.material}
Dimensions: ${request.width}mm x ${request.height}mm
Style: ${request.style}
Complexity: ${request.complexity}`;

    // Add user context if available
    if (request.userHistory && request.userHistory.length > 0) {
      const recentProjects = request.userHistory.slice(0, 3);
      contextPrompt += `

User Context (previous projects):
${recentProjects.map(p => `- ${p.title}: ${p.project_type}`).join('\n')}

Consider the user's skill progression and preferences based on their project history.`;
    }

    contextPrompt += `

Requirements:
- Generate clean, scalable SVG code
- Use 0.025mm (0.001 inch) stroke width for cut lines, 0.25mm (0.01 inch) for score lines
- Create separate layers for different operations:
  * Cut layer: stroke="#FF0000" (red) for through cuts
  * Score layer: stroke="#0000FF" (blue) for score lines  
  * Engrave layer: stroke="#000000" (black) for engraving
- Optimize for ${request.material} material properties with kerf compensation
- Ensure design fits within ${request.width}x${request.height}mm dimensions
- Apply ${request.style} design principles
- Create ${request.complexity} level of detail
- Include proper layer grouping with id attributes (cuts, scores, engrave)
- Consider fabrication constraints and material grain direction
- Add power/speed metadata comments for Glowforge compatibility

Return only the SVG code without explanations.`;

    return contextPrompt;
  }
}

// Mock AI service for development/testing
export class MockCloudflareAIService {
  async generateContextualSVG(request: SVGGenerationRequest): Promise<string> {
    return `<svg width="${request.width}" height="${request.height}" viewBox="0 0 ${request.width} ${request.height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="${request.width-20}" height="${request.height-20}" fill="none" stroke="#000" stroke-width="0.1"/>
      <circle cx="${request.width/2}" cy="${request.height/2}" r="${Math.min(request.width, request.height)/4}" fill="none" stroke="#000" stroke-width="0.1"/>
      <text x="5" y="${request.height-5}" font-family="Arial" font-size="8" fill="#666">Mock AI: ${request.description}</text>
    </svg>`;
  }

  async generateGCode(): Promise<GCodeOutput> {
    return {
      gcode: "; Mock G-code\nG21 ; Set units to millimeters\nG90 ; Absolute positioning\nM3 S1000 ; Spindle on\nG1 X10 Y10 F1000\nM5 ; Spindle off",
      estimatedTime: "15 minutes",
      materialUsage: 75,
      cuttingPath: "Optimized mock path",
      warnings: ["This is mock data for development"]
    };
  }

  async analyzeQuality(): Promise<QualityPrediction> {
    return {
      successProbability: 90,
      potentialIssues: ["Mock analysis - no real issues detected"],
      recommendations: ["Test on scrap material", "Verify dimensions"],
      materialOptimizations: ["Mock optimization suggestions"]
    };
  }

  async generateWorkshopGuidance(): Promise<WorkshopGuidance> {
    return {
      safetyTips: ["Wear safety glasses", "Ensure proper ventilation"],
      stepByStep: ["Prepare materials", "Set machine parameters", "Execute cuts", "Finish edges"],
      toolsNeeded: ["Laser cutter", "Safety equipment"],
      timeEstimate: "30 minutes",
      difficultyRating: 5,
      troubleshooting: ["Check material thickness", "Verify cut settings"]
    };
  }

  async optimizeMaterial() {
    return {
      layout: "Mock optimized layout",
      efficiency: 85,
      wastePercentage: 15,
      recommendations: ["Mock layout recommendations"]
    };
  }
}

// Factory function to create appropriate AI service
export function createAIService(env?: Env): CloudflareAIService | MockCloudflareAIService {
  if (env?.AI) {
    return new CloudflareAIService(env.AI);
  }
  return new MockCloudflareAIService();
}

export const aiService = createAIService();
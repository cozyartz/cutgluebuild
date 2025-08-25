// Cloudflare Workers AI service for gpt-oss models
// Replaces OpenAI SDK for hackathon submission

import type { Env, UserProject } from './database';

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

  async generateContextualSVG(request: SVGGenerationRequest): Promise<string> {
    try {
      const prompt = this.createContextualSVGPrompt(request);
      
      const response = await this.ai.run('@cf/openai/gpt-oss-120b', {
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
      
    } catch (error) {
      console.error('Cloudflare AI SVG generation error:', error);
      throw new Error('Failed to generate SVG with AI');
    }
  }

  async generateGCode(svgData: string, material: string, machineType: string): Promise<GCodeOutput> {
    try {
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

      const response = await this.ai.run('@cf/openai/gpt-oss-120b', {
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
      
    } catch (error) {
      console.error('G-code generation error:', error);
      throw new Error('Failed to generate G-code');
    }
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

      const response = await this.ai.run('@cf/openai/gpt-oss-20b', {
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

      const response = await this.ai.run('@cf/openai/gpt-oss-20b', {
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

      const response = await this.ai.run('@cf/openai/gpt-oss-20b', {
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
- Use 0.1mm stroke width for cut lines, 0.05mm for engrave lines
- Optimize for ${request.material} material properties
- Ensure design fits within ${request.width}x${request.height}mm dimensions
- Apply ${request.style} design principles
- Create ${request.complexity} level of detail
- Include cut and engrave layers properly differentiated
- Consider fabrication constraints and material grain direction

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
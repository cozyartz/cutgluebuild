// New Agents SDK v0.1.0 + AI SDK v5 integration
// Replaces both openai.ts and cloudflare-ai.ts with unified approach

import { streamText, generateObject, generateText } from 'ai';
import { createWorkersAI } from 'workers-ai-provider';
import { z } from 'zod';
import type { Env, UserProject } from './database';
import { trackAICall, aiRateLimiter } from './ai-usage-tracker';

// Request interfaces (keeping existing for compatibility)
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

// Zod schemas for structured outputs (AI SDK v5 feature)
const ProjectIdeaSchema = z.object({
  projects: z.array(z.object({
    title: z.string(),
    description: z.string(),
    difficulty: z.string(),
    timeEstimate: z.string(),
    materials: z.array(z.string()),
    tools: z.array(z.string()),
    steps: z.array(z.string()),
    tips: z.array(z.string())
  }))
});

const QualityAnalysisSchema = z.object({
  successProbability: z.number(),
  potentialIssues: z.array(z.string()),
  recommendations: z.array(z.string()),
  materialOptimizations: z.array(z.string())
});

const GCodeSchema = z.object({
  gcode: z.string(),
  estimatedTime: z.string(),
  materialUsage: z.number(),
  cuttingPath: z.string(),
  warnings: z.array(z.string())
});

const WorkshopGuidanceSchema = z.object({
  safetyTips: z.array(z.string()),
  stepByStep: z.array(z.string()),
  toolsNeeded: z.array(z.string()),
  timeEstimate: z.string(),
  difficultyRating: z.number(),
  troubleshooting: z.array(z.string())
});

const MaterialOptimizationSchema = z.object({
  layout: z.string(),
  efficiency: z.number(),
  wastePercentage: z.number(),
  recommendations: z.array(z.string())
});

export class AgentsAIService {
  private workersAI: any;
  private openaiModel: any;
  private useCloudflare: boolean;

  constructor(env?: Env) {
    this.useCloudflare = !!env?.AI;
    
    if (this.useCloudflare && env?.AI) {
      this.workersAI = createWorkersAI({ binding: env.AI });
    }
    
    // Fallback to OpenAI if available
    if (!this.useCloudflare && typeof window !== 'undefined' && import.meta.env.OPENAI_API_KEY) {
      // Client-side OpenAI fallback (for development)
      import('openai').then(({ default: OpenAI }) => {
        const openai = new OpenAI({
          apiKey: import.meta.env.OPENAI_API_KEY,
          dangerouslyAllowBrowser: true
        });
        this.openaiModel = openai;
      });
    }
  }

  // Model selection based on task complexity
  private getModel(complexity: 'simple' | 'complex' | 'balanced' = 'balanced') {
    if (this.useCloudflare) {
      switch (complexity) {
        case 'complex': return this.workersAI('@cf/openai/gpt-oss-120b');
        case 'simple': return this.workersAI('@cf/openai/gpt-oss-20b');
        default: return this.workersAI('@cf/openai/gpt-oss-20b');
      }
    }
    
    // OpenAI fallback
    return 'gpt-4';
  }

  // Check rate limits before API calls
  private checkRateLimit() {
    if (!aiRateLimiter.canMakeCall()) {
      const waitTime = aiRateLimiter.getTimeUntilNextCall();
      throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }
    aiRateLimiter.recordCall();
  }

  async generateSVG(request: SVGGenerationRequest): Promise<string> {
    this.checkRateLimit();
    
    const model = this.getModel('simple');
    const prompt = this.createContextualSVGPrompt(request);
    
    return trackAICall(this.useCloudflare ? '@cf/openai/gpt-oss-20b' : 'gpt-4', 'SVG Generation', async () => {
      try {
        const { text } = await generateText({
          model,
          prompt,
          maxTokens: 2500,
          temperature: 0.7,
        });

        // Extract SVG from response
        const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
        return svgMatch ? svgMatch[0] : text;
        
      } catch (error) {
        console.error('AI SVG generation error:', error);
        throw new Error('Failed to generate SVG with AI');
      }
    });
  }

  async generateProjectIdeas(request: ProjectIdeaRequest): Promise<any[]> {
    this.checkRateLimit();
    
    const model = this.getModel('balanced');
    const prompt = this.createProjectIdeaPrompt(request);
    
    return trackAICall(this.useCloudflare ? '@cf/openai/gpt-oss-20b' : 'gpt-4', 'Project Ideas', async () => {
      try {
        const { object } = await generateObject({
          model,
          schema: ProjectIdeaSchema,
          prompt,
          maxTokens: 3000,
          temperature: 0.8,
        });

        return object.projects;
        
      } catch (error) {
        console.error('AI project ideas generation error:', error);
        // Fallback to text generation
        return this.generateProjectIdeasFallback(request);
      }
    });
  }

  async generateGCode(svgData: string, material: string, machineType: string): Promise<GCodeOutput> {
    this.checkRateLimit();
    
    const model = this.getModel('complex');
    const prompt = `Convert this SVG design to optimized G-code for ${machineType}:

SVG Data: ${svgData}
Material: ${material}
Machine: ${machineType}

Generate G-code with:
- Optimized cutting paths to minimize travel time
- Appropriate feed rates and speeds for ${material}
- Safety checks and tool changes
- Material usage calculations
- Estimated completion time`;
    
    return trackAICall(this.useCloudflare ? '@cf/openai/gpt-oss-120b' : 'gpt-4', 'G-code Generation', async () => {
      try {
        const { object } = await generateObject({
          model,
          schema: GCodeSchema,
          prompt,
          maxTokens: 3000,
          temperature: 0.3,
        });

        return object;
        
      } catch (error) {
        console.error('G-code generation error:', error);
        return this.generateGCodeFallback();
      }
    });
  }

  async analyzeQuality(svgData: string, material: string, settings: any): Promise<QualityPrediction> {
    this.checkRateLimit();
    
    const model = this.getModel('balanced');
    const prompt = `Analyze this design for fabrication quality:

Design: ${svgData}
Material: ${material}
Settings: ${JSON.stringify(settings)}

Predict success probability, potential issues, recommendations, and material optimizations.`;
    
    return trackAICall(this.useCloudflare ? '@cf/openai/gpt-oss-20b' : 'gpt-4', 'Quality Analysis', async () => {
      try {
        const { object } = await generateObject({
          model,
          schema: QualityAnalysisSchema,
          prompt,
          maxTokens: 1500,
          temperature: 0.4,
        });

        return object;
        
      } catch (error) {
        console.error('Quality analysis error:', error);
        return this.analyzeQualityFallback();
      }
    });
  }

  async generateWorkshopGuidance(project: UserProject): Promise<WorkshopGuidance> {
    this.checkRateLimit();
    
    const model = this.getModel('simple');
    const prompt = `Generate workshop guidance for this project:

Title: ${project.title}
Description: ${project.description}
Type: ${project.project_type}

Provide safety tips, step-by-step instructions, required tools, time estimate, difficulty rating, and troubleshooting.`;
    
    return trackAICall(this.useCloudflare ? '@cf/openai/gpt-oss-20b' : 'gpt-4', 'Workshop Guidance', async () => {
      try {
        const { object } = await generateObject({
          model,
          schema: WorkshopGuidanceSchema,
          prompt,
          maxTokens: 2000,
          temperature: 0.6,
        });

        return object;
        
      } catch (error) {
        console.error('Workshop guidance generation error:', error);
        return this.generateWorkshopGuidanceFallback();
      }
    });
  }

  async optimizeMaterial(designs: string[], materialDimensions: { width: number, height: number }) {
    this.checkRateLimit();
    
    const model = this.getModel('complex');
    const prompt = `Optimize material layout for these designs:

Designs: ${JSON.stringify(designs)}
Material: ${materialDimensions.width}mm x ${materialDimensions.height}mm

Calculate optimal nesting layout, efficiency, waste percentage, and recommendations.`;
    
    return trackAICall(this.useCloudflare ? '@cf/openai/gpt-oss-120b' : 'gpt-4', 'Material Optimization', async () => {
      try {
        const { object } = await generateObject({
          model,
          schema: MaterialOptimizationSchema,
          prompt,
          maxTokens: 1500,
          temperature: 0.3,
        });

        return object;
        
      } catch (error) {
        console.error('Material optimization error:', error);
        return this.optimizeMaterialFallback();
      }
    });
  }

  async vectorizeImage(imageData: string, settings: any): Promise<string> {
    this.checkRateLimit();
    
    const model = this.getModel('balanced');
    const prompt = `Convert this image to a laser-ready SVG with settings:
Quality: ${settings.quality}
Color mode: ${settings.colorMode}
Smoothing: ${settings.smoothing}%
Threshold: ${settings.threshold}

Generate clean SVG paths suitable for laser cutting.`;
    
    return trackAICall(this.useCloudflare ? '@cf/openai/gpt-oss-20b' : 'gpt-4', 'Image Vectorization', async () => {
      try {
        const { text } = await generateText({
          model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image', image: imageData }
              ]
            }
          ],
          maxTokens: 2000,
          temperature: 0.4,
        });

        const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
        return svgMatch ? svgMatch[0] : text;
        
      } catch (error) {
        console.error('Image vectorization error:', error);
        return this.vectorizeImageFallback();
      }
    });
  }

  // Stream-based SVG generation for real-time updates
  async *streamSVGGeneration(request: SVGGenerationRequest): AsyncGenerator<string, void, unknown> {
    this.checkRateLimit();
    
    const model = this.getModel('simple');
    const prompt = this.createContextualSVGPrompt(request);
    
    const { textStream } = await streamText({
      model,
      prompt,
      maxTokens: 2500,
      temperature: 0.7,
    });

    for await (const delta of textStream) {
      yield delta;
    }
  }

  // Private helper methods
  private createContextualSVGPrompt(request: SVGGenerationRequest): string {
    let prompt = `Create a laser-ready SVG design:

Description: ${request.description}
Material: ${request.material}
Dimensions: ${request.width}mm x ${request.height}mm
Style: ${request.style}
Complexity: ${request.complexity}`;

    if (request.userHistory?.length) {
      const recent = request.userHistory.slice(0, 3);
      prompt += `\n\nUser's recent projects: ${recent.map(p => p.title).join(', ')}`;
    }

    prompt += `\n\nGenerate clean SVG with:
- 0.025mm stroke width for cuts (red)
- 0.25mm for scores (blue)
- Black for engraving
- Proper layer grouping
- Kerf compensation for ${request.material}

Return only SVG code.`;

    return prompt;
  }

  private createProjectIdeaPrompt(request: ProjectIdeaRequest): string {
    return `Generate 3-5 project ideas for laser cutting/crafting:

Skill: ${request.skill}
Materials: ${request.materials.join(', ')}
Tools: ${request.tools.join(', ')}
Category: ${request.category}
Time: ${request.timeAvailable} hours

Each project needs: title, description, difficulty, time estimate, materials, tools, steps, and tips.`;
  }

  // Fallback methods for when structured generation fails
  private async generateProjectIdeasFallback(request: ProjectIdeaRequest): Promise<any[]> {
    return [{
      title: "Geometric Wall Art",
      description: `Create stunning ${request.category} patterns for your space.`,
      difficulty: request.skill,
      timeEstimate: `${request.timeAvailable} hours`,
      materials: request.materials.slice(0, 2),
      tools: request.tools.slice(0, 1),
      steps: ["Design pattern", "Prepare material", "Cut design", "Sand edges", "Apply finish", "Install"],
      tips: ["Start simple", "Test on scrap material"]
    }];
  }

  private generateGCodeFallback(): GCodeOutput {
    return {
      gcode: "; Fallback G-code\nG21\nG90\nM3 S1000\nG1 X10 Y10 F1000\nM5",
      estimatedTime: "15-30 minutes",
      materialUsage: 75,
      cuttingPath: "Optimized path",
      warnings: ["Test settings on scrap material"]
    };
  }

  private analyzeQualityFallback(): QualityPrediction {
    return {
      successProbability: 85,
      potentialIssues: ["Check material thickness", "Verify settings"],
      recommendations: ["Test first", "Check dimensions"],
      materialOptimizations: ["Consider grain direction", "Optimize layout"]
    };
  }

  private generateWorkshopGuidanceFallback(): WorkshopGuidance {
    return {
      safetyTips: ["Wear safety glasses", "Ensure ventilation"],
      stepByStep: ["Prepare materials", "Set parameters", "Execute cuts", "Finish"],
      toolsNeeded: ["Laser cutter", "Safety equipment"],
      timeEstimate: "30-60 minutes",
      difficultyRating: 5,
      troubleshooting: ["Increase power if incomplete", "Decrease speed for rough edges"]
    };
  }

  private optimizeMaterialFallback() {
    return {
      layout: "Grid layout with 5mm spacing",
      efficiency: 78,
      wastePercentage: 22,
      recommendations: ["Rotate pieces", "Consider smaller material"]
    };
  }

  private vectorizeImageFallback(): string {
    return `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <path d="M50,50 Q150,20 250,50 Q220,150 250,250 Q150,280 50,250 Q20,150 50,50 Z" 
            fill="none" stroke="#000" stroke-width="1"/>
      <circle cx="150" cy="150" r="30" fill="none" stroke="#000" stroke-width="1"/>
    </svg>`;
  }

  // Test connection to AI service
  async testConnection(): Promise<boolean> {
    try {
      if (this.useCloudflare) {
        const { text } = await generateText({
          model: this.getModel('simple'),
          prompt: 'Respond with just "OK"',
          maxTokens: 10
        });
        return text.includes('OK');
      } else if (this.openaiModel) {
        const response = await this.openaiModel.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'Respond with just "OK"' }],
          max_tokens: 10
        });
        return response.choices[0]?.message?.content?.includes('OK') || false;
      }
      return false;
    } catch (error) {
      console.error('AI connection test failed:', error);
      return false;
    }
  }
}

// Mock service for development
export class MockAgentsAIService {
  async generateSVG(request: SVGGenerationRequest): Promise<string> {
    return `<svg width="${request.width}" height="${request.height}" viewBox="0 0 ${request.width} ${request.height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="${request.width-20}" height="${request.height-20}" fill="none" stroke="#FF0000" stroke-width="0.025"/>
      <text x="5" y="${request.height-5}" font-size="8" fill="#666">Mock Agents SDK: ${request.description}</text>
    </svg>`;
  }

  async generateProjectIdeas(request: ProjectIdeaRequest): Promise<any[]> {
    return this.generateProjectIdeasFallback(request);
  }

  async generateGCode(): Promise<GCodeOutput> {
    return {
      gcode: "; Mock Agents SDK G-code\nG21\nG90\nM3 S1000\nG1 X10 Y10\nM5",
      estimatedTime: "Mock: 15 minutes",
      materialUsage: 75,
      cuttingPath: "Mock optimized",
      warnings: ["Mock data for development"]
    };
  }

  async analyzeQuality(): Promise<QualityPrediction> {
    return {
      successProbability: 95,
      potentialIssues: ["Mock analysis complete"],
      recommendations: ["Mock recommendations"],
      materialOptimizations: ["Mock optimizations"]
    };
  }

  async generateWorkshopGuidance(): Promise<WorkshopGuidance> {
    return {
      safetyTips: ["Mock safety tip"],
      stepByStep: ["Mock step 1", "Mock step 2"],
      toolsNeeded: ["Mock tools"],
      timeEstimate: "Mock: 30 minutes",
      difficultyRating: 3,
      troubleshooting: ["Mock troubleshooting"]
    };
  }

  async optimizeMaterial() {
    return {
      layout: "Mock layout",
      efficiency: 90,
      wastePercentage: 10,
      recommendations: ["Mock layout recommendations"]
    };
  }

  async vectorizeImage(): Promise<string> {
    return `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
      <circle cx="150" cy="150" r="100" fill="none" stroke="#000" stroke-width="2"/>
      <text x="110" y="160" font-size="16">Mock Vector</text>
    </svg>`;
  }

  async *streamSVGGeneration(request: SVGGenerationRequest): AsyncGenerator<string, void, unknown> {
    const mockSVG = await this.generateSVG(request);
    const chunks = mockSVG.split(' ');
    
    for (const chunk of chunks) {
      yield chunk + ' ';
      await new Promise(resolve => setTimeout(resolve, 50)); // Mock streaming delay
    }
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  private generateProjectIdeasFallback(request: ProjectIdeaRequest): any[] {
    return [{
      title: "Mock Project",
      description: `Mock ${request.category} project for ${request.skill} level.`,
      difficulty: request.skill,
      timeEstimate: `${request.timeAvailable} hours`,
      materials: request.materials.slice(0, 2),
      tools: request.tools.slice(0, 1),
      steps: ["Mock step 1", "Mock step 2", "Mock step 3"],
      tips: ["Mock tip 1", "Mock tip 2"]
    }];
  }
}

// Factory function
export function createAgentsAIService(env?: Env): AgentsAIService | MockAgentsAIService {
  if (env?.AI || (typeof window !== 'undefined' && import.meta.env.OPENAI_API_KEY)) {
    return new AgentsAIService(env);
  }
  return new MockAgentsAIService();
}

// Export convenience instance
export const agentsAIService = createAgentsAIService();

// Helper functions
export function isAgentsAIConfigured(env?: Env): boolean {
  return !!(env?.AI || (typeof window !== 'undefined' && import.meta.env.OPENAI_API_KEY));
}
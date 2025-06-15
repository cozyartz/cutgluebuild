import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for client-side usage in development
});

export interface SVGGenerationRequest {
  description: string;
  material: string;
  width: number;
  height: number;
  style: string;
  complexity: string;
}

export interface ProjectIdeaRequest {
  skill: string;
  materials: string[];
  tools: string[];
  category: string;
  timeAvailable: string;
}

export class OpenAIService {
  async generateSVG(request: SVGGenerationRequest): Promise<string> {
    try {
      const prompt = this.createSVGPrompt(request);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert SVG designer specializing in laser cutting and crafting. Generate clean, laser-ready SVG code with proper cut and engrave layers."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      const svgContent = completion.choices[0]?.message?.content;
      
      if (!svgContent) {
        throw new Error('No SVG content generated');
      }

      // Extract SVG from response if wrapped in markdown
      const svgMatch = svgContent.match(/<svg[\s\S]*?<\/svg>/i);
      return svgMatch ? svgMatch[0] : svgContent;
      
    } catch (error) {
      console.error('OpenAI SVG generation error:', error);
      throw new Error('Failed to generate SVG with AI');
    }
  }

  async generateProjectIdeas(request: ProjectIdeaRequest): Promise<any[]> {
    try {
      const prompt = this.createProjectIdeaPrompt(request);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert maker and crafting instructor. Generate detailed, practical project ideas for laser cutting and crafting based on user preferences."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.8
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No project ideas generated');
      }

      // Parse the response as JSON if possible
      try {
        return JSON.parse(response);
      } catch {
        // If not JSON, return a structured response
        return this.parseProjectIdeasFromText(response);
      }
      
    } catch (error) {
      console.error('OpenAI project ideas generation error:', error);
      throw new Error('Failed to generate project ideas with AI');
    }
  }

  async vectorizeImage(imageData: string, settings: any): Promise<string> {
    try {
      // Note: This is a simplified example. Real image vectorization would require
      // specialized AI models or services like Adobe's vectorization API
      
      const prompt = `Convert this image to a laser-ready SVG with the following settings:
      - Quality: ${settings.quality}
      - Color mode: ${settings.colorMode}
      - Smoothing: ${settings.smoothing}%
      - Threshold: ${settings.threshold}
      
      Generate clean SVG paths suitable for laser cutting.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        max_tokens: 2000
      });

      const svgContent = completion.choices[0]?.message?.content;
      
      if (!svgContent) {
        throw new Error('No SVG content generated from image');
      }

      const svgMatch = svgContent.match(/<svg[\s\S]*?<\/svg>/i);
      return svgMatch ? svgMatch[0] : svgContent;
      
    } catch (error) {
      console.error('OpenAI image vectorization error:', error);
      throw new Error('Failed to vectorize image with AI');
    }
  }

  private createSVGPrompt(request: SVGGenerationRequest): string {
    return `Create a laser-ready SVG design with the following specifications:

Description: ${request.description}
Material: ${request.material}
Dimensions: ${request.width}mm x ${request.height}mm
Style: ${request.style}
Complexity: ${request.complexity}

Requirements:
- Generate clean, scalable SVG code
- Use appropriate stroke widths for laser cutting (0.1mm for cut lines)
- Include proper cut and engrave layers
- Optimize for ${request.material} material
- Ensure design fits within ${request.width}x${request.height}mm dimensions
- Use ${request.style} design principles
- Make it ${request.complexity} in detail level

Return only the SVG code without any explanations.`;
  }

  private createProjectIdeaPrompt(request: ProjectIdeaRequest): string {
    return `Generate 3-5 detailed project ideas for laser cutting/crafting with these preferences:

Skill Level: ${request.skill}
Available Materials: ${request.materials.join(', ')}
Available Tools: ${request.tools.join(', ')}
Project Category: ${request.category}
Time Available: ${request.timeAvailable} hours

For each project, provide:
- Title
- Description (2-3 sentences)
- Difficulty level
- Time estimate
- Required materials
- Required tools
- Step-by-step instructions (5-8 steps)
- Tips for success

Format as JSON array with objects containing: title, description, difficulty, timeEstimate, materials, tools, steps, tips.`;
  }

  private parseProjectIdeasFromText(text: string): any[] {
    // Fallback parser for non-JSON responses
    const projects = [];
    const sections = text.split(/\d+\./);
    
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i].trim();
      const lines = section.split('\n').filter(line => line.trim());
      
      if (lines.length > 0) {
        projects.push({
          title: lines[0].replace(/[*#]/g, '').trim(),
          description: lines.slice(1, 3).join(' ').trim(),
          difficulty: 'intermediate',
          timeEstimate: '2-4 hours',
          materials: ['Wood', 'Acrylic'],
          tools: ['Laser Cutter'],
          steps: lines.slice(3).map(line => line.replace(/^[-*]\s*/, '').trim()),
          tips: ['Take your time with measurements', 'Test settings on scrap material first']
        });
      }
    }
    
    return projects;
  }
}

export const openaiService = new OpenAIService();

// Helper function to check if OpenAI is configured
export function isOpenAIConfigured(): boolean {
  return !!import.meta.env.OPENAI_API_KEY;
}

// Fallback service for when OpenAI is not available
export class MockAIService {
  async generateSVG(request: SVGGenerationRequest): Promise<string> {
    // Return mock SVG based on request
    return `
      <svg width="${request.width}" height="${request.height}" viewBox="0 0 ${request.width} ${request.height}" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="${request.width-20}" height="${request.height-20}" fill="none" stroke="#000" stroke-width="0.1"/>
        <circle cx="${request.width/2}" cy="${request.height/2}" r="${Math.min(request.width, request.height)/4}" fill="none" stroke="#000" stroke-width="0.1"/>
        <text x="5" y="${request.height-5}" font-family="Arial" font-size="8" fill="#666">
          ${request.description.substring(0, 30)}...
        </text>
      </svg>
    `;
  }

  async generateProjectIdeas(request: ProjectIdeaRequest): Promise<any[]> {
    // Return mock project ideas
    return [
      {
        title: "Geometric Wall Art",
        description: "Create stunning geometric patterns for your wall. Perfect for beginners with clean, simple cuts.",
        difficulty: request.skill,
        timeEstimate: request.timeAvailable + " hours",
        materials: request.materials.slice(0, 2),
        tools: request.tools.slice(0, 1),
        steps: [
          "Choose geometric pattern",
          "Prepare material",
          "Set laser parameters",
          "Cut the design",
          "Sand edges",
          "Apply finish",
          "Mount on wall"
        ],
        tips: ["Start with simple patterns", "Test settings on scrap material"]
      }
    ];
  }

  async vectorizeImage(imageData: string, settings: any): Promise<string> {
    // Return mock vectorized SVG
    return `
      <svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <path d="M50,50 Q150,20 250,50 Q220,150 250,250 Q150,280 50,250 Q20,150 50,50 Z" 
              fill="none" stroke="#000" stroke-width="1"/>
        <circle cx="150" cy="150" r="30" fill="none" stroke="#000" stroke-width="1"/>
      </svg>
    `;
  }
}

export const mockAIService = new MockAIService();

// Export the appropriate service based on configuration
export const aiService = isOpenAIConfigured() ? openaiService : mockAIService;
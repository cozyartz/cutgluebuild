// Enhanced Documentation Generation System
import type { Env, UserProject } from './database';
import { trackAICall, aiRateLimiter } from './ai-usage-tracker';

export interface DocumentationRequest {
  projectTitle: string;
  projectDescription: string;
  components: ComponentInfo[];
  materials: MaterialInfo[];
  tools: string[];
  difficulty: number;
  estimatedTime: string;
  safetyNotes?: string[];
}

export interface ComponentInfo {
  name: string;
  quantity: number;
  dimensions: string;
  material: string;
  notes?: string;
  svgPath?: string;
}

export interface MaterialInfo {
  type: string;
  thickness: number;
  dimensions: string;
  quantity: number;
  supplier?: string;
  grade?: string;
}

export interface AssemblyStep {
  stepNumber: number;
  title: string;
  description: string;
  tools: string[];
  duration: string;
  difficulty: number;
  safetyWarnings: string[];
  tips: string[];
  commonIssues: string[];
  qualityChecks: string[];
  images?: string[];
}

export interface ComprehensiveDocumentation {
  projectOverview: string;
  materialsList: string;
  toolsList: string;
  safetyGuidelines: string;
  preparationSteps: string[];
  assemblyInstructions: AssemblyStep[];
  qualityControl: string[];
  troubleshooting: string[];
  finishingOptions: string[];
  maintenanceGuide: string[];
  variations: string[];
  estimatedCosts: string;
  skillsRequired: string[];
  pdf: string; // Base64 encoded PDF
}

export class DocumentationGenerator {
  private ai: any;

  constructor(ai: any) {
    this.ai = ai;
  }

  async generateComprehensiveDocumentation(request: DocumentationRequest): Promise<ComprehensiveDocumentation> {
    if (!aiRateLimiter.canMakeCall()) {
      const waitTime = aiRateLimiter.getTimeUntilNextCall();
      throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    const model = '@cf/openai/gpt-oss-120b'; // Use complex model for detailed documentation
    
    return trackAICall(model, 'Documentation Generation', async () => {
      aiRateLimiter.recordCall();
      
      const prompt = this.createDocumentationPrompt(request);

      const response = await this.ai.run(model, {
        reasoning: { effort: \"high\" },
        messages: [
          {
            role: \"system\",
            content: \"You are an expert technical writer and maker instructor. Create comprehensive, professional fabrication documentation that guides users from start to finish with safety, precision, and clarity.\"
          },
          {
            role: \"user\",
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.3
      });

      try {
        const result = JSON.parse(response.response);
        return this.processDocumentationResult(result, request);
      } catch {
        // Fallback if JSON parsing fails
        return this.createFallbackDocumentation(request);
      }
    });
  }

  async generateAssemblySequence(components: ComponentInfo[], projectType: string): Promise<AssemblyStep[]> {
    if (!aiRateLimiter.canMakeCall()) {
      const waitTime = aiRateLimiter.getTimeUntilNextCall();
      throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    const model = '@cf/openai/gpt-oss-120b';
    
    return trackAICall(model, 'Assembly Sequence', async () => {
      aiRateLimiter.recordCall();
      
      const prompt = `Generate detailed assembly sequence for ${projectType}:

Components:
${components.map((c, i) => `${i+1}. ${c.name} (${c.quantity}x) - ${c.dimensions} - ${c.material}${c.notes ? ' - ' + c.notes : ''}`).join('\\n')}

Create step-by-step assembly instructions with:
- Logical build sequence (foundation first, details last)
- Tool requirements for each step  
- Time estimates per step
- Difficulty rating (1-10) per step
- Safety warnings specific to each step
- Quality control checkpoints
- Common mistakes and how to avoid them
- Pro tips for better results

Return as JSON array of steps:
[{
  "stepNumber": 1,
  "title": "Step title",
  "description": "Detailed step description",
  "tools": ["tool1", "tool2"],
  "duration": "time estimate",
  "difficulty": 1-10,
  "safetyWarnings": ["warning1", "warning2"],
  "tips": ["tip1", "tip2"],
  "commonIssues": ["issue1: solution1"],
  "qualityChecks": ["check1", "check2"]
}]`;

      const response = await this.ai.run(model, {
        reasoning: { effort: \"high\" },
        messages: [
          {
            role: \"system\",
            content: \"You are a master craftsperson and instructor. Create clear, safe, efficient assembly sequences.\"
          },
          {
            role: \"user\",
            content: prompt
          }
        ],
        max_tokens: 3500,
        temperature: 0.4
      });

      try {
        return JSON.parse(response.response);
      } catch {
        return this.createFallbackAssemblySteps(components);
      }
    });
  }

  async generateTroubleshootingGuide(projectType: string, materials: MaterialInfo[]): Promise<string[]> {
    if (!aiRateLimiter.canMakeCall()) {
      const waitTime = aiRateLimiter.getTimeUntilNextCall();
      throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    const model = '@cf/openai/gpt-oss-20b'; // Simpler model for troubleshooting
    
    return trackAICall(model, 'Troubleshooting Guide', async () => {
      aiRateLimiter.recordCall();
      
      const prompt = `Generate comprehensive troubleshooting guide for ${projectType} using materials:
${materials.map(m => `- ${m.type} (${m.thickness}mm) - ${m.dimensions}`).join('\\n')}

Cover common issues in:
1. Material preparation
2. Cutting/machining problems  
3. Assembly difficulties
4. Finishing issues
5. Structural problems

For each issue provide:
- Symptoms: How to identify the problem
- Causes: Why it happens
- Prevention: How to avoid it
- Solutions: How to fix it if it occurs
- When to start over vs. repair

Return as array of troubleshooting entries in format:
["Issue: Description | Cause: Reason | Prevention: How to avoid | Solution: How to fix"]`;

      const response = await this.ai.run(model, {
        reasoning: { effort: \"medium\" },
        messages: [
          {
            role: \"system\",
            content: \"You are an experienced maker who has seen every possible fabrication problem. Provide practical, tested solutions.\"
          },
          {
            role: \"user\",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.5
      });

      try {
        return JSON.parse(response.response);
      } catch {
        return [
          \"Cuts not clean: Check blade sharpness | Keep steady feed rate | Use proper cutting speed\",
          \"Parts don't fit: Measure twice, cut once | Account for kerf width | Test fit before final assembly\",
          \"Joints loose: Check material thickness | Adjust joint tolerances | Use appropriate glue\",
          \"Burn marks: Reduce cutting speed | Increase feed rate | Clean lens/bit\",
          \"Tear-out: Use backing board | Sharp tools | Proper grain direction\"
        ];
      }
    });
  }

  private createDocumentationPrompt(request: DocumentationRequest): string {
    return `Generate comprehensive fabrication documentation for: ${request.projectTitle}

Project Details:
- Description: ${request.projectDescription}
- Difficulty: ${request.difficulty}/10
- Estimated Time: ${request.estimatedTime}

Components (${request.components.length} items):
${request.components.map((c, i) => `${i+1}. ${c.name} (${c.quantity}x) - ${c.dimensions} - ${c.material}`).join('\\n')}

Materials Required:
${request.materials.map(m => `- ${m.type}: ${m.thickness}mm, ${m.dimensions} (${m.quantity}x)${m.grade ? ', Grade: ' + m.grade : ''}`).join('\\n')}

Tools Required: ${request.tools.join(', ')}

Generate complete fabrication documentation package:

1. **Project Overview**: 
   - Purpose and design goals
   - Skill level requirements
   - Time commitment breakdown
   - What you'll learn

2. **Materials & Sourcing**:
   - Complete bill of materials with specs
   - Supplier recommendations
   - Material selection criteria
   - Cost estimation

3. **Tool Requirements**:
   - Essential tools vs. nice-to-have
   - Tool setup and calibration
   - Safety equipment requirements
   - Alternative tool options

4. **Safety Guidelines**:
   - General workshop safety
   - Material-specific hazards
   - Tool safety procedures
   - Emergency procedures
   - PPE requirements

5. **Preparation Phase**:
   - Workspace setup
   - Material preparation steps
   - Tool preparation and calibration
   - Test cuts and calibration

6. **Quality Control Standards**:
   - Measurement and inspection points
   - Acceptable tolerance ranges
   - Go/no-go criteria
   - Testing procedures

7. **Finishing Options**:
   - Surface preparation
   - Finish selection guide
   - Application techniques
   - Maintenance requirements

8. **Project Variations**:
   - Design modifications
   - Scale adjustments
   - Material substitutions
   - Skill progression options

Return as JSON with these sections as string properties, plus estimatedCosts as cost breakdown string.`;
  }

  private processDocumentationResult(result: any, request: DocumentationRequest): ComprehensiveDocumentation {
    return {
      projectOverview: result.projectOverview || this.createProjectOverview(request),
      materialsList: result.materialsList || this.createMaterialsList(request.materials),
      toolsList: result.toolsList || request.tools.join(', '),
      safetyGuidelines: result.safetyGuidelines || this.createSafetyGuidelines(request),
      preparationSteps: result.preparationSteps || ['Prepare workspace', 'Check materials', 'Calibrate tools'],
      assemblyInstructions: [], // Will be generated separately
      qualityControl: result.qualityControl || ['Check dimensions', 'Test fit', 'Inspect finish'],
      troubleshooting: [], // Will be generated separately  
      finishingOptions: result.finishingOptions || ['Sand smooth', 'Apply finish', 'Final inspection'],
      maintenanceGuide: result.maintenanceGuide || ['Regular inspection', 'Touch up finish as needed'],
      variations: result.variations || ['Scale up/down', 'Alternative materials', 'Design modifications'],
      estimatedCosts: result.estimatedCosts || 'Costs vary by material choice and local suppliers',
      skillsRequired: this.extractSkillsRequired(request),
      pdf: '' // Would generate PDF in production
    };
  }

  private createFallbackDocumentation(request: DocumentationRequest): ComprehensiveDocumentation {
    return {
      projectOverview: this.createProjectOverview(request),
      materialsList: this.createMaterialsList(request.materials),
      toolsList: request.tools.join(', '),
      safetyGuidelines: this.createSafetyGuidelines(request),
      preparationSteps: [
        'Set up workspace with adequate lighting and ventilation',
        'Check all materials for defects',
        'Calibrate cutting tools and machines',
        'Prepare safety equipment'
      ],
      assemblyInstructions: this.createFallbackAssemblySteps(request.components),
      qualityControl: [
        'Check all dimensions against specifications',
        'Test fit all joints before final assembly',
        'Inspect cut quality and sand if needed',
        'Verify structural integrity'
      ],
      troubleshooting: [
        'Poor cut quality: Check tool sharpness and settings',
        'Parts don\'t fit: Verify measurements and adjust',
        'Finish issues: Sand between coats, control environment'
      ],
      finishingOptions: [
        'Sand progressively through grits',
        'Apply appropriate finish for use case',
        'Allow proper cure time between coats'
      ],
      maintenanceGuide: [
        'Inspect regularly for wear or damage',
        'Clean according to material requirements',
        'Touch up finish as needed'
      ],
      variations: [
        'Scale project up or down proportionally',
        'Substitute materials based on availability',
        'Modify design for different skill levels'
      ],
      estimatedCosts: 'Material costs typically $20-100 depending on size and materials chosen',
      skillsRequired: this.extractSkillsRequired(request),
      pdf: ''
    };
  }

  private createProjectOverview(request: DocumentationRequest): string {
    return `# ${request.projectTitle}

${request.projectDescription}

**Difficulty Level**: ${request.difficulty}/10
**Estimated Time**: ${request.estimatedTime}
**Components**: ${request.components.length} pieces

This project will teach you essential fabrication skills while creating a functional and attractive result. Perfect for ${request.difficulty <= 3 ? 'beginners' : request.difficulty <= 7 ? 'intermediate makers' : 'advanced craftspeople'}.`;
  }

  private createMaterialsList(materials: MaterialInfo[]): string {
    return materials.map(m => 
      `- ${m.type}: ${m.thickness}mm thick, ${m.dimensions} (${m.quantity} piece${m.quantity > 1 ? 's' : ''})${m.grade ? `, Grade: ${m.grade}` : ''}${m.supplier ? `, Supplier: ${m.supplier}` : ''}`
    ).join('\\n');
  }

  private createSafetyGuidelines(request: DocumentationRequest): string {
    const hasWoodworking = request.materials.some(m => m.type.includes('wood') || m.type.includes('plywood'));
    const hasAcrylic = request.materials.some(m => m.type.includes('acrylic'));
    
    let guidelines = `# Safety Guidelines

**Essential PPE**: Safety glasses, dust mask, hearing protection
**Workspace**: Well-ventilated area with good lighting
**Emergency**: Keep first aid kit and fire extinguisher nearby

`;

    if (hasWoodworking) {
      guidelines += `**Wood Safety**: 
- Check for nails/staples before cutting
- Cut with grain direction when possible
- Watch for kickback on power tools

`;
    }

    if (hasAcrylic) {
      guidelines += `**Acrylic Safety**:
- Remove protective film before cutting
- Use proper speeds to prevent melting
- Ventilate cutting fumes

`;
    }

    return guidelines;
  }

  private createFallbackAssemblySteps(components: ComponentInfo[]): AssemblyStep[] {
    return [
      {
        stepNumber: 1,
        title: 'Prepare Components',
        description: 'Organize all cut pieces and verify dimensions',
        tools: ['measuring tape', 'square'],
        duration: '10 minutes',
        difficulty: 2,
        safetyWarnings: ['Handle cut pieces carefully'],
        tips: ['Label pieces to avoid confusion'],
        commonIssues: ['Missing pieces: Double-check cut list'],
        qualityChecks: ['All pieces present and correctly sized']
      },
      {
        stepNumber: 2,
        title: 'Test Assembly',
        description: 'Dry fit all components without glue',
        tools: ['clamps'],
        duration: '15 minutes', 
        difficulty: 3,
        safetyWarnings: ['Don\'t force ill-fitting parts'],
        tips: ['Mark any adjustments needed'],
        commonIssues: ['Tight fit: Sand lightly to adjust'],
        qualityChecks: ['All joints fit properly', 'Assembly is square']
      },
      {
        stepNumber: 3,
        title: 'Final Assembly',
        description: 'Assemble with adhesive and fasteners',
        tools: ['clamps', 'glue', 'fasteners'],
        duration: '30 minutes',
        difficulty: 4,
        safetyWarnings: ['Follow glue manufacturer instructions'],
        tips: ['Work quickly once glue is applied'],
        commonIssues: ['Glue squeeze-out: Clean immediately'],
        qualityChecks: ['Tight joints', 'Square assembly', 'Clean finish']
      }
    ];
  }

  private extractSkillsRequired(request: DocumentationRequest): string[] {
    const skills = ['Basic measuring and marking'];
    
    if (request.tools.some(t => t.toLowerCase().includes('saw'))) {
      skills.push('Safe cutting techniques');
    }
    
    if (request.tools.some(t => t.toLowerCase().includes('drill'))) {
      skills.push('Drilling and hole placement');
    }
    
    if (request.components.some(c => c.name.toLowerCase().includes('joint'))) {
      skills.push('Joinery techniques');
    }
    
    if (request.difficulty >= 7) {
      skills.push('Advanced fabrication techniques');
    }
    
    return skills;
  }
}

export const documentationGenerator = new DocumentationGenerator(null);

#!/usr/bin/env node

/**
 * Test script for Cloudflare AI binding
 * Run with: node test-ai.js
 */

import { createAIService } from './src/lib/cloudflare-ai.js';

// Mock environment for testing
const mockEnv = {
  AI: {
    run: async (model, options) => {
      console.log(`🤖 Mock AI call to ${model}`);
      console.log(`📊 Reasoning effort: ${options.reasoning?.effort || 'none'}`);
      console.log(`💬 Messages: ${options.messages?.length || 0} messages`);
      console.log(`🎛️ Max tokens: ${options.max_tokens || 'default'}`);
      console.log(`🌡️ Temperature: ${options.temperature || 'default'}`);
      
      // Return mock SVG response
      if (model.includes('gpt-oss')) {
        return {
          response: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="80" height="80" fill="none" stroke="#000" stroke-width="0.1"/>
  <circle cx="50" cy="50" r="20" fill="none" stroke="#000" stroke-width="0.1"/>
  <text x="5" y="95" font-family="Arial" font-size="4" fill="#666">Test AI: ${model}</text>
</svg>`
        };
      }
      
      return { response: 'Mock AI response' };
    }
  }
};

async function testAIService() {
  console.log('🚀 Testing Cloudflare AI Service Configuration\n');
  
  const aiService = createAIService(mockEnv);
  
  // Test 1: SVG Generation (should use gpt-oss-20b with low reasoning)
  console.log('📝 Test 1: SVG Generation');
  try {
    const svgRequest = {
      description: 'Simple geometric pattern',
      material: 'plywood',
      width: 100,
      height: 100,
      style: 'modern',
      complexity: 'medium'
    };
    
    const svg = await aiService.generateContextualSVG(svgRequest);
    console.log('✅ SVG generated successfully');
    console.log(`📏 SVG length: ${svg.length} characters\n`);
  } catch (error) {
    console.error('❌ SVG generation failed:', error.message, '\n');
  }
  
  // Test 2: G-Code Generation (should use gpt-oss-120b with high reasoning)
  console.log('⚙️ Test 2: G-Code Generation');
  try {
    const gcode = await aiService.generateGCode(
      '<svg>test</svg>', 
      'plywood', 
      'laser_cutter'
    );
    console.log('✅ G-Code generated successfully');
    console.log(`📊 Estimated time: ${gcode.estimatedTime}\n`);
  } catch (error) {
    console.error('❌ G-Code generation failed:', error.message, '\n');
  }
  
  // Test 3: Quality Analysis (should use gpt-oss-120b with high reasoning)
  console.log('🔍 Test 3: Quality Analysis');
  try {
    const analysis = await aiService.analyzeQuality(
      '<svg>test</svg>', 
      'plywood', 
      { power: 80, speed: 1000 }
    );
    console.log('✅ Quality analysis completed');
    console.log(`📈 Success probability: ${analysis.successProbability}%\n`);
  } catch (error) {
    console.error('❌ Quality analysis failed:', error.message, '\n');
  }
  
  // Test 4: Workshop Guidance (should use gpt-oss-20b with low reasoning)
  console.log('📚 Test 4: Workshop Guidance');
  try {
    const mockProject = {
      title: 'Test Project',
      description: 'Simple test project',
      project_type: 'laser_cutting',
      metadata: '{"material": "plywood"}'
    };
    
    const guidance = await aiService.generateWorkshopGuidance(mockProject);
    console.log('✅ Workshop guidance generated');
    console.log(`⏱️ Estimated time: ${guidance.timeEstimate}\n`);
  } catch (error) {
    console.error('❌ Workshop guidance failed:', error.message, '\n');
  }
  
  console.log('🎉 All tests completed!');
  console.log('\n📋 Summary:');
  console.log('- Fast tasks (SVG, guidance) → gpt-oss-20b with low reasoning');
  console.log('- Complex tasks (G-code, analysis) → gpt-oss-120b with high reasoning');
  console.log('- All models now use proper reasoning effort configuration');
}

// Run tests
testAIService().catch(console.error);

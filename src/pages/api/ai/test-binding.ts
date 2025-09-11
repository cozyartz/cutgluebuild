import type { APIRoute } from 'astro';
import type { Env } from '../../../lib/database';
import { createAIService } from '../../../lib/cloudflare-ai';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const env = (locals as any)?.runtime?.env as Env;
    
    if (!env?.AI) {
      return new Response(JSON.stringify({ 
        error: 'AI binding not available',
        env: env ? 'env exists' : 'no env',
        AI: env?.AI ? 'AI binding exists' : 'no AI binding'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const aiService = createAIService(env);
    
    // Test basic connectivity
    const isConnected = await (aiService as any).testConnection?.() || false;
    
    if (!isConnected) {
      // Try a simple test call
      try {
        const response = await env.AI.run('@cf/openai/gpt-oss-20b', {
          reasoning: { effort: "low" },
          messages: [{ role: "user", content: "Test - respond with 'SUCCESS'" }],
          max_tokens: 20
        });
        
        return new Response(JSON.stringify({
          status: 'AI binding working',
          model: '@cf/openai/gpt-oss-20b',
          response: response.response || response,
          test: 'direct call success'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (directError) {
        return new Response(JSON.stringify({
          error: 'Direct AI call failed',
          details: directError.message,
          env_keys: Object.keys(env || {}),
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({
      status: 'AI binding working',
      service: 'CloudflareAIService',
      models: {
        fast: '@cf/openai/gpt-oss-20b',
        complex: '@cf/openai/gpt-oss-120b'
      },
      test: 'connection test passed'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('AI binding test error:', error);
    return new Response(JSON.stringify({
      error: 'Test failed',
      details: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

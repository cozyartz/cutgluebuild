# AI Configuration Guide - CutGlueBuild

## Overview
Your project uses **Cloudflare Workers AI** with OpenAI's new `gpt-oss-120b` and `gpt-oss-20b` models for optimal performance and cost efficiency.

## Model Selection Strategy

### gpt-oss-20b (Fast Model)
**Usage:** Simple tasks requiring quick responses
- **SVG Generation** - Low reasoning effort
- **Workshop Guidance** - Low reasoning effort  
- **Quality Analysis** - Medium reasoning effort

**Characteristics:**
- 21B total parameters, 3.6B active
- Faster response times
- Lower cost per request
- Context length: 128k tokens

### gpt-oss-120b (Complex Model)
**Usage:** Complex reasoning tasks
- **G-code Generation** - High reasoning effort
- **Material Optimization** - High reasoning effort

**Characteristics:**
- 117B total parameters, 5.1B active
- Superior reasoning capabilities
- Higher cost per request
- Context length: 128k tokens

## Rate Limits & Optimization

### Current Limits
- **Text Generation**: 300 requests/minute
- **Conservative Limit**: 250 requests/minute (built into rate limiter)

### Optimization Features
1. **Automatic Model Selection** - Tasks automatically use optimal model
2. **Reasoning Effort Control** - Configurable effort levels (low/medium/high)
3. **Rate Limiting** - Prevents API limit exceeded errors
4. **Usage Tracking** - Monitor performance and costs

## Testing Your Setup

### 1. Test AI Binding
```bash
# Start development server
wrangler dev --local

# Test the AI binding
curl http://localhost:8788/api/ai/test-binding
```

### 2. Check Usage Statistics
```bash
# View usage stats and recommendations
curl http://localhost:8788/api/ai/usage-stats \\
  -H "Cookie: cutglue_session=YOUR_SESSION_ID"
```

### 3. Test SVG Generation
```bash
curl -X POST http://localhost:8788/api/ai/generate-svg \\
  -H "Content-Type: application/json" \\
  -H "Cookie: cutglue_session=YOUR_SESSION_ID" \\
  -d '{
    "description": "Simple geometric bird house",
    "material": "plywood",
    "width": 100,
    "height": 100,
    "style": "modern",
    "complexity": "simple"
  }'
```

## Environment Configuration

### Required in wrangler.toml
```toml
[ai]
binding = "AI"

[env.production.ai]
binding = "AI"
```

### Verify Configuration
Your `wrangler.toml` is correctly configured with AI binding.

## Error Handling & Fallbacks

### Automatic Fallbacks
1. **Mock Service** - When AI binding unavailable
2. **Fallback SVG** - When AI generation fails
3. **Rate Limit Protection** - Prevents API errors

### Common Issues & Solutions

#### Issue: "AI binding not available"
**Solution:** Ensure you're running with Cloudflare Workers environment
```bash
wrangler dev  # Not wrangler dev --local for AI features
```

#### Issue: "Rate limit exceeded"
**Solution:** Implemented automatic rate limiting with retry suggestions

#### Issue: Slow responses
**Solution:** Optimized model selection - uses gpt-oss-20b for fast tasks

## Performance Monitoring

### Usage Tracking
- Monitor model usage patterns
- Track response times
- Success/failure rates
- Cost estimation

### Optimization Recommendations
The system provides automatic recommendations:
- Model selection optimization
- Response time improvements
- Cost reduction suggestions

## Next Steps

### 1. Deploy and Test
```bash
# Build and deploy
npm run build
wrangler pages deploy dist

# Test in production
curl https://cutgluebuild.com/api/ai/test-binding
```

### 2. Monitor Usage
- Check `/api/ai/usage-stats` regularly
- Monitor Cloudflare Workers AI dashboard
- Adjust model selection based on performance

### 3. Optimize Based on Usage
- Review recommendations in usage stats
- Adjust reasoning effort levels if needed
- Consider caching for repeated requests

## Cost Optimization

### Current Strategy
- **Fast tasks** → gpt-oss-20b (lower cost)
- **Complex tasks** → gpt-oss-120b (when reasoning needed)
- **Rate limiting** → Prevents overuse
- **Reasoning effort** → Adjustable based on needs

### Estimated Costs
Based on usage patterns, the system provides cost estimates in the usage stats endpoint.

## Advanced Configuration

### Custom Model Selection
Modify `src/lib/cloudflare-ai.ts` to adjust model selection logic:

```typescript
private selectModel(taskType: 'simple' | 'complex' | 'balanced'): string {
  // Customize based on your needs
}
```

### Reasoning Effort Tuning
Adjust reasoning effort levels for your specific use cases:

```typescript
private selectReasoningEffort(taskType: string): 'low' | 'medium' | 'high' {
  // Fine-tune for your requirements
}
```

Your AI setup is now optimized for the gpt-oss models with intelligent model selection, rate limiting, and comprehensive monitoring!

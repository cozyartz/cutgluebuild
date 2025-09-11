// AI Usage tracking and optimization utilities
import type { Env } from './database';

export interface AIUsageMetrics {
  modelUsed: string;
  taskType: string;
  tokensUsed?: number;
  responseTime: number;
  timestamp: Date;
  userId?: string;
  success: boolean;
  errorType?: string;
}

export class AIUsageTracker {
  private metrics: AIUsageMetrics[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 calls

  logUsage(metrics: AIUsageMetrics) {
    this.metrics.push(metrics);
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
    
    // Log for debugging
    console.log(`AI Usage: ${metrics.modelUsed} (${metrics.taskType}) - ${metrics.responseTime}ms - ${metrics.success ? 'SUCCESS' : 'FAILED'}`);
  }

  getUsageStats(): {
    totalCalls: number;
    modelBreakdown: Record<string, number>;
    taskBreakdown: Record<string, number>;
    averageResponseTime: number;
    successRate: number;
    recentErrors: string[];
  } {
    const total = this.metrics.length;
    
    const modelCounts = this.metrics.reduce((acc, m) => {
      acc[m.modelUsed] = (acc[m.modelUsed] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const taskCounts = this.metrics.reduce((acc, m) => {
      acc[m.taskType] = (acc[m.taskType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const avgResponseTime = total > 0 
      ? this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / total 
      : 0;
    
    const successCount = this.metrics.filter(m => m.success).length;
    const successRate = total > 0 ? successCount / total : 1;
    
    const recentErrors = this.metrics
      .filter(m => !m.success && m.errorType)
      .slice(-5)
      .map(m => m.errorType!);
    
    return {
      totalCalls: total,
      modelBreakdown: modelCounts,
      taskBreakdown: taskCounts,
      averageResponseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate * 100) / 100,
      recentErrors
    };
  }

  // Get recommendations for optimization
  getOptimizationRecommendations(): string[] {
    const stats = this.getUsageStats();
    const recommendations: string[] = [];
    
    // Check for high failure rate
    if (stats.successRate < 0.9) {
      recommendations.push(`Low success rate (${(stats.successRate * 100).toFixed(1)}%) - check API configuration`);
    }
    
    // Check for slow responses
    if (stats.averageResponseTime > 5000) {
      recommendations.push(`Slow average response time (${stats.averageResponseTime}ms) - consider using gpt-oss-20b for faster tasks`);
    }
    
    // Check model usage balance
    const gpt120bUsage = stats.modelBreakdown['@cf/openai/gpt-oss-120b'] || 0;
    const gpt20bUsage = stats.modelBreakdown['@cf/openai/gpt-oss-20b'] || 0;
    
    if (gpt120bUsage > gpt20bUsage * 2) {
      recommendations.push('Consider using gpt-oss-20b for simpler tasks to improve speed and reduce costs');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('AI usage is optimized - good model selection and performance');
    }
    
    return recommendations;
  }
}

// Global usage tracker instance
export const aiUsageTracker = new AIUsageTracker();

// Wrapper function to track AI calls
export async function trackAICall<T>(
  modelName: string,
  taskType: string,
  aiCall: () => Promise<T>,
  userId?: string
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await aiCall();
    const responseTime = Date.now() - startTime;
    
    aiUsageTracker.logUsage({
      modelUsed: modelName,
      taskType,
      responseTime,
      timestamp: new Date(),
      userId,
      success: true
    });
    
    return result;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    aiUsageTracker.logUsage({
      modelUsed: modelName,
      taskType,
      responseTime,
      timestamp: new Date(),
      userId,
      success: false,
      errorType: error.message
    });
    
    throw error;
  }
}

// Rate limiting helper
export class AIRateLimiter {
  private callTimes: number[] = [];
  private readonly maxCallsPerMinute = 250; // Conservative limit for text generation
  
  canMakeCall(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove calls older than 1 minute
    this.callTimes = this.callTimes.filter(time => time > oneMinuteAgo);
    
    return this.callTimes.length < this.maxCallsPerMinute;
  }
  
  recordCall() {
    this.callTimes.push(Date.now());
  }
  
  getTimeUntilNextCall(): number {
    if (this.canMakeCall()) return 0;
    
    const oldestCall = Math.min(...this.callTimes);
    const timeUntilExpiry = (oldestCall + 60000) - Date.now();
    return Math.max(0, timeUntilExpiry);
  }
}

export const aiRateLimiter = new AIRateLimiter();

// Usage Statistics Component
// Displays current usage and limits for the user

import { useState, useEffect } from 'react';
import { useSubscriptionTier } from '../../store/authStore';

interface UsageData {
  feature: string;
  used_today: number;
  used_this_month: number;
  limit_daily: number;
  limit_monthly: number;
  tier: string;
  reset_date: string;
}

export default function UsageStats() {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentTier = useSubscriptionTier();

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      const response = await fetch('/api/billing/usage');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setUsageData(data.usage_stats || []);
    } catch (err) {
      console.error('Error fetching usage data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load usage data');
    } finally {
      setIsLoading(false);
    }
  };

  const getFeatureName = (feature: string): string => {
    switch (feature) {
      case 'ai_generation':
        return 'AI Design Generation';
      case 'ai_analysis':
        return 'AI Quality Analysis';
      case 'project_creation':
        return 'Projects Created';
      case 'template_download':
        return 'Template Downloads';
      case 'export_operation':
        return 'File Exports';
      default:
        return feature.replace('_', ' ');
    }
  };

  const getUsagePercentage = (used: number, limit: number): number => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 bg-gray-300 rounded flex-1"></div>
                <div className="h-4 w-16 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Usage Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchUsageData();
            }}
            className="btn btn-outline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Usage This Month
          </h3>
          <p className="text-gray-600 dark:text-gray-400 capitalize">
            {currentTier} plan limits
          </p>
        </div>
        
        {currentTier === 'starter' && (
          <a href="/pricing" className="btn btn-primary btn-sm">
            Upgrade to Pro
          </a>
        )}
      </div>

      <div className="space-y-4">
        {usageData.map((usage) => {
          const dailyPercentage = getUsagePercentage(usage.used_today, usage.limit_daily);
          const monthlyPercentage = getUsagePercentage(usage.used_this_month, usage.limit_monthly);
          const isUnlimited = usage.limit_daily === -1;

          return (
            <div key={usage.feature} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {getFeatureName(usage.feature)}
                </span>
                <div className="flex items-center space-x-2">
                  {isUnlimited ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      Unlimited
                    </span>
                  ) : (
                    <>
                      <span className={`text-xs px-2 py-1 rounded-full ${getUsageColor(dailyPercentage)}`}>
                        {usage.used_today}/{usage.limit_daily} today
                      </span>
                      {usage.limit_monthly > 0 && (
                        <span className="text-xs text-gray-500">
                          {usage.used_this_month}/{usage.limit_monthly} this month
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {!isUnlimited && (
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(dailyPercentage)}`}
                      style={{ width: `${dailyPercentage}%` }}
                    ></div>
                  </div>
                  {dailyPercentage >= 90 && (
                    <div className="text-xs text-red-600 mt-1">
                      Daily limit almost reached
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {usageData.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              No usage data available yet.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Start using our AI tools to see your usage statistics here.
            </p>
          </div>
        )}
      </div>

      {/* Upgrade prompt for starter users */}
      {currentTier === 'starter' && usageData.some(u => u.used_today > u.limit_daily * 0.8) && (
        <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Approaching Limits</h4>
              <p className="text-sm text-gray-600">
                Upgrade to Professional for unlimited AI generations and premium features.
              </p>
            </div>
            <a href="/pricing" className="btn btn-primary btn-sm">
              Upgrade to Pro
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
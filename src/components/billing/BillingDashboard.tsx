// Billing Dashboard Component
// Displays subscription status, invoices, and billing management

import { useState, useEffect } from 'react';
import { useAuthStore, useSubscriptionTier } from '../../store/authStore';

interface Subscription {
  id: string;
  status: string;
  tier: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  trial_end?: number;
  created: string;
}

interface Invoice {
  id: string;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: string;
  invoice_url?: string;
  invoice_pdf?: string;
  period_start?: number;
  period_end?: number;
  created: string;
}

interface BillingData {
  subscription: Subscription | null;
  invoices: Invoice[];
  tier: string;
  status: string;
}

export default function BillingDashboard() {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isManaging, setIsManaging] = useState(false);
  const currentTier = useSubscriptionTier();

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const response = await fetch('/api/billing/subscription');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setBillingData(data);
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsManaging(true);
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const { portal_url } = await response.json();
      if (portal_url) {
        window.location.href = portal_url;
      }
    } catch (err) {
      console.error('Error opening portal:', err);
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
      setIsManaging(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }

    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ immediately: false })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Refresh billing data
      fetchBillingData();
    } catch (err) {
      console.error('Error canceling subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number, currency = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Billing Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchBillingData();
            }}
            className="btn btn-outline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const subscription = billingData?.subscription;
  const isTrialing = subscription?.status === 'trialing';
  const isActive = subscription?.status === 'active' || isTrialing;
  const isCanceled = subscription?.cancel_at_period_end;

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      <div className="card p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Subscription Status
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Current plan and billing information
            </p>
          </div>
          
          {isActive && (
            <div className="flex gap-2">
              <button
                onClick={handleManageBilling}
                disabled={isManaging}
                className="btn btn-outline btn-sm"
              >
                {isManaging ? 'Loading...' : 'Manage Billing'}
              </button>
              
              {!isCanceled && (
                <button
                  onClick={handleCancelSubscription}
                  className="btn btn-outline btn-sm text-red-600 border-red-600 hover:bg-red-50"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-3 h-3 rounded-full ${
                isActive ? 'bg-green-500' : 
                currentTier === 'free' ? 'bg-gray-400' : 'bg-red-500'
              }`}></div>
              <span className="font-medium capitalize">
                {currentTier} Plan
              </span>
              {isTrialing && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  Free Trial
                </span>
              )}
              {isCanceled && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  Canceled
                </span>
              )}
            </div>

            {subscription ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="capitalize">{subscription.status}</span>
                </div>
                
                {isTrialing && subscription.trial_end && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trial Ends</span>
                    <span>{formatDate(subscription.trial_end)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {isCanceled ? 'Access Until' : 'Next Billing'}
                  </span>
                  <span>{formatDate(subscription.current_period_end)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Started</span>
                  <span>{new Date(subscription.created).toLocaleDateString()}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">No active subscription</p>
            )}
          </div>

          {/* Upgrade/Downgrade Options */}
          {currentTier === 'free' && (
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Upgrade Your Plan</h4>
              <p className="text-sm text-gray-600 mb-3">
                Unlock more AI tools, premium templates, and advanced features.
              </p>
              <a href="/pricing" className="btn btn-primary btn-sm">
                View Plans
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Recent Invoices */}
      {billingData?.invoices && billingData.invoices.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Invoices
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Period</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {billingData.invoices.slice(0, 5).map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3">
                      {new Date(invoice.created).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      {formatAmount(invoice.amount_paid, invoice.currency)}
                    </td>
                    <td className="py-3">
                      <span className={`capitalize px-2 py-1 text-xs rounded-full ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-gray-600">
                      {invoice.period_start && invoice.period_end ? (
                        <>
                          {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                        </>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="py-3">
                      {invoice.invoice_url && (
                        <a 
                          href={invoice.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline text-xs"
                        >
                          View
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
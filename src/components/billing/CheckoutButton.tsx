// Stripe Checkout Button Component
// Handles subscription checkout flow with loading states

import { useState } from 'react';
import { useAuthStore, useIsAuthenticated } from '../../store/authStore';

interface CheckoutButtonProps {
  tier: 'maker' | 'pro';
  billingCycle?: 'monthly' | 'yearly';
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export default function CheckoutButton({ 
  tier, 
  billingCycle = 'monthly', 
  className = '', 
  children, 
  disabled = false 
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = useIsAuthenticated();

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = '/login?redirect=' + encodeURIComponent('/pricing');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier,
          billing_cycle: billingCycle
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const { checkout_url } = await response.json();
      
      if (checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = checkout_url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="text-center">
        <button
          onClick={() => setError(null)}
          className={`${className} opacity-75`}
          disabled={disabled}
        >
          {children}
        </button>
        <p className="text-red-500 text-sm mt-2">{error}</p>
        <button
          onClick={handleCheckout}
          className="text-primary-500 text-sm underline mt-1"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={disabled || isLoading}
      className={`${className} ${
        isLoading ? 'opacity-75 cursor-not-allowed' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </div>
      ) : (
        children
      )}
    </button>
  );
}
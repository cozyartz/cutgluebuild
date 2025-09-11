import React, { useState, useEffect } from 'react';
import { X, Cookie, Shield, Settings } from 'lucide-react';

interface CookieConsentProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export default function CookieConsent({ onAccept, onDecline }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always required
    functional: false,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cutglue_cookie_consent');
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const consentData = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now()
    };
    
    localStorage.setItem('cutglue_cookie_consent', JSON.stringify(consentData));
    setIsVisible(false);
    onAccept?.();
  };

  const handleDeclineAll = () => {
    const consentData = {
      essential: true, // Required for basic functionality
      functional: false,
      analytics: false,
      marketing: false,
      timestamp: Date.now()
    };
    
    localStorage.setItem('cutglue_cookie_consent', JSON.stringify(consentData));
    setIsVisible(false);
    onDecline?.();
  };

  const handleSavePreferences = () => {
    const consentData = {
      ...preferences,
      timestamp: Date.now()
    };
    
    localStorage.setItem('cutglue_cookie_consent', JSON.stringify(consentData));
    setIsVisible(false);
    onAccept?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-w-md w-full pointer-events-auto">
        <div className="p-6">
          {!showDetails ? (
            <>
              <div className="flex items-start gap-3 mb-4">
                <Cookie className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                    We use cookies
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    We use essential cookies to make our site work. We'd also like to set optional cookies to help us improve our services and analyze site usage.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={handleAcceptAll}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={handleDeclineAll}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Essential Only
                  </button>
                </div>
                
                <button
                  onClick={() => setShowDetails(true)}
                  className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium py-1"
                >
                  <Settings className="w-4 h-4" />
                  Customize Preferences
                </button>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                By continuing, you agree to our{' '}
                <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Terms of Service
                </a>
                .
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Cookie Preferences
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-900 dark:text-white text-sm">
                      Essential Cookies
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Required for authentication and core site functionality.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-900 dark:text-white text-sm">
                      Functional Cookies
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Remember your preferences and settings.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={(e) => setPreferences(prev => ({ ...prev, functional: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-900 dark:text-white text-sm">
                      Analytics Cookies
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Help us understand how visitors use our site.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-900 dark:text-white text-sm">
                      Marketing Cookies
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Used to show relevant ads and measure campaign effectiveness.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Save Preferences
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Accept All
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Utility function to check if specific cookie consent is given
export function hasCookieConsent(type: 'essential' | 'functional' | 'analytics' | 'marketing'): boolean {
  const consent = localStorage.getItem('cutglue_cookie_consent');
  if (!consent) return type === 'essential'; // Essential cookies are always allowed
  
  try {
    const parsed = JSON.parse(consent);
    return parsed[type] === true;
  } catch {
    return type === 'essential';
  }
}

// Function to get all consent preferences
export function getCookieConsent() {
  const consent = localStorage.getItem('cutglue_cookie_consent');
  if (!consent) return null;
  
  try {
    return JSON.parse(consent);
  } catch {
    return null;
  }
}
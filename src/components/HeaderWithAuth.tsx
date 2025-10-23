import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore, useUser, useSubscriptionTier } from '../store/authStore';
import {
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Package,
  CreditCard,
  Shield,
  Sparkles
} from 'lucide-react';

export default function HeaderWithAuth() {
  const user = useUser();
  const tier = useSubscriptionTier();
  const { logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const getTierBadge = () => {
    if (tier === 'pro') return { label: 'PRO', color: 'bg-gradient-to-r from-purple-500 to-pink-500' };
    if (tier === 'maker') return { label: 'MAKER', color: 'bg-gradient-to-r from-blue-500 to-cyan-500' };
    if (tier === 'starter') return { label: 'STARTER', color: 'bg-gradient-to-r from-green-500 to-emerald-500' };
    return { label: 'FREE', color: 'bg-gray-500' };
  };

  const tierBadge = getTierBadge();

  if (!user) {
    return (
      <div className="hidden md:flex items-center space-x-3">
        <a href="/login" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200">
          Sign In
        </a>
        <a href="/signup" className="btn btn-primary">
          Get Started
        </a>
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center space-x-4">
      {/* Dashboard Link */}
      <a
        href="/dashboard"
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <LayoutDashboard className="w-4 h-4" />
        <span className="text-sm font-medium">Dashboard</span>
      </a>

      {/* User Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user.profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full text-white font-medium ${tierBadge.color}`}>
              {tierBadge.label}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full text-white font-medium ${tierBadge.color}`}>
                  <Sparkles className="w-3 h-3" />
                  {tierBadge.label} PLAN
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">AI Uses This Month</span>
                <span className="font-medium">47 / {tier === 'pro' ? '∞' : tier === 'maker' ? '100' : '50'}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                <div className="bg-gradient-to-r from-primary-500 to-secondary-500 h-1 rounded-full" style={{ width: '47%' }} />
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <a
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </a>
              <a
                href="/account"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <User className="w-4 h-4" />
                Account Settings
              </a>
              <a
                href="/account#billing"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Billing & Subscription
              </a>
              <a
                href="/templates"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Package className="w-4 h-4" />
                My Templates
              </a>
              <a
                href="/account/privacy"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Privacy & Security
              </a>
            </div>

            {/* Upgrade CTA for non-pro users */}
            {tier !== 'pro' && (
              <div className="px-4 py-3 bg-gradient-to-r from-primary-500 to-secondary-500">
                <a
                  href="/pricing"
                  className="flex items-center justify-between text-white text-sm font-medium"
                >
                  <span>Upgrade to PRO</span>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Save 20%</span>
                </a>
              </div>
            )}

            {/* Logout */}
            <div className="border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
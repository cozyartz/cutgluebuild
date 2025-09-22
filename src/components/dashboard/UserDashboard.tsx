import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  FolderOpen,
  Download,
  Trophy,
  TrendingUp,
  Calendar,
  Clock,
  FileText,
  Package,
  Settings,
  CreditCard,
  User,
  Shield,
  Activity,
  ChevronRight,
  Plus,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useAuthStore, useUser, useSubscriptionTier } from '../../store/authStore';
import toast from 'react-hot-toast';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
}

interface StatCard {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: string;
}

export default function UserDashboard() {
  const user = useUser();
  const tier = useSubscriptionTier();
  const [stats, setStats] = useState({
    projectsCount: 12,
    templatesDownloaded: 8,
    aiGenerations: 47,
    totalExports: 23,
    storageUsed: '234 MB',
    thisMonthActivity: 156
  });

  const [recentProjects, setRecentProjects] = useState([
    { id: '1', name: 'Geometric Shield', created: '2 days ago', type: 'AI Generated', status: 'completed' },
    { id: '2', name: 'Custom Box Design', created: '1 week ago', type: 'Template', status: 'in-progress' },
    { id: '3', name: 'Garden Markers Set', created: '2 weeks ago', type: 'AI Generated', status: 'completed' },
    { id: '4', name: 'Wall Art Pattern', created: '3 weeks ago', type: 'Upload', status: 'completed' }
  ]);

  const [achievements, setAchievements] = useState([
    { id: '1', title: 'First Project', description: 'Created your first project', icon: '🎯', unlocked: true },
    { id: '2', title: 'Template Explorer', description: 'Downloaded 5 templates', icon: '📦', unlocked: true },
    { id: '3', title: 'AI Master', description: 'Generated 50 AI designs', icon: '🤖', unlocked: false, progress: 47, total: 50 },
    { id: '4', title: 'Community Star', description: 'Share 10 projects', icon: '⭐', unlocked: false, progress: 0, total: 10 }
  ]);

  const quickActions: QuickAction[] = [
    {
      title: 'Generate AI Design',
      description: 'Create new design with AI',
      icon: <Sparkles className="w-5 h-5" />,
      action: () => window.location.href = '/tools/generate',
      color: 'bg-gradient-to-br from-purple-500 to-pink-500'
    },
    {
      title: 'Browse Templates',
      description: 'Explore template library',
      icon: <Package className="w-5 h-5" />,
      action: () => window.location.href = '/templates',
      color: 'bg-gradient-to-br from-blue-500 to-cyan-500'
    },
    {
      title: 'Upload Image',
      description: 'Convert image to vector',
      icon: <FileText className="w-5 h-5" />,
      action: () => window.location.href = '/tools/upload',
      color: 'bg-gradient-to-br from-green-500 to-emerald-500'
    },
    {
      title: 'View Projects',
      description: 'Manage your projects',
      icon: <FolderOpen className="w-5 h-5" />,
      action: () => window.location.href = '/tools/projects',
      color: 'bg-gradient-to-br from-orange-500 to-red-500'
    }
  ];

  const statCards: StatCard[] = [
    {
      title: 'AI Generations',
      value: stats.aiGenerations,
      change: 12,
      changeLabel: 'vs last month',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
    },
    {
      title: 'Projects',
      value: stats.projectsCount,
      change: 3,
      changeLabel: 'this month',
      icon: <FolderOpen className="w-5 h-5" />,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Downloads',
      value: stats.templatesDownloaded,
      change: -2,
      changeLabel: 'vs last month',
      icon: <Download className="w-5 h-5" />,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Total Activity',
      value: stats.thisMonthActivity,
      change: 23,
      changeLabel: '% increase',
      icon: <Activity className="w-5 h-5" />,
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
    }
  ];

  const getUsagePercentage = () => {
    if (tier === 'pro') return 0; // Unlimited
    if (tier === 'maker') return (stats.aiGenerations / 100) * 100;
    if (tier === 'starter') return (stats.aiGenerations / 50) * 100;
    return (stats.aiGenerations / 10) * 100; // Free tier
  };

  const getUsageLimit = () => {
    if (tier === 'pro') return 'Unlimited';
    if (tier === 'maker') return '100';
    if (tier === 'starter') return '50';
    return '10';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.name || 'Creator'}! 👋
            </h1>
            <p className="text-white/90">
              Here's what's happening with your projects today
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/tools/generate'}
            className="btn bg-white text-primary-500 hover:bg-gray-100 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                {stat.icon}
              </div>
              {stat.change && (
                <div className={`flex items-center text-xs ${stat.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {Math.abs(stat.change)}{stat.changeLabel.includes('%') ? '%' : ''}
                </div>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stat.title}
              </p>
              {stat.changeLabel && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {stat.changeLabel}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="group relative overflow-hidden rounded-xl p-6 text-white transition-transform hover:scale-105"
            >
              <div className={`absolute inset-0 ${action.color}`} />
              <div className="relative z-10">
                <div className="mb-3">{action.icon}</div>
                <h3 className="font-semibold mb-1">{action.title}</h3>
                <p className="text-xs text-white/90">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Usage & Projects Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Usage Overview */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Monthly Usage
            </h2>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {tier === 'free' ? 'Free Plan' : `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">AI Generations</span>
                <span className="text-sm font-medium">
                  {stats.aiGenerations} / {getUsageLimit()}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Storage Used</span>
                <span className="text-sm font-medium">{stats.storageUsed} / 1 GB</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                  style={{ width: '23.4%' }}
                />
              </div>
            </div>

            {tier !== 'pro' && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <a
                  href="/pricing"
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  Upgrade for more features
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Recent Projects
            </h2>
            <a
              href="/tools/projects"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all
            </a>
          </div>

          <div className="space-y-3">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {project.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {project.type} • {project.created}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    project.status === 'completed'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    {project.status === 'completed' ? 'Completed' : 'In Progress'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Achievements
          </h2>
          <Trophy className="w-5 h-5 text-yellow-500" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                achievement.unlocked
                  ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
              }`}
            >
              <div className="text-2xl mb-2">{achievement.icon}</div>
              <h3 className={`font-medium mb-1 ${
                achievement.unlocked
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-500'
              }`}>
                {achievement.title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {achievement.description}
              </p>
              {!achievement.unlocked && achievement.progress !== undefined && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{achievement.progress}/{achievement.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-1 rounded-full"
                      style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              {achievement.unlocked && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs">✓</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
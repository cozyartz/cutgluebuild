import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  File,
  Activity,
  Settings,
  BarChart3,
  Shield,
  Zap,
  Download,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Database,
  Cpu
} from 'lucide-react';

interface AdminStats {
  users: {
    total: number;
    active: number;
    new_this_month: number;
    by_tier: Record<string, number>;
  };
  templates: {
    total: number;
    downloads: number;
    popular: Array<{ name: string; downloads: number }>;
  };
  ai: {
    generations_today: number;
    total_generations: number;
    average_response_time: number;
    error_rate: number;
  };
  system: {
    uptime: string;
    database_size: string;
    cache_hit_rate: number;
    active_sessions: number;
  };
}

interface RecentActivity {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  resource_type: string;
  details: string;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load admin dashboard data
      const [statsResponse, activityResponse] = await Promise.all([
        fetch('/api/admin/stats', { credentials: 'include' }),
        fetch('/api/admin/activity', { credentials: 'include' })
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-indigo-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  CutGlueBuild System Administration
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>System Operational</span>
              </div>
              <button
                onClick={loadDashboardData}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                <Activity className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'templates', label: 'Templates', icon: File },
              { id: 'ai', label: 'AI Usage', icon: Cpu },
              { id: 'system', label: 'System', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <OverviewTab stats={stats} recentActivity={recentActivity} />
        )}
        {activeTab === 'users' && <UsersTab stats={stats} />}
        {activeTab === 'templates' && <TemplatesTab stats={stats} />}
        {activeTab === 'ai' && <AIUsageTab stats={stats} />}
        {activeTab === 'system' && <SystemTab stats={stats} />}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ stats: AdminStats | null; recentActivity: RecentActivity[] }> = ({ stats, recentActivity }) => {
  if (!stats) return <div>Loading...</div>;

  const cards = [
    {
      title: 'Total Users',
      value: stats.users.total.toLocaleString(),
      change: `+${stats.users.new_this_month} this month`,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Template Downloads',
      value: stats.templates.downloads.toLocaleString(),
      change: '+15% vs last month',
      icon: Download,
      color: 'bg-green-500'
    },
    {
      title: 'AI Generations Today',
      value: stats.ai.generations_today.toLocaleString(),
      change: `${stats.ai.error_rate.toFixed(1)}% error rate`,
      icon: Zap,
      color: 'bg-purple-500'
    },
    {
      title: 'Active Sessions',
      value: stats.system.active_sessions.toString(),
      change: stats.system.uptime,
      icon: Activity,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
          >
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{card.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">{card.change}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Admin Activity
        </h3>
        <div className="space-y-3">
          {recentActivity.slice(0, 10).map((activity, index) => (
            <div key={activity.id} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-2 w-2 bg-indigo-600 rounded-full"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">
                  <span className="font-medium">{activity.admin_name}</span> {activity.action} {activity.resource_type}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(activity.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Users Tab Component
const UsersTab: React.FC<{ stats: AdminStats | null }> = ({ stats }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          User Statistics
        </h3>
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{stats.users.total}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.users.active}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.users.new_this_month}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">New This Month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(stats.users.by_tier).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Paid Users</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Templates Tab Component
const TemplatesTab: React.FC<{ stats: AdminStats | null }> = ({ stats }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Template Analytics
        </h3>
        {stats && (
          <div>
            <div className="mb-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.templates.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Templates</div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Popular Templates</h4>
              {stats.templates.popular.map((template, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{template.name}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {template.downloads} downloads
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// AI Usage Tab Component
const AIUsageTab: React.FC<{ stats: AdminStats | null }> = ({ stats }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          AI Usage Monitoring
        </h3>
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.ai.generations_today}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Generations Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.ai.total_generations}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Generations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.ai.average_response_time}ms</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${stats.ai.error_rate < 5 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.ai.error_rate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Error Rate</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// System Tab Component
const SystemTab: React.FC<{ stats: AdminStats | null }> = ({ stats }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          System Health
        </h3>
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{stats.system.uptime}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{stats.system.database_size}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Database Size</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{stats.system.cache_hit_rate}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cache Hit Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{stats.system.active_sessions}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Sessions</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  DevicePhoneMobileIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { dashboardApi, DashboardOverview } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError,
  } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => dashboardApi.getOverview(),
  });

  const {
    data: activityData,
    isLoading: activityLoading,
  } = useQuery({
    queryKey: ['activity-chart', selectedPeriod],
    queryFn: () => dashboardApi.getActivityChart({ period: selectedPeriod }),
  });

  const {
    data: recentActivity,
    isLoading: recentLoading,
  } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => dashboardApi.getRecentActivity({ limit: 10 }),
  });

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (overviewError) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading dashboard</h3>
        <p className="mt-1 text-sm text-gray-500">Please try again later.</p>
      </div>
    );
  }

  const data = overview?.data;

  // Chart data for activity
  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Messages Sent',
        data: [12, 19, 3, 5, 2, 3, 7],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Messages Received',
        data: [8, 15, 7, 12, 9, 5, 11],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Doughnut chart data for device status
  const deviceStatusData = {
    labels: ['Active', 'Inactive', 'Disconnected'],
    datasets: [
      {
        data: [data?.devices.active || 0, data?.devices.total - (data?.devices.active || 0), 0],
        backgroundColor: [
          'rgb(34, 197, 94)',
          'rgb(156, 163, 175)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down';
    icon: React.ComponentType<any>;
    color: string;
  }> = ({ title, value, change, trend, icon: Icon, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {change && (
              <div className={`ml-2 flex items-center text-sm ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend === 'up' ? (
                  <ArrowUpIcon className="h-4 w-4" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4" />
                )}
                <span className="ml-1">{change}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Monitor your WhatsApp automation activities</p>
        </div>
        <div className="flex space-x-2">
          {(['24h', '7d', '30d', '90d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                selectedPeriod === period
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Devices"
          value={`${data?.devices.active || 0}/${data?.devices.total || 0}`}
          change={data?.devices.percentage || '0%'}
          trend="up"
          icon={DevicePhoneMobileIcon}
          color="bg-blue-500"
        />
        <StatCard
          title="Messages Today"
          value={data?.messages.today || 0}
          change={data?.messages.change || '0%'}
          trend={data?.messages.trend || 'up'}
          icon={ChatBubbleLeftRightIcon}
          color="bg-green-500"
        />
        <StatCard
          title="Pending Tasks"
          value={data?.tasks.pending || 0}
          icon={ClockIcon}
          color="bg-yellow-500"
        />
        <StatCard
          title="Success Rate"
          value={data?.tasks.successRate || '0%'}
          icon={CheckCircleIcon}
          color="bg-purple-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Message Activity</h3>
          {activityLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>

        {/* Device Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Device Status</h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={deviceStatusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* License Info */}
      {data?.license && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {data.license.type} License
              </h3>
              <p className="text-sm text-gray-600">
                Expires in {data.license.expiresIn} days • {data.license.messagesUsedToday}/{data.license.messageLimit} messages used today
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {data.license.deviceLimit} devices allowed
              </p>
              <p className="text-xs text-gray-500">
                {data.license.messageLimit === null ? 'Unlimited' : data.license.messageLimit} messages/month
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          {recentLoading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity?.data?.slice(0, 5).map((activity: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {activity.type === 'message' && (
                        <>
                          {activity.direction === 'OUTGOING' ? 'Sent' : 'Received'} message to{' '}
                          {activity.phoneNumber}
                        </>
                      )}
                      {activity.type === 'task' && (
                        <>
                          {activity.taskType} task {activity.status}
                        </>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

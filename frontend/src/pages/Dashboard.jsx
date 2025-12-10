import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Clock, Activity, RefreshCw } from 'lucide-react';

const COLORS = ['#DC2626', '#2563EB', '#D97706', '#EA580C', '#059669', '#6B7280'];

function Dashboard() {
  const location = useLocation(); // Track route changes
  const [stats, setStats] = useState(null);
  const [clusters, setClusters] = useState([]);
  const [topAreas, setTopAreas] = useState([]);
  const [timeline, setTimeline] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Memoized function to load dashboard data
  const loadDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('🔄 Loading dashboard data...', { isRefresh, timestamp: new Date().toISOString() });

      // Parallel API calls for better performance
      const [statsData, clustersData, areasData, timelineData] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getClusters(),
        dashboardAPI.getTopAreas(),
        dashboardAPI.getTimeline(),
      ]);

      console.log('✅ Dashboard data loaded:', {
        stats: statsData,
        clustersCount: clustersData.clusters?.length || 0,
        areasCount: areasData.top_areas?.length || 0,
        timelineDays: Object.keys(timelineData.timeline || {}).length
      });

      // Update state with fresh data
      setStats(statsData);
      setClusters(clustersData.clusters || []);
      setTopAreas(areasData.top_areas || []);
      setTimeline(timelineData.timeline || {});
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load and auto-refresh setup
  useEffect(() => {
    console.log('🎯 Dashboard mounted or route changed:', location.pathname);
    
    // Load data immediately whenever we navigate to dashboard
    loadDashboardData();

    // Set up auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      console.log('⏰ Auto-refresh triggered');
      loadDashboardData(true);
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => {
      console.log('🧹 Dashboard cleanup - clearing interval');
      clearInterval(intervalId);
    };
  }, [loadDashboardData, location.pathname]); // Re-run when route changes

  // Manual refresh handler
  const handleManualRefresh = () => {
    loadDashboardData(true);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  // Prepare chart data
  const statusData = [
    { name: 'Pending', value: stats?.pending_incidents || 0, color: '#D97706' },
    { name: 'Verified', value: stats?.verified_incidents || 0, color: '#059669' },
    { name: 'Resolved', value: stats?.resolved_incidents || 0, color: '#6B7280' },
  ];

  const timelineChartData = Object.entries(timeline).map(([date, data]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    total: data.total,
    ...data.by_type,
  }));

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold">Responder Dashboard</h2>
            {lastUpdate && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            <span className="sm:hidden">↻</span>
          </button>
        </div>

        {/* Key Stats */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 transition-opacity ${refreshing ? 'opacity-60' : 'opacity-100'}`}>
          <StatCard
            icon={<Activity className="w-8 h-8" />}
            title="Total Incidents"
            value={stats?.total_incidents || 0}
            color="bg-blue-500"
          />
          <StatCard
            icon={<AlertTriangle className="w-8 h-8" />}
            title="Critical"
            value={stats?.critical_incidents || 0}
            color="bg-red-600"
          />
          <StatCard
            icon={<Clock className="w-8 h-8" />}
            title="Pending"
            value={stats?.pending_incidents || 0}
            color="bg-yellow-500"
          />
          <StatCard
            icon={<CheckCircle className="w-8 h-8" />}
            title="Resolved"
            value={stats?.resolved_incidents || 0}
            color="bg-green-500"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Status Distribution */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">7-Day Incident Timeline</h3>
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <BarChart data={timelineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#2563EB" name="Total Incidents" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Clusters */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Priority Incident Clusters</h3>
          {clusters.length > 0 ? (
            <div className="space-y-4">
              {clusters.slice(0, 5).map((cluster, index) => (
                <div
                  key={cluster.cluster_id}
                  className="border-l-4 p-3 sm:p-4 rounded-lg bg-gray-50"
                  style={{
                    borderColor: cluster.priority_score >= 0.8 ? '#DC2626' :
                                 cluster.priority_score >= 0.6 ? '#D97706' : '#059669'
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-base sm:text-lg">Cluster #{cluster.cluster_id}</span>
                      <span className="px-2 sm:px-3 py-1 rounded-full text-white text-xs sm:text-sm" style={{
                        backgroundColor: cluster.priority_score >= 0.8 ? '#DC2626' :
                                       cluster.priority_score >= 0.6 ? '#D97706' : '#059669'
                      }}>
                        {cluster.recommended_action.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-gray-700">
                      {cluster.incident_count} incidents
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 mb-2">{cluster.action_message}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Location:</span> {cluster.center_latitude.toFixed(4)}, {cluster.center_longitude.toFixed(4)}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {cluster.dominant_type}
                    </div>
                    <div>
                      <span className="font-medium">Priority:</span> {(cluster.priority_score * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No active clusters at this time</p>
          )}
        </div>

        {/* Top Areas */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Hotspot Areas (Last 24h)</h3>
          {topAreas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topAreas.map((area, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-crisis-red">{area.count}</span>
                    <span className="text-sm text-gray-500">incidents</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    📍 {area.latitude.toFixed(2)}, {area.longitude.toFixed(2)}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(area.types).map(([type, count]) => (
                      <span key={type} className="text-xs px-2 py-1 bg-gray-100 rounded">
                        {type}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hotspots detected</p>
          )}
        </div>

        {/* Quick Stats Footer */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-blue-600 font-medium">Last 24 Hours</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-700">{stats?.incidents_last_24h || 0}</p>
            <p className="text-xs sm:text-sm text-blue-600">New Reports</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-purple-600 font-medium">Active Clusters</p>
            <p className="text-2xl sm:text-3xl font-bold text-purple-700">{stats?.active_clusters || 0}</p>
            <p className="text-xs sm:text-sm text-purple-600">Require Coordination</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-orange-600 font-medium">Most Common</p>
            <p className="text-2xl sm:text-3xl font-bold text-orange-700 truncate">{stats?.most_common_type || 'N/A'}</p>
            <p className="text-xs sm:text-sm text-orange-600">Incident Type</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold">{value}</p>
        </div>
        <div className={`${color} text-white p-2 sm:p-3 rounded-lg flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Clock, Activity, RefreshCw, TrendingDown, Zap, MapPinned, Shield, Radio, Filter } from 'lucide-react';

const COLORS = ['#EF4444', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#6B7280'];
const PRIORITY_COLORS = {
  critical: '#DC2626',
  high: '#F97316',
  medium: '#FBBF24',
  low: '#10B981'
};

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
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-red-600 border-r-red-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const statusData = [
    { name: 'Pending', value: stats?.pending_incidents || 0, color: '#F59E0B' },
    { name: 'Verified', value: stats?.verified_incidents || 0, color: '#10B981' },
    { name: 'Resolved', value: stats?.resolved_incidents || 0, color: '#6B7280' },
  ];

  const timelineChartData = Object.entries(timeline).map(([date, data]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    total: data.total,
    ...data.by_type,
  }));

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Enhanced Header with Glassmorphism */}
        <div className="backdrop-blur-xl bg-white/70 border border-white/20 rounded-2xl shadow-xl p-6 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Command Center
                  </h1>
                  <p className="text-sm text-slate-500 font-medium">Real-time incident monitoring & analytics</p>
                </div>
              </div>
              {lastUpdate && (
                <div className="flex items-center gap-2 mt-3 text-xs text-slate-600">
                  <Radio className="w-3.5 h-3.5 text-green-500 animate-pulse" />
                  <span>Live • Last sync {lastUpdate.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="group relative px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                  <span className="hidden sm:inline">{refreshing ? 'Syncing...' : 'Refresh Data'}</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 sm:mb-8 transition-all duration-300 ${refreshing ? 'opacity-60 scale-95' : 'opacity-100 scale-100'}`}>
          <EnhancedStatCard
            icon={<Activity className="w-6 h-6" />}
            title="Total Incidents"
            value={stats?.total_incidents || 0}
            trend="+12%"
            trendUp={true}
            gradient="from-blue-500 to-blue-600"
            bgGradient="from-blue-50 to-blue-100/50"
          />
          <EnhancedStatCard
            icon={<AlertTriangle className="w-6 h-6" />}
            title="Critical Alerts"
            value={stats?.critical_incidents || 0}
            trend="-5%"
            trendUp={false}
            gradient="from-red-500 to-red-600"
            bgGradient="from-red-50 to-red-100/50"
          />
          <EnhancedStatCard
            icon={<Clock className="w-6 h-6" />}
            title="Pending Review"
            value={stats?.pending_incidents || 0}
            trend="+8%"
            trendUp={true}
            gradient="from-amber-500 to-amber-600"
            bgGradient="from-amber-50 to-amber-100/50"
          />
          <EnhancedStatCard
            icon={<CheckCircle className="w-6 h-6" />}
            title="Resolved"
            value={stats?.resolved_incidents || 0}
            trend="+23%"
            trendUp={true}
            gradient="from-green-500 to-green-600"
            bgGradient="from-green-50 to-green-100/50"
          />
        </div>

        {/* Enhanced Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Status Distribution - Redesigned */}
          <div className="lg:col-span-1 backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Status Overview</h3>
                <p className="text-xs text-slate-500 mt-1">Current distribution</p>
              </div>
              <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg">
                <Filter className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <defs>
                  {statusData.map((entry, index) => (
                    <linearGradient key={index} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={entry.color} stopOpacity={1}/>
                      <stop offset="100%" stopColor={entry.color} stopOpacity={0.7}/>
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#gradient-${index})`} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Timeline - Enhanced */}
          <div className="lg:col-span-2 backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Incident Trends</h3>
                <p className="text-xs text-slate-500 mt-1">7-day activity overview</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">+15.3%</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={timelineChartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94A3B8"
                  style={{ fontSize: '12px', fontWeight: '500' }}
                />
                <YAxis 
                  stroke="#94A3B8"
                  style={{ fontSize: '12px', fontWeight: '500' }}
                />
                <Tooltip 
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    padding: '12px'
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#1E293B' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  fill="url(#colorTotal)" 
                  name="Total Incidents"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Clusters - Redesigned */}
        <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl shadow-xl p-6 mb-8 hover:shadow-2xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Active Threat Clusters</h3>
              <p className="text-sm text-slate-500 mt-1">AI-identified incident hotspots requiring immediate attention</p>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl">
              <span className="text-sm font-bold text-red-700">{clusters.length} Active</span>
            </div>
          </div>
          
          {clusters.length > 0 ? (
            <div className="space-y-4">
              {clusters.slice(0, 5).map((cluster, index) => {
                const priorityLevel = cluster.priority_score >= 0.8 ? 'critical' : 
                                     cluster.priority_score >= 0.6 ? 'high' : 
                                     cluster.priority_score >= 0.4 ? 'medium' : 'low';
                const priorityColor = PRIORITY_COLORS[priorityLevel];
                
                return (
                  <div
                    key={cluster.cluster_id}
                    className="group relative overflow-hidden backdrop-blur-sm bg-gradient-to-r from-white to-slate-50 border-l-4 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                    style={{ borderColor: priorityColor }}
                  >
                    {/* Priority Indicator */}
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-5" style={{ background: `radial-gradient(circle, ${priorityColor} 0%, transparent 70%)` }}></div>
                    
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200">
                          <MapPinned className="w-5 h-5" style={{ color: priorityColor }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-lg text-slate-800">Cluster #{cluster.cluster_id}</h4>
                            <span 
                              className="px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wide"
                              style={{ backgroundColor: priorityColor }}
                            >
                              {priorityLevel}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">{cluster.action_message}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black bg-gradient-to-br from-slate-700 to-slate-900 bg-clip-text text-transparent">
                          {cluster.incident_count}
                        </div>
                        <span className="text-xs text-slate-500 font-medium">incidents</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <MapPinned className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Location</p>
                          <p className="text-sm font-bold text-slate-700">{cluster.center_latitude.toFixed(3)}, {cluster.center_longitude.toFixed(3)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Type</p>
                          <p className="text-sm font-bold text-slate-700 capitalize">{cluster.dominant_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Priority</p>
                          <p className="text-sm font-bold text-slate-700">{(cluster.priority_score * 100).toFixed(0)}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Activity className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Action</p>
                          <p className="text-sm font-bold text-slate-700 capitalize">{cluster.recommended_action.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <p className="text-slate-600 font-medium">No active threat clusters detected</p>
              <p className="text-sm text-slate-400 mt-1">All incidents are well-distributed</p>
            </div>
          )}
        </div>

        {/* Hotspot Areas - Redesigned */}
        <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl shadow-xl p-6 mb-8 hover:shadow-2xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Geographic Hotspots</h3>
              <p className="text-sm text-slate-500 mt-1">High-density incident areas in the last 24 hours</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
              <MapPinned className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-700">{topAreas.length} Areas</span>
            </div>
          </div>
          
          {topAreas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {topAreas.map((area, index) => (
                <div 
                  key={index} 
                  className="group relative overflow-hidden backdrop-blur-sm bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl p-5 hover:shadow-xl hover:border-red-300 transition-all duration-300 hover:scale-105"
                >
                  {/* Background decoration */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-red-100 to-orange-100 rounded-full opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg">
                          <MapPinned className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-3xl font-black bg-gradient-to-br from-red-600 to-orange-600 bg-clip-text text-transparent">
                            {area.count}
                          </div>
                          <span className="text-xs text-slate-500 font-medium">incidents</span>
                        </div>
                      </div>
                      <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        area.count > 10 ? 'bg-red-100 text-red-700' :
                        area.count > 5 ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {area.count > 10 ? 'HIGH' : area.count > 5 ? 'MEDIUM' : 'LOW'}
                      </div>
                    </div>
                    
                    <div className="mb-3 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPinned className="w-4 h-4 text-slate-400" />
                        <span className="font-mono">{area.latitude.toFixed(4)}, {area.longitude.toFixed(4)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Incident Types</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(area.types).map(([type, count]) => (
                          <span 
                            key={type} 
                            className="px-2.5 py-1 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 hover:border-slate-400 transition-colors"
                          >
                            {type}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPinned className="w-10 h-10 text-blue-600" />
              </div>
              <p className="text-slate-600 font-medium">No hotspots detected</p>
              <p className="text-sm text-slate-400 mt-1">Incident density is within normal parameters</p>
            </div>
          )}
        </div>

        {/* Enhanced Quick Stats Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <MetricCard
            icon={<Activity className="w-6 h-6" />}
            label="Last 24 Hours"
            value={stats?.incidents_last_24h || 0}
            subtitle="New Reports"
            gradient="from-blue-500 to-cyan-500"
            bgPattern="from-blue-50 to-cyan-50"
          />
          <MetricCard
            icon={<Zap className="w-6 h-6" />}
            label="Active Clusters"
            value={stats?.active_clusters || 0}
            subtitle="Require Coordination"
            gradient="from-purple-500 to-pink-500"
            bgPattern="from-purple-50 to-pink-50"
          />
          <MetricCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Most Common"
            value={stats?.most_common_type || 'N/A'}
            subtitle="Incident Type"
            gradient="from-orange-500 to-red-500"
            bgPattern="from-orange-50 to-red-50"
            isText={true}
          />
        </div>
      </div>
    </div>
  );
}

// Enhanced Stat Card Component
function EnhancedStatCard({ icon, title, value, trend, trendUp, gradient, bgGradient }) {
  return (
    <div className={`group relative overflow-hidden backdrop-blur-sm bg-gradient-to-br ${bgGradient} border border-white/40 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
      <div className="absolute inset-0 bg-white/50 backdrop-blur-sm"></div>
      <div className="relative p-5 lg:p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">{title}</p>
            <p className="text-3xl lg:text-4xl font-black text-slate-800">{value}</p>
          </div>
          <div className={`p-3 bg-gradient-to-br ${gradient} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <div className="text-white">
              {icon}
            </div>
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/50">
            {trendUp ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-sm font-bold ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trend}
            </span>
            <span className="text-xs text-slate-500 ml-1">vs last period</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ icon, label, value, subtitle, gradient, bgPattern, isText = false }) {
  return (
    <div className={`group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br ${bgPattern} border border-white/40 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300`}>
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm"></div>
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-3 bg-gradient-to-br ${gradient} rounded-xl shadow-lg`}>
            <div className="text-white">{icon}</div>
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</div>
        </div>
        <div className={`${isText ? 'text-2xl' : 'text-4xl'} font-black text-slate-800 mb-1 ${isText ? 'capitalize' : ''}`}>
          {value}
        </div>
        <p className="text-sm text-slate-600 font-medium">{subtitle}</p>
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

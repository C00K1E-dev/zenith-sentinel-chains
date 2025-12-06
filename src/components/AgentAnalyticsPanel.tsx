import { useState, useEffect } from 'react';
import { X, TrendingUp, Users, MessageSquare, Clock, Loader2, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AgentAnalyticsPanelProps {
  agentId: string;
  agentName: string;
  onClose: () => void;
}

interface AnalyticsData {
  totalMessages: number;
  uniqueUsers: number;
  avgResponseTime: number;
  messagesOverTime: Array<{
    date: string;
    messages: number;
  }>;
  userEngagement: Array<{
    userId: string;
    username: string;
    messageCount: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    messages: number;
  }>;
}

export default function AgentAnalyticsPanel({ agentId, agentName, onClose }: AgentAnalyticsPanelProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

  useEffect(() => {
    loadAnalytics();
  }, [agentId, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const now = new Date();
      let startDate = new Date(0); // Unix epoch for 'all'
      if (timeRange === '7d') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeRange === '30d') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get agent message logs
      const { data: messages, error } = await supabase
        .from('agent_message_logs')
        .select('*')
        .eq('agent_id', agentId)
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      if (!messages || messages.length === 0) {
        setAnalytics({
          totalMessages: 0,
          uniqueUsers: 0,
          avgResponseTime: 0,
          messagesOverTime: [],
          userEngagement: [],
          hourlyDistribution: []
        });
        return;
      }

      // Calculate total messages
      const totalMessages = messages.length;

      // Calculate unique users
      const uniqueUserIds = new Set(messages.map(m => m.user_id));
      const uniqueUsers = uniqueUserIds.size;

      // Calculate average response time
      const responseTimes = messages
        .filter(m => m.response_time_ms)
        .map(m => m.response_time_ms);
      const avgResponseTime = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
        : 0;

      // Messages over time (daily aggregation)
      const messagesByDate: { [key: string]: number } = {};
      messages.forEach(m => {
        const date = new Date(m.timestamp).toISOString().split('T')[0];
        messagesByDate[date] = (messagesByDate[date] || 0) + 1;
      });
      const messagesOverTime = Object.entries(messagesByDate).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        messages: count
      }));

      // User engagement
      const messagesByUser: { [key: string]: { count: number; username: string } } = {};
      messages.forEach(m => {
        if (!messagesByUser[m.user_id]) {
          messagesByUser[m.user_id] = { count: 0, username: m.username || 'Unknown' };
        }
        messagesByUser[m.user_id].count++;
      });
      const userEngagement = Object.entries(messagesByUser)
        .map(([userId, data]) => ({
          userId,
          username: data.username,
          messageCount: data.count
        }))
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, 10); // Top 10 users

      // Hourly distribution
      const messagesByHour: { [key: number]: number } = {};
      messages.forEach(m => {
        const hour = new Date(m.timestamp).getHours();
        messagesByHour[hour] = (messagesByHour[hour] || 0) + 1;
      });
      const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        messages: messagesByHour[hour] || 0
      }));

      setAnalytics({
        totalMessages,
        uniqueUsers,
        avgResponseTime,
        messagesOverTime,
        userEngagement,
        hourlyDistribution
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="glass-card p-8 max-w-4xl w-full mx-4">
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin mr-2" />
            <p>Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto"
        onClick={onClose}
      >
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-card p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="text-primary" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-orbitron font-bold">Agent Analytics</h2>
                  <p className="text-sm text-muted-foreground">{agentName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="px-4 py-2 bg-secondary/20 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="all">All time</option>
                </select>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-secondary/20 rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {analytics && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Messages</p>
                        <p className="text-2xl font-bold">{analytics.totalMessages}</p>
                      </div>
                      <MessageSquare className="text-blue-500" size={32} />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Unique Users</p>
                        <p className="text-2xl font-bold">{analytics.uniqueUsers}</p>
                      </div>
                      <Users className="text-green-500" size={32} />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Avg Response Time</p>
                        <p className="text-2xl font-bold">{analytics.avgResponseTime}ms</p>
                      </div>
                      <Clock className="text-purple-500" size={32} />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Engagement Rate</p>
                        <p className="text-2xl font-bold">
                          {analytics.uniqueUsers > 0 ? (analytics.totalMessages / analytics.uniqueUsers).toFixed(1) : '0'}
                        </p>
                      </div>
                      <TrendingUp className="text-primary" size={32} />
                    </div>
                  </motion.div>
                </div>

                {/* Messages Over Time Chart */}
                {analytics.messagesOverTime.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4">Messages Over Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analytics.messagesOverTime}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                          dataKey="date" 
                          stroke="rgba(255,255,255,0.5)"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.5)"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(0,0,0,0.8)', 
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="messages" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          dot={{ fill: '#8b5cf6', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Users */}
                  {analytics.userEngagement.length > 0 && (
                    <div className="glass-card p-6">
                      <h3 className="text-lg font-semibold mb-4">Top Users</h3>
                      <div className="space-y-3">
                        {analytics.userEngagement.map((user, index) => (
                          <div key={user.userId} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-bold">
                                {index + 1}
                              </div>
                              <span className="text-sm font-medium">{user.username}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{user.messageCount} messages</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hourly Distribution */}
                  {analytics.hourlyDistribution.length > 0 && (
                    <div className="glass-card p-6">
                      <h3 className="text-lg font-semibold mb-4">Hourly Activity</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={analytics.hourlyDistribution}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis 
                            dataKey="hour" 
                            stroke="rgba(255,255,255,0.5)"
                            style={{ fontSize: '10px' }}
                          />
                          <YAxis 
                            stroke="rgba(255,255,255,0.5)"
                            style={{ fontSize: '10px' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(0,0,0,0.8)', 
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar dataKey="messages" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

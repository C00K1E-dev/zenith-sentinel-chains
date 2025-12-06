import { useState, useEffect } from 'react';
import { Bot, Users, DollarSign, TrendingUp, Search, ExternalLink, Calendar, MessageSquare, Settings, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AgentSettingsPanel from '@/components/AgentSettingsPanel';

interface TelegramAgent {
  id: string;
  project_name: string;
  bot_handle: string;
  user_wallet: string;
  pricing_tier: string;
  deployment_status: string;
  message_count: number;
  created_at: string;
  subscription_status: string;
  expiry_date: string | null;
  subscription_cost: number | null;
  transaction_hash: string | null;
  telegram_webhook_url: string | null;
  vercel_deployment_url: string | null;
}

interface DashboardStats {
  total_agents: number;
  active_agents: number;
  expired_agents: number;
  total_revenue: number;
  total_messages: number;
  unique_users: number;
  revenue_by_tier: {
    starter: number;
    pro: number;
    enterprise: number;
  };
  agents_by_tier: {
    starter: number;
    pro: number;
    enterprise: number;
  };
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6'];
const TIER_COLORS = {
  starter: '#10b981',
  pro: '#3b82f6',
  enterprise: '#8b5cf6'
};

export default function TelegramAgentsDashboard() {
  const [agents, setAgents] = useState<TelegramAgent[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_agents: 0,
    active_agents: 0,
    expired_agents: 0,
    total_revenue: 0,
    total_messages: 0,
    unique_users: 0,
    revenue_by_tier: { starter: 0, pro: 0, enterprise: 0 },
    agents_by_tier: { starter: 0, pro: 0, enterprise: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');
  const [selectedTab, setSelectedTab] = useState<'agents' | 'analytics'>('agents');
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all agents with their subscriptions and user info
      const { data: agentsData, error: agentsError } = await supabase
        .from('telegram_agents')
        .select(`
          *,
          users!telegram_agents_user_id_fkey(wallet_address),
          subscriptions(
            subscription_tier,
            subscription_cost_usd,
            payment_status,
            expiry_date,
            transaction_hash
          )
        `)
        .order('created_at', { ascending: false });

      if (agentsError) throw agentsError;

      // Transform data
      const transformedAgents = agentsData?.map((agent: any) => {
        const latestSub = agent.subscriptions?.[0];
        const isActive = latestSub && 
          latestSub.payment_status === 'confirmed' && 
          new Date(latestSub.expiry_date) > new Date();

        return {
          id: agent.id,
          project_name: agent.project_name,
          bot_handle: agent.bot_handle,
          user_wallet: agent.users?.wallet_address || 'N/A',
          pricing_tier: agent.pricing_tier,
          deployment_status: agent.deployment_status,
          message_count: agent.message_count || 0,
          created_at: agent.created_at,
          subscription_status: isActive ? 'active' : 'expired',
          expiry_date: latestSub?.expiry_date || null,
          subscription_cost: latestSub?.subscription_cost_usd || null,
          transaction_hash: latestSub?.transaction_hash || null,
          telegram_webhook_url: agent.telegram_webhook_url,
          vercel_deployment_url: agent.vercel_deployment_url
        };
      }) || [];

      setAgents(transformedAgents);

      // Calculate stats
      const { data: subsData } = await supabase
        .from('subscriptions')
        .select('subscription_tier, subscription_cost_usd, payment_status, expiry_date');

      const confirmedSubs = subsData?.filter(s => s.payment_status === 'confirmed') || [];
      const activeSubs = confirmedSubs.filter(s => new Date(s.expiry_date) > new Date());

      const totalRevenue = confirmedSubs.reduce((sum, s) => sum + parseFloat(s.subscription_cost_usd.toString()), 0);
      
      const revenueByTier = confirmedSubs.reduce((acc, s) => {
        acc[s.subscription_tier as keyof typeof acc] += parseFloat(s.subscription_cost_usd.toString());
        return acc;
      }, { starter: 0, pro: 0, enterprise: 0 });

      const agentsByTier = transformedAgents.reduce((acc, a) => {
        acc[a.pricing_tier as keyof typeof acc]++;
        return acc;
      }, { starter: 0, pro: 0, enterprise: 0 });

      const totalMessages = transformedAgents.reduce((sum, a) => sum + a.message_count, 0);
      const uniqueUsers = new Set(transformedAgents.map(a => a.user_wallet)).size;

      setStats({
        total_agents: transformedAgents.length,
        active_agents: activeSubs.length,
        expired_agents: transformedAgents.length - activeSubs.length,
        total_revenue: totalRevenue,
        total_messages: totalMessages,
        unique_users: uniqueUsers,
        revenue_by_tier: revenueByTier,
        agents_by_tier: agentsByTier
      });

    } catch (error) {
      console.error('Failed to load Telegram agents data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = 
      agent.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.bot_handle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.user_wallet.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterStatus === 'all' ? true :
      filterStatus === 'active' ? agent.subscription_status === 'active' :
      agent.subscription_status === 'expired';

    return matchesSearch && matchesFilter;
  });

  const pieChartData = [
    { name: 'Starter', value: stats.agents_by_tier.starter },
    { name: 'Pro', value: stats.agents_by_tier.pro },
    { name: 'Enterprise', value: stats.agents_by_tier.enterprise }
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Telegram AI Agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-orbitron font-bold mb-2 flex items-center gap-3">
          <Bot className="text-primary" size={32} />
          Telegram AI Agents Dashboard
        </h1>
        <p className="text-muted-foreground">Manage all Telegram AI agents, subscriptions, and analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Agents</p>
              <p className="text-3xl font-bold">{stats.total_agents}</p>
            </div>
            <Bot className="text-blue-500" size={40} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Active Agents</p>
              <p className="text-3xl font-bold text-green-500">{stats.active_agents}</p>
            </div>
            <TrendingUp className="text-green-500" size={40} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-green-500">${stats.total_revenue.toFixed(2)}</p>
            </div>
            <DollarSign className="text-green-500" size={40} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Messages</p>
              <p className="text-3xl font-bold">{stats.total_messages.toLocaleString()}</p>
            </div>
            <MessageSquare className="text-purple-500" size={40} />
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setSelectedTab('agents')}
          className={`px-6 py-3 font-semibold transition ${
            selectedTab === 'agents'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All Agents
        </button>
        <button
          onClick={() => setSelectedTab('analytics')}
          className={`px-6 py-3 font-semibold transition ${
            selectedTab === 'analytics'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Agents Tab */}
      {selectedTab === 'agents' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary/20 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 bg-secondary/20 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Agents Table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/20">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Bot Handle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Messages</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Expiry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAgents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-secondary/5 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold">{agent.project_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{agent.bot_handle}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-mono">{agent.user_wallet.slice(0, 6)}...{agent.user_wallet.slice(-4)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="capitalize text-sm px-2 py-1 rounded" style={{ 
                          backgroundColor: `${TIER_COLORS[agent.pricing_tier as keyof typeof TIER_COLORS]}20`,
                          color: TIER_COLORS[agent.pricing_tier as keyof typeof TIER_COLORS]
                        }}>
                          {agent.pricing_tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          agent.subscription_status === 'active'
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-red-500/20 text-red-500'
                        }`}>
                          {agent.subscription_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {agent.message_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {agent.expiry_date ? new Date(agent.expiry_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingAgentId(agent.id)}
                            className="p-2 text-amber-500 hover:bg-amber-500/10 rounded transition"
                            title="Edit Agent Settings"
                          >
                            <Settings size={16} />
                          </button>
                          {agent.vercel_deployment_url && (
                            <a
                              href={agent.vercel_deployment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-primary hover:bg-primary/10 rounded transition"
                              title="View Deployment"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                          {agent.transaction_hash && (
                            <a
                              href={`https://bscscan.com/tx/${agent.transaction_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-500 hover:bg-blue-500/10 rounded transition"
                              title="View Transaction"
                            >
                              <DollarSign size={16} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {selectedTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Tier */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-4">Revenue by Tier</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Starter</span>
                    <span className="font-bold text-green-500">${stats.revenue_by_tier.starter.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${(stats.revenue_by_tier.starter / stats.total_revenue) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Pro</span>
                    <span className="font-bold text-blue-500">${stats.revenue_by_tier.pro.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${(stats.revenue_by_tier.pro / stats.total_revenue) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Enterprise</span>
                    <span className="font-bold text-purple-500">${stats.revenue_by_tier.enterprise.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{
                        width: `${(stats.revenue_by_tier.enterprise / stats.total_revenue) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Agents by Tier (Pie Chart) */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-4">Agents Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Metrics Summary */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-4">Summary Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Revenue/Agent</p>
                <p className="text-2xl font-bold text-green-500">
                  ${stats.total_agents > 0 ? (stats.total_revenue / stats.total_agents).toFixed(2) : '0.00'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Rate</p>
                <p className="text-2xl font-bold text-blue-500">
                  {stats.total_agents > 0 ? ((stats.active_agents / stats.total_agents) * 100).toFixed(1) : '0'}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Messages/Agent</p>
                <p className="text-2xl font-bold text-purple-500">
                  {stats.total_agents > 0 ? Math.round(stats.total_messages / stats.total_agents) : '0'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Unique Users</p>
                <p className="text-2xl font-bold">
                  {stats.unique_users}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Settings Panel (Admin Edit) */}
      {editingAgentId && (
        <AgentSettingsPanel
          agentId={editingAgentId}
          onClose={() => setEditingAgentId(null)}
          onSaved={() => {
            setEditingAgentId(null);
            loadData(); // Reload data after saving
          }}
        />
      )}
    </div>
  );
}

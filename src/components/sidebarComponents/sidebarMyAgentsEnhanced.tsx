import { Bot, Settings, TrendingUp, MessageCircle, Trash2, Calendar, DollarSign, RefreshCw, ExternalLink, AlertCircle, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getOrCreateUser, getUserAgents, getLatestSubscription, deleteAgent } from '@/lib/supabase';
import { getSubscriptionStatus } from '@/lib/subscriptionManager';
import { motion, AnimatePresence } from 'framer-motion';
import RenewalModal from '@/components/RenewalModal';
import AgentSettingsPanel from '@/components/AgentSettingsPanel';
import AgentAnalyticsPanel from '@/components/AgentAnalyticsPanel';

interface Agent {
  id: string;
  project_name: string;
  bot_handle: string;
  personality: string;
  pricing_tier: string;
  deployment_status: string;
  message_count: number;
  created_at: string;
  telegram_webhook_url?: string | null;
  vercel_deployment_url?: string | null;
}

interface Subscription {
  id: string;
  subscription_tier: string;
  subscription_cost_usd: number;
  payment_status: string;
  expiry_date: string;
  transaction_hash?: string | null;
}

interface AgentWithSubscription extends Agent {
  subscription: Subscription | null;
  subscriptionStatus: {
    isActive: boolean;
    daysRemaining: number;
    status: 'active' | 'expiring-soon' | 'expired' | 'none';
  };
}

export default function SidebarMyAgentsEnhanced() {
  const { address, isConnected } = useAccount();
  const [agents, setAgents] = useState<AgentWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalAgent, setRenewalAgent] = useState<{id: string; name: string} | null>(null);
  const [settingsAgentId, setSettingsAgentId] = useState<string | null>(null);
  const [analyticsAgent, setAnalyticsAgent] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      loadAgents();
    } else {
      setAgents([]);
      setLoading(false);
    }
  }, [isConnected, address]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      
      // Get or create user first
      const user = await getOrCreateUser(address!);
      if (!user) {
        console.error('Failed to get user');
        return;
      }
      
      const userAgents = await getUserAgents(user.id);
      
      // Load subscription for each agent
      const agentsWithSubs = await Promise.all(
        userAgents.map(async (agent) => {
          const subscription = await getLatestSubscription(agent.id);
          const status = await getSubscriptionStatus(agent.id);
          
          return {
            ...agent,
            subscription,
            subscriptionStatus: {
              isActive: status.isActive,
              daysRemaining: status.daysUntilExpiry,
              status: status.isActive ? (status.isExpiringSoon ? 'expiring-soon' as const : 'active' as const) : (subscription ? 'expired' as const : 'none' as const)
            }
          };
        })
      );

      setAgents(agentsWithSubs);
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteAgent(agentId);
      setAgents(agents.filter(a => a.id !== agentId));
    } catch (error) {
      console.error('Failed to delete agent:', error);
      alert('Failed to delete agent. Please try again.');
    }
  };

  const openRenewalModal = (agentId: string, agentName: string) => {
    setRenewalAgent({ id: agentId, name: agentName });
    setShowRenewalModal(true);
  };

  const handleRenewalSuccess = () => {
    loadAgents(); // Reload agents after successful renewal
  };

  if (!isConnected) {
    return (
      <div className="p-6 text-center">
        <div className="glass-card p-8">
          <AlertCircle className="mx-auto mb-4 text-yellow-500" size={48} />
          <h3 className="text-xl font-bold mb-2">Wallet Not Connected</h3>
          <p className="text-muted-foreground">
            Please connect your wallet to view your agents.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your agents...</p>
        </div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="p-6">
        <div className="glass-card p-8 text-center">
          <Bot className="mx-auto mb-4 text-muted-foreground" size={48} />
          <h3 className="text-xl font-bold mb-2">No Agents Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first Telegram AI agent to get started!
          </p>
          <button 
            onClick={() => window.location.href = '#create-agent'}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            Create Agent
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-orbitron font-bold">My Agents</h2>
          <p className="text-sm text-muted-foreground">Manage your Telegram AI agents</p>
        </div>
        <button 
          onClick={loadAgents}
          className="p-2 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition"
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Agents</p>
              <p className="text-2xl font-bold">{agents.length}</p>
            </div>
            <Bot className="text-primary" size={32} />
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-green-500">
                {agents.filter(a => a.subscriptionStatus.isActive).length}
              </p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Messages</p>
              <p className="text-2xl font-bold">
                {agents.reduce((sum, a) => sum + (a.message_count || 0), 0)}
              </p>
            </div>
            <MessageCircle className="text-blue-500" size={32} />
          </div>
        </div>
      </div>

      {/* Agents List */}
      <div className="space-y-4">
        <AnimatePresence>
          {agents.map((agent) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="glass-card p-6"
            >
              {/* Agent Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Bot size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-orbitron font-bold text-lg">{agent.project_name}</h3>
                    <p className="text-sm text-muted-foreground">{agent.bot_handle}</p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  agent.subscriptionStatus.status === 'active' 
                    ? 'bg-green-500/20 text-green-500'
                    : agent.subscriptionStatus.status === 'expiring-soon'
                    ? 'bg-yellow-500/20 text-yellow-500'
                    : 'bg-red-500/20 text-red-500'
                }`}>
                  {agent.subscriptionStatus.status === 'active' && '✓ Active'}
                  {agent.subscriptionStatus.status === 'expiring-soon' && '⚠ Expiring Soon'}
                  {agent.subscriptionStatus.status === 'expired' && '✗ Expired'}
                  {agent.subscriptionStatus.status === 'none' && '⊘ No Subscription'}
                </div>
              </div>

              {/* Agent Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Personality</p>
                  <p className="text-sm font-semibold capitalize">{agent.personality}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tier</p>
                  <p className="text-sm font-semibold capitalize">{agent.pricing_tier}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Messages</p>
                  <p className="text-sm font-semibold">{agent.message_count || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Days Remaining</p>
                  <p className={`text-sm font-semibold ${
                    agent.subscriptionStatus.daysRemaining > 7 
                      ? 'text-green-500' 
                      : agent.subscriptionStatus.daysRemaining > 0
                      ? 'text-yellow-500'
                      : 'text-red-500'
                  }`}>
                    {agent.subscriptionStatus.daysRemaining > 0 
                      ? `${agent.subscriptionStatus.daysRemaining} days` 
                      : 'Expired'}
                  </p>
                </div>
              </div>

              {/* Subscription Info */}
              {agent.subscription && (
                <div className="bg-secondary/5 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-muted-foreground" size={16} />
                      <span className="text-sm">
                        Expires: {new Date(agent.subscription.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                    {agent.subscription.transaction_hash && (
                      <a
                        href={`https://bscscan.com/tx/${agent.subscription.transaction_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        View Transaction <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAnalyticsAgent({ id: agent.id, name: agent.project_name })}
                  className="px-3 py-2 text-purple-500 hover:bg-purple-500/10 rounded-lg transition flex items-center gap-2"
                  title="View Analytics"
                >
                  <BarChart3 size={16} />
                  Analytics
                </button>
                <button
                  onClick={() => setSettingsAgentId(agent.id)}
                  className="px-3 py-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition flex items-center gap-2"
                  title="Agent Settings"
                >
                  <Settings size={16} />
                  Settings
                </button>
                
                {(!agent.subscriptionStatus.isActive || agent.subscriptionStatus.daysRemaining < 7) && (
                  <button
                    onClick={() => openRenewalModal(agent.id, agent.project_name)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 transition"
                  >
                    <DollarSign size={16} />
                    Renew
                  </button>
                )}

                <button
                  onClick={() => handleDeleteAgent(agent.id)}
                  className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition"
                  title="Delete Agent"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Renewal Modal */}
      {showRenewalModal && renewalAgent && (
        <RenewalModal
          agentId={renewalAgent.id}
          agentName={renewalAgent.name}
          onClose={() => {
            setShowRenewalModal(false);
            setRenewalAgent(null);
          }}
          onSuccess={() => {
            setShowRenewalModal(false);
            setRenewalAgent(null);
            loadAgents();
          }}
        />
      )}

      {/* Settings Panel */}
      {settingsAgentId && (
        <AgentSettingsPanel
          agentId={settingsAgentId}
          onClose={() => setSettingsAgentId(null)}
          onSaved={() => {
            setSettingsAgentId(null);
            loadAgents();
          }}
        />
      )}

      {/* Analytics Panel */}
      {analyticsAgent && (
        <AgentAnalyticsPanel
          agentId={analyticsAgent.id}
          agentName={analyticsAgent.name}
          onClose={() => setAnalyticsAgent(null)}
        />
      )}
    </div>
  );
}

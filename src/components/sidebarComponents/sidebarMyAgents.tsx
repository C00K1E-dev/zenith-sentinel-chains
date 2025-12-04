import { Bot, Sparkles, Cpu, Shield, TrendingUp, Play, Pause, Square, Settings, Plus, Zap, MessageCircle, Trash2 } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { useState, useEffect } from 'react';

interface AgentCardProps {
  name: string;
  type: string;
  status: 'running' | 'idle' | 'stopped';
  performance: string;
  earnings: string;
  icon: React.ComponentType<{ size?: string | number; className?: string }>;
}

const AgentCard = ({ name, type, status, performance, earnings, icon: Icon }: AgentCardProps) => {
  const statusConfig = {
    running: { color: 'text-green-400', bgColor: 'bg-green-400/20', icon: Play, label: 'Running' },
    idle: { color: 'text-yellow-400', bgColor: 'bg-yellow-400/20', icon: Pause, label: 'Idle' },
    stopped: { color: 'text-red-400', bgColor: 'bg-red-400/20', icon: Square, label: 'Stopped' }
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="glass-card p-4 cursor-not-allowed">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center">
            <Icon size={24} className="text-secondary" />
          </div>
          <div>
            <h3 className="font-orbitron font-semibold text-sm">{name}</h3>
            <p className="text-xs text-foreground">{type}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${config.bgColor}`}>
          <StatusIcon size={12} className={config.color} />
          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <span className="text-xs text-foreground">Performance</span>
          <div className="flex items-center gap-1">
            <TrendingUp size={12} className="text-green-400" />
            <span className="text-sm font-orbitron font-bold text-green-400">{performance}</span>
          </div>
        </div>
        <div>
          <span className="text-xs text-foreground">Earnings (24h)</span>
          <span className="text-sm font-orbitron font-bold text-primary">{earnings}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          disabled
          className="flex-1 px-3 py-2 bg-primary/20 text-primary/60 border border-primary/30 rounded-lg font-orbitron text-xs cursor-not-allowed"
        >
          Manage
        </button>
        <button
          disabled
          className="px-3 py-2 bg-muted/20 text-muted-foreground/60 border border-muted/30 rounded-lg cursor-not-allowed"
        >
          <Settings size={14} />
        </button>
      </div>
    </div>
  );
};

const SidebarMyAgents = () => {
  const [telegramAgents, setTelegramAgents] = useState<any[]>([]);

  useEffect(() => {
    // Load Telegram agents from localStorage
    const savedAgents = localStorage.getItem('telegramAgents');
    if (savedAgents) {
      try {
        setTelegramAgents(JSON.parse(savedAgents));
      } catch (error) {
        console.error('Error loading agents:', error);
      }
    }
  }, []);

  const deleteTelegramAgent = (projectName: string) => {
    const updated = telegramAgents.filter(agent => agent.projectName !== projectName);
    setTelegramAgents(updated);
    localStorage.setItem('telegramAgents', JSON.stringify(updated));
  };

  const myAgents = [
    {
      name: 'Contract Guardian',
      type: 'Smart Contract Monitor',
      status: 'running' as const,
      performance: '98.5%',
      earnings: '67 SSTL',
      icon: Shield
    },
    {
      name: 'Market Oracle',
      type: 'DeFi Price Analyzer',
      status: 'running' as const,
      performance: '95.2%',
      earnings: '89 SSTL',
      icon: TrendingUp
    },
    {
      name: 'Security Sentinel',
      type: 'Threat Detection AI',
      status: 'idle' as const,
      performance: '87.3%',
      earnings: '34 SSTL',
      icon: Zap
    },
    {
      name: 'Liquidity Watcher',
      type: 'Pool Monitor Agent',
      status: 'stopped' as const,
      performance: '92.1%',
      earnings: '0 SSTL',
      icon: Cpu
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
            <Bot size={24} className="text-primary" />
          </div>
          <h2 className="text-2xl font-orbitron font-bold">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">My Agents</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <StatCard
              title="Active Agents"
              value="4"
              icon={Bot}
              description="Running agents"
              iconColor="primary"
            />
          </div>
          <div>
            <StatCard
              title="Total Earnings"
              value="190 SSTL"
              icon={Sparkles}
              description="Last 24 hours"
              iconColor="primary"
            />
          </div>
          <div>
            <StatCard
              title="Avg. Performance"
              value="93.3%"
              icon={TrendingUp}
              description="Success rate"
              iconColor="secondary"
            />
          </div>
          <div>
            <StatCard
              title="Tasks Completed"
              value="1,247"
              icon={Zap}
              description="This month"
              iconColor="secondary"
            />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Existing Agents Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-orbitron font-semibold text-foreground">
              AI Monitor Agents
            </h3>
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary/60 border border-primary/30 rounded-lg font-orbitron text-sm cursor-not-allowed"
            >
              <Plus size={16} />
              Create Agent
            </button>
          </div>

          <div className="grid gap-4">
            {myAgents.map((agent) => (
              <AgentCard key={agent.name} {...agent} />
            ))}
          </div>
        </div>

        {/* Telegram Agents Section */}
        {telegramAgents.length > 0 && (
          <div className="space-y-4 border-t border-muted pt-8">
            <h3 className="text-lg font-orbitron font-semibold text-foreground flex items-center gap-2">
              <MessageCircle size={20} className="text-blue-500" />
              Community Agents
            </h3>

            <div className="grid gap-4">
              {telegramAgents.map((agent) => (
                <div key={agent.projectName} className="glass-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center">
                        <MessageCircle size={20} className="text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-orbitron font-semibold text-sm">{agent.projectName}</h3>
                        <p className="text-xs text-foreground">{agent.personality} • {agent.pricingTier}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-blue-400/20`}>
                      <Play size={12} className="text-blue-400" />
                      <span className={`text-xs font-medium text-blue-400`}>Active</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <span className="text-xs text-foreground">Bot Handle</span>
                      <p className="text-sm font-mono text-primary font-bold">@{agent.botHandle}</p>
                    </div>
                    <div>
                      <span className="text-xs text-foreground">Triggers</span>
                      <span className="text-sm font-orbitron font-bold text-accent">{agent.triggers?.length || 0}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled
                      className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400/60 border border-blue-500/30 rounded-lg font-orbitron text-xs cursor-not-allowed"
                    >
                      Settings
                    </button>
                    <button
                      onClick={() => deleteTelegramAgent(agent.projectName)}
                      className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition cursor-pointer"
                      title="Delete agent"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass-card p-6 text-center cursor-not-allowed">
          <h3 className="font-orbitron font-bold text-lg mb-2 text-foreground">
            AI Agent Creation
          </h3>
          <p className="text-foreground text-sm mb-4">
            Create and customize your own AI agents to monitor smart contracts, analyze market data, detect threats, and protect your assets through intelligent automation.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Bot size={16} className="text-primary" />
              </div>
              <span className="text-sm text-foreground">Custom AI Agents</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Sparkles size={16} className="text-primary" />
              </div>
              <span className="text-sm text-foreground">Automated Tasks</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Shield size={16} className="text-primary" />
              </div>
              <span className="text-sm text-foreground">Smart Contract Monitoring</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Sparkles size={16} className="text-primary" />
              </div>
              <span className="text-sm text-foreground">Coming Q4 2025</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarMyAgents;
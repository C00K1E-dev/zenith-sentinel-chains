import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Zap, Shield, Code, Search, Star, Clock, DollarSign, MessageSquare, ShoppingCart } from 'lucide-react';

const AgentCard = ({
  name,
  creator,
  price,
  rating,
  capabilities,
  icon: Icon,
  isPopular = false
}: {
  name: string;
  creator: string;
  price: string;
  rating: number;
  capabilities: string[];
  icon: any;
  isPopular?: boolean;
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`glass-card p-6 relative ${isPopular ? 'ring-2 ring-primary' : ''}`}
    >
      {isPopular && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-bold">
          Popular
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <Icon size={24} className="text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{name}</h3>
          <p className="text-sm text-muted-foreground">by {creator}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star size={14} className="text-yellow-400 fill-current" />
            <span className="text-sm font-medium">{rating}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {capabilities.map((cap, index) => (
          <span key={index} className="text-xs bg-muted px-2 py-1 rounded-full">
            {cap}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <DollarSign size={16} className="text-green-400" />
          <span className="font-bold text-lg">{price}</span>
          <span className="text-sm text-muted-foreground">/hour</span>
        </div>
      </div>

      <button
        className="w-full px-4 py-2 bg-muted text-muted-foreground cursor-not-allowed rounded-lg font-medium"
        disabled
      >
        Rent Agent (Coming Soon)
      </button>
    </motion.div>
  );
};

const SidebarMarketplace = () => {
  const availableAgents = [
    {
      id: 'security-auditor',
      name: 'Security Auditor Pro',
      creator: 'BlockSecure Labs',
      price: '25',
      rating: 4.9,
      capabilities: ['Smart Contract Audit', 'Vulnerability Scan', 'Security Analysis'],
      icon: Shield,
      isPopular: true
    },
    {
      id: 'code-reviewer',
      name: 'Code Reviewer AI',
      creator: 'DevTools Inc',
      price: '15',
      rating: 4.7,
      capabilities: ['Code Review', 'Best Practices', 'Bug Detection'],
      icon: Code,
      isPopular: false
    },
    {
      id: 'research-assistant',
      name: 'Research Assistant',
      creator: 'AI Research Co',
      price: '20',
      rating: 4.8,
      capabilities: ['Research', 'Data Analysis', 'Report Generation'],
      icon: Search,
      isPopular: false
    },
    {
      id: 'trading-bot',
      name: 'DeFi Trading Bot',
      creator: 'CryptoAI Labs',
      price: '35',
      rating: 4.6,
      capabilities: ['Trading Analysis', 'Risk Assessment', 'Market Data'],
      icon: Zap,
      isPopular: false
    }
  ];

  const marketplaceStats = {
    totalAgents: 247,
    activeRentals: 89,
    totalRevenue: 15420,
    avgRating: 4.7
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <ShoppingCart size={24} className="text-primary" />
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-orbitron font-bold">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                AI Agent Marketplace
              </span>
            </h2>
            <span className="px-3 py-1 text-xs font-orbitron font-bold bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-full text-primary">
              SOON
            </span>
          </div>
        </div>
        <div className="glass-card p-4 mb-6 bg-blue-500/5 border-blue-500/20">
          <p className="text-sm text-foreground">
            <span className="font-semibold text-blue-400">Preview Mode:</span> These are example agents showing how this feature will look like. AI Agent Marketplace will be available in Q2/Q3 2026. Subject to change in accordance to development.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-6"
      >
        {/* Marketplace Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-2">
              <Bot className="text-primary" size={20} />
            </div>
            <div className="text-2xl font-bold">{marketplaceStats.totalAgents}</div>
            <div className="text-xs text-muted-foreground">Available Agents</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center mx-auto mb-2">
              <ShoppingCart className="text-secondary" size={20} />
            </div>
            <div className="text-2xl font-bold">{marketplaceStats.activeRentals}</div>
            <div className="text-xs text-muted-foreground">Active Rentals</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center mx-auto mb-2">
              <DollarSign className="text-accent" size={20} />
            </div>
            <div className="text-2xl font-bold">${marketplaceStats.totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Monthly Revenue</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center mx-auto mb-2">
              <Star className="text-primary" size={20} />
            </div>
            <div className="text-2xl font-bold">{marketplaceStats.avgRating}</div>
            <div className="text-xs text-muted-foreground">Avg Rating</div>
          </div>
        </div>

        {/* Available Agents */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Bot size={20} className="text-primary" />
            </div>
            Available Agents
          </h3>
          <p className="text-muted-foreground mb-6">
            Rent pre-trained AI agents for specific tasks. All agents are vetted and regularly updated.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {availableAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                name={agent.name}
                creator={agent.creator}
                price={agent.price}
                rating={agent.rating}
                capabilities={agent.capabilities}
                icon={agent.icon}
                isPopular={agent.isPopular}
              />
            ))}
          </div>
        </div>

        {/* Custom Request Section */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center">
              <MessageSquare size={20} className="text-secondary" />
            </div>
            Custom Agent Requests
          </h3>
          <p className="text-muted-foreground mb-6">
            Can't find what you need? Request a custom AI agent built specifically for your use case.
          </p>

          <div className="text-center py-8">
            <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
              <MessageSquare size={32} className="text-muted-foreground" />
            </div>
            <h4 className="font-semibold text-lg mb-2">Custom Agent Requests</h4>
            <p className="text-muted-foreground mb-4">
              Request custom AI agents tailored to your specific requirements. Our team will build and deploy your agent.
            </p>
            <button
              className="px-6 py-2 bg-muted text-muted-foreground cursor-not-allowed rounded-lg font-medium"
              disabled
            >
              Request Custom Agent (Coming Soon)
            </button>
          </div>
        </div>

        {/* Marketplace Benefits */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-4 text-foreground">
            Why Choose Our Marketplace?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-3">
                <Shield size={24} className="text-primary" />
              </div>
              <h4 className="font-medium mb-1">Vetted Agents</h4>
              <p className="text-sm text-muted-foreground">
                All agents are thoroughly tested and security-audited
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center mx-auto mb-3">
                <Clock size={24} className="text-secondary" />
              </div>
              <h4 className="font-medium mb-1">Pay Per Use</h4>
              <p className="text-sm text-muted-foreground">
                Only pay for the time you actually use the agents
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center mx-auto mb-3">
                <Star size={24} className="text-accent" />
              </div>
              <h4 className="font-medium mb-1">High Quality</h4>
              <p className="text-sm text-muted-foreground">
                Average 4.7-star rating from satisfied customers
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SidebarMarketplace;
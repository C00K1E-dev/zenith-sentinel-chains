import React from 'react';
import { Bot } from 'lucide-react';
import SolanaFeaturePage from '@/components/SolanaFeaturePage';

const SolanaAgents: React.FC = () => {
  return (
    <SolanaFeaturePage
      icon={Bot}
      title="Solana AI Agents"
      description="Deploy and manage intelligent AI agents on the Solana blockchain"
      features={[
        'AI-Powered Trading Agents',
        'Smart Contract Monitoring',
        'Automated DeFi Strategies',
        'Real-time Alert System',
        'Agent Analytics & Performance Tracking',
      ]}
      comingSoonFeatures={[
        'Create Agent',
        'Agent Dashboard',
        'Agent Analytics',
        'Agent Marketplace',
        'Agent Settings',
        'Deployment Tools',
      ]}
    />
  );
};

export default SolanaAgents;

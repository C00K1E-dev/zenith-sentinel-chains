import React from 'react';
import { Bot } from 'lucide-react';
import SolanaFeaturePage from '@/components/SolanaFeaturePage';

const SolanaMyAgents: React.FC = () => {
  return (
    <SolanaFeaturePage
      icon={Bot}
      title="My Solana Agents"
      description="Manage your personal AI agents deployed on Solana"
      features={[
        'Agent Dashboard',
        'Performance Analytics',
        'Configuration Management',
        'Activity Logs',
        'Agent Controls',
      ]}
      comingSoonFeatures={[
        'Agent List',
        'Agent Details',
        'Start/Stop Agent',
        'Performance Charts',
        'Activity Logs',
        'Settings',
      ]}
    />
  );
};

export default SolanaMyAgents;

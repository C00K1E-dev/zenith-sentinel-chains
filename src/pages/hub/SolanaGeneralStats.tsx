import React from 'react';
import { BarChart3 } from 'lucide-react';
import SolanaFeaturePage from '@/components/SolanaFeaturePage';

const SolanaGeneralStats: React.FC = () => {
  return (
    <SolanaFeaturePage
      icon={BarChart3}
      title="Solana General Stats"
      description="Overview of SmartSentinels ecosystem on Solana blockchain"
      features={[
        'Real-time Network Statistics',
        'Transaction Volume Analytics',
        'User Growth Metrics',
        'Agent Performance Overview',
        'NFT Collection Stats',
      ]}
      comingSoonFeatures={[
        'Network Overview',
        'User Statistics',
        'Agent Analytics',
        'NFT Metrics',
        'Revenue Dashboard',
        'Performance Charts',
      ]}
    />
  );
};

export default SolanaGeneralStats;

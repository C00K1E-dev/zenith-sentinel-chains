import React from 'react';
import { Coins } from 'lucide-react';
import SolanaFeaturePage from '@/components/SolanaFeaturePage';

const SolanaStaking: React.FC = () => {
  return (
    <SolanaFeaturePage
      icon={Coins}
      title="Solana Staking"
      description="Stake tokens and earn rewards on Solana"
      features={[
        'High APY Rewards',
        'Flexible Staking Options',
        'Instant Unstaking',
        'Compound Interest',
        'Multiple Token Support',
      ]}
      comingSoonFeatures={[
        'Stake Tokens',
        'View Rewards',
        'Unstake',
        'Reward History',
        'APY Calculator',
        'Staking Pools',
      ]}
    />
  );
};

export default SolanaStaking;

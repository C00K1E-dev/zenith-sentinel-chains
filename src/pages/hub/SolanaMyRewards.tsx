import React from 'react';
import { Award } from 'lucide-react';
import SolanaFeaturePage from '@/components/SolanaFeaturePage';

const SolanaMyRewards: React.FC = () => {
  return (
    <SolanaFeaturePage
      icon={Award}
      title="My Solana Rewards"
      description="Track and claim your rewards earned on Solana"
      features={[
        'Real-time Reward Tracking',
        'Multiple Reward Streams',
        'Instant Claiming',
        'Reward History',
        'Performance Bonuses',
      ]}
      comingSoonFeatures={[
        'Rewards Dashboard',
        'Claim Rewards',
        'Reward History',
        'Earnings Calculator',
        'Referral Rewards',
        'Bonus Opportunities',
      ]}
    />
  );
};

export default SolanaMyRewards;

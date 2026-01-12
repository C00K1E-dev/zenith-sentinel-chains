import React from 'react';
import { Gift } from 'lucide-react';
import SolanaFeaturePage from '@/components/SolanaFeaturePage';

const SolanaAirdrop: React.FC = () => {
  return (
    <SolanaFeaturePage
      icon={Gift}
      title="Solana Airdrop"
      description="Participate in token airdrops on the Solana network"
      features={[
        'Fast & Low-cost Token Distribution',
        'Automated Airdrop Management',
        'Claim History Tracking',
        'Multi-token Support',
        'Instant Distribution on Solana',
      ]}
      comingSoonFeatures={[
        'Claim Tokens',
        'Airdrop History',
        'Eligibility Checker',
        'Distribution Schedule',
        'Token Analytics',
        'Referral System',
      ]}
    />
  );
};

export default SolanaAirdrop;

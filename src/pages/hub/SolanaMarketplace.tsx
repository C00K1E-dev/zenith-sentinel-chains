import React from 'react';
import { Store } from 'lucide-react';
import SolanaFeaturePage from '@/components/SolanaFeaturePage';

const SolanaMarketplace: React.FC = () => {
  return (
    <SolanaFeaturePage
      icon={Store}
      title="Solana Marketplace"
      description="Trade agents, NFTs, and services on Solana"
      features={[
        'Low-fee Trading',
        'Instant Settlements',
        'Agent Marketplace',
        'NFT Trading',
        'Service Exchange',
      ]}
      comingSoonFeatures={[
        'Browse Listings',
        'List Items',
        'Buy/Sell',
        'Auction System',
        'Trading History',
        'Price Analytics',
      ]}
    />
  );
};

export default SolanaMarketplace;

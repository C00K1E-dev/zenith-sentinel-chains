import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import SolanaFeaturePage from '@/components/SolanaFeaturePage';

const SolanaNFTs: React.FC = () => {
  return (
    <SolanaFeaturePage
      icon={ImageIcon}
      title="Solana NFTs Hub"
      description="Launch and manage NFT collections on Solana with low fees and fast transactions"
      features={[
        'NFT Collection Management',
        'Low-cost Minting on Solana',
        'Fast Transaction Processing',
        'NFT Marketplace Integration',
        'Metadata Editor & Batch Operations',
      ]}
      comingSoonFeatures={[
        'NFT Gallery',
        'Mint NFTs',
        'Transfer NFTs',
        'NFT Analytics',
        'Metadata Editor',
        'Batch Operations',
      ]}
    />
  );
};

export default SolanaNFTs;

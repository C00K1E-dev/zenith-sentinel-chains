import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import SolanaFeaturePage from '@/components/SolanaFeaturePage';

const SolanaMyNFTs: React.FC = () => {
  return (
    <SolanaFeaturePage
      icon={ImageIcon}
      title="My Solana NFTs"
      description="View and manage your personal NFT collection on Solana"
      features={[
        'NFT Gallery View',
        'Collection Management',
        'Transfer & Trading',
        'Metadata Viewing',
        'Rarity Analytics',
      ]}
      comingSoonFeatures={[
        'NFT Gallery',
        'Collection Stats',
        'Transfer NFTs',
        'List for Sale',
        'Rarity Checker',
        'Transaction History',
      ]}
    />
  );
};

export default SolanaMyNFTs;

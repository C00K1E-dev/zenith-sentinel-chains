import React from 'react';
import { Bot } from 'lucide-react';
import SolanaFeaturePage from '@/components/SolanaFeaturePage';

const SolanaCreateAgent: React.FC = () => {
  return (
    <SolanaFeaturePage
      icon={Bot}
      title="Create Solana Agent"
      description="Build and deploy custom AI agents on Solana"
      features={[
        'No-code Agent Builder',
        'Pre-built Templates',
        'Custom Logic Implementation',
        'Instant Deployment',
        'Agent Testing Environment',
      ]}
      comingSoonFeatures={[
        'Agent Builder',
        'Template Library',
        'Test Agent',
        'Deploy Agent',
        'Configuration',
        'Documentation',
      ]}
    />
  );
};

export default SolanaCreateAgent;

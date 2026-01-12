import React from 'react';
import { Monitor } from 'lucide-react';
import SolanaFeaturePage from '@/components/SolanaFeaturePage';

const SolanaDevices: React.FC = () => {
  return (
    <SolanaFeaturePage
      icon={Monitor}
      title="Solana Device Monitoring"
      description="Monitor and manage devices on the Solana network"
      features={[
        'Real-time Device Status',
        'Performance Metrics',
        'Alert System',
        'Resource Usage Tracking',
        'Remote Management',
      ]}
      comingSoonFeatures={[
        'Device Dashboard',
        'Add Devices',
        'Performance Charts',
        'Alert Settings',
        'Device History',
        'Batch Management',
      ]}
    />
  );
};

export default SolanaDevices;

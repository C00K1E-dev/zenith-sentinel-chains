import { motion } from 'framer-motion';
import { Image as ImageIcon, Bot, HardDrive, Activity, Coins, Zap, Flame, Vault, DollarSign } from 'lucide-react';
import { useReadContract } from 'thirdweb/react';
import { getContract, createThirdwebClient } from 'thirdweb';
import { bsc } from 'thirdweb/chains';
import { formatEther } from 'viem';
import { useMemo, memo } from 'react';
import StatCard from '@/components/StatCard';

// Import contract ABIs and addresses
import { POUW_POOL_ADDRESS, POUW_POOL_ABI } from "../../contracts/index";

const thirdwebClient = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

const SidebarGeneralStats = () => {
  // Create contract instance
  const pouwContract = getContract({
    client: thirdwebClient,
    address: POUW_POOL_ADDRESS,
    chain: bsc,
  });

  // Read global stats from PoUW contract with optimized polling
  const { data: totalJobs, error: totalJobsError } = useReadContract({
    contract: pouwContract,
    method: 'function totalJobs() view returns (uint256)',
    queryOptions: {
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  const { data: totalDistributed, error: totalDistributedError } = useReadContract({
    contract: pouwContract,
    method: 'function totalDistributed() view returns (uint256)',
    queryOptions: {
      refetchInterval: 5000,
    },
  });

  const { data: totalTreasury, error: totalTreasuryError } = useReadContract({
    contract: pouwContract,
    method: 'function totalTreasury() view returns (uint256)',
    queryOptions: {
      refetchInterval: 5000,
    },
  });

  const { data: totalBurnedAmount, error: totalBurnedError } = useReadContract({
    contract: pouwContract,
    method: 'function totalBurned() view returns (uint256)',
    queryOptions: {
      refetchInterval: 5000,
    },
  });

  const { data: totalGenesisRevenue, error: totalGenesisRevenueError } = useReadContract({
    contract: pouwContract,
    method: 'function totalGenesisRevenue() view returns (uint256)',
    queryOptions: {
      refetchInterval: 5000,
    },
  });

  // Calculate stats with memoization
  const stats = useMemo(() => ({
    totalAuditsCompleted: totalJobs ? Number(totalJobs) : 0,
    totalMintedTokens: totalJobs ? Number(totalJobs) * 67 : 0, // 67 SSTL per job
    totalDistributed: totalDistributed ? Number(formatEther(totalDistributed as bigint)) : 0,
    totalTreasury: totalTreasury ? Number(formatEther(totalTreasury as bigint)) : 0,
    totalBurned: totalBurnedAmount ? Number(formatEther(totalBurnedAmount as bigint)) : 0,
    totalGenesisRevenue: totalGenesisRevenue ? Number(formatEther(totalGenesisRevenue as bigint)) : 0,
  }), [totalJobs, totalDistributed, totalTreasury, totalBurnedAmount, totalGenesisRevenue]);

  console.log('General Stats Debug:', {
    totalJobs: totalJobs ? Number(totalJobs) : 0,
    totalMinted: stats.totalMintedTokens,
    totalDistributed: stats.totalDistributed,
    totalTreasury: stats.totalTreasury,
    totalBurned: stats.totalBurned,
    totalGenesisRevenue: stats.totalGenesisRevenue,
    calculatedAudits: stats.totalAuditsCompleted,
    errors: {
      totalJobsError: totalJobsError?.message,
      totalDistributedError: totalDistributedError?.message,
      totalTreasuryError: totalTreasuryError?.message,
      totalBurnedError: totalBurnedError?.message,
      totalGenesisRevenueError: totalGenesisRevenueError?.message
    }
  });

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <Activity size={24} className="text-primary" />
        </div>
        <h2 className="text-xl sm:text-2xl font-orbitron font-bold">
          <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">General Stats</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          title="NFT Collections"
          value="2"
          icon={ImageIcon}
          description="Active collections"
          iconColor="primary"
          delay={0}
        />
        <StatCard
          title="Active Agents"
          value="1"
          icon={Bot}
          description="AI agents deployed"
          iconColor="primary"
          delay={0}
        />
        <StatCard
          title="Connected Devices"
          value="1"
          icon={HardDrive}
          description="Hardware devices"
          iconColor="secondary"
          delay={0}
        />
      </div>

      {/* Global PoUW Statistics */}
      <div className="mt-6 sm:mt-8">
        <h3 className="text-lg sm:text-xl font-orbitron font-bold mb-3 sm:mb-4 text-foreground">
          Global PoUW Statistics
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">These statistics are on BSC Mainnet</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            title="Total Audits Completed"
            value={stats.totalAuditsCompleted.toString()}
            icon={Activity}
            description="AI audits processed"
            iconColor="primary"
            delay={0}
          />
          <StatCard
            title="Total SSTL Minted"
            value={`${stats.totalMintedTokens.toFixed(2)} SSTL`}
            icon={Coins}
            description="Tokens created via PoUW"
            iconColor="accent"
            delay={0}
          />
          <StatCard
            title="Total Distributed (60%)"
            value={`${stats.totalDistributed.toFixed(2)} SSTL`}
            icon={Zap}
            description="Rewards distributed to NFT holders"
            iconColor="secondary"
            delay={0}
          />
          <StatCard
            title="Total Treasury (20%)"
            value={`${stats.totalTreasury.toFixed(2)} SSTL`}
            icon={Vault}
            description="Reserved for ecosystem growth"
            iconColor="accent"
            delay={0}
          />
          <StatCard
            title="Total Burned (10%)"
            value={`${stats.totalBurned.toFixed(2)} SSTL`}
            icon={Flame}
            description="Tokens permanently removed"
            iconColor="secondary"
            delay={0}
          />
          <StatCard
            title="Total Genesis Revenue"
            value={`${stats.totalGenesisRevenue.toFixed(4)} BNB`}
            icon={DollarSign}
            description="Revenue shared with Genesis holders"
            iconColor="accent"
            delay={0}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(SidebarGeneralStats);
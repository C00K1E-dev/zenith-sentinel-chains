import { motion } from 'framer-motion';
import { Image as ImageIcon, Bot, HardDrive, Activity, Coins, Zap, Flame, Vault, DollarSign } from 'lucide-react';
import { useReadContract, useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useMemo, memo } from 'react';
import StatCard from '@/components/StatCard';

// Import contract ABIs and addresses
import { POUW_POOL_ADDRESS, POUW_POOL_ABI } from "../../contracts/index";

const SidebarGeneralStats = () => {
  const { chain } = useAccount();

  // Read global stats from PoUW contract with optimized polling
  const { data: totalJobs, error: totalJobsError } = useReadContract({
    address: POUW_POOL_ADDRESS as `0x${string}`,
    abi: POUW_POOL_ABI as any,
    functionName: 'totalJobs',
    chainId: chain?.id,
    query: {
      refetchInterval: 5000, // Refetch every 5 seconds
      staleTime: 0,
    },
  });

  const { data: totalDistributed, error: totalDistributedError } = useReadContract({
    address: POUW_POOL_ADDRESS as `0x${string}`,
    abi: POUW_POOL_ABI as any,
    functionName: 'totalDistributed',
    chainId: chain?.id,
    query: {
      refetchInterval: 5000,
      staleTime: 0,
    },
  });

  const { data: totalTreasury, error: totalTreasuryError } = useReadContract({
    address: POUW_POOL_ADDRESS as `0x${string}`,
    abi: POUW_POOL_ABI as any,
    functionName: 'totalTreasury',
    chainId: chain?.id,
    query: {
      refetchInterval: 5000,
      staleTime: 0,
    },
  });

  const { data: totalBurnedAmount, error: totalBurnedError } = useReadContract({
    address: POUW_POOL_ADDRESS as `0x${string}`,
    abi: POUW_POOL_ABI as any,
    functionName: 'totalBurned',
    chainId: chain?.id,
    query: {
      refetchInterval: 5000,
      staleTime: 0,
    },
  });

  const { data: totalGenesisRevenue, error: totalGenesisRevenueError } = useReadContract({
    address: POUW_POOL_ADDRESS as `0x${string}`,
    abi: POUW_POOL_ABI as any,
    functionName: 'totalGenesisRevenue',
    chainId: chain?.id,
    query: {
      refetchInterval: 5000,
      staleTime: 0,
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
    },
    chainId: chain?.id
  });

  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-xl sm:text-2xl font-orbitron font-bold mb-3 sm:mb-4 text-foreground">
        General Stats
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          title="NFT Collections"
          value="2"
          icon={ImageIcon}
          description="Active collections"
          delay={0}
        />
        <StatCard
          title="Active Agents"
          value="1"
          icon={Bot}
          description="AI agents deployed"
          delay={0}
        />
        <StatCard
          title="Connected Devices"
          value="1"
          icon={HardDrive}
          description="Hardware devices"
          delay={0}
        />
      </div>

      {/* Global PoUW Statistics */}
      <div className="mt-6 sm:mt-8">
        <h3 className="text-lg sm:text-xl font-orbitron font-bold mb-3 sm:mb-4 text-foreground">
          Global PoUW Statistics
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">These statistics are on Testnet</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            title="Total Audits Completed"
            value={stats.totalAuditsCompleted.toString()}
            icon={Activity}
            description="AI audits processed"
            delay={0}
          />
          <StatCard
            title="Total SSTL Minted"
            value={`${stats.totalMintedTokens.toFixed(2)} SSTL`}
            icon={Coins}
            description="Tokens created via PoUW"
            delay={0}
          />
          <StatCard
            title="Total Distributed (60%)"
            value={`${stats.totalDistributed.toFixed(2)} SSTL`}
            icon={Zap}
            description="Rewards distributed to NFT holders"
            delay={0}
          />
          <StatCard
            title="Total Treasury (20%)"
            value={`${stats.totalTreasury.toFixed(2)} SSTL`}
            icon={Vault}
            description="Reserved for ecosystem growth"
            delay={0}
          />
          <StatCard
            title="Total Burned (10%)"
            value={`${stats.totalBurned.toFixed(2)} SSTL`}
            icon={Flame}
            description="Tokens permanently removed"
            delay={0}
          />
          <StatCard
            title="Total Genesis Revenue"
            value={`${stats.totalGenesisRevenue.toFixed(4)} BNB`}
            icon={DollarSign}
            description="Revenue shared with Genesis holders"
            delay={0}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(SidebarGeneralStats);
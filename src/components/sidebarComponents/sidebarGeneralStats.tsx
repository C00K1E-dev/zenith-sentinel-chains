import { motion } from 'framer-motion';
import { Image as ImageIcon, Bot, HardDrive, Activity, Coins, Zap, Flame } from 'lucide-react';
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

  const { data: totalMinted, error: totalMintedError } = useReadContract({
    address: POUW_POOL_ADDRESS as `0x${string}`,
    abi: POUW_POOL_ABI as any,
    functionName: 'totalMinted',
    chainId: chain?.id,
    query: {
      refetchInterval: 5000,
      staleTime: 0,
    },
  });

  const { data: totalNFTRewards, error: totalNFTRewardsError } = useReadContract({
    address: POUW_POOL_ADDRESS as `0x${string}`,
    abi: POUW_POOL_ABI as any,
    functionName: 'totalNFTRewards',
    chainId: chain?.id,
    query: {
      refetchInterval: 5000,
      staleTime: 0,
    },
  });

  // Calculate stats with memoization
  const stats = useMemo(() => ({
    totalAuditsCompleted: totalMinted ? Math.floor(Number(formatEther(totalMinted as bigint)) / 67) : 0,
    totalMintedTokens: totalMinted ? Number(formatEther(totalMinted as bigint)) : 0,
    totalDistributed: totalNFTRewards ? Number(formatEther(totalNFTRewards as bigint)) : 0,
  }), [totalJobs, totalMinted, totalNFTRewards]);

  console.log('General Stats Debug:', {
    totalJobs: totalJobs ? Number(totalJobs) : 0,
    totalMinted: totalMinted ? Number(formatEther(totalMinted as bigint)) : 0,
    totalNFTRewards: totalNFTRewards ? Number(formatEther(totalNFTRewards as bigint)) : 0,
    calculatedAudits: stats.totalAuditsCompleted,
    errors: {
      totalJobsError: totalJobsError?.message,
      totalMintedError: totalMintedError?.message,
      totalNFTRewardsError: totalNFTRewardsError?.message
    },
    chainId: chain?.id
  });
  const totalBurned = stats.totalMintedTokens * 0.1; // 10% burned
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-orbitron font-bold mb-4 text-foreground">
        General Stats
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      <div className="mt-8">
        <h3 className="text-xl font-orbitron font-bold mb-4 text-foreground">
          Global PoUW Statistics
        </h3>
        <p className="text-sm text-muted-foreground mb-4">These statistics are on Testnet</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            title="Total Distributed (90%)"
            value={`${stats.totalDistributed.toFixed(2)} SSTL`}
            icon={Zap}
            description="Rewards distributed to NFT holders"
            delay={0}
          />
          <StatCard
            title="Total Burned (10%)"
            value={`${totalBurned.toFixed(2)} SSTL`}
            icon={Flame}
            description="Tokens permanently removed"
            delay={0}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(SidebarGeneralStats);
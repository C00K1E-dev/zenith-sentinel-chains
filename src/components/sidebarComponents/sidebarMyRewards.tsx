"use client";
import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWalletClient, usePublicClient } from "wagmi";
import { formatEther, encodeFunctionData } from "viem";
import { sendTransaction } from "viem/actions";
import { Loader, Gift, TrendingUp, CheckCircle, AlertCircle, ExternalLink, DollarSign } from "lucide-react";

// Import contract ABIs and addresses
import { POUW_POOL_ADDRESS, POUW_POOL_ABI, AI_AUDIT_CONTRACT_ADDRESS, AI_AUDIT_ABI, GENESIS_CONTRACT_ADDRESS, GENESIS_ABI } from "../../contracts/index";

// Contract addresses
const POUW_ADDRESS = POUW_POOL_ADDRESS;
const AI_AUDIT_ADDRESS = AI_AUDIT_CONTRACT_ADDRESS;
const GENESIS_ADDRESS = GENESIS_CONTRACT_ADDRESS;

interface RewardsSectionProps {
  refreshTrigger?: number;
}

export default function SidebarMyRewards({ refreshTrigger = 0 }: RewardsSectionProps) {
  const { address, isConnected, chain } = useAccount();
  
  // State
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [userTotalEarned, setUserTotalEarned] = useState(0);
  // Separate states for the two claimable streams
  const [userPendingRewards, setUserPendingRewards] = useState(0); // PoUW rewards
  const [userPendingRevenue, setUserPendingRevenue] = useState(0); // Genesis Revenue
  const [userNFTs, setUserNFTs] = useState<bigint[]>([]);
  const [userGenesisNFTs, setUserGenesisNFTs] = useState<bigint[]>([]); // Added state to track only Genesis NFTs for revenue claim
  const [internalRefreshTrigger, setInternalRefreshTrigger] = useState<number>(0);
  const [claimTxHash, setClaimTxHash] = useState<string | undefined>();
  const [isCalculatingRewards, setIsCalculatingRewards] = useState(false);

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Calculate user earnings and pending rewards/revenue
  useEffect(() => {
    if (!address || userNFTs.length === 0 || !publicClient) {
      setUserTotalEarned(0);
      setUserPendingRewards(0);
      setUserPendingRevenue(0);
      setIsCalculatingRewards(false);
      return;
    }

    const calculateUserStats = async () => {
      setIsCalculatingRewards(true);
      let totalEarned = BigInt(0);
      let totalPendingRewards = BigInt(0);
      let totalPendingRevenue = BigInt(0);

      // --- Calculate Rewards and Revenue for ALL held NFTs ---
      for (const tokenId of userNFTs) {
        try {
          // Get claimed amount for PoUW rewards
          const claimed = await publicClient.readContract({
            address: POUW_ADDRESS as `0x${string}`,
            abi: POUW_POOL_ABI,
            functionName: 'claimedPerNFT',
            args: [tokenId],
          } as any) as bigint;
          totalEarned += claimed;

          // Get pending reward amount using contract function
          const pendingReward = await publicClient.readContract({
            address: POUW_ADDRESS as `0x${string}`,
            abi: POUW_POOL_ABI,
            functionName: 'pendingReward',
            args: [tokenId],
            account: address as `0x${string}`,
          } as any) as bigint;
          totalPendingRewards += pendingReward;
        } catch (error) {
          console.error('Error calculating PoUW stats for token', tokenId.toString(), error);
        }
      }

      // Calculate pending revenue for Genesis NFTs
      for (const tokenId of userGenesisNFTs) {
        try {
          // Get pending revenue using contract function
          const pendingRev = await publicClient.readContract({
            address: POUW_ADDRESS as `0x${string}`,
            abi: POUW_POOL_ABI,
            functionName: 'pendingRevenue',
            args: [tokenId],
            account: address as `0x${string}`,
          } as any) as bigint;
          totalPendingRevenue += pendingRev;
        } catch (error) {
          console.error('Error calculating revenue for Genesis token', tokenId.toString(), error);
        }
      }

      // Update state with formatted numbers
      setUserTotalEarned(Number(formatEther(totalEarned)));
      setUserPendingRewards(Number(formatEther(totalPendingRewards)));
      setUserPendingRevenue(Number(formatEther(totalPendingRevenue)));
      setIsCalculatingRewards(false);
    };

    calculateUserStats();
  }, [address, userNFTs.length, userGenesisNFTs.length, publicClient, refreshTrigger, internalRefreshTrigger]);

  // Read global stats from PoUW contract with real-time updates
  const { data: totalJobs } = useReadContract({
    address: POUW_ADDRESS as `0x${string}`,
    abi: POUW_POOL_ABI as any,
    functionName: 'totalJobs',
    chainId: chain?.id,
    query: {
      refetchInterval: 2000, // Refetch every 2 seconds
      staleTime: 0,
      gcTime: 0, // Disable garbage collection caching
    },
  });

  const { data: totalMinted } = useReadContract({
    address: POUW_ADDRESS as `0x${string}`,
    abi: POUW_POOL_ABI as any,
    functionName: 'totalMinted',
    chainId: chain?.id,
    query: {
      refetchInterval: 2000,
      staleTime: 0,
      gcTime: 0,
    },
  });

  const { data: totalNFTRewards } = useReadContract({
    address: POUW_ADDRESS as `0x${string}`,
    abi: POUW_POOL_ABI as any,
    functionName: 'totalNFTRewards',
    chainId: chain?.id,
    query: {
      refetchInterval: 2000,
      staleTime: 0,
      gcTime: 0,
    },
  });

  const { data: totalRevenue } = useReadContract({
    address: POUW_ADDRESS as `0x${string}`,
    abi: POUW_POOL_ABI as any,
    functionName: 'totalRevenue',
    chainId: chain?.id,
    query: {
      refetchInterval: 2000,
      staleTime: 0,
      gcTime: 0,
    },
  });

  // Read user's NFT holdings
  const { data: genesisNFTs } = useReadContract({
    address: GENESIS_ADDRESS as `0x${string}`,
    abi: GENESIS_ABI as any,
    functionName: 'tokensOfOwner',
    args: address ? [address] : undefined,
    chainId: chain?.id,
    query: { enabled: !!address && isConnected }
  });

  const { data: aiAuditNFTs } = useReadContract({
    address: AI_AUDIT_ADDRESS as `0x${string}`,
    abi: AI_AUDIT_ABI as any,
    functionName: 'tokensOfOwner',
    args: address ? [address] : undefined,
    chainId: chain?.id,
    query: { enabled: !!address && isConnected }
  });

  // Read total supply for debugging
  const { data: aiAuditTotalSupply } = useReadContract({
    address: AI_AUDIT_ADDRESS as `0x${string}`,
    abi: AI_AUDIT_ABI as any,
    functionName: 'totalSupply',
    chainId: chain?.id,
  });

  const { data: genesisTotalSupply } = useReadContract({
    address: GENESIS_ADDRESS as `0x${string}`,
    abi: GENESIS_ABI as any,
    functionName: 'totalSupply',
    chainId: chain?.id,
  });

  // Calculate user's NFT holdings
  useEffect(() => {
    if (!genesisNFTs && !aiAuditNFTs) return;

    const genesis = Array.isArray(genesisNFTs) ? (genesisNFTs as bigint[]) : [];
    const aiAudit = Array.isArray(aiAuditNFTs) ? (aiAuditNFTs as bigint[]) : [];
    
    // Store Genesis NFTs separately for revenue claim logic
    setUserGenesisNFTs(genesis);

    // Combine all NFTs to check ownership for reward claims
    const allNFTs = [...genesis, ...aiAudit];
    setUserNFTs(allNFTs);
  }, [genesisNFTs, aiAuditNFTs]);

  // Trigger user stats recalculation when global rewards or revenue changes
  useEffect(() => {
    if ((totalNFTRewards || totalRevenue) && address && userNFTs.length > 0) {
      // Trigger recalculation of user earnings when new rewards/revenue are distributed
      setInternalRefreshTrigger(prev => prev + 1);
    }
  }, [totalNFTRewards, totalRevenue, address, userNFTs.length]);

  // Write contract for claiming rewards
  // Removed useWriteContract since using sendTransaction directly

  // Handle claim transaction confirmation
  // Removed since handling manually in handleClaimRewards

  // Handle claim rewards (combined logic for both PoUW Rewards and Revenue Share)
  const handleClaimRewards = async () => {
    if (!address || !isConnected || !walletClient || !publicClient) {
      alert('Please connect your wallet first');
      return;
    }

    const totalClaimable = userPendingRewards + userPendingRevenue;
    if (totalClaimable <= 0) {
      alert('No rewards or revenue to claim');
      return;
    }

    try {
      setIsClaiming(true);
      setClaimError(null);
      
      const txHashes: `0x${string}`[] = [];
      
      // --- 1. Batch Claim PoUW Rewards (All NFTs with pending rewards) ---
      if (userPendingRewards > 0 && userNFTs.length > 0) {
        console.log('Claiming PoUW rewards for tokens:', userNFTs.map(t => t.toString()));
        
        const txData = encodeFunctionData({
          abi: POUW_POOL_ABI,
          functionName: 'batchClaimRewards',
          args: [userNFTs], // Pass all user NFTs at once
        });

        try {
          const hash = await walletClient.sendTransaction({
            to: POUW_ADDRESS as `0x${string}`,
            data: txData,
            account: address as `0x${string}`,
            chain: undefined,
            kzg: undefined,
          });
          txHashes.push(hash);
          console.log('PoUW rewards claim tx:', hash);
        } catch (error) {
          console.error('Error claiming PoUW rewards:', error);
          // Continue to try claiming revenue even if rewards fail
        }
      }

      // --- 2. Batch Claim Genesis Revenue (ONLY Genesis NFTs) ---
      if (userPendingRevenue > 0 && userGenesisNFTs.length > 0) {
        console.log('Claiming Genesis revenue for tokens:', userGenesisNFTs.map(t => t.toString()));
        
        const txData = encodeFunctionData({
          abi: POUW_POOL_ABI,
          functionName: 'batchClaimRevenue',
          args: [userGenesisNFTs], // Pass all Genesis NFTs at once
        });

        try {
          const hash = await walletClient.sendTransaction({
            to: POUW_ADDRESS as `0x${string}`,
            data: txData,
            account: address as `0x${string}`,
            chain: undefined,
            kzg: undefined,
          });
          txHashes.push(hash);
          console.log('Genesis revenue claim tx:', hash);
        } catch (error) {
          console.error('Error claiming Genesis revenue:', error);
        }
      }

      if (txHashes.length === 0) {
        throw new Error('No claim transactions were successfully initiated.');
      }
      
      // Wait for all successful transactions to confirm
      console.log('Waiting for confirmations...');
      await Promise.all(txHashes.map(hash => publicClient.waitForTransactionReceipt({ hash })));
      console.log('All successful transactions confirmed');

      // Final State Update
      setClaimTxHash(txHashes[0]);
      setClaimSuccess(true);
      setIsClaiming(false);
      setInternalRefreshTrigger((prev: number) => prev + 1);

      // Reset success message after 5 seconds
      setTimeout(() => setClaimSuccess(false), 5000);

    } catch (error: any) {
      console.error('Claim error:', error);
      setClaimError(error.message || 'Failed to claim all rewards');
      setIsClaiming(false);
    }
  };

  // User stats
  const holdsNFT = userNFTs.length > 0;
  const totalEarned = userTotalEarned;
  const pendingRewards = userPendingRewards;
  const pendingRevenue = userPendingRevenue;
  const totalClaimable = userPendingRewards + userPendingRevenue;

  // Global PoUW stats from contract
  const totalAuditsCompleted = totalMinted ? Math.floor(Number(formatEther(totalMinted as bigint)) / 67) : 0;
  const totalMintedTokens = totalMinted ? Number(formatEther(totalMinted as bigint)) : 0;
  const totalDistributed = totalNFTRewards ? Number(formatEther(totalNFTRewards as bigint)) : 0;
  const totalRevenueCollected = totalRevenue ? Number(formatEther(totalRevenue as bigint)) : 0;
  const totalBurned = totalMintedTokens * 0.1; // 10% burned

  const formattedTotalEarned = totalEarned.toFixed(4);
  const formattedPendingRewards = pendingRewards.toFixed(4);
  const formattedPendingRevenue = pendingRevenue.toFixed(4);
  const formattedTotalClaimable = totalClaimable.toFixed(4);

  console.log('User Earnings:', {
    totalEarned,
    pendingRewards,
    pendingRevenue,
    totalClaimable,
    holdsNFT,
    nftCount: userNFTs.length,
    genesisNFTCount: userGenesisNFTs.length,
    aiAuditTotalSupply: aiAuditTotalSupply ? Number(aiAuditTotalSupply) : 0,
    genesisTotalSupply: genesisTotalSupply ? Number(genesisTotalSupply) : 0,
    totalNFTRewards: totalNFTRewards ? Number(formatEther(totalNFTRewards as bigint)) : 0,
    totalRevenue: totalRevenue ? Number(formatEther(totalRevenue as bigint)) : 0,
    chainId: chain?.id,
    totalMinted: totalMinted ? Number(formatEther(totalMinted as bigint)) : 0
  });

  // Get explorer URL
  const getExplorerUrl = (txHash: string) => {
    const baseUrl = chain?.id === 56 ? 'https://bscscan.com' : 'https://testnet.bscscan.com';
    return `${baseUrl}/tx/${txHash}`;
  };

  return (
    <div className="rewards-section">
      <div className="rewards-header">
        <Gift size={32} className="rewards-icon" />
        <div>
          <h3>My Rewards Dashboard</h3>
          <p className="rewards-subtitle">
            {holdsNFT 
              ? "You're eligible for PoUW rewards from completed audits" 
              : "Mint an AI Audit NFT to start earning rewards"}
          </p>
        </div>
      </div>

      {!isConnected && (
        <div className="rewards-message warning">
          <AlertCircle size={20} />
          <span>Please connect your wallet to view your rewards</span>
        </div>
      )}

      {isConnected && !holdsNFT && (
        <div className="rewards-message info">
          <AlertCircle size={20} />
          <span>You need to mint an AI Audit NFT to be eligible for PoUW rewards</span>
        </div>
      )}

      {isConnected && (
        <>
          {/* Reward Stats Grid or Loading */}
          {isCalculatingRewards ? (
            <div className="rewards-loading">
              <Loader size={24} className="animate-spin" />
              <span>Rewards are being calculated!</span>
            </div>
          ) : (
            <div className="rewards-stats-grid">
              <div className="reward-stat-card primary">
                <div className="stat-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">
                    Total Earned
                    <span className="info-tooltip" title="Your total claimed rewards from all your NFTs">ℹ️</span>
                  </span>
                  <span className="stat-value">{formattedTotalEarned} SSTL</span>
                  <span className="stat-subtitle">Your claimed rewards</span>
                </div>
              </div>
              {totalClaimable > 0 && (
                <div className="reward-stat-card secondary">
                  <div className="stat-icon">
                    <Gift size={24} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">
                      Total Claimable
                      <span className="info-tooltip" title="Total rewards and revenue available to claim">ℹ️</span>
                    </span>
                    <span className="stat-value">{formattedTotalClaimable} SSTL</span>
                    <span className="stat-subtitle">Available to claim</span>
                  </div>
                </div>
              )}

              {/* Line 506 omitted */}
              {pendingRewards > 0 && (
                <div className="reward-stat-card">
                  <div className="stat-icon">
                    <TrendingUp size={24} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">
                      PoUW Rewards
                      <span className="info-tooltip" title="Proof of Useful Work rewards from AI audits">ℹ️</span>
                    </span>
                    <span className="stat-value">{formattedPendingRewards} SSTL</span>
                    <span className="stat-subtitle">From completed audits</span>
                  </div>
                </div>
              )}
              {pendingRevenue > 0 && (
                <div className="reward-stat-card">
                  <div className="stat-icon">
                    <DollarSign size={24} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">
                      Genesis Revenue
                      <span className="info-tooltip" title="Revenue share from Genesis NFT holdings">ℹ️</span>
                    </span>
                    <span className="stat-value">{formattedPendingRevenue} SSTL</span>
                    <span className="stat-subtitle">From Genesis NFTs</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Claim Rewards Button */}
          {totalClaimable > 0 && !isCalculatingRewards && (
            <div className="claim-section">
              <button
                className="claim-rewards-btn"
                onClick={handleClaimRewards}
                disabled={isClaiming}
              >
                {isClaiming ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Gift size={16} />
                    Claim Rewards ({formattedTotalClaimable} SSTL)
                  </>
                )}
              </button>
            </div>
          )}

          {/* Success Message */}
          {claimSuccess && claimTxHash && (
            <div className="rewards-message success">
              <CheckCircle size={20} />
              <span>Rewards claimed successfully!</span>
              <a href={getExplorerUrl(claimTxHash)} target="_blank" rel="noopener noreferrer" className="view-tx-link">
                View Transaction <ExternalLink size={14} />
              </a>
            </div>
          )}

          {/* Error Message */}
          {claimError && (
            <div className="rewards-message error">
              <AlertCircle size={20} />
              <span>{claimError}</span>
            </div>
          )}

          {/* How Rewards Work */}
          <div className="rewards-info-box">
            <h4>How PoUW Rewards Work</h4>
            <ul>
              <li>When any user completes an AI audit, 67 SSTL tokens are minted via Proof of Useful Work</li>
              <li>60% (40.2 SSTL) distributed equally to all AI Audit NFT holders</li>
              <li>Genesis NFTs receive double rewards compared to regular AI Audit NFTs</li>
              <li>20% goes to treasury, 10% is burned, 10% to business client</li>
              <li>Rewards accumulate automatically - claim them using the button above</li>
            </ul>
          </div>

          {/* Global Stats */}
          <div className="global-stats">
            <h4>Global PoUW Statistics</h4>
            <p className="text-xs text-muted-foreground mb-2">These statistics are on Testnet</p>
            <div className="global-stat-item">
              <span className="global-stat-label">Total Audits Completed:</span>
              <span className="global-stat-value">{totalAuditsCompleted}</span>
            </div>
            <div className="global-stat-item">
              <span className="global-stat-label">Total SSTL Minted:</span>
              <span className="global-stat-value">{totalMintedTokens.toFixed(2)} SSTL</span>
            </div>
            <div className="global-stat-item">
              <span className="global-stat-label">Total Distributed (90%):</span>
              <span className="global-stat-value">{totalDistributed.toFixed(2)} SSTL</span>
            </div>
            <div className="global-stat-item">
              <span className="global-stat-label">Total Revenue Collected:</span>
              <span className="global-stat-value">{totalRevenueCollected.toFixed(2)} SSTL</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
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
    if (!address || !publicClient) {
      setUserPendingRewards(0);
      setUserPendingRevenue(0);
      setIsCalculatingRewards(false);
      return;
    }

    const calculateUserStats = async () => {
      setIsCalculatingRewards(true);
      let totalPendingRewards = BigInt(0);
      let totalPendingRevenue = BigInt(0);

      try {
        // Get total pending PoUW rewards across all collections
        const pendingRewards = await publicClient.readContract({
          address: POUW_ADDRESS as `0x${string}`,
          abi: POUW_POOL_ABI,
          functionName: 'getTotalPendingRewards',
          args: [address],
        } as any) as bigint;
        totalPendingRewards = pendingRewards;
      } catch (error) {
        console.error('Error getting pending PoUW rewards:', error);
      }

      try {
        // Get total pending Genesis revenue
        const pendingRevenue = await publicClient.readContract({
          address: POUW_ADDRESS as `0x${string}`,
          abi: POUW_POOL_ABI,
          functionName: 'getTotalPendingGenesisRevenue',
          args: [address],
        } as any) as bigint;
        totalPendingRevenue = pendingRevenue;
      } catch (error) {
        console.error('Error getting pending Genesis revenue:', error);
      }

      // Update state with formatted numbers
      setUserPendingRewards(Number(formatEther(totalPendingRewards)));
      setUserPendingRevenue(Number(formatEther(totalPendingRevenue)));
      setIsCalculatingRewards(false);
    };

    calculateUserStats();
  }, [address, publicClient, internalRefreshTrigger, refreshTrigger]);

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

  const { data: totalDistributed } = useReadContract({
    address: POUW_ADDRESS as `0x${string}`,
    abi: POUW_POOL_ABI as any,
    functionName: 'totalDistributed',
    chainId: chain?.id,
    query: {
      refetchInterval: 2000,
      staleTime: 0,
      gcTime: 0,
    },
  });

  const { data: totalTreasury } = useReadContract({
    address: POUW_ADDRESS as `0x${string}`,
    abi: POUW_POOL_ABI as any,
    functionName: 'totalTreasury',
    chainId: chain?.id,
    query: {
      refetchInterval: 2000,
      staleTime: 0,
      gcTime: 0,
    },
  });

  const { data: totalGenesisRevenue } = useReadContract({
    address: POUW_ADDRESS as `0x${string}`,
    abi: POUW_POOL_ABI as any,
    functionName: 'totalGenesisRevenue',
    chainId: chain?.id,
    query: {
      refetchInterval: 2000,
      staleTime: 0,
      gcTime: 0,
    },
  });

  const { data: totalBurnedAmount } = useReadContract({
    address: POUW_ADDRESS as `0x${string}`,
    abi: POUW_POOL_ABI as any,
    functionName: 'totalBurned',
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
    if ((totalDistributed || totalGenesisRevenue) && address) {
      // Trigger recalculation of user earnings when new rewards/revenue are distributed
      setInternalRefreshTrigger(prev => prev + 1);
    }
  }, [totalDistributed, totalGenesisRevenue, address]);

  // Write contract for claiming rewards
  // Removed useWriteContract since using sendTransaction directly

  // Handle claim transaction confirmation
  // Removed since handling manually in handleClaimRewards

  // Handle claim PoUW SSTL rewards
  const handleClaimRewards = async () => {
    if (!address || !isConnected || !walletClient || !publicClient) {
      alert('Please connect your wallet first');
      return;
    }

    if (userPendingRewards <= 0) {
      alert('No PoUW rewards to claim');
      return;
    }

    try {
      setIsClaiming(true);
      setClaimError(null);
      
      console.log('Claiming all PoUW rewards');
      
      const txData = encodeFunctionData({
        abi: POUW_POOL_ABI,
        functionName: 'claimAllRewards',
        args: [],
      });

      const hash = await walletClient.sendTransaction({
        to: POUW_ADDRESS as `0x${string}`,
        data: txData,
        account: address as `0x${string}`,
        chain: undefined,
        kzg: undefined,
      });
      
      console.log('PoUW rewards claim tx:', hash);
      
      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash });
      console.log('Transaction confirmed');

      // Final State Update
      setClaimTxHash(hash);
      setClaimSuccess(true);
      setIsClaiming(false);
      setInternalRefreshTrigger((prev: number) => prev + 1);

      // Reset success message after 5 seconds
      setTimeout(() => setClaimSuccess(false), 5000);

    } catch (error: any) {
      console.error('Claim error:', error);
      setClaimError(error.message || 'Failed to claim PoUW rewards');
      setIsClaiming(false);
    }
  };

  // Handle claim Genesis BNB revenue
  const handleClaimRevenue = async () => {
    if (!address || !isConnected || !walletClient || !publicClient) {
      alert('Please connect your wallet first');
      return;
    }

    if (userPendingRevenue <= 0) {
      alert('No Genesis revenue to claim');
      return;
    }

    if (userGenesisNFTs.length === 0) {
      alert('No Genesis NFTs found');
      return;
    }

    try {
      setIsClaiming(true);
      setClaimError(null);
      
      console.log('Claiming Genesis revenue for tokens:', userGenesisNFTs.map(t => t.toString()));
      
      const txData = encodeFunctionData({
        abi: POUW_POOL_ABI,
        functionName: 'batchClaimGenesisRevenue',
        args: [userGenesisNFTs],
      });

      const hash = await walletClient.sendTransaction({
        to: POUW_ADDRESS as `0x${string}`,
        data: txData,
        account: address as `0x${string}`,
        chain: undefined,
        kzg: undefined,
      });
      
      console.log('Genesis revenue claim tx:', hash);
      
      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash });
      console.log('Transaction confirmed');

      // Final State Update
      setClaimTxHash(hash);
      setClaimSuccess(true);
      setIsClaiming(false);
      setInternalRefreshTrigger((prev: number) => prev + 1);

      // Reset success message after 5 seconds
      setTimeout(() => setClaimSuccess(false), 5000);

    } catch (error: any) {
      console.error('Claim error:', error);
      setClaimError(error.message || 'Failed to claim Genesis revenue');
      setIsClaiming(false);
    }
  };

  // User stats
  const holdsNFT = userNFTs.length > 0;
  const pendingRewards = userPendingRewards;
  const pendingRevenue = userPendingRevenue;
  const totalClaimable = userPendingRewards + userPendingRevenue;

  // Global PoUW stats from contract
  const totalAuditsCompleted = totalJobs ? Number(totalJobs) : 0;
  // Total minted = jobs * 67 SSTL per job
  const totalMintedTokens = totalAuditsCompleted * 67;
  const totalDistributedTokens = totalDistributed ? Number(formatEther(totalDistributed as bigint)) : 0;
  const totalRevenueCollected = totalGenesisRevenue ? Number(formatEther(totalGenesisRevenue as bigint)) : 0;
  const totalBurnedTokens = totalBurnedAmount ? Number(formatEther(totalBurnedAmount as bigint)) : 0;
  const totalTreasuryTokens = totalTreasury ? Number(formatEther(totalTreasury as bigint)) : 0;

  const formattedPendingRewards = pendingRewards.toFixed(4);
  const formattedPendingRevenue = pendingRevenue.toFixed(4);

  console.log('User Earnings:', {
    pendingRewards,
    pendingRevenue,
    holdsNFT,
    nftCount: userNFTs.length,
    genesisNFTCount: userGenesisNFTs.length,
    aiAuditTotalSupply: aiAuditTotalSupply ? Number(aiAuditTotalSupply) : 0,
    genesisTotalSupply: genesisTotalSupply ? Number(genesisTotalSupply) : 0,
    totalDistributed: totalDistributed ? Number(formatEther(totalDistributed as bigint)) : 0,
    totalGenesisRevenue: totalGenesisRevenue ? Number(formatEther(totalGenesisRevenue as bigint)) : 0,
    chainId: chain?.id,
    totalJobs: totalJobs ? Number(totalJobs) : 0
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
              {(pendingRewards > 0 || pendingRevenue > 0) && (
                <div className="reward-stat-card secondary">
                  <div className="stat-icon">
                    <Gift size={24} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">
                      Total Claimable
                      <span className="info-tooltip" title="Total rewards and revenue available to claim">ℹ️</span>
                    </span>
                    <span className="stat-value">
                      {pendingRewards > 0 && `${formattedPendingRewards} SSTL`}
                      {pendingRewards > 0 && pendingRevenue > 0 && ' + '}
                      {pendingRevenue > 0 && `${formattedPendingRevenue} BNB`}
                    </span>
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
                    <span className="stat-value">{formattedPendingRevenue} BNB</span>
                    <span className="stat-subtitle">From Genesis NFTs</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Claim Rewards Buttons */}
          {!isCalculatingRewards && (
            <div className="claim-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              {pendingRewards > 0 && (
                <button
                  className="claim-rewards-btn"
                  onClick={handleClaimRewards}
                  disabled={isClaiming}
                  style={{ 
                    padding: '10px 16px',
                    fontSize: '14px',
                    width: '100%',
                    maxWidth: '400px',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isClaiming ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Gift size={16} />
                      Claim PoUW Rewards ({formattedPendingRewards} SSTL)
                    </>
                  )}
                </button>
              )}
              {pendingRevenue > 0 && (
                <button
                  className="claim-rewards-btn"
                  onClick={handleClaimRevenue}
                  disabled={isClaiming}
                  style={{ 
                    padding: '10px 16px',
                    fontSize: '14px',
                    width: '100%',
                    maxWidth: '400px',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isClaiming ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <DollarSign size={16} />
                      Claim Genesis Revenue ({formattedPendingRevenue} BNB)
                    </>
                  )}
                </button>
              )}
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
              <span className="global-stat-label">Total Distributed (60%):</span>
              <span className="global-stat-value">{totalDistributedTokens.toFixed(2)} SSTL</span>
            </div>
            <div className="global-stat-item">
              <span className="global-stat-label">Total Treasury (20%):</span>
              <span className="global-stat-value">{totalTreasuryTokens.toFixed(2)} SSTL</span>
            </div>
            <div className="global-stat-item">
              <span className="global-stat-label">Total Burned (10%):</span>
              <span className="global-stat-value">{totalBurnedTokens.toFixed(2)} SSTL</span>
            </div>
            <div className="global-stat-item">
              <span className="global-stat-label">Total Genesis Revenue:</span>
              <span className="global-stat-value">{totalRevenueCollected.toFixed(4)} BNB</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
"use client";
import { useState, useEffect } from "react";
import { useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react";
import { getContract, prepareContractCall, createThirdwebClient, readContract } from "thirdweb";
import { bscTestnet } from "thirdweb/chains";
import { formatEther } from "viem";
import { Loader, Gift, TrendingUp, CheckCircle, AlertCircle, ExternalLink, DollarSign } from "lucide-react";

// Import contract ABIs and addresses
import { POUW_POOL_ADDRESS, POUW_POOL_ABI, AI_AUDIT_CONTRACT_ADDRESS, AI_AUDIT_ABI, GENESIS_CONTRACT_ADDRESS, GENESIS_ABI } from "../../contracts/index";

const thirdwebClient = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

// Contract addresses
const POUW_ADDRESS = POUW_POOL_ADDRESS;
const AI_AUDIT_ADDRESS = AI_AUDIT_CONTRACT_ADDRESS;
const GENESIS_ADDRESS = GENESIS_CONTRACT_ADDRESS;

interface RewardsSectionProps {
  refreshTrigger?: number;
}

export default function SidebarMyRewards({ refreshTrigger = 0 }: RewardsSectionProps) {
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;
  
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
  
  // New states for claimed amounts tracking
  const [totalClaimedRewards, setTotalClaimedRewards] = useState(0); // Total SSTL claimed by user
  const [totalClaimedRevenue, setTotalClaimedRevenue] = useState(0); // Total BNB claimed by user
  const [justClaimedRewards, setJustClaimedRewards] = useState(false); // Hide rewards button after claim
  const [justClaimedRevenue, setJustClaimedRevenue] = useState(false); // Hide revenue button after claim
  
  // Track blockchain pending amounts for comparison
  const [blockchainPendingRewards, setBlockchainPendingRewards] = useState(0);
  const [blockchainPendingRevenue, setBlockchainPendingRevenue] = useState(0);

  // Create contract instances
  const pouwContract = getContract({
    client: thirdwebClient,
    address: POUW_POOL_ADDRESS,
    chain: bscTestnet,
  });

  const genesisContract = getContract({
    client: thirdwebClient,
    address: GENESIS_CONTRACT_ADDRESS,
    chain: bscTestnet,
  });

  const aiAuditContract = getContract({
    client: thirdwebClient,
    address: AI_AUDIT_CONTRACT_ADDRESS,
    chain: bscTestnet,
  });

  // Calculate user earnings and pending rewards/revenue
  useEffect(() => {
    if (!address) {
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
        const pendingRewards = await readContract({
          contract: pouwContract,
          method: 'function getPendingRewards(address user) view returns (uint256)',
          params: [address as `0x${string}`],
        }) as bigint;
        totalPendingRewards = pendingRewards;
      } catch (error) {
        console.error('Error getting pending PoUW rewards:', error);
      }

      try {
        // Get user's Genesis NFT IDs first
        const genesisTokens = await readContract({
          contract: genesisContract,
          method: 'function tokensOfOwner(address owner_) view returns (uint256[])',
          params: [address as `0x${string}`],
        }) as bigint[];

        // Get total pending Genesis revenue using V3.1 snapshot calculation (now consistent!)
        if (genesisTokens && genesisTokens.length > 0) {
          const pendingRevenue = await readContract({
            contract: pouwContract,
            method: 'function getBatchClaimableGenesisRevenue(uint256[] calldata tokenIds) view returns (uint256)',
            params: [genesisTokens],
          }) as bigint;
          totalPendingRevenue = pendingRevenue;
          
          console.log(`V3.1 Genesis revenue calculation: ${formatEther(pendingRevenue)} BNB claimable`);
        }
      } catch (error) {
        console.error('Error getting pending Genesis revenue:', error);
      }

      // Get user's total claimed amounts from localStorage (client-side tracking) FIRST
      let currentClaimedRewards = 0;
      let currentClaimedRevenue = 0;
      
      try {
        const storedClaimedRewards = localStorage.getItem(`claimedRewards_${address}`);
        const storedClaimedRevenue = localStorage.getItem(`claimedRevenue_${address}`);
        
        // Initialize with stored values or 0
        currentClaimedRewards = storedClaimedRewards ? parseFloat(storedClaimedRewards) : 0;
        currentClaimedRevenue = storedClaimedRevenue ? parseFloat(storedClaimedRevenue) : 0;
        
        // Initialize with your previously claimed amounts (before localStorage tracking)
        if (!storedClaimedRevenue && address === '0x53FF3FB6f8CFb648626F8179856FA7f38A2e3DeB') {
          // Your wallet - you mentioned you claimed 0.0074 BNB + now 0.0149 = 0.0223 total
          currentClaimedRevenue = 0.0223;
          localStorage.setItem(`claimedRevenue_${address}`, '0.0223');
        }
        // Remove hardcoded initialization - let it track organically from actual claims
        
        // Update state with current claimed amounts
        setTotalClaimedRewards(currentClaimedRewards);
        setTotalClaimedRevenue(currentClaimedRevenue);
        
      } catch (error) {
        console.log('Error reading claimed amounts from localStorage:', error);
        setTotalClaimedRewards(0);
        setTotalClaimedRevenue(0);
      }

      // Update blockchain pending amounts (raw from contract)
      const rawPendingRewards = Number(formatEther(totalPendingRewards));
      const rawPendingRevenue = Number(formatEther(totalPendingRevenue));
      
      // Store raw blockchain amounts for comparison
      setBlockchainPendingRewards(rawPendingRewards);
      setBlockchainPendingRevenue(rawPendingRevenue);
      
      // The blockchain already returns only UNCLAIMED rewards, so use them directly
      // No need to subtract claimed amounts - contract handles this internally
      const actualClaimableRewards = rawPendingRewards;
      const actualClaimableRevenue = rawPendingRevenue;
      
      console.log(`Blockchain unclaimed: ${rawPendingRewards} SSTL, ${rawPendingRevenue} BNB`);
      console.log(`LocalStorage claimed: ${currentClaimedRewards} SSTL, ${currentClaimedRevenue} BNB`);
      console.log(`Available to claim: ${actualClaimableRewards} SSTL, ${actualClaimableRevenue} BNB`);
      
      // Reset "just claimed" states only when there are genuinely NEW rewards (threshold > 0.0001)
      if (actualClaimableRewards > 0.0001) {
        setJustClaimedRewards(false);
      }
      if (actualClaimableRevenue > 0.0001) {
        setJustClaimedRevenue(false);
      }
      
      // Set the user pending amounts to the actual claimable amounts
      setUserPendingRewards(actualClaimableRewards);
      setUserPendingRevenue(actualClaimableRevenue);
      setIsCalculatingRewards(false);
    };

    calculateUserStats();
  }, [address, internalRefreshTrigger, refreshTrigger]);

  // Read global stats from PoUW contract with real-time updates
  const { data: totalJobs } = useReadContract({
    contract: pouwContract,
    method: 'function totalJobs() view returns (uint256)',
    queryOptions: {
      refetchInterval: 2000, // Refetch every 2 seconds
    },
  });

  const { data: totalDistributed } = useReadContract({
    contract: pouwContract,
    method: 'function totalDistributed() view returns (uint256)',
    queryOptions: {
      refetchInterval: 2000,
    },
  });

  const { data: totalTreasury } = useReadContract({
    contract: pouwContract,
    method: 'function totalTreasury() view returns (uint256)',
    queryOptions: {
      refetchInterval: 2000,
    },
  });

  const { data: totalGenesisRevenue } = useReadContract({
    contract: pouwContract,
    method: 'function totalGenesisRevenue() view returns (uint256)',
    queryOptions: {
      refetchInterval: 2000,
    },
  });

  const { data: totalBurnedAmount } = useReadContract({
    contract: pouwContract,
    method: 'function totalBurned() view returns (uint256)',
    queryOptions: {
      refetchInterval: 2000,
    },
  });

  // Read user's NFT holdings
  const { data: genesisNFTs } = useReadContract({
    contract: genesisContract,
    method: 'function tokensOfOwner(address owner) view returns (uint256[])',
    params: address ? [address as `0x${string}`] : undefined,
    queryOptions: { enabled: !!address && isConnected }
  });

  const { data: aiAuditNFTs } = useReadContract({
    contract: aiAuditContract,
    method: 'function tokensOfOwner(address owner) view returns (uint256[])',
    params: address ? [address as `0x${string}`] : undefined,
    queryOptions: { enabled: !!address && isConnected }
  });

  // Read total supply for debugging
  const { data: aiAuditTotalSupply } = useReadContract({
    contract: aiAuditContract,
    method: 'function totalSupply() view returns (uint256)',
  });

  const { data: genesisTotalSupply } = useReadContract({
    contract: genesisContract,
    method: 'function totalSupply() view returns (uint256)',
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

  // Thirdweb transaction hook
  const { mutateAsync: sendTx } = useSendTransaction();

  // Handle claim PoUW SSTL rewards
  const handleClaimRewards = async () => {
    if (!address || !isConnected) {
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
      
      const transaction = prepareContractCall({
        contract: pouwContract,
        method: 'function claimAllRewards()',
        params: [],
      });

      const result = await sendTx(transaction);
      
      console.log('PoUW rewards claim tx:', result.transactionHash);
      
      // Final State Update
      setClaimTxHash(result.transactionHash);
      setClaimSuccess(true);
      setIsClaiming(false);
      setJustClaimedRewards(true); // Hide claim button immediately
      
      // Update claimed amounts in localStorage and state IMMEDIATELY
      const newTotalClaimed = totalClaimedRewards + userPendingRewards;
      setTotalClaimedRewards(newTotalClaimed);
      localStorage.setItem(`claimedRewards_${address}`, newTotalClaimed.toString());
      
      // IMMEDIATELY set pending rewards to 0 so button disappears
      setUserPendingRewards(0);
      
      setInternalRefreshTrigger((prev: number) => prev + 1);

      // Reset success message after some time, but keep button hidden longer
      setTimeout(() => {
        setClaimSuccess(false);
      }, 8000); // 8 seconds for success message

      // Keep button hidden longer to ensure blockchain data has updated
      setTimeout(() => {
        setJustClaimedRewards(false); // Show button again only after longer delay
      }, 15000); // 15 seconds for button visibility

    } catch (error: any) {
      console.error('PoUW rewards claim error:', error);
      
      // Check for specific "nothing to claim" error
      if (error.message && error.message.includes('Nothing to claim')) {
        setClaimError('No PoUW rewards available to claim. You may have already claimed recent rewards.');
        // Force refresh to update UI with correct claimable amounts
        setInternalRefreshTrigger((prev: number) => prev + 1);
      } else {
        setClaimError(error.message || 'Failed to claim PoUW rewards');
      }
      
      setIsClaiming(false);
      
      // Refresh data after error to ensure UI is in sync
      setTimeout(() => {
        setInternalRefreshTrigger((prev: number) => prev + 1);
      }, 2000);
    }
  };

  // Handle claim Genesis BNB revenue
  const handleClaimRevenue = async () => {
    if (!address || !isConnected) {
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
      
      const transaction = prepareContractCall({
        contract: pouwContract,
        method: 'function batchClaimGenesisRevenue(uint256[] calldata genesisTokenIds)',
        params: [userGenesisNFTs],
      });

      const result = await sendTx(transaction);
      
      console.log('Genesis revenue claim tx:', result.transactionHash);
      
      // Final State Update
      setClaimTxHash(result.transactionHash);
      setClaimSuccess(true);
      setIsClaiming(false);
      setJustClaimedRevenue(true); // Hide claim button immediately
      
      // Update claimed amounts in localStorage and state IMMEDIATELY
      const newTotalClaimedRevenue = totalClaimedRevenue + userPendingRevenue;
      setTotalClaimedRevenue(newTotalClaimedRevenue);
      localStorage.setItem(`claimedRevenue_${address}`, newTotalClaimedRevenue.toString());
      
      // IMMEDIATELY set pending revenue to 0 so button disappears
      setUserPendingRevenue(0);
      
      setInternalRefreshTrigger((prev: number) => prev + 1);

      // Reset success message after some time, but keep button hidden longer
      setTimeout(() => {
        setClaimSuccess(false);
      }, 8000); // 8 seconds for success message

      // Keep button hidden longer to ensure blockchain data has updated
      setTimeout(() => {
        setJustClaimedRevenue(false); // Show button again only after longer delay
      }, 15000); // 15 seconds for button visibility

    } catch (error: any) {
      console.error('Genesis revenue claim error:', error);
      
      // Check for specific "nothing to claim" error
      if (error.message && error.message.includes('Nothing to claim')) {
        setClaimError('No Genesis revenue available to claim. You may have already claimed recent rewards.');
        // Force refresh to update UI with correct claimable amounts
        setInternalRefreshTrigger((prev: number) => prev + 1);
      } else {
        setClaimError(error.message || 'Failed to claim Genesis revenue');
      }
      
      setIsClaiming(false);
      
      // Refresh data after error to ensure UI is in sync
      setTimeout(() => {
        setInternalRefreshTrigger((prev: number) => prev + 1);
      }, 2000);
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

  // Debug logging for Genesis revenue claim button
  console.log('Genesis Revenue Debug:', {
    userPendingRevenue,
    pendingRevenue,
    formattedPendingRevenue,
    isGreaterThanZero: pendingRevenue > 0,
    isGreaterThanMinimum: pendingRevenue > 0.0001, // Add minimum threshold
    userGenesisNFTs: userGenesisNFTs.length
  });

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
    totalJobs: totalJobs ? Number(totalJobs) : 0
  });

  // Get explorer URL - BSC Testnet
  const getExplorerUrl = (txHash: string) => {
    return `https://testnet.bscscan.com/tx/${txHash}`;
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
              {/* Show claimed amounts cards first - always visible for connected users */}
              {address && (
                <div className="reward-stat-card claimed">
                  <div className="stat-icon">
                    <CheckCircle size={24} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">
                      Claimed from Genesis
                      <span className="info-tooltip" title="Total Genesis revenue claimed from AI Audit NFT sales">ℹ️</span>
                    </span>
                    <span className="stat-value">{totalClaimedRevenue.toFixed(4)} BNB</span>
                    <span className="stat-subtitle">From AI Audit NFT sales</span>
                  </div>
                </div>
              )}

              {address && (
                <div className="reward-stat-card claimed">
                  <div className="stat-icon">
                    <CheckCircle size={24} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">
                      Claimed from AI Audits
                      <span className="info-tooltip" title="Total PoUW rewards claimed from completed AI audit jobs">ℹ️</span>
                    </span>
                    <span className="stat-value">{totalClaimedRewards.toFixed(4)} SSTL</span>
                    <span className="stat-subtitle">From audit job completions</span>
                  </div>
                </div>
              )}

              {/* Smart claimable card centered below claimed cards */}
              {(pendingRewards > 0 || pendingRevenue > 0) && (
                <div className="reward-stat-card secondary" style={{ gridColumn: '1 / -1', maxWidth: '400px', margin: '0 auto' }}>
                  <div className="stat-icon">
                    <Gift size={24} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">
                      Available to Claim
                      <span className="info-tooltip" title="Rewards and revenue ready to claim right now">ℹ️</span>
                    </span>
                    <span className="stat-value">
                      {pendingRewards > 0 && `${formattedPendingRewards} SSTL`}
                      {pendingRewards > 0 && pendingRevenue > 0 && ' + '}
                      {pendingRevenue > 0 && `${formattedPendingRevenue} BNB`}
                    </span>
                    <span className="stat-subtitle">
                      {pendingRewards > 0 && pendingRevenue > 0 
                        ? "From AI Audits & Genesis NFTs"
                        : pendingRewards > 0 
                        ? "From AI Audit job completions"
                        : "From Genesis NFT revenue share"
                      }
                    </span>
                  </div>
                </div>
              )}

              {/* Show "just claimed" message when user recently claimed */}
              {(justClaimedRewards || justClaimedRevenue) && !(pendingRewards > 0 || pendingRevenue > 0) && (
                <div className="reward-stat-card secondary" style={{ gridColumn: '1 / -1', maxWidth: '400px', margin: '0 auto', backgroundColor: '#2a4a3a' }}>
                  <div className="stat-icon">
                    <CheckCircle size={24} style={{ color: '#22c55e' }} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label" style={{ color: '#22c55e' }}>
                      Just Claimed!
                      <span className="info-tooltip" title="You recently claimed rewards - new rewards will appear here when available">ℹ️</span>
                    </span>
                    <span className="stat-value" style={{ color: '#22c55e' }}>
                      {justClaimedRewards && "✓ AI Audit Rewards"}
                      {justClaimedRewards && justClaimedRevenue && " & "}
                      {justClaimedRevenue && "✓ Genesis Revenue"}
                    </span>
                    <span className="stat-subtitle">
                      Claim buttons will reappear when new rewards are available
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Claim Rewards Buttons */}
          {!isCalculatingRewards && (
            <div className="claim-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              {pendingRewards > 0.0001 && !justClaimedRewards && (
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
                      Claim AI Audit Rewards ({formattedPendingRewards} SSTL)
                    </>
                  )}
                </button>
              )}
              {pendingRevenue > 0.0001 && !justClaimedRevenue && (
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
              
              {/* Show message when buttons are hidden after claiming */}
              {(justClaimedRewards || justClaimedRevenue) && (
                <div className="rewards-message info" style={{ marginTop: '10px' }}>
                  <CheckCircle size={20} />
                  <span>
                    {justClaimedRewards && justClaimedRevenue 
                      ? "Both rewards claimed! Buttons will return when new rewards become available."
                      : justClaimedRewards 
                      ? "AI Audit rewards claimed! Button will return when new audit jobs complete."
                      : "Genesis revenue claimed! Button will return when new AI Audit NFTs are sold."
                    }
                  </span>
                </div>
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
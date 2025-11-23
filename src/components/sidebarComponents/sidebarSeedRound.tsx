import { useState, useEffect, useMemo, memo } from 'react';
import { ethers } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Zap,
  ArrowRight,
  Info,
  Clock,
  Users,
  Target,
  Flame,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { useActiveAccount } from 'thirdweb/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import styles from './sidebarSeedRound.module.css';

// Token & Contract Constants
const SSTL_TOKEN_ADDRESS = '0x56317dbCCd647C785883738fac9308ebcA063aca';
const USD1_TOKEN_ADDRESS = '0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d'; // USD1 on BSC
const BSC_CHAIN_ID = 56;
const BSC_RPC_URL = 'https://bsc-dataseed1.binance.org:8545';

// Seed Round Configuration - 100 Tiers System
const SEED_CONFIG = {
  totalTokens: 1_000_000,
  tokensPerTier: 10_000, // 10k tokens per tier
  totalTiers: 100,
  startPrice: 0.015, // Starting price in USD for tier 1
  priceMultiplier: 0.075, // Price increase formula: startPrice × (1 + tier × multiplier)
  tokensSold: 0, // Will be updated from backend
  lastUpdateTime: Date.now(),
};

interface RecentBuy {
  id: string;
  buyer: string;
  amount: number;
  price: number;
  total: number;
  timestamp: number;
  txHash?: string;
}

interface SeedRoundStats {
  totalRaised: number; // in USD
  tokensSold: number;
  currentPrice: number;
  priceIncrease: number; // percentage
  participantsCount: number;
  percentageComplete: number;
}

const SidebarSeedRound = memo(() => {
  const account = useActiveAccount();
  const [activeTab, setActiveTab] = useState<'purchase'>('purchase');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [estimatedTokens, setEstimatedTokens] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [recentBuys, setRecentBuys] = useState<RecentBuy[]>([]);

  // Mock stats data (will be fetched from backend)
  const [stats, setStats] = useState<SeedRoundStats>({
    totalRaised: 0,
    tokensSold: 0,
    currentPrice: 0.015,
    priceIncrease: 0,
    participantsCount: 0,
    percentageComplete: 0,
  });

  // Calculate estimated tokens based on input amount
  useEffect(() => {
    if (purchaseAmount && !isNaN(Number(purchaseAmount))) {
      const usdAmount = Number(purchaseAmount);
      const tokens = usdAmount / stats.currentPrice;
      const cost = tokens * stats.currentPrice;
      setEstimatedTokens(Math.floor(tokens));
      setEstimatedCost(cost);
    } else {
      setEstimatedTokens(0);
      setEstimatedCost(0);
    }
  }, [purchaseAmount, stats.currentPrice]);

  // Get current tier number based on tokens sold
  const getCurrentTier = (tokensSold: number): number => {
    return Math.floor(tokensSold / SEED_CONFIG.tokensPerTier) + 1;
  };

  // Get price for a specific tier
  const getPriceForTier = (tierNumber: number): number => {
    return SEED_CONFIG.startPrice * (1 + tierNumber * SEED_CONFIG.priceMultiplier);
  };

  // Calculate price based on tokens sold (tier-based pricing)
  const calculateDynamicPrice = (tokensSoldSoFar: number): number => {
    const currentTier = getCurrentTier(tokensSoldSoFar);
    return getPriceForTier(currentTier);
  };

  const handlePurchase = async () => {
    if (!account?.address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to participate in the seed round",
        variant: "destructive",
      });
      return;
    }

    if (!purchaseAmount || Number(purchaseAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid purchase amount",
        variant: "destructive",
      });
      return;
    }

    const usdAmount = Number(purchaseAmount);
    if (usdAmount < 10) {
      toast({
        title: "Minimum Purchase",
        description: "Minimum purchase amount is $10 USD",
        variant: "destructive",
      });
      return;
    }

    // Calculate new totals after purchase
    const newTokensAfterPurchase = stats.tokensSold + estimatedTokens;
    const newTotalRaised = stats.totalRaised + estimatedCost;

    // Check if tokens would exceed available
    if (newTokensAfterPurchase > SEED_CONFIG.totalTokens) {
      toast({
        title: "Not Enough Tokens",
        description: `Only ${SEED_CONFIG.totalTokens - stats.tokensSold} tokens remaining in this round`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get the user's signer from window.ethereum
      if (!window.ethereum) {
        throw new Error("Ethereum provider not found");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // USD1 token ABI (ERC20 standard + approve)
      const USD1_ABI = [
        'function approve(address spender, uint256 amount) returns (bool)',
        'function balanceOf(address account) returns (uint256)',
      ];

      // Seed Round Sale ABI
      const SEED_ROUND_ABI = [
        'function buyTokens(uint256 _tokenAmount) external',
        'function tokenPrice() view returns (uint256)',
        'function totalTokensForSale() view returns (uint256)',
        'function tokensSold() view returns (uint256)',
      ];

      // TODO: Replace with your deployed SeedRoundSale contract address
      const SEED_ROUND_ADDRESS = '0x...'; // UPDATE THIS AFTER DEPLOYMENT

      // Check if user has enough USD1
      const usd1Contract = new ethers.Contract(USD1_TOKEN_ADDRESS, USD1_ABI, provider);
      const usdBalance = await usd1Contract.balanceOf(account.address);
      const usdAmountWei = ethers.parseEther(usdAmount.toFixed(6)); // USD1 uses 18 decimals

      if (usdBalance < usdAmountWei) {
        toast({
          title: "Insufficient Balance",
          description: `You have insufficient USD1. You need ${usdAmount.toFixed(2)} USD1`,
          variant: "destructive",
        });
        return;
      }

      // Step 1: Approve USD1 spending
      toast({
        title: "Step 1: Approval",
        description: "Approving USD1 spending...",
      });

      const usd1ContractSigner = new ethers.Contract(USD1_TOKEN_ADDRESS, USD1_ABI, signer);
      const approveTx = await usd1ContractSigner.approve(
        SEED_ROUND_ADDRESS,
        usdAmountWei
      );
      const approveReceipt = await approveTx.wait();

      if (!approveReceipt) {
        throw new Error("Approval transaction failed");
      }

      // Step 2: Purchase tokens from seed round
      toast({
        title: "Step 2: Purchase",
        description: "Purchasing SSTL tokens...",
      });

      const seedRoundContract = new ethers.Contract(
        SEED_ROUND_ADDRESS,
        SEED_ROUND_ABI,
        signer
      );

      // Convert SSTL amount to wei (18 decimals)
      const sstlAmountWei = ethers.parseEther(estimatedTokens.toString());
      const purchaseTx = await seedRoundContract.buyTokens(sstlAmountWei);
      const purchaseReceipt = await purchaseTx.wait();

      if (!purchaseReceipt) {
        throw new Error("Purchase transaction failed");
      }

      // Get transaction hash
      const txHash = purchaseReceipt.hash;

      // Add to recent buys
      const newBuy: RecentBuy = {
        id: txHash,
        buyer: account.address,
        amount: estimatedTokens,
        price: stats.currentPrice,
        total: estimatedCost,
        timestamp: Date.now(),
        txHash: txHash,
      };

      setRecentBuys(prev => [newBuy, ...prev.slice(0, 9)]);

      // Update stats
      const newPrice = calculateDynamicPrice(newTokensAfterPurchase);
      setStats(prev => ({
        ...prev,
        totalRaised: newTotalRaised,
        tokensSold: newTokensAfterPurchase,
        currentPrice: newPrice,
        priceIncrease: ((newPrice - SEED_CONFIG.startPrice) / SEED_CONFIG.startPrice) * 100,
        participantsCount: prev.participantsCount + 1,
        percentageComplete: (newTokensAfterPurchase / SEED_CONFIG.totalTokens) * 100,
      }));

      toast({
        title: "Purchase Successful! 🎉",
        description: `You purchased ${estimatedTokens.toLocaleString()} SSTL tokens for $${estimatedCost.toFixed(2)} USD. Tokens are now locked with vesting.`,
      });

      setPurchaseAmount('');
      setEstimatedTokens(0);
      setEstimatedCost(0);

    } catch (error: any) {
      console.error('Purchase error:', error);

      // Handle specific error cases
      let errorDescription = "An error occurred during your purchase. Please try again.";
      if (error.message?.includes("user rejected")) {
        errorDescription = "Transaction rejected by user";
      } else if (error.message?.includes("insufficient")) {
        errorDescription = "Insufficient balance or allowance";
      } else if (error.message?.includes("SeedRoundSale")) {
        errorDescription = error.message;
      }

      toast({
        title: "Purchase Failed",
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const timeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const tokensRemaining = useMemo(
    () => SEED_CONFIG.totalTokens - stats.tokensSold,
    [stats.tokensSold]
  );

  const currentTierInfo = useMemo(() => {
    const tierNumber = getCurrentTier(stats.tokensSold);
    const tokensInCurrentTier = stats.tokensSold % SEED_CONFIG.tokensPerTier;
    const tokensRemainingInTier = SEED_CONFIG.tokensPerTier - tokensInCurrentTier;
    return {
      tierNumber,
      tokensInTier: tokensInCurrentTier,
      tokensRemainingInTier,
      tierPrice: getPriceForTier(tierNumber),
    };
  }, [stats.tokensSold]);



  return (
    <div className={styles.container}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <DollarSign className={styles.zapIcon} size={32} />
          </div>
          <div style={{ flex: 1 }}>
            <h1 className={styles.title}>Public Seed Round</h1>
            <p className={styles.subtitle}>Support SSTL early and benefit from dynamic pricing</p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '1.5rem' }}>
          <motion.img
            src="/assets/token.svg"
            alt="SSTL Token"
            style={{ width: 250, height: 250 }}
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              scale: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className={styles.infoBanner}>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>About This Round</h3>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5', opacity: 0.95 }}>
                This exclusive public seed round offers early supporters an opportunity to invest in SSTL tokens at attractive dynamic pricing. As more tokens are sold, the price increases based on demand.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>How It Works</h3>
              <ol style={{ fontSize: '0.9rem', lineHeight: '1.6', opacity: 0.95, paddingLeft: '1.25rem' }}>
                <li>Select your purchase amount in USD</li>
                <li>View the number of SSTL tokens you'll receive at current price</li>
                <li>Approve USD1 spending and confirm transaction</li>
                <li>Receive SSTL tokens directly in your wallet</li>
              </ol>
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} />
                Dynamic Pricing
              </h3>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5', opacity: 0.95, marginBottom: '0.5rem' }}>
                Starting price: <strong>$0.015</strong> per token. Price increases automatically as tokens are sold, based on demand. Early buyers get lower prices, incentivizing early participation. Current price: <strong>${stats.currentPrice.toFixed(4)}</strong>
              </p>
              <p style={{ fontSize: '0.85rem', opacity: 0.9, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#fbbf24', flexShrink: 0 }}>💡</span>
                <span><strong>Price increases gradually:</strong> As more tokens are purchased, the price rises incrementally. This means the first buyers get the best deal, and later buyers pay more—rewarding those who commit early.</span>
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Key Details</h3>
              <ul style={{ fontSize: '0.9rem', lineHeight: '1.6', opacity: 0.95, paddingLeft: '1.25rem' }}>
                <li>Total Tokens Available: {SEED_CONFIG.totalTokens.toLocaleString()}</li>
                <li>Minimum Purchase: $10 USD</li>
                <li>Payment Token: USD1 on BSC</li>
                <li>Receipt Token: SSTL</li>
                <li>Vesting: 12-month Cliff, 18-month Linear Vesting</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ExternalLink size={18} />
                Token Contract
              </h3>
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '0.75rem', fontSize: '0.85rem', wordBreak: 'break-all', opacity: 0.9 }}>
                {SSTL_TOKEN_ADDRESS}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <a 
                  href={`https://bscscan.com/token/${SSTL_TOKEN_ADDRESS}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: 'rgba(248, 244, 66, 0.1)',
                    border: '1px solid rgba(248, 244, 66, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#fbbf24',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(248, 244, 66, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(248, 244, 66, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(248, 244, 66, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(248, 244, 66, 0.3)';
                  }}
                >
                  View on BSCScan
                  <ExternalLink size={14} />
                </a>
                <a 
                  href="/documents/SmartSentinelsWhitepaper v0.2.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: 'rgba(248, 244, 66, 0.1)',
                    border: '1px solid rgba(248, 244, 66, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#fbbf24',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(248, 244, 66, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(248, 244, 66, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(248, 244, 66, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(248, 244, 66, 0.3)';
                  }}
                >
                  Tokenomics (Whitepaper)
                  <ExternalLink size={14} />
                </a>
                <a 
                  href="https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafybeiayb6pztjs57hwrbgj76vuv4qrsp3g4it7vqbtsgeg3avolnrcjum" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: 'rgba(248, 244, 66, 0.1)',
                    border: '1px solid rgba(248, 244, 66, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#fbbf24',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(248, 244, 66, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(248, 244, 66, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(248, 244, 66, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(248, 244, 66, 0.3)';
                  }}
                >
                  Audit Report (IPFS)
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className={styles.progressCard}>
          <CardContent className="pt-6">
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>Sale Progress</span>
              <span className={styles.progressPercent}>{stats.percentageComplete.toFixed(1)}%</span>
            </div>
            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBar}
                style={{ width: `${Math.min(stats.percentageComplete, 100)}%` }}
              />
            </div>
            <div className={styles.progressFooter}>
              <span className={styles.progressTokens}>
                {stats.tokensSold.toLocaleString()} / {SEED_CONFIG.totalTokens.toLocaleString()} SSTL
              </span>
              <span className={styles.progressUsd}>
                ${stats.totalRaised.toLocaleString('en-US', { maximumFractionDigits: 0 })} raised
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Purchase Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className={styles.contentCard}>
              <CardContent className="pt-6 space-y-6">
                {!account?.address ? (
                  <div className={styles.noWalletBox}>
                    <AlertCircle size={24} />
                    <p>Please connect your wallet to participate in the seed round</p>
                  </div>
                ) : (
                  <>
                    <div className={styles.purchaseForm}>
                      <label className={styles.formLabel}>
                        <span>Amount to Invest (USD)</span>
                        <span className={styles.formHint}>Minimum: $10</span>
                      </label>
                      <div className={styles.inputGroup}>
                        <DollarSign size={18} className={styles.inputPrefix} />
                        <Input
                          type="number"
                          placeholder="Enter amount in USD"
                          value={purchaseAmount}
                          onChange={(e) => setPurchaseAmount(e.target.value)}
                          className={styles.formInput}
                          min="10"
                          step="1"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {estimatedTokens > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={styles.estimateBox}
                      >
                        <div className={styles.estimateRow}>
                          <span className={styles.estimateLabel}>Current Price:</span>
                          <span className={styles.estimateValue}>${stats.currentPrice.toFixed(4)} per token</span>
                        </div>
                        <div className={styles.estimateRow}>
                          <span className={styles.estimateLabel}>Tokens You'll Receive:</span>
                          <span className={`${styles.estimateValue} text-green-400`}>
                            {estimatedTokens.toLocaleString()} SSTL
                          </span>
                        </div>
                        <div className={`${styles.estimateRow} ${styles.estimateTotal}`}>
                          <span className={styles.estimateLabel}>Total Cost:</span>
                          <span className={styles.estimateValue}>${estimatedCost.toFixed(2)}</span>
                        </div>
                      </motion.div>
                    )}

                    <div className={styles.purchaseInfo}>
                      <Info size={16} />
                      <p>
                        You will need to approve USD1 token spending before the transaction. Both tokens are on BSC mainnet.
                      </p>
                    </div>

                    <Button
                      onClick={handlePurchase}
                      disabled={isLoading || !purchaseAmount || Number(purchaseAmount) <= 0}
                      className={styles.purchaseButton}
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="inline-block mr-2"
                          >
                            <Zap size={18} />
                          </motion.div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Zap size={18} className="mr-2" />
                          Complete Purchase
                        </>
                      )}
                    </Button>

                    <div className={styles.disclaimerBox}>
                      <AlertCircle size={16} />
                      <p>
                        <strong>Disclaimer:</strong> This seed round is for early supporters only. Token price increases
                        with demand. Always verify transactions before confirming.
                      </p>
                    </div>
                  </>
                )}

                {/* Recent Purchases Section */}
                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Flame size={18} />
                    Recent Purchases
                  </h3>
                  {recentBuys.length === 0 ? (
                    <div className={styles.emptyBox}>
                      <Flame size={32} />
                      <p>No purchases yet. Be the first!</p>
                    </div>
                  ) : (
                    <div className={styles.buysList}>
                      {recentBuys.map((buy, index) => (
                        <motion.div
                          key={buy.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={styles.buyItem}
                        >
                          <div className={styles.buyContent}>
                            <div className={styles.buyHeader}>
                              <span className={styles.buyAddress}>{formatAddress(buy.buyer)}</span>
                              <span className={styles.buyTime}>{timeAgo(buy.timestamp)}</span>
                            </div>
                            <div className={styles.buyDetails}>
                              <div className={styles.buyDetail}>
                                <span className={styles.buyLabel}>Amount:</span>
                                <span className={styles.buyValue}>{buy.amount.toLocaleString()} SSTL</span>
                              </div>
                              <div className={styles.buyDetail}>
                                <span className={styles.buyLabel}>Price:</span>
                                <span className={styles.buyValue}>${buy.price.toFixed(4)}</span>
                              </div>
                              <div className={styles.buyDetail}>
                                <span className={styles.buyLabel}>Total:</span>
                                <span className={`${styles.buyValue} text-green-400`}>${buy.total.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                          {buy.txHash && (
                            <a
                              href={`https://bscscan.com/tx/${buy.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.buyLink}
                              title="View on BSCScan"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
    </div>
  );
});

SidebarSeedRound.displayName = 'SidebarSeedRound';

export default SidebarSeedRound;

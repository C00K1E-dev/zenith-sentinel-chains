import { useState, useEffect, useMemo, memo, useRef } from 'react';
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
  Lock,
  CheckCircle,
} from 'lucide-react';
import { useActiveAccount } from 'thirdweb/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import styles from './sidebarSeedRound.module.css';

// Token & Contract Constants - TESTNET (USDT VERSION)
const SSTL_TOKEN_ADDRESS_TST = '0x53Efbb2DA9CDf2DDe6AD0A0402b7b4427a7F9e89'; // SSTLTST on testnet
const SEED_ROUND_USD_ADDRESS_TST = '0x[DEPLOY_ADDRESS_HERE]'; // SeedRoundSaleUSD testnet - UPDATE AFTER DEPLOY
const USDT_ADDRESS_TST = '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd'; // USDT on BSC Testnet
const TESTNET_CHAIN_ID = 97; // BSC Testnet
const TESTNET_RPC_URL = 'https://data-seed-prebsc-1-s1.binance.org:8545';
const FALLBACK_RPC_URLS = [
  'https://bsc-testnet.publicnode.com',
  'https://rpc.ankr.com/bsc_testnet_chapel',
  'https://data-seed-prebsc-1-s1.binance.org:8545',
  'https://data-seed-prebsc-2-s1.binance.org:8545',
];
const BSCSCAN_API_KEY = import.meta.env.VITE_BSCSCAN_API_KEY || '';

// Mainnet addresses (keep for reference)
const SSTL_TOKEN_ADDRESS = '0x56317dbCCd647C785883738fac9308ebcA063aca';
const USDT_ADDRESS_MAINNET = '0x55d398326f99059fF775485246999027B3197955'; // USDT on BSC Mainnet
const BSC_CHAIN_ID = 56;
const BSC_RPC_URL = 'https://bsc-dataseed1.binance.org:8545';

// Seed Round Configuration - 100 Tiers System
const SEED_CONFIG = {
  totalTokens: 1_000_000,
  tokensPerTier: 10_000, // 10k tokens per tier
  totalTiers: 100,
  startPrice: 0.015, // Starting price in USDT
  priceMultiplier: 0.075, // Price increase formula: startPrice × (1 + tier × multiplier)
  minPurchase: 10, // Minimum 10 USDT
  targetRaise: 7500000, // Target $7.5M USDT
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
  totalRaised: number; // in USDT
  tokensSold: number;
  currentPrice: number;
  priceIncrease: number; // percentage
  participantsCount: number;
  percentageComplete: number;
  salePaused: boolean;
  saleClosed: boolean;
}

interface VestingInfo {
  totalTokens: number;
  claimedTokens: number;
  claimableTokens: number;
  vestingStart: number;
  nextClaimTime: number;
  lockedTokens: number;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const SidebarSeedRound = memo(() => {
  const account = useActiveAccount();
  const [activeTab, setActiveTab] = useState<'purchase'>('purchase');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [estimatedTokens, setEstimatedTokens] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [recentBuys, setRecentBuys] = useState<RecentBuy[]>([]);
  const [vestingInfo, setVestingInfo] = useState<VestingInfo | null>(null);
  const [countdown, setCountdown] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [claimLoading, setClaimLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [usdtBalance, setUsdtBalance] = useState<number>(0);
  const [usdtAllowance, setUsdtAllowance] = useState<number>(0);

  // Fetch USDT balance for connected account
  useEffect(() => {
    const fetchUsdtBalance = async () => {
      if (!account?.address) {
        setUsdtBalance(0);
        return;
      }

      try {
        const provider = new ethers.JsonRpcProvider(TESTNET_RPC_URL);
        const usdtContract = new ethers.Contract(
          USDT_ADDRESS_TST,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );
        const balance = await usdtContract.balanceOf(account.address);
        setUsdtBalance(Number(ethers.formatUnits(balance, 18)));
      } catch (error) {
        console.log('Error fetching USDT balance:', error);
        setUsdtBalance(0);
      }
    };

    fetchUsdtBalance();
    const interval = setInterval(fetchUsdtBalance, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [account?.address]);

  // Mock stats data (will be fetched from contract)
  const [stats, setStats] = useState<SeedRoundStats>({
    totalRaised: 0,
    tokensSold: 0,
    currentPrice: 0.015,
    priceIncrease: 0,
    participantsCount: 0,
    percentageComplete: 0,
    salePaused: false,
    saleClosed: false,
  });

  // Calculate estimated tokens based on input amount and current price
  useEffect(() => {
    if (purchaseAmount && !isNaN(Number(purchaseAmount)) && stats.currentPrice > 0) {
      const tbnbAmount = Number(purchaseAmount);
      // Use current price from contract stats
      const tokens = tbnbAmount / stats.currentPrice;
      setEstimatedTokens(Math.floor(tokens));
      setEstimatedCost(tbnbAmount);
    } else {
      setEstimatedTokens(0);
      setEstimatedCost(0);
    }
  }, [purchaseAmount, stats.currentPrice]);

  // Fetch vesting info for connected account
  useEffect(() => {
    const fetchVestingInfo = async () => {
      if (!account?.address) {
        setVestingInfo(null);
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          SEED_ROUND_USD_ADDRESS_TST,
          [
            'function getVestingInfo(address _buyer) external view returns (uint256 totalTokens, uint256 claimedTokens, uint256 claimableTokens, uint256 vestingStart, uint256 nextClaimTime, uint256 lockedTokens)',
          ],
          provider
        );

        const info = await contract.getVestingInfo(account.address);
        
        const totalTokens = Number(ethers.formatEther(info[0]));
        const claimedTokens = Number(ethers.formatEther(info[1]));
        const claimableTokens = Number(ethers.formatEther(info[2]));
        const lockedTokensRaw = Number(ethers.formatEther(info[5]));
        // Handle dust/precision issues
        const lockedTokens = lockedTokensRaw < 0.0001 ? 0 : lockedTokensRaw;
        
        setVestingInfo({
          totalTokens,
          claimedTokens,
          claimableTokens,
          vestingStart: Number(info[3]),
          nextClaimTime: Number(info[4]),
          lockedTokens,
        });
      } catch (error) {
        console.log('No vesting info yet or error fetching:', error);
        setVestingInfo(null);
      }
    };

    fetchVestingInfo();
    const interval = setInterval(fetchVestingInfo, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [account?.address]);

  // Fetch contract stats (sale progress)
  const isFetchingStats = useRef(false);

  useEffect(() => {
    const fetchContractStats = async () => {
      if (isFetchingStats.current) return;
      isFetchingStats.current = true;

      try {
        // Use JsonRpcProvider for reliable data fetching without wallet connection
        const provider = new ethers.JsonRpcProvider(TESTNET_RPC_URL);
        const contract = new ethers.Contract(
          SEED_ROUND_USD_ADDRESS_TST,
          [
            'function tokensSold() view returns (uint256)',
            'function totalTokensForSale() view returns (uint256)',
            'function totalUSDTRaised() view returns (uint256)',
            'function getCurrentPrice() view returns (uint256)',
            'function salePaused() view returns (bool)',
            'function saleClosed() view returns (bool)',
            'event TokensPurchased(address indexed buyer, uint256 amount, uint256 price, uint256 totalCost)',
          ],
          provider
        );

        const tokensSold = await contract.tokensSold();
        const totalTokens = await contract.totalTokensForSale();
        const usdtRaised = await contract.totalUSDTRaised();
        const currentPrice = await contract.getCurrentPrice();
        const salePaused = await contract.salePaused();
        const saleClosed = await contract.saleClosed();

        const tokensSoldFormatted = Number(ethers.formatEther(tokensSold));
        const totalTokensFormatted = Number(ethers.formatEther(totalTokens));
        const usdtRaisedFormatted = Number(ethers.formatUnits(usdtRaised, 18)); // USDT has 18 decimals
        const currentPriceFormatted = Number(ethers.formatUnits(currentPrice, 18));
        
        // Calculate percentage using BigInt before converting to avoid precision loss
        const percentComplete = totalTokensFormatted > 0 
          ? (Number(tokensSold) / Number(totalTokens)) * 100 
          : 0;

        console.log('Contract Stats (Raw BigInt):', {
          tokensSold: tokensSold.toString(),
          totalTokens: totalTokens.toString(),
        });

        console.log('Contract Stats (Formatted):', {
          tokensSold: tokensSoldFormatted,
          totalTokens: totalTokensFormatted,
          usdtRaised: usdtRaisedFormatted,
          currentPrice: currentPriceFormatted,
          percentComplete
        });

        setStats(prev => ({
          ...prev,
          tokensSold: tokensSoldFormatted,
          totalRaised: usdtRaisedFormatted,
          currentPrice: currentPriceFormatted,
          percentageComplete: percentComplete,
          salePaused,
          saleClosed,
        }));

        // Fetch recent purchases using Etherscan V2 API (Unified) or Fallback to RPC
        try {
          // 1. Get the topic hash for TokensPurchased
          const iface = new ethers.Interface([
            'event TokensPurchased(address indexed buyer, uint256 amount, uint256 price, uint256 totalCost)'
          ]);
          const topic0 = ethers.id('TokensPurchased(address,uint256,uint256,uint256)');

          // 2. Construct Etherscan V2 API URL
          // Note: This requires an Etherscan V2 API Key. Old BscScan keys might not work.
          // Chain ID 97 is BSC Testnet.
          const startBlock = 74000000; 
          const apiUrl = `https://api.etherscan.io/v2/api?chainid=97&module=logs&action=getLogs&fromBlock=${startBlock}&toBlock=latest&address=${SEED_ROUND_USD_ADDRESS_TST}&topic0=${topic0}&apikey=${BSCSCAN_API_KEY}`;

          console.log('Fetching from Etherscan V2:', apiUrl);

          const response = await fetch(apiUrl);
          const data = await response.json();

          if (data.status === '1' && Array.isArray(data.result)) {
            console.log(`Etherscan V2 found ${data.result.length} logs`);
            
            const allPurchases: RecentBuy[] = data.result.reverse().slice(0, 10).map((log: any) => {
              try {
                const parsed = iface.parseLog({
                  topics: log.topics,
                  data: log.data
                });

                if (!parsed) return null;

                let timestamp = Date.now();
                if (log.timeStamp) {
                    timestamp = Number(log.timeStamp) * 1000; 
                }

                return {
                  id: log.transactionHash,
                  buyer: parsed.args[0] as string,
                  amount: Number(ethers.formatEther(parsed.args[1])),
                  price: Number(ethers.formatEther(parsed.args[2])),
                  total: Number(ethers.formatEther(parsed.args[3])),
                  timestamp: timestamp,
                  txHash: log.transactionHash,
                };
              } catch (e) {
                console.error('Error parsing log from API:', e);
                return null;
              }
            }).filter((item: any) => item !== null) as RecentBuy[];

            setRecentBuys(allPurchases);
          } else {
            console.log('Etherscan V2 returned error:', data.message, data.result);
            
            // Fallback: Gentle RPC fetch for last 2000 blocks if API fails
            if (data.message === 'NOTOK' || data.result?.includes('limit') || data.message?.includes('No records')) {
                 console.log('Falling back to gentle RPC fetch (trying multiple nodes)...');
                 
                 let logs = [];
                 let rpcSuccess = false;

                 for (const rpcUrl of FALLBACK_RPC_URLS) {
                    try {
                        console.log(`Trying RPC: ${rpcUrl}`);
                        const tempProvider = new ethers.JsonRpcProvider(rpcUrl);
                        const currentBlock = await tempProvider.getBlockNumber();
                        
                        // Try to fetch last 40,000 blocks (approx 4 hours) to catch recent user txs
                        // Public nodes might limit this, so we try the best ones first (Ankr/PublicNode)
                        const range = 40000; 
                        const fromBlock = Math.max(0, currentBlock - range);
                        
                        console.log(`Fetching logs from block ${fromBlock} to ${currentBlock} (${range} blocks)`);

                        logs = await tempProvider.getLogs({
                            address: SEED_ROUND_USD_ADDRESS_TST,
                            topics: [topic0],
                            fromBlock: fromBlock,
                            toBlock: 'latest'
                        });
                        
                        console.log(`RPC success with ${rpcUrl}, found ${logs.length} logs`);
                        rpcSuccess = true;
                        break; // Stop if successful
                    } catch (rpcError: any) {
                        console.warn(`RPC failed ${rpcUrl}:`, rpcError.message || rpcError);
                        continue; // Try next RPC
                    }
                 }

                 if (rpcSuccess) {
                    const rpcPurchases = logs.reverse().map((log: any) => {
                        try {
                            const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
                            if (!parsed) return null;
                            return {
                                id: log.transactionHash,
                                buyer: parsed.args[0] as string,
                                amount: Number(ethers.formatEther(parsed.args[1])),
                                price: Number(ethers.formatEther(parsed.args[2])),
                                total: Number(ethers.formatEther(parsed.args[3])),
                                timestamp: Date.now(), // Approximation for fallback
                                txHash: log.transactionHash,
                            };
                        } catch (e) { return null; }
                    }).filter((p: any) => p !== null) as RecentBuy[];
                    
                    if (rpcPurchases.length > 0) {
                        setRecentBuys(rpcPurchases);
                    }
                 } else {
                     console.error('All RPC fallbacks failed.');
                 }
            }
            
            if (data.message?.includes('No records found')) {
                setRecentBuys([]);
            }
          }
        } catch (error) {
          console.log('Error fetching recent purchases:', error);
        }
      } catch (error) {
        console.log('Error fetching contract stats:', error);
      } finally {
        isFetchingStats.current = false;
      }
    };

    fetchContractStats();
    const interval = setInterval(fetchContractStats, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  // Update countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      if (!vestingInfo) return;

      const now = Math.floor(Date.now() / 1000);
      const remaining = vestingInfo.nextClaimTime - now;

      if (remaining <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setCountdown({
          days: Math.floor(remaining / 86400),
          hours: Math.floor((remaining % 86400) / 3600),
          minutes: Math.floor((remaining % 3600) / 60),
          seconds: remaining % 60,
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [vestingInfo]);

  // Get current tier number based on tokens sold (0-indexed like contract)
  const getCurrentTier = (tokensSold: number): number => {
    return Math.floor(tokensSold / SEED_CONFIG.tokensPerTier);
  };

  // Get price for a specific tier (matches contract formula)
  const getPriceForTier = (tierNumber: number): number => {
    // Contract: (START_PRICE * (1000 + (currentTier * 75))) / 1000
    return SEED_CONFIG.startPrice * (1000 + tierNumber * 75) / 1000;
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
        description: "Please enter a valid purchase amount (in USDT)",
        variant: "destructive",
      });
      return;
    }

    const usdtAmount = Number(purchaseAmount);
    
    // Validate purchase limits
    if (usdtAmount < SEED_CONFIG.minPurchase) {
      toast({
        title: "Minimum Purchase",
        description: `Minimum purchase amount is ${SEED_CONFIG.minPurchase} USDT`,
        variant: "destructive",
      });
      return;
    }

    // Check sale status
    if (stats.salePaused) {
      toast({
        title: "Sale Paused",
        description: "The sale is currently paused. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    if (stats.saleClosed) {
      toast({
        title: "Sale Closed",
        description: "The sale has ended.",
        variant: "destructive",
      });
      return;
    }

    if (usdtBalance < usdtAmount) {
      toast({
        title: "Insufficient Balance",
        description: `You have ${usdtBalance} USDT, but need ${usdtAmount} USDT`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (!window.ethereum) {
        throw new Error("Ethereum provider not found");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Seed Round USD ABI
      const SEED_ROUND_USD_ABI = [
        'function buyTokens(uint256 usdtAmount) external',
      ];

      // USDT ABI
      const USDT_ABI = [
        'function approve(address spender, uint256 amount) external returns (bool)',
        'function allowance(address owner, address spender) external view returns (uint256)',
      ];

      const seedRoundContract = new ethers.Contract(
        SEED_ROUND_USD_ADDRESS_TST,
        SEED_ROUND_USD_ABI,
        signer
      );

      const usdtContract = new ethers.Contract(
        USDT_ADDRESS_TST,
        USDT_ABI,
        signer
      );

      const usdtWei = ethers.parseUnits(usdtAmount.toString(), 18);

      // Step 1: Check current allowance
      toast({
        title: "Processing",
        description: "Checking USDT allowance...",
      });

      const currentAllowance = await usdtContract.allowance(account.address, SEED_ROUND_USD_ADDRESS_TST);

      // Step 2: If insufficient, approve USDT
      if (BigInt(currentAllowance) < usdtWei) {
        setApprovalLoading(true);
        toast({
          title: "Approval Required",
          description: "Approving USDT spending. Please confirm in your wallet...",
        });

        const approveTx = await usdtContract.approve(SEED_ROUND_USD_ADDRESS_TST, usdtWei);
        await approveTx.wait();

        setApprovalLoading(false);
        toast({
          title: "Approved",
          description: "USDT approved. Proceeding with purchase...",
        });
      }

      // Step 3: Buy tokens with USDT
      toast({
        title: "Processing",
        description: "Buying SSTL tokens with USDT...",
      });

      const purchaseTx = await seedRoundContract.buyTokens(usdtWei);
      const purchaseReceipt = await purchaseTx.wait();

      if (!purchaseReceipt) {
        throw new Error("Purchase transaction failed");
      }

      const txHash = purchaseReceipt.hash;

      // Parse logs to get exact tokens purchased and price
      let tokensPurchased = 0;
      let purchasePrice = 0;

      const iface = new ethers.Interface([
        'event TokensPurchased(address indexed buyer, uint256 amount, uint256 price, uint256 totalCost)'
      ]);

      for (const log of purchaseReceipt.logs) {
        try {
          const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
          if (parsed && parsed.name === 'TokensPurchased') {
            tokensPurchased = Number(ethers.formatEther(parsed.args.amount));
            purchasePrice = Number(ethers.formatUnits(parsed.args.price, 18));
            break;
          }
        } catch (e) {
          // Ignore logs that don't match
        }
      }

      // Fallback if log parsing fails
      if (tokensPurchased === 0) {
         console.warn("Could not parse TokensPurchased event, using estimation");
         tokensPurchased = (usdtAmount / stats.currentPrice); 
         purchasePrice = stats.currentPrice;
      }

      // Add to recent buys
      const newBuy: RecentBuy = {
        id: txHash,
        buyer: account.address,
        amount: tokensPurchased,
        price: purchasePrice,
        total: usdtAmount,
        timestamp: Date.now(),
        txHash: txHash,
      };

      setRecentBuys(prev => [newBuy, ...prev.slice(0, 9)]);

      // Update stats from contract
      setStats(prev => ({
        ...prev,
        totalRaised: prev.totalRaised + usdtAmount,
        tokensSold: prev.tokensSold + tokensPurchased,
        participantsCount: prev.participantsCount + 1,
        currentPrice: purchasePrice 
      }));

      toast({
        title: "Purchase Successful! 🎉",
        description: `You purchased ${tokensPurchased.toLocaleString(undefined, {maximumFractionDigits: 2})} SSTL tokens for ${usdtAmount} USDT. Tokens are locked and will vest over time.`,
      });

      setPurchaseAmount('');
      setEstimatedTokens(0);
      setEstimatedCost(0);

      // Clear any errors from console
      setTimeout(() => {
        // Refresh vesting info to show new purchase
        setVestingInfo(null);
      }, 1000);

    } catch (error: any) {
      console.error('Purchase error:', error);

      let errorDescription = "An error occurred during your purchase. Please try again.";
      if (error.message?.includes("user rejected")) {
        errorDescription = "Transaction rejected by user";
      } else if (error.message?.includes("insufficient")) {
        errorDescription = "Insufficient USDT balance";
      } else if (error.message?.includes("not enough tokens")) {
        errorDescription = "Not enough tokens available in this round";
      } else if (error.message?.includes("Sale has ended")) {
        errorDescription = "Sale period has ended. The contract needs to be reconfigured by the owner.";
      } else if (error.message?.includes("Sale has not started")) {
        errorDescription = "Sale has not started yet. Please wait for the sale to begin.";
      } else if (error.message?.includes("revert")) {
        errorDescription = error.reason || "Transaction reverted. Please check contract configuration.";
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

  const handleClaimTokens = async () => {
    if (!account?.address || !vestingInfo) return;

    setClaimLoading(true);

    try {
      if (!window.ethereum) {
        throw new Error("Ethereum provider not found");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const SEED_ROUND_USD_ABI = [
        'function claimTokens() external',
      ];

      const seedRoundContract = new ethers.Contract(
        SEED_ROUND_USD_ADDRESS_TST,
        SEED_ROUND_USD_ABI,
        signer
      );

      toast({
        title: "Processing",
        description: "Claiming your vested tokens...",
      });

      const claimTx = await seedRoundContract.claimTokens();
      const claimReceipt = await claimTx.wait();

      if (!claimReceipt) {
        throw new Error("Claim transaction failed");
      }

      toast({
        title: "Tokens Claimed! ✨",
        description: `You claimed ${vestingInfo.claimableTokens.toLocaleString()} SSTLTST tokens`,
      });

      // Force refresh vesting info immediately
      setTimeout(async () => {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const contract = new ethers.Contract(
            SEED_ROUND_USD_ADDRESS_TST,
            ['function getVestingInfo(address _buyer) external view returns (uint256 totalTokens, uint256 claimedTokens, uint256 claimableTokens, uint256 vestingStart, uint256 nextClaimTime, uint256 lockedTokens)'],
            provider
          );
          const info = await contract.getVestingInfo(account.address);
          const totalTokens = Number(ethers.formatEther(info[0]));
          const claimedTokens = Number(ethers.formatEther(info[1]));
          const claimableTokens = Number(ethers.formatEther(info[2]));
          const lockedTokensRaw = Number(ethers.formatEther(info[5]));
          // Handle dust/precision issues
          const lockedTokens = lockedTokensRaw < 0.0001 ? 0 : lockedTokensRaw;
          
          setVestingInfo({
            totalTokens,
            claimedTokens,
            claimableTokens,
            vestingStart: Number(info[3]),
            nextClaimTime: Number(info[4]),
            lockedTokens,
          });
        } catch (e) {
          console.log('Error refreshing vesting info:', e);
        }
      }, 2000);

    } catch (error: any) {
      console.error('Claim error:', error);
      toast({
        title: "Claim Failed",
        description: error.message || "Failed to claim tokens",
        variant: "destructive",
      });
    } finally {
      setClaimLoading(false);
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
            src="/assets/token.webp"
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
                <li>Select your purchase amount in USDT</li>
                <li>View the number of SSTL tokens you'll receive at current price</li>
                <li>Approve USDT spending and confirm transaction</li>
                <li>Receive SSTL tokens directly in your wallet (locked with vesting)</li>
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
                <li>Minimum Purchase: ${SEED_CONFIG.minPurchase} USDT</li>
                <li>Payment Token: USDT on BSC</li>
                <li>Receipt Token: SSTL</li>
                <li>Vesting: 1-hour Cliff (Testnet), 12-month Cliff (Mainnet) + Linear Vesting</li>
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
              <span className={styles.progressPercent}>
                {stats.percentageComplete < 0.001
                  ? stats.percentageComplete.toFixed(6)
                  : stats.percentageComplete < 0.01
                  ? stats.percentageComplete.toFixed(5)
                  : stats.percentageComplete < 0.1
                  ? stats.percentageComplete.toFixed(4)
                  : stats.percentageComplete.toFixed(2)}%
              </span>
            </div>
            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBar}
                style={{ width: `${Math.max(0.5, Math.min(stats.percentageComplete, 100))}%` }}
              />
            </div>
            <div className={styles.progressFooter}>
              <span className={styles.progressTokens}>
                {stats.tokensSold.toLocaleString()} / {SEED_CONFIG.totalTokens.toLocaleString()} SSTL
              </span>
              <span className={styles.progressUsd}>
                {stats.totalRaised.toFixed(2)} USDT raised
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
                        <span>Amount to Invest (USDT - Testnet)</span>
                        <span className={styles.formHint}>Minimum: {SEED_CONFIG.minPurchase} USDT | Price: 0.015 USDT per token (increases with demand)</span>
                      </label>
                      <div className={styles.inputGroup}>
                        <DollarSign size={18} className={styles.inputPrefix} />
                        <Input
                          type="number"
                          placeholder="Enter amount in USDT"
                          value={purchaseAmount}
                          onChange={(e) => setPurchaseAmount(e.target.value)}
                          className={styles.formInput}
                          min={SEED_CONFIG.minPurchase.toString()}
                          step="1"
                          disabled={isLoading || approvalLoading}
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
                          <span className={styles.estimateLabel}>Exchange Rate:</span>
                          <span className={styles.estimateValue}>1 token = ${stats.currentPrice.toFixed(4)} USDT</span>
                        </div>
                        <div className={styles.estimateRow}>
                          <span className={styles.estimateLabel}>You Send:</span>
                          <span className={styles.estimateValue}>{purchaseAmount} USDT</span>
                        </div>
                        <div className={styles.estimateRow}>
                          <span className={styles.estimateLabel}>You Receive:</span>
                          <span className={`${styles.estimateValue} text-green-400`}>
                            {estimatedTokens.toLocaleString()} SSTLTST
                          </span>
                        </div>
                        <div className={`${styles.estimateRow} ${styles.estimateTotal}`}>
                          <span className={styles.estimateLabel}>Total Cost:</span>
                          <span className={styles.estimateValue}>{purchaseAmount} USDT</span>
                        </div>
                      </motion.div>
                    )}

                    <div className={styles.purchaseInfo}>
                      <Info size={16} />
                      <p>
                        Tokens are locked upon purchase. You'll be able to claim them after the cliff period (1 hour on testnet, 12 months on mainnet). Vesting is linear over 2 hours (testnet) or 18 months (mainnet).
                      </p>
                    </div>

                    <Button
                      onClick={handlePurchase}
                      disabled={isLoading || approvalLoading || !purchaseAmount || Number(purchaseAmount) <= 0}
                      className={styles.purchaseButton}
                      size="lg"
                    >
                      {isLoading || approvalLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="inline-block mr-2"
                          >
                            <Zap size={18} />
                          </motion.div>
                          {approvalLoading ? 'Approving USDT...' : 'Processing...'}
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

                    {/* Vesting Status Section */}
                    {account?.address && vestingInfo && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          marginTop: '1.5rem',
                          padding: '1rem',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                        }}
                      >
                        <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Lock size={16} />
                          Your Vesting Schedule
                        </h4>

                        {/* Status Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                          <div style={{
                            padding: '0.75rem',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            textAlign: 'center',
                          }}>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.25rem' }}>
                              Total Purchased
                            </div>
                            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff' }}>
                              {vestingInfo.totalTokens.toLocaleString()}
                            </div>
                          </div>
                          <div style={{
                            padding: '0.75rem',
                            borderRadius: '8px',
                            background: 'rgba(34, 197, 94, 0.1)',
                            textAlign: 'center',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                          }}>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(34, 197, 94, 0.8)', marginBottom: '0.25rem' }}>
                              Claimable Now
                            </div>
                            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#22c55e' }}>
                              {vestingInfo.claimableTokens.toLocaleString()}
                            </div>
                          </div>
                          <div style={{
                            padding: '0.75rem',
                            borderRadius: '8px',
                            background: 'rgba(249, 115, 22, 0.1)',
                            textAlign: 'center',
                            border: '1px solid rgba(249, 115, 22, 0.3)',
                          }}>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(249, 115, 22, 0.8)', marginBottom: '0.25rem' }}>
                              Still Locked
                            </div>
                            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#f97316' }}>
                              {Math.max(0, vestingInfo.lockedTokens).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Countdown Timer */}
                        {vestingInfo.claimableTokens === 0 && countdown && (
                          <div style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            background: 'rgba(168, 85, 247, 0.1)',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            marginBottom: '1rem',
                            textAlign: 'center',
                          }}>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>
                              Cliff Ends In
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#a855f7' }}>
                                  {countdown.days}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)' }}>Days</span>
                              </div>
                              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>:</span>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#a855f7' }}>
                                  {countdown.hours}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)' }}>Hours</span>
                              </div>
                              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>:</span>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#a855f7' }}>
                                  {countdown.minutes}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)' }}>Minutes</span>
                              </div>
                              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>:</span>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#a855f7' }}>
                                  {countdown.seconds}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)' }}>Seconds</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Claim Button */}
                        <Button
                          onClick={handleClaimTokens}
                          disabled={claimLoading || vestingInfo.claimableTokens === 0}
                          style={{
                            width: '100%',
                            background: vestingInfo.claimableTokens === 0
                              ? 'rgba(107, 114, 128, 0.5)'
                              : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            borderColor: vestingInfo.claimableTokens === 0 ? 'rgba(107, 114, 128, 0.3)' : undefined,
                          }}
                          size="sm"
                        >
                          {claimLoading ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="inline-block mr-2"
                              >
                                <Zap size={16} />
                              </motion.div>
                              Claiming...
                            </>
                          ) : vestingInfo.claimableTokens === 0 ? (
                            <>
                              <Lock size={16} className="mr-2" />
                              Locked (Cliff Active)
                            </>
                          ) : (
                            <>
                              <CheckCircle size={16} className="mr-2" />
                              Claim {vestingInfo.claimableTokens.toLocaleString()} Tokens
                            </>
                          )}
                        </Button>

                        <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.75rem', textAlign: 'center' }}>
                          You can claim vested tokens at any time. Unclaimed tokens accumulate.
                        </div>
                      </motion.div>
                    )}
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

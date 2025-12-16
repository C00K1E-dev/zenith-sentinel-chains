import { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Gift, 
  CheckCircle2, 
  Circle, 
  Twitter, 
  MessageCircle, 
  Heart, 
  Users, 
  Coins,
  Shield,
  ExternalLink,
  Award,
  TrendingUp,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { useActiveAccount } from 'thirdweb/react';
import { getContract, readContract } from 'thirdweb';
import { createThirdwebClient } from 'thirdweb';
import { bsc } from 'thirdweb/chains';
import { useAccount, useConnectorClient } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { VerificationDialog } from '@/components/VerificationDialog';
import { RegistrationForm } from '@/components/RegistrationForm';
import {
  verifyTwitterFollow,
  verifyTwitterLikes,
  verifyTwitterTags,
  verifyTelegramJoin,
  verifyNFTMint,
  recordTaskCompletion,
  claimTokens,
  generateClaimSignature,
  checkClaimStatus,
} from '@/utils/taskVerification';
import {
  getUserProgress,
  completeTask as completeTaskBackend,
  checkTelegramAvailability,
  getLeaderboard as getLeaderboardBackend,
} from '@/services/airdropApi';
import {
  GENESIS_CONTRACT_ADDRESS,
  AI_AUDIT_CONTRACT_ADDRESS,
  GENESIS_ABI,
  AI_AUDIT_ABI,
} from '@/contracts';
import styles from './sidebarAirdrop.module.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const thirdwebClient = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

// Helper function to detect if wallet is MetaMask
const detectMetaMaskWallet = (): boolean => {
  if (typeof window === 'undefined') return false;
  const { ethereum } = window as any;
  
  // Check for MetaMask on desktop
  if (ethereum?.isMetaMask === true) return true;
  
  // Check for MetaMask mobile in-app browser
  // MetaMask mobile sets specific user agent
  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent || '';
    if (userAgent.includes('MetaMask')) return true;
  }
  
  // Additional check for injected provider
  if (ethereum?.providers) {
    return ethereum.providers.some((provider: any) => provider.isMetaMask);
  }
  
  return false;
};

interface Task {
  id: string;
  name: string;
  description: string;
  points: number;
  icon: React.ComponentType<{ size?: string | number; className?: string }>;
  completed: boolean;
  type: 'social' | 'nft' | 'engagement';
  actionUrl?: string;
  requiresVerification?: boolean;
}

interface LeaderboardEntry {
  rank: number;
  address: string;
  points: number;
  tasksCompleted: number;
}

const SidebarAirdrop = memo(() => {
  const account = useActiveAccount();
  const { connector } = useAccount();
  const [userPoints, setUserPoints] = useState(0);
  const [isMetaMaskWallet, setIsMetaMaskWallet] = useState(false);
  const [metaMaskBonusApplied, setMetaMaskBonusApplied] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'connect-metamask',
      name: 'Connect MetaMask Wallet',
      description: 'Connect with MetaMask wallet (desktop or mobile) to unlock an exclusive bonus and earn extra points',
      points: 10,
      icon: Sparkles,
      completed: false,
      type: 'social',
      requiresVerification: false,
    },
    {
      id: 'fill-form',
      name: 'Fill Registration Form',
      description: 'Complete the registration form with your wallet address, X handle, and Telegram handle to be eligible for token claim on TGE',
      points: 10,
      icon: ClipboardList,
      completed: false,
      type: 'social',
      requiresVerification: false,
    },
    {
      id: 'follow-x',
      name: 'Follow on X (Twitter)',
      description: 'Follow @SmartSentinels_ on X',
      points: 10,
      icon: Twitter,
      completed: false,
      type: 'social',
      actionUrl: 'https://twitter.com/SmartSentinels_',
      requiresVerification: true,
    },
    {
      id: 'telegram-community',
      name: 'Join Telegram Community',
      description: 'Join our official Telegram group and submit for verification',
      points: 10,
      icon: MessageCircle,
      completed: false,
      type: 'social',
      actionUrl: 'https://t.me/SmartSentinelsCommunity',
      requiresVerification: true,
    },
    {
      id: 'like-post',
      name: 'Like and Repost on X',
      description: 'Like our recent post on X and submit for verification',
      points: 5,
      icon: Heart,
      completed: false,
      type: 'social',
      actionUrl: 'https://x.com/SmartSentinels_/status/2000594304646222122?s=20',
      requiresVerification: true,
    },
    {
      id: 'tag-friends',
      name: 'Tag 3 Friends',
      description: 'Tag 3 friends in our latest X post',
      points: 15,
      icon: Users,
      completed: false,
      type: 'engagement',
      actionUrl: 'https://x.com/SmartSentinels_/status/2000594304646222122?s=20',
      requiresVerification: true,
    },
    {
      id: 'mint-genesis',
      name: 'Mint Genesis NFT',
      description: 'Mint an NFT from the Genesis Collection',
      points: 50,
      icon: Sparkles,
      completed: false,
      type: 'nft',
      requiresVerification: false,
    },
    {
      id: 'mint-audit',
      name: 'Mint AI Audit NFT',
      description: 'Mint an NFT from the AI Audit Collection',
      points: 30,
      icon: Shield,
      completed: false,
      type: 'nft',
      requiresVerification: false,
    },
  ]);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const [isClaiming, setIsClaiming] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'leaderboard'>('tasks');
  const [registrationFormOpen, setRegistrationFormOpen] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<string[]>([]); // Track tasks pending manual verification
  const [rejectedTasks, setRejectedTasks] = useState<string[]>([]); // Track tasks that were rejected
  const [approvedTasks, setApprovedTasks] = useState<string[]>([]); // Track tasks that were approved (to show approved message once)
  const [processedApprovals, setProcessedApprovals] = useState<Set<number>>(new Set()); // Track which approval IDs we've already processed
  const [genesisNFTBalance, setGenesisNFTBalance] = useState<number>(0);
  const [aiAuditNFTBalance, setAiAuditNFTBalance] = useState<number>(0);
  const [checkingNFTs, setCheckingNFTs] = useState(false);
  const [verificationDialog, setVerificationDialog] = useState<{
    open: boolean;
    taskId: string;
    taskName: string;
    taskType: 'twitter-follow' | 'twitter-likes' | 'twitter-tags' | 'telegram';
    actionUrl?: string;
  }>({
    open: false,
    taskId: '',
    taskName: '',
    taskType: 'twitter-follow',
  });

  // Memoize NFT contracts
  const genesisContract = useMemo(() => 
    getContract({ 
      client: thirdwebClient, 
      address: GENESIS_CONTRACT_ADDRESS, 
      chain: bsc 
    }), []);

  const aiAuditContract = useMemo(() => 
    getContract({ 
      client: thirdwebClient, 
      address: AI_AUDIT_CONTRACT_ADDRESS, 
      chain: bsc 
    }), []);

  // Check NFT balances when wallet connects
  useEffect(() => {
    const checkNFTBalances = async () => {
      if (!account?.address) {
        setGenesisNFTBalance(0);
        setAiAuditNFTBalance(0);
        return;
      }

      setCheckingNFTs(true);
      try {
        // Check Genesis NFT balance
        try {
          const genesisBalance = await readContract({
            contract: genesisContract,
            method: 'function balanceOf(address owner) view returns (uint256)',
            params: [account.address],
          });
          setGenesisNFTBalance(Number(genesisBalance));
        } catch (error) {
          console.error('Error checking Genesis NFT:', error);
          setGenesisNFTBalance(0);
        }

        // Check AI Audit NFT balance
        try {
          const auditBalance = await readContract({
            contract: aiAuditContract,
            method: 'function balanceOf(address owner) view returns (uint256)',
            params: [account.address],
          });
          setAiAuditNFTBalance(Number(auditBalance));
        } catch (error) {
          console.error('Error checking AI Audit NFT:', error);
          setAiAuditNFTBalance(0);
        }
      } finally {
        setCheckingNFTs(false);
      }
    };

    checkNFTBalances();
  }, [account?.address, genesisContract, aiAuditContract]);

  // Detect MetaMask wallet and apply bonus
  useEffect(() => {
    if (!account?.address) {
      setIsMetaMaskWallet(false);
      setMetaMaskBonusApplied(false);
      return;
    }

    // Check if MetaMask is the connected wallet (desktop or mobile)
    const isMetaMask = 
      connector?.name === 'MetaMask' || 
      connector?.name?.toLowerCase().includes('metamask') ||
      detectMetaMaskWallet();
    
    console.log('[METAMASK] Detection:', { 
      connectorName: connector?.name, 
      detectResult: detectMetaMaskWallet(), 
      isMetaMask,
      userAgent: navigator.userAgent,
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    });
    
    setIsMetaMaskWallet(isMetaMask);

    // Apply MetaMask bonus if applicable and not yet applied
    if (isMetaMask && !metaMaskBonusApplied) {
      const savedBonus = localStorage.getItem(`metamask_bonus_${account.address}`);
      if (!savedBonus) {
        console.log('MetaMask detected! Adding 10 bonus points...');
        
        // Call completeTask which handles backend persistence
        // Wrap in try-catch to handle mobile errors gracefully
        (async () => {
          try {
            await completeTask('connect-metamask', 10);
            
            setMetaMaskBonusApplied(true);
            localStorage.setItem(`metamask_bonus_${account.address}`, 'true');
            
            toast({
              title: "MetaMask Bonus! 🦊",
              description: "You received 10 bonus points for connecting with MetaMask!",
            });
          } catch (error) {
            console.error('[METAMASK] Error auto-applying bonus:', error);
            // Don't block the user, just log the error
            // They can manually click "Complete" on the task
          }
        })();
      } else {
        setMetaMaskBonusApplied(true);
        // Mark the task as completed if bonus was already applied
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === 'connect-metamask' ? { ...task, completed: true } : task
          )
        );
      }
    }
  }, [account?.address, connector?.name, metaMaskBonusApplied]);

  // Load user progress from backend and localStorage
  useEffect(() => {
    if (account?.address) {
      loadUserProgress();
      checkPendingVerifications();
    }
  }, [account?.address, genesisNFTBalance, aiAuditNFTBalance]);

  // Automatically check for pending/rejected verifications every 5 seconds
  useEffect(() => {
    if (!account?.address) return;

    const intervalId = setInterval(() => {
      checkPendingVerifications();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [account?.address]);

  // Load leaderboard data from backend
  useEffect(() => {
    const loadLeaderboard = async () => {
      setLeaderboardLoading(true);
      try {
        const data = await getLeaderboardBackend(10);
        setLeaderboard(data);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
        setLeaderboard([]);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    loadLeaderboard();
    
    // Refresh leaderboard every 30 seconds
    const intervalId = setInterval(loadLeaderboard, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Check for pending verifications
  const checkPendingVerifications = async () => {
    if (!account?.address) return;
    
    const adminKey = import.meta.env.VITE_ADMIN_KEY || '006046';
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/pending-verifications?adminKey=${adminKey}`);
      const data = await response.json();
      
      if (data.success) {
        const userVerifications = data.data
          .filter((v: any) => 
            v.wallet_address.toLowerCase() === account.address.toLowerCase()
          );
        
        // Check for approved verifications (only process new ones)
        const approved = userVerifications.filter((v: any) => 
          v.status === 'approved' && !processedApprovals.has(v.id)
        );
        
        if (approved.length > 0) {
          // Mark these approvals as processed
          setProcessedApprovals(prev => {
            const newSet = new Set(prev);
            approved.forEach((v: any) => newSet.add(v.id));
            return newSet;
          });
          
          // Add to approved tasks state (badge stays until page refresh)
          const approvedTaskIds = approved.map((v: any) => v.task_id);
          setApprovedTasks(prev => {
            const newApproved = approvedTaskIds.filter(id => !prev.includes(id));
            return [...prev, ...newApproved];
          });
          
          // Remove from pending/rejected state immediately
          setPendingTasks(prev => prev.filter(id => !approvedTaskIds.includes(id)));
          setRejectedTasks(prev => prev.filter(id => !approvedTaskIds.includes(id)));
          
          // Reload progress to update points and mark as completed
          await loadUserProgress();
        }
        
        // Track rejected verifications (don't show toast, just update state)
        const rejected = userVerifications.filter((v: any) => v.status === 'rejected');
        const newRejectedTaskIds = rejected.map((v: any) => v.task_id);
        
        // Add to existing rejected tasks (don't replace, just add new ones)
        if (newRejectedTaskIds.length > 0) {
          setRejectedTasks(prev => {
            const combined = [...prev, ...newRejectedTaskIds];
            return [...new Set(combined)]; // Remove duplicates
          });
          
          // Remove from pending tasks
          setPendingTasks(prev => prev.filter(id => !newRejectedTaskIds.includes(id)));
        }
        
        // Delete rejected verifications from backend so they don't accumulate
        if (rejected.length > 0) {
          rejected.forEach(async (v: any) => {
            await fetch(`${API_BASE_URL}/admin/reject-verification`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ verificationId: v.id })
            });
          });
        }
        
        // Set pending tasks (excluding rejected ones)
        const userPending = userVerifications
          .filter((v: any) => v.status === 'pending')
          .map((v: any) => v.task_id);
        
        setPendingTasks(userPending);
      }
    } catch (error) {
      console.error('Error checking pending verifications:', error);
    }
  };

  const loadUserProgress = async () => {
    if (!account?.address) return;

    try {
      // Try to load from backend first
      const backendData = await getUserProgress(account.address);
      
      if (backendData) {
        // Use backend data (even if points = 0, meaning reset happened)
        setUserPoints(backendData.points);
        setTasks(prevTasks =>
          prevTasks.map(task =>
            backendData.completedTasks.includes(task.id) ? { ...task, completed: true } : { ...task, completed: false }
          )
        );
        
        // Check registration status from backend OR localStorage
        const isFormComplete = backendData.completedTasks.includes('fill-form');
        const registrationData = localStorage.getItem(`airdrop_registration_${account.address}`);
        const hasLocalRegistration = registrationData ? JSON.parse(registrationData) : null;
        
        // User is registered if either the form task is complete OR localStorage has registration data
        if (isFormComplete || (hasLocalRegistration?.xHandle && hasLocalRegistration?.telegramHandle)) {
          setIsRegistered(true);
        } else {
          setIsRegistered(false);
        }
        
        // Auto-verify NFT tasks if user has NFTs but hasn't completed the tasks yet
        if (genesisNFTBalance > 0 && !backendData.completedTasks.includes('mint-genesis')) {
          console.log('Auto-verifying Genesis NFT...');
          handleNFTVerification('mint-genesis');
        }
        if (aiAuditNFTBalance > 0 && !backendData.completedTasks.includes('mint-audit')) {
          console.log('Auto-verifying AI Audit NFT...');
          handleNFTVerification('mint-audit');
        }
        
        // Clear approved/rejected/pending states if reset (points = 0 and no tasks)
        if (backendData.points === 0 && backendData.completedTasks.length === 0) {
          setApprovedTasks([]);
          setRejectedTasks([]);
          setPendingTasks([]);
          setProcessedApprovals(new Set());
        }
        
        // Also save to localStorage as backup
        saveProgressLocal(backendData.points, backendData.completedTasks);
        console.log('Loaded progress from backend:', backendData);
      } else {
        // Fallback to localStorage
        const savedProgress = localStorage.getItem(`airdrop_progress_${account.address}`);
        if (savedProgress) {
          try {
            const { points, completedTasks } = JSON.parse(savedProgress);
            setUserPoints(points);
            setTasks(prevTasks =>
              prevTasks.map(task =>
                completedTasks.includes(task.id) ? { ...task, completed: true } : task
              )
            );
            console.log('Loaded progress from localStorage:', { points, completedTasks });
          } catch (error) {
            console.error('Error parsing localStorage:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  // Save progress to localStorage (backup)
  const saveProgressLocal = (points: number, completedTaskIds: string[]) => {
    if (account?.address) {
      const progressData = {
        points,
        completedTasks: completedTaskIds,
        timestamp: Date.now(),
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(
        `airdrop_progress_${account.address}`,
        JSON.stringify(progressData)
      );
    }
  };

  // Reset progress for testing (DEV MODE ONLY)
  const handleResetProgress = async () => {
    if (!account?.address) return;
    
    const confirmed = window.confirm('⚠️ DEV MODE: Reset all progress? This will clear all completed tasks and points.');
    if (!confirmed) return;

    try {
      // Clear localStorage
      localStorage.removeItem(`airdrop_progress_${account.address}`);
      
      // Reset backend via API
      const response = await fetch(`${API_BASE_URL}/user/${account.address}`, {
        method: 'DELETE',
      });
      
      // Reset UI state
      setUserPoints(0);
      setTasks(prevTasks => prevTasks.map(task => ({ ...task, completed: false })));
      
      toast({
        title: "Progress Reset",
        description: "All tasks and points have been reset. Refresh the page.",
      });
      
      // Reload after a moment
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Reset error:', error);
      toast({
        title: "Reset Failed",
        description: "Could not reset progress. Try manually clearing localStorage.",
        variant: "destructive",
      });
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    console.log('handleTaskComplete called with:', taskId);
    const task = tasks.find(t => t.id === taskId);
    console.log('Task found:', task);
    if (!task || task.completed) return;

    if (!account?.address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to complete tasks",
        variant: "destructive",
      });
      return;
    }

    // Special handling for registration form - open modal
    if (taskId === 'fill-form') {
      console.log('Opening registration form modal');
      setRegistrationFormOpen(true);
      return;
    }

    // CHECK REGISTRATION: All other tasks require registration with X and Telegram handles
    if (taskId !== 'fill-form' && !isRegistered) {
      toast({
        title: "Registration Required 📋",
        description: "You must complete the registration form with your X and Telegram handles before completing other tasks.",
        variant: "destructive",
      });
      // Open registration form
      setRegistrationFormOpen(true);
      return;
    }

    // Special handling for Telegram - open verification dialog
    if (taskId === 'telegram-community') {
      setVerificationDialog({
        open: true,
        taskId: task.id,
        taskName: task.name,
        taskType: 'telegram',
        actionUrl: task.actionUrl,
      });
      return;
    }

    // Special handling for Like Post - open verification dialog for manual approval
    if (taskId === 'like-post') {
      setVerificationDialog({
        open: true,
        taskId: task.id,
        taskName: task.name,
        taskType: 'twitter-likes',
        actionUrl: task.actionUrl,
      });
      return;
    }

    // Special handling for Connect MetaMask
    if (taskId === 'connect-metamask') {
      try {
        if (isMetaMaskWallet) {
          if (!task.completed) {
            // Wait for backend confirmation before showing success
            const success = await completeTask('connect-metamask', 10);
            
            if (success) {
              setMetaMaskBonusApplied(true);
              localStorage.setItem(`metamask_bonus_${account.address}`, 'true');
              toast({
                title: "MetaMask Bonus! 🦊",
                description: "You received 10 bonus points for connecting with MetaMask!",
              });
            } else {
              toast({
                title: "Error",
                description: "Failed to claim MetaMask bonus. Please try again.",
                variant: "destructive",
              });
            }
          } else {
            toast({
              title: "Already Completed",
              description: "You have already claimed the MetaMask bonus.",
            });
          }
        } else {
          toast({
            title: "MetaMask Required",
            description: "Please connect using MetaMask to claim this bonus.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('[METAMASK] Error claiming bonus:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to claim MetaMask bonus. Please try again.",
          variant: "destructive",
        });
      }
      return;
    }

    // For NFT tasks, verify directly on-chain
    if (task.type === 'nft') {
      handleNFTVerification(taskId);
      return;
    }

    // For social tasks (Twitter only), open verification dialog
    if (task.requiresVerification) {
      let taskType: 'twitter-follow' | 'twitter-likes' | 'twitter-tags' | 'telegram' = 'twitter-follow';
      
      if (taskId === 'follow-x') taskType = 'twitter-follow';
      else if (taskId === 'like-post') taskType = 'twitter-likes';
      else if (taskId === 'tag-friends') taskType = 'twitter-tags';

      setVerificationDialog({
        open: true,
        taskId: task.id,
        taskName: task.name,
        taskType,
        actionUrl: task.actionUrl,
      });
    }
  };

  const handleNFTVerification = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !account?.address) return;

    toast({
      title: "Verifying NFT...",
      description: "Checking your wallet for NFT ownership",
    });

    const collectionType = taskId === 'mint-genesis' ? 'genesis' : 'audit';
    const result = await verifyNFTMint(account.address, collectionType);

    if (result.verified) {
      completeTask(taskId, task.points);
      toast({
        title: "Task Completed! 🎉",
        description: result.message,
      });
    } else {
      toast({
        title: "Verification Failed",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handleSocialVerification = async (username: string, additionalData?: any) => {
    const { taskId, taskType } = verificationDialog;
    const task = tasks.find(t => t.id === taskId);
    if (!task || !account?.address) return false;

    // Check if task is already completed
    if (task.completed) {
      toast({
        title: "Already Completed",
        description: "You have already completed this task!",
        variant: "destructive",
      });
      return false;
    }

    let result;

    try {
      switch (taskType) {
        case 'twitter-follow':
          result = await verifyTwitterFollow(account.address, username);
          break;
        case 'twitter-likes':
          result = await verifyTwitterLikes(account.address, username);
          break;
        case 'twitter-tags':
          result = await verifyTwitterTags(account.address, username, additionalData?.tweetUrl, additionalData?.taggedFriends);
          break;
        case 'telegram':
          // Submit for manual verification
          result = await verifyTelegramJoin(account.address, username);
          break;
        default:
          return false;
      }

      if (result.verified) {
        completeTask(taskId, task.points);
        toast({
          title: "Task Completed! 🎉",
          description: `You earned ${task.points} points!`,
        });
        return true;
      } else if (result.pending) {
        // Add to pending tasks
        setPendingTasks(prev => [...prev, taskId]);
        
        // Pending manual verification
        toast({
          title: "Verification Pending ⏳",
          description: result.message || "Your verification request is pending admin review. You'll receive points once approved!",
          duration: 6000,
        });
        return true; // Close dialog
      } else {
        toast({
          title: "Verification Failed",
          description: result.message,
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during verification",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleRegistrationSuccess = async () => {
    // Update registration state
    setIsRegistered(true);
    // Mark the registration form task as complete
    completeTask('fill-form', 10);
  };

  const completeTask = async (taskId: string, points: number, telegramUserId?: string): Promise<boolean> => {
    if (!account?.address) return false;

    // For non-Telegram tasks, save to backend
    if (taskId !== 'join-telegram') {
      const task = tasks.find(t => t.id === taskId);
      const taskName = task?.name || taskId;
      
      const backendResult = await completeTaskBackend(
        account.address,
        taskId,
        points,
        telegramUserId,
        taskName
      );

      if (!backendResult.success) {
        // Check if error is due to registration requirement
        if (backendResult.error === 'Registration required') {
          toast({
            title: "Registration Required 📋",
            description: backendResult.message || "Please complete the registration form with your X and Telegram handles first.",
            variant: "destructive",
          });
          setRegistrationFormOpen(true);
          return false;
        }
        
        toast({
          title: "Error",
          description: backendResult.error || "Failed to save progress",
          variant: "destructive",
        });
        return false;
      }

      // Use backend data to update state (source of truth)
      if (backendResult.data) {
        setUserPoints(backendResult.data.points);
        setTasks(prevTasks => prevTasks.map(t => 
          backendResult.data!.completedTasks.includes(t.id) ? { ...t, completed: true } : t
        ));
        saveProgressLocal(backendResult.data.points, backendResult.data.completedTasks);
        return true;
      }
    }

    // Fallback: Mark task as completed locally if backend didn't return data
    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, completed: true } : t
    );
    // Use functional update to avoid stale state
    setUserPoints(prevPoints => {
      const newPoints = prevPoints + points;
      const completedTaskIds = updatedTasks.filter(t => t.completed).map(t => t.id);
      saveProgressLocal(newPoints, completedTaskIds);
      return newPoints;
    });
    setTasks(updatedTasks);
    return true;
  };

  const handleClaimTokens = async () => {
    if (!account?.address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to claim tokens",
        variant: "destructive",
      });
      return;
    }

    if (userPoints < 100) {
      toast({
        title: "Insufficient Points",
        description: "You need at least 100 points to claim SSTL tokens",
        variant: "destructive",
      });
      return;
    }

    setIsClaiming(true);

    try {
      // 1. Check if user already claimed
      const claimStatus = await checkClaimStatus(account.address);
      if (claimStatus.hasClaimed) {
        toast({
          title: "Already Claimed",
          description: "You have already claimed your SSTL tokens for this campaign",
          variant: "destructive",
        });
        setIsClaiming(false);
        return;
      }

      // 2. Generate signature to prove wallet ownership
      const message = `Claim SSTL Airdrop Tokens\nWallet: ${account.address}\nPoints: ${userPoints}\nTimestamp: ${Date.now()}`;
      const signature = await generateClaimSignature(account.address, message);

      if (!signature) {
        toast({
          title: "Signature Required",
          description: "You must sign the message to verify wallet ownership",
          variant: "destructive",
        });
        setIsClaiming(false);
        return;
      }

      // 3. Submit claim to backend
      const claimResult = await claimTokens(account.address, userPoints, signature);

      if (!claimResult.success) {
        toast({
          title: "Claim Failed",
          description: claimResult.message,
          variant: "destructive",
        });
        setIsClaiming(false);
        return;
      }

      // 4. Open MetaMask Portfolio or claim URL
      if (claimResult.claimData?.claimUrl) {
        window.open(claimResult.claimData.claimUrl, '_blank');
        
        toast({
          title: "Claim Submitted! 🎉",
          description: `Opening claim page. You will receive ${claimResult.claimData.amount} SSTL tokens.`,
        });

        // 5. Reset user points after successful claim
        setUserPoints(0);
        saveProgressLocal(0, tasks.filter(t => t.completed).map(t => t.id));
      }
      
    } catch (error) {
      console.error('Claim error:', error);
      toast({
        title: "Claim Failed",
        description: "An error occurred while claiming tokens. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const completedTasksCount = useMemo(
    () => tasks.filter(t => t.completed).length,
    [tasks]
  );

  const totalPossiblePoints = useMemo(
    () => tasks.reduce((sum, task) => sum + task.points, 0),
    [tasks]
  );

  const progressPercentage = useMemo(
    () => (userPoints / totalPossiblePoints) * 100,
    [userPoints, totalPossiblePoints]
  );

  const userRank = useMemo(() => {
    if (!account?.address || userPoints === 0) return null;
    const sortedBoard = [...leaderboard, { 
      rank: 0, 
      address: account.address, 
      points: userPoints, 
      tasksCompleted: completedTasksCount 
    }].sort((a, b) => b.points - a.points);
    
    const userIndex = sortedBoard.findIndex(
      entry => entry.address.toLowerCase() === account.address.toLowerCase()
    );
    return userIndex >= 0 ? userIndex + 1 : null;
  }, [account?.address, userPoints, completedTasksCount, leaderboard]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <div className={styles.headerContent}>
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
            <Gift className="text-primary" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                SSTL Airdrop Campaign
              </span>
            </h1>
            <p className="text-xs text-foreground">Complete tasks to earn points and claim SSTL tokens</p>
          </div>
        </div>
      </motion.div>

      {/* Info Section - Campaign Details */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className={styles.infoCard}>
          <CardContent className="pt-6">
            <div className={styles.metamaskInfo} style={{ padding: '1rem', background: 'linear-gradient(to right, hsl(var(--primary) / 0.1), hsl(var(--secondary) / 0.1), hsl(var(--accent) / 0.1))', borderRadius: '8px', border: '1px solid hsl(var(--primary) / 0.3)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <img 
                src="/assets/MetaMask-icon-fox.svg" 
                alt="MetaMask" 
                style={{ width: '48px', height: '48px', flexShrink: 0, marginTop: '0.25rem' }}
              />
              <div style={{ flex: 1 }}>
                <p className={styles.infoText} style={{ marginBottom: '0.75rem' }}>
                  <strong>🎉 Activation Campaign:</strong> This exclusive campaign is brought to you by{' '}
                  <a 
                    href="https://www.themiracle.io/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.infoLink}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', pointerEvents: 'auto', cursor: 'pointer' }}
                  >
                    theMiracle
                    <ExternalLink size={12} />
                  </a>
                  . Complete tasks to earn points and claim SSTL tokens at the end of the campaign!
                </p>
                <p className={styles.infoText} style={{ marginBottom: 0 }}>
                  <strong>MetaMask Bonus:</strong> Connect with MetaMask to receive{' '}
                  <strong>instant +10 bonus points</strong>! The more points you earn, the more tokens you can claim.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Registration Status Warning */}
      {!isRegistered && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={styles.infoCard} style={{ borderColor: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.05)' }}>
            <CardContent className="pt-6">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>⚠️</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 'bold', color: '#991b1b', marginBottom: '0.5rem' }}>
                    Registration Required
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#7f1d1d', marginBottom: '0.75rem' }}>
                    You must complete the <strong>"Fill Registration Form"</strong> task with your X (Twitter) handle and Telegram handle before you can earn points on other tasks. This ensures all participants are verified and eligible for token claims.
                  </p>
                  <Button
                    onClick={() => setRegistrationFormOpen(true)}
                    size="sm"
                    style={{ backgroundColor: '#dc2626', color: 'white' }}
                  >
                    Complete Registration Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* User Stats Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className={styles.statsCard}>
          <CardContent className="pt-6">
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <Coins className={styles.statIcon} size={24} />
                <div>
                  <p className={styles.statLabel}>Your Points</p>
                  <p className={styles.statValue}>{userPoints.toLocaleString()}</p>
                </div>
              </div>
              <div className={styles.statItem}>
                <CheckCircle2 className={styles.statIcon} size={24} />
                <div>
                  <p className={styles.statLabel}>Tasks Completed</p>
                  <p className={styles.statValue}>{completedTasksCount}/{tasks.length}</p>
                </div>
              </div>
              {userRank && (
                <div className={styles.statItem}>
                  <Trophy className={styles.statIcon} size={24} />
                  <div>
                    <p className={styles.statLabel}>Your Rank</p>
                    <p className={styles.statValue}>{getRankIcon(userRank)}</p>
                  </div>
                </div>
              )}
              {isMetaMaskWallet && metaMaskBonusApplied && (
                <div className={styles.statItem}>
                  <div className="text-2xl">🦊</div>
                  <div>
                    <p className={styles.statLabel}>MetaMask Bonus</p>
                    <p className={styles.statValue}>+10 pts</p>
                  </div>
                </div>
              )}
            </div>

            <Button 
              onClick={handleClaimTokens}
              disabled={isClaiming || userPoints < 100}
              className={styles.claimButton}
              size="lg"
            >
              <Coins className="mr-2" size={20} />
              {isClaiming ? 'Claiming...' : 'Claim SSTL Tokens'}
            </Button>

            <div className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/30 rounded-lg">
              <p className="text-xs sm:text-sm text-foreground text-center leading-relaxed">
                ℹ️ Tokens will be available to claim at the end of this campaign. Your points determine your token allocation.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`${styles.tab} ${activeTab === 'tasks' ? styles.tabActive : ''}`}
        >
          <CheckCircle2 size={18} />
          Tasks
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`${styles.tab} ${activeTab === 'leaderboard' ? styles.tabActive : ''}`}
        >
          <Trophy size={18} />
          Leaderboard
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'tasks' ? (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={styles.content}
          >
            <div className={styles.tasksList}>
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`${styles.taskCard} ${task.completed ? styles.taskCompleted : ''}`}>
                    <CardContent className="p-4">
                      <div className={styles.taskContent}>
                        <div className={styles.taskIcon}>
                          <task.icon size={24} />
                        </div>
                        <div className={styles.taskInfo}>
                          <div className={styles.taskHeader}>
                            <h3 className={styles.taskName}>{task.name}</h3>
                          </div>
                          <p className={styles.taskDescription}>{task.description}</p>
                          <div className={styles.taskMeta}>
                            <Badge variant="outline" className={styles.taskType}>
                              {task.type === 'social' && 'Social'}
                              {task.type === 'nft' && 'NFT'}
                              {task.type === 'engagement' && 'Engagement'}
                            </Badge>
                          </div>
                        </div>
                        <div className={styles.taskAction}>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={task.completed ? "default" : "secondary"}
                              className={styles.taskBadge}
                            >
                              +{task.points} pts
                            </Badge>
                            {approvedTasks.includes(task.id) && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 animate-pulse">
                                ✅ Approved!
                              </Badge>
                            )}
                            {pendingTasks.includes(task.id) && !task.completed && !approvedTasks.includes(task.id) && (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                ⏳ Pending Review
                              </Badge>
                            )}
                            {rejectedTasks.includes(task.id) && !task.completed && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                                ❌ Rejected
                              </Badge>
                            )}
                          </div>
                          {approvedTasks.includes(task.id) ? (
                            <div className="flex flex-col items-center gap-1">
                              <div className={styles.completedIcon}>
                                <CheckCircle2 size={28} className="text-green-500" />
                              </div>
                              <span className="text-xs text-green-600 font-semibold animate-pulse">Points awarded! 🎉</span>
                            </div>
                          ) : task.completed ? (
                            <div className={styles.completedIcon}>
                              <CheckCircle2 size={28} />
                            </div>
                          ) : pendingTasks.includes(task.id) ? (
                            <span className="text-xs text-gray-500 mt-1">Admin verification needed</span>
                          ) : rejectedTasks.includes(task.id) ? (
                            <div className="flex flex-col items-center gap-1">
                              <Button
                                onClick={() => {
                                  setRejectedTasks(prev => prev.filter(id => id !== task.id));
                                  handleTaskComplete(task.id);
                                }}
                                size="sm"
                                className={styles.taskButton}
                              >
                                Start
                                <ExternalLink size={14} className="ml-1" />
                              </Button>
                              <span className="text-xs text-red-600">Complete task and retry</span>
                            </div>
                          ) : task.type === 'nft' ? (
                            // NFT Tasks: Show Mint button if no NFT, otherwise Claim Points button
                            <div className="flex flex-col items-center gap-2">
                              {task.id === 'mint-genesis' ? (
                                genesisNFTBalance > 0 ? (
                                  <>
                                    <Button
                                      onClick={() => handleNFTVerification(task.id)}
                                      disabled={checkingNFTs}
                                      size="sm"
                                      className={styles.taskButton}
                                    >
                                      {checkingNFTs ? 'Checking...' : 'Claim Points'}
                                    </Button>
                                    <span className="text-xs text-green-500">✓ {genesisNFTBalance} NFT{genesisNFTBalance !== 1 ? 's' : ''} owned</span>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      onClick={() => window.location.href = '/hub/nfts'}
                                      size="sm"
                                      className={`${styles.taskButton} bg-gradient-to-r from-purple-600 to-pink-600`}
                                    >
                                      <Sparkles size={14} className="mr-1" />
                                      Mint NFT
                                    </Button>
                                    <span className="text-xs text-gray-500">Points awarded automatically when minted</span>
                                  </>
                                )
                              ) : task.id === 'mint-audit' ? (
                                aiAuditNFTBalance > 0 ? (
                                  <>
                                    <Button
                                      onClick={() => handleNFTVerification(task.id)}
                                      disabled={checkingNFTs}
                                      size="sm"
                                      className={styles.taskButton}
                                    >
                                      {checkingNFTs ? 'Checking...' : 'Claim Points'}
                                    </Button>
                                    <span className="text-xs text-green-500">✓ {aiAuditNFTBalance} NFT{aiAuditNFTBalance !== 1 ? 's' : ''} owned</span>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      onClick={() => window.location.href = '/hub/nfts'}
                                      size="sm"
                                      className={`${styles.taskButton} bg-gradient-to-r from-purple-600 to-pink-600`}
                                    >
                                      <Shield size={14} className="mr-1" />
                                      Mint NFT
                                    </Button>
                                    <span className="text-xs text-gray-500">Points awarded automatically when minted</span>
                                  </>
                                )
                              ) : null}
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleTaskComplete(task.id)}
                              size="sm"
                              className={styles.taskButton}
                            >
                              {task.id === 'fill-form' ? (
                                <>
                                  Fill Form
                                  <ExternalLink size={14} className="ml-1" />
                                </>
                              ) : task.requiresVerification ? (
                                <>
                                  Start
                                  <ExternalLink size={14} className="ml-1" />
                                </>
                              ) : (
                                'Complete'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* How It Works - Informative Card - Moved under tasks */}
            <Card className={styles.infoCard} style={{ marginTop: '1.5rem' }}>
              <CardHeader>
                <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                  <Award className="text-primary" size={24} />
                  How the Airdrop Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Step 1 */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'hsl(220, 90%, 56%, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'hsl(220, 90%, 56%)' }}>
                      1
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: 'var(--foreground)' }}>Complete Registration</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                        Fill out the registration form with your wallet address, X (Twitter) handle, and Telegram handle. This is required to participate.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'hsl(280, 60%, 60%, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'hsl(280, 60%, 60%)' }}>
                      2
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: 'var(--foreground)' }}>Complete Tasks</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                        Earn points by following us on social media, minting NFTs, and engaging with our community. Each task has a specific point value.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'hsl(170, 70%, 50%, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'hsl(170, 70%, 50%)' }}>
                      3
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: 'var(--foreground)' }}>Climb the Leaderboard</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                        The more points you earn, the higher your rank. Check the leaderboard to see where you stand among all participants.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'hsl(220, 90%, 56%, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'hsl(220, 90%, 56%)' }}>
                      4
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: 'var(--foreground)' }}>Claim SSTL Tokens</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                        At the end of the campaign, your points will be converted to SSTL tokens. The "Claim SSTL Tokens" button will become active when the campaign ends.
                      </p>
                    </div>
                  </div>

                  {/* Important Notes */}
                  <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'hsl(220, 90%, 56%, 0.1)', borderRadius: '8px', borderLeft: '3px solid hsl(220, 90%, 56%)' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--foreground)' }}>
                      📌 Important Notes:
                    </p>
                    <ul style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <li>Some tasks require manual verification by our team (1-48 hours)</li>
                      <li>You must complete registration before earning points on other tasks</li>
                      <li>Connect with MetaMask wallet to earn an instant +10 bonus points</li>
                      <li>Token distribution will happen after the campaign ends on TGE (Token Generation Event)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={styles.content}
          >
            <Card className={styles.leaderboardCard}>
              <CardHeader>
                <CardTitle className={styles.leaderboardTitle}>
                  <TrendingUp size={24} />
                  Top Contributors
                </CardTitle>
                <CardDescription>
                  Top 10 participants by points earned
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboardLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center text-gray-500">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="inline-block mb-2"
                      >
                        <Trophy size={24} className="text-gray-400" />
                      </motion.div>
                      <p>Loading leaderboard...</p>
                    </div>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center text-gray-500">
                      <Trophy size={24} className="text-gray-400 mx-auto mb-2" />
                      <p>No participants yet. Be the first to complete tasks!</p>
                    </div>
                  </div>
                ) : (
                  <div className={styles.leaderboardList}>
                    {leaderboard.map((entry, index) => (
                      <motion.div
                        key={entry.address}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={styles.leaderboardEntry}
                      >
                        <div className={styles.leaderboardRank}>
                          <span className={styles.rankBadge}>
                            {getRankIcon(entry.rank)}
                          </span>
                        </div>
                        <div className={styles.leaderboardInfo}>
                          <p className={styles.leaderboardAddress}>{entry.address}</p>
                          <p className={styles.leaderboardTasks}>
                            {entry.tasksCompleted} tasks completed
                          </p>
                        </div>
                        <div className={styles.leaderboardPoints}>
                          <Award className={styles.leaderboardIcon} size={18} />
                          <span className={styles.leaderboardPointsValue}>
                            {entry.points.toLocaleString()}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verification Dialog */}
      <VerificationDialog
        open={verificationDialog.open}
        onOpenChange={(open) =>
          setVerificationDialog(prev => ({ ...prev, open }))
        }
        taskId={verificationDialog.taskId}
        taskName={verificationDialog.taskName}
        taskType={verificationDialog.taskType}
        actionUrl={verificationDialog.actionUrl}
        onVerify={handleSocialVerification}
      />

      {/* Registration Form Dialog */}
      {account?.address && (
        <RegistrationForm
          open={registrationFormOpen}
          onOpenChange={setRegistrationFormOpen}
          walletAddress={account.address}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </div>
  );
});

SidebarAirdrop.displayName = 'SidebarAirdrop';

export default SidebarAirdrop;

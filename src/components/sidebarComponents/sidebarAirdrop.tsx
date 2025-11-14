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
import styles from './sidebarAirdrop.module.css';

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
  const [userPoints, setUserPoints] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([
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
      id: 'join-telegram',
      name: 'Join Telegram Community',
      description: 'Join our official Telegram group',
      points: 10,
      icon: MessageCircle,
      completed: false,
      type: 'social',
      actionUrl: 'https://t.me/SmartSentinelsCommunity',
      requiresVerification: true,
    },
    {
      id: 'like-post',
      name: 'Like Posts on X',
      description: 'Like 3 recent posts on our X profile',
      points: 50,
      icon: Heart,
      completed: false,
      type: 'engagement',
      actionUrl: 'https://twitter.com/SmartSentinels',
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
      actionUrl: 'https://twitter.com/SmartSentinels',
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

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([
    { rank: 1, address: '0x742d...5d21', points: 2500, tasksCompleted: 6 },
    { rank: 2, address: '0x8f3a...9b4c', points: 2100, tasksCompleted: 6 },
    { rank: 3, address: '0x1c5e...7a8d', points: 1850, tasksCompleted: 5 },
    { rank: 4, address: '0x9d2f...3e6b', points: 1600, tasksCompleted: 5 },
    { rank: 5, address: '0x4a7b...2c9f', points: 1400, tasksCompleted: 4 },
    { rank: 6, address: '0x6e1d...8f5a', points: 1200, tasksCompleted: 4 },
    { rank: 7, address: '0x2b9c...4d7e', points: 1050, tasksCompleted: 3 },
    { rank: 8, address: '0x5f8a...1b3c', points: 900, tasksCompleted: 3 },
    { rank: 9, address: '0x3d4e...6a2f', points: 750, tasksCompleted: 2 },
    { rank: 10, address: '0x7c2b...9e4d', points: 600, tasksCompleted: 2 },
  ]);

  const [isClaiming, setIsClaiming] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'leaderboard'>('tasks');
  const [registrationFormOpen, setRegistrationFormOpen] = useState(false);
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

  // Load user progress from backend and localStorage
  useEffect(() => {
    if (account?.address) {
      loadUserProgress();
    }
  }, [account?.address]);

  const loadUserProgress = async () => {
    if (!account?.address) return;

    try {
      // Try to load from backend first
      const backendData = await getUserProgress(account.address);
      
      if (backendData && backendData.points > 0) {
        // Use backend data
        setUserPoints(backendData.points);
        setTasks(prevTasks =>
          prevTasks.map(task =>
            backendData.completedTasks.includes(task.id) ? { ...task, completed: true } : task
          )
        );
        
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

  const handleTaskComplete = (taskId: string) => {
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

    // For NFT tasks, verify directly on-chain
    if (task.type === 'nft') {
      handleNFTVerification(taskId);
      return;
    }

    // For social tasks, open verification dialog
    if (task.requiresVerification) {
      let taskType: 'twitter-follow' | 'twitter-likes' | 'twitter-tags' | 'telegram' = 'twitter-follow';
      
      if (taskId === 'follow-x') taskType = 'twitter-follow';
      else if (taskId === 'join-telegram') taskType = 'telegram';
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
          result = await verifyTwitterTags(account.address, username, additionalData?.tweetUrl);
          break;
        case 'telegram':
          // Check if this Telegram ID is available
          const availabilityCheck = await checkTelegramAvailability(username, account.address);
          
          if (!availabilityCheck.available) {
            toast({
              title: "Already Used",
              description: "This Telegram account has already been used by another wallet address.",
              variant: "destructive",
            });
            return false;
          }
          
          // Verify with Telegram API
          result = await verifyTelegramJoin(account.address, username);
          
          // If verified, complete task on backend
          if (result.verified) {
            const backendResult = await completeTaskBackend(
              account.address,
              taskId,
              task.points,
              username
            );
            
            if (!backendResult.success) {
              toast({
                title: "Error",
                description: backendResult.error || "Failed to save progress",
                variant: "destructive",
              });
              return false;
            }
          }
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
    // Mark the registration form task as complete
    completeTask('fill-form', 10);
  };

  const completeTask = async (taskId: string, points: number, telegramUserId?: string) => {
    if (!account?.address) return;

    // For non-Telegram tasks, save to backend
    if (taskId !== 'join-telegram') {
      const backendResult = await completeTaskBackend(
        account.address,
        taskId,
        points
      );

      if (!backendResult.success) {
        toast({
          title: "Error",
          description: backendResult.error || "Failed to save progress",
          variant: "destructive",
        });
        return;
      }
    }

    // Mark task as completed locally
    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, completed: true } : t
    );
    const newPoints = userPoints + points;
    const completedTaskIds = updatedTasks.filter(t => t.completed).map(t => t.id);

    setTasks(updatedTasks);
    setUserPoints(newPoints);
    saveProgressLocal(newPoints, completedTaskIds);
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
      {/* Coming Soon Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={styles.comingSoonBanner}
      >
        <div className={styles.comingSoonContent}>
          <span className={styles.comingSoonBadge}>COMING SOON</span>
          <h2 className={styles.comingSoonTitle}>🚀 Airdrop Campaign Launching Soon!</h2>
          <p className={styles.comingSoonText}>
            Get ready to earn SSTL tokens by completing tasks. Follow our social media channels for launch announcements and exclusive updates.
          </p>
        </div>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
        style={{ opacity: 0.5 }}
      >
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <Gift className={styles.giftIcon} size={32} />
          </div>
          <div>
            <h1 className={styles.title}>SSTL Airdrop Campaign</h1>
            <p className={styles.subtitle}>Complete tasks to earn points and claim SSTL tokens</p>
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
            <h3 className={styles.infoTitle}>
              <Sparkles size={20} />
              About This Campaign
            </h3>
            <p className={styles.infoText}>
              <strong>⚠️ MetaMask Wallet Required:</strong> This airdrop campaign is powered by MetaMask Portfolio in partnership with{' '}
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
              {' '}project. 
              You must use MetaMask wallet to participate and claim SSTL tokens. Other wallets are not supported for token claims.
            </p>
            <p className={styles.infoText}>
              Complete tasks to earn points, then claim your SSTL tokens directly through MetaMask Portfolio. 
              The more points you earn, the more tokens you can claim!
            </p>
          </CardContent>
        </Card>
      </motion.div>

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
            </div>
            
            <div className={styles.progressSection}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>Campaign Progress</span>
                <span className={styles.progressValue}>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className={styles.progress} />
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
            <p className={styles.claimHint}>
              {userPoints < 100 
                ? '🎯 Complete tasks to earn at least 100 points to claim tokens' 
                : '✅ You are eligible to claim SSTL tokens!'}
            </p>
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
                          <Badge 
                            variant={task.completed ? "default" : "secondary"}
                            className={styles.taskBadge}
                          >
                            +{task.points} pts
                          </Badge>
                          {task.completed ? (
                            <div className={styles.completedIcon}>
                              <CheckCircle2 size={28} />
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

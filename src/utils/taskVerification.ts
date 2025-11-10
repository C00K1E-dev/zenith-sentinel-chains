/**
 * Task Verification Utilities
 * 
 * This file contains utilities for verifying user completion of social tasks
 * and integrating with theMiracle API for displaying benefits to your token holders.
 * 
 * For custom airdrop campaigns: Use your own backend
 * For theMiracle integration: Display benefits available to your NFT/Token holders
 */

interface VerificationResponse {
  verified: boolean;
  message: string;
  data?: any;
}

/**
 * Backend API base URL - Update this with your actual backend URL
 */
const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000/api';

/**
 * theMiracle API Configuration
 * Get your API key from: https://themiracle.readme.io
 */
const THEMIRACLE_API_URL = 'https://api.themiracle.io';
const THEMIRACLE_API_KEY = import.meta.env.VITE_THEMIRACLE_API_KEY || '';

/**
 * Get benefits from theMiracle API for your token/NFT collection
 * This displays available benefits for your holders
 * 
 * @param contractAddress - Your token or NFT contract address
 * @param chain - Chain name (ethereum, polygon, bsc, etc.)
 */
export async function getTheMiracleBenefits(
  contractAddress: string,
  chain: string = 'bsc'
): Promise<any[]> {
  try {
    const response = await fetch(
      `${THEMIRACLE_API_URL}/v1/benefits?contract=${contractAddress}&chain=${chain}`,
      {
        headers: {
          'x-api-key': THEMIRACLE_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch benefits');
    }

    const data = await response.json();
    return data.benefits || [];
  } catch (error) {
    console.error('theMiracle API error:', error);
    return [];
  }
}

/**
 * Verify Twitter Follow
 * 
 * Backend should use Twitter API v2:
 * GET /2/users/:id/following
 * 
 * Requires: Twitter API Bearer Token (on backend)
 * @param walletAddress - User's wallet address
 * @param twitterUsername - Optional: User's Twitter username for verification
 */
export async function verifyTwitterFollow(
  walletAddress: string,
  twitterUsername?: string
): Promise<VerificationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/verify/twitter-follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        twitterUsername,
        targetAccount: 'SmartSentinels', // Your Twitter handle
      }),
    });

    if (!response.ok) {
      throw new Error('Verification failed');
    }

    const data = await response.json();
    return {
      verified: data.verified,
      message: data.verified 
        ? 'Twitter follow verified!' 
        : 'Could not verify Twitter follow. Please make sure you are following @SmartSentinels',
      data: data,
    };
  } catch (error) {
    console.error('Twitter verification error:', error);
    return {
      verified: false,
      message: 'Verification temporarily unavailable. Please try again later.',
    };
  }
}

/**
 * Verify Telegram Join
 * 
 * Uses Telegram Bot API to check group membership
 * IMPORTANT: Requires user's numeric Telegram ID, not username!
 * 
 * Users can get their ID from @userinfobot on Telegram
 * 
 * @param walletAddress - User's wallet address
 * @param telegramUserId - User's numeric Telegram ID
 */
export async function verifyTelegramJoin(
  walletAddress: string,
  telegramUserId?: string
): Promise<VerificationResponse> {
  try {
    if (!telegramUserId || telegramUserId.trim() === '') {
      return {
        verified: false,
        message: 'Please enter your Telegram User ID.\n\nTo get it:\n1. Send a message to @userinfobot on Telegram\n2. Copy your User ID (numbers only)\n3. Paste it here',
      };
    }

    // Telegram User ID must be numeric
    const numericUserId = telegramUserId.trim();
    if (!/^\d+$/.test(numericUserId)) {
      return {
        verified: false,
        message: 'Invalid User ID. It should be numbers only (e.g., 123456789).\n\nGet your ID from @userinfobot on Telegram',
      };
    }

    // Telegram Bot API configuration from environment
    const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '8562406342:AAE-MxgNZadX1hThRdVHHHiRVvRvtEh3FlQ';
    const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || '-1002711126186';

    // Call Telegram Bot API using getChatMember with numeric user ID
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember`;
    
    const response = await fetch(`${url}?chat_id=${TELEGRAM_CHAT_ID}&user_id=${numericUserId}`);
    const data = await response.json();

    console.log('Telegram API Response:', data); // Debug log

    if (data.ok && data.result) {
      // Check membership status
      // Possible values: creator, administrator, member, restricted, left, kicked
      const status = data.result.status;
      const isMember = ['creator', 'administrator', 'member', 'restricted'].includes(status);

      if (isMember) {
        const username = data.result.user?.username || 'User';
        return {
          verified: true,
          message: `Successfully verified @${username} as a member of SmartSentinels Community!`,
          data: {
            userId: numericUserId,
            username: username,
            status: status,
            walletAddress: walletAddress,
          },
        };
      } else {
        return {
          verified: false,
          message: `You are not a member of the group (status: ${status}).\n\nPlease join: https://t.me/SmartSentinelsCommunity`,
        };
      }
    } else {
      // API returned error
      return {
        verified: false,
        message: `Cannot verify membership.\n\nMake sure:\n1. You joined https://t.me/SmartSentinelsCommunity\n2. Your User ID is correct (get it from @userinfobot)\n\nError: ${data.description || 'Invalid User ID'}`,
      };
    }
  } catch (error) {
    console.error('Telegram verification error:', error);
    return {
      verified: false,
      message: 'Verification failed. Please check your User ID and try again.',
    };
  }
}

/**
 * Verify Twitter Likes
 * 
 * Backend should use Twitter API v2:
 * GET /2/users/:id/liked_tweets
 * 
 * @param walletAddress - User's wallet address
 * @param twitterUsername - User's Twitter username
 * @param requiredLikes - Number of likes required
 */
export async function verifyTwitterLikes(
  walletAddress: string,
  twitterUsername?: string,
  requiredLikes: number = 3
): Promise<VerificationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/verify/twitter-likes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        twitterUsername,
        targetAccount: 'SmartSentinels',
        requiredLikes,
      }),
    });

    if (!response.ok) {
      throw new Error('Verification failed');
    }

    const data = await response.json();
    return {
      verified: data.verified,
      message: data.verified 
        ? `${data.likesCount} likes verified!` 
        : `Please like at least ${requiredLikes} recent posts from @SmartSentinels`,
      data: data,
    };
  } catch (error) {
    console.error('Twitter likes verification error:', error);
    return {
      verified: false,
      message: 'Verification temporarily unavailable. Please try again later.',
    };
  }
}

/**
 * Verify Twitter Tag Friends
 * 
 * Backend should use Twitter API v2:
 * Search recent tweets mentioning your account
 * 
 * @param walletAddress - User's wallet address
 * @param twitterUsername - User's Twitter username
 * @param tweetUrl - URL of the tweet where they tagged friends
 */
export async function verifyTwitterTags(
  walletAddress: string,
  twitterUsername?: string,
  tweetUrl?: string
): Promise<VerificationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/verify/twitter-tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        twitterUsername,
        tweetUrl,
        targetAccount: 'SmartSentinels',
        requiredTags: 3,
      }),
    });

    if (!response.ok) {
      throw new Error('Verification failed');
    }

    const data = await response.json();
    return {
      verified: data.verified,
      message: data.verified 
        ? 'Friend tags verified!' 
        : 'Please tag 3 friends in our latest post',
      data: data,
    };
  } catch (error) {
    console.error('Twitter tags verification error:', error);
    return {
      verified: false,
      message: 'Verification temporarily unavailable. Please try again later.',
    };
  }
}

/**
 * Verify NFT Mint
 * 
 * This checks on-chain if the user has minted from the specified collection
 * 
 * @param walletAddress - User's wallet address
 * @param collectionType - 'genesis' or 'audit'
 */
export async function verifyNFTMint(
  walletAddress: string,
  collectionType: 'genesis' | 'audit'
): Promise<VerificationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/verify/nft-mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        collectionType,
      }),
    });

    if (!response.ok) {
      throw new Error('Verification failed');
    }

    const data = await response.json();
    return {
      verified: data.verified,
      message: data.verified 
        ? `${collectionType === 'genesis' ? 'Genesis' : 'AI Audit'} NFT mint verified!` 
        : `No ${collectionType === 'genesis' ? 'Genesis' : 'AI Audit'} NFT found in your wallet`,
      data: data,
    };
  } catch (error) {
    console.error('NFT mint verification error:', error);
    return {
      verified: false,
      message: 'Verification temporarily unavailable. Please try again later.',
    };
  }
}

/**
 * Submit task completion to backend for recording
 * 
 * @param walletAddress - User's wallet address
 * @param taskId - ID of the completed task
 * @param points - Points earned
 */
export async function recordTaskCompletion(
  walletAddress: string,
  taskId: string,
  points: number
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        taskId,
        points,
        timestamp: Date.now(),
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Task recording error:', error);
    return false;
  }
}

/**
 * Get user's task completion status from backend
 * 
 * @param walletAddress - User's wallet address
 */
export async function getUserTaskStatus(walletAddress: string): Promise<{
  points: number;
  completedTasks: string[];
} | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/status/${walletAddress}`);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      points: data.points || 0,
      completedTasks: data.completedTasks || [],
    };
  } catch (error) {
    console.error('Status fetch error:', error);
    return null;
  }
}

/**
 * Get leaderboard data from backend
 */
export async function getLeaderboard(limit: number = 10): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard?limit=${limit}`);
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.leaderboard || [];
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return [];
  }
}

/**
 * Claim SSTL tokens using points
 * This creates a claim record and prepares data for MetaMask/Web3 distribution
 * 
 * @param walletAddress - User's wallet address
 * @param points - Points to exchange for tokens
 * @param signature - Wallet signature to verify ownership
 */
export async function claimTokens(
  walletAddress: string,
  points: number,
  signature?: string
): Promise<{
  success: boolean;
  message: string;
  claimData?: {
    amount: string;
    merkleProof?: string[];
    claimUrl?: string;
  };
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/claim/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        points,
        signature,
        timestamp: Date.now(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.message || 'Claim failed',
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Claim prepared successfully',
      claimData: {
        amount: data.tokenAmount,
        merkleProof: data.merkleProof,
        claimUrl: data.claimUrl || `https://portfolio.metamask.io/campaigns/smartsentinels-airdrop?address=${walletAddress}`,
      },
    };
  } catch (error) {
    console.error('Claim error:', error);
    return {
      success: false,
      message: 'An error occurred while processing your claim',
    };
  }
}

/**
 * Generate wallet signature for claim verification
 * This proves the user owns the wallet address
 * 
 * @param walletAddress - User's wallet address
 * @param message - Message to sign
 */
export async function generateClaimSignature(
  walletAddress: string,
  message: string
): Promise<string | null> {
  try {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not installed');
    }

    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, walletAddress],
    });

    return signature;
  } catch (error) {
    console.error('Signature error:', error);
    return null;
  }
}

/**
 * Check if user has claimed tokens already
 * 
 * @param walletAddress - User's wallet address
 */
export async function checkClaimStatus(walletAddress: string): Promise<{
  hasClaimed: boolean;
  claimedAmount?: string;
  claimedAt?: number;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/claim/status/${walletAddress}`);
    
    if (!response.ok) {
      return { hasClaimed: false };
    }

    const data = await response.json();
    return {
      hasClaimed: data.hasClaimed || false,
      claimedAmount: data.claimedAmount,
      claimedAt: data.claimedAt,
    };
  } catch (error) {
    console.error('Claim status error:', error);
    return { hasClaimed: false };
  }
}

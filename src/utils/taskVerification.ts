/**
 * Task Verification Utilities
 * 
 * This file contains utilities for verifying user completion of social tasks
 * All verification is done through the backend API using free services:
 * - Twitter: Nitter scraper (no API key needed)
 * - Telegram: Telegram Bot API (free)
 * - NFT: On-chain verification via BSC RPC (free)
 */

interface VerificationResponse {
  verified: boolean;
  pending?: boolean;
  message: string;
  data?: any;
}

/**
 * Backend API base URL - Update this with your actual backend URL
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Verify Twitter Follow
 * 
 * Backend uses Nitter scraper (FREE - no API key needed)
 * Verifies user follows @SmartSentinels_
 * 
 * @param walletAddress - User's wallet address
 * @param twitterUsername - User's Twitter username for verification
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
        username: twitterUsername,
      }),
    });

    if (!response.ok) {
      throw new Error('Verification failed');
    }

    const data = await response.json();
    return {
      verified: data.verified,
      pending: data.pending,
      message: data.message || (data.verified 
        ? 'Twitter follow verified!' 
        : 'Could not verify Twitter follow. Please make sure you are following @SmartSentinels'),
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
  telegramUsername?: string
): Promise<VerificationResponse> {
  try {
    if (!telegramUsername || telegramUsername.trim() === '') {
      return {
        verified: false,
        message: 'Please enter your Telegram username',
      };
    }

    // Clean username (remove @ if present)
    const cleanUsername = telegramUsername.trim().replace(/^@/, '');

    // Submit for manual verification
    const response = await fetch(`${API_BASE_URL}/telegram/verify-community`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress,
        telegramUsername: cleanUsername
      })
    });

    const data = await response.json();

    if (data.success) {
      return {
        verified: false,
        pending: true,
        message: 'Verification submitted! An admin will review your Telegram membership and approve your points.'
      };
    } else {
      return {
        verified: false,
        message: data.error || 'Failed to submit verification'
      };
    }
  } catch (error) {
    console.error('Telegram verification error:', error);
    return {
      verified: false,
      message: 'Failed to connect to verification server'
    };
  }
}

/**
 * Verify Twitter Likes
 * 
 * Backend uses Nitter scraper (FREE - no API key needed)
 * Verifies user liked at least 3 recent posts from @SmartSentinels_
 * 
 * @param walletAddress - User's wallet address
 * @param twitterUsername - User's Twitter username
 * @param requiredLikes - Number of likes required (default: 3)
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
        username: twitterUsername,
        requiredLikes,
      }),
    });

    if (!response.ok) {
      throw new Error('Verification failed');
    }

    const data = await response.json();
    return {
      verified: data.verified,
      pending: data.pending,
      message: data.message || (data.verified 
        ? `${data.likesCount} likes verified!` 
        : `Please like at least ${requiredLikes} recent posts from @SmartSentinels`),
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
 * Backend uses Nitter scraper (FREE - no API key needed)
 * Verifies user tagged at least 3 friends mentioning @SmartSentinels_
 * 
 * @param walletAddress - User's wallet address
 * @param twitterUsername - User's Twitter username
 * @param tweetUrl - Optional: URL of the tweet where they tagged friends
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
        username: twitterUsername,
        tweetUrl,
        requiredTags: 3,
      }),
    });

    if (!response.ok) {
      throw new Error('Verification failed');
    }

    const data = await response.json();
    return {
      verified: data.verified,
      pending: data.pending,
      message: data.message || (data.verified 
        ? 'Friend tags verified!' 
        : 'Please tag 3 friends in our latest post'),
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
        nftType: collectionType,
      }),
    });

    if (!response.ok) {
      throw new Error('Verification failed');
    }

    const data = await response.json();
    return {
      verified: data.verified,
      message: data.message || (data.verified 
        ? `${collectionType === 'genesis' ? 'Genesis' : 'AI Audit'} NFT mint verified!` 
        : `No ${collectionType === 'genesis' ? 'Genesis' : 'AI Audit'} NFT found in your wallet`),
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

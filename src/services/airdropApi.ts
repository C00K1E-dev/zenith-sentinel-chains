/**
 * Airdrop Backend API Service
 * Communicates with the Vercel-deployed backend
 */

const API_BASE_URL = 'https://sstlgbot.vercel.app/api';

export interface AirdropUserData {
  walletAddress: string;
  points: number;
  completedTasks: string[];
  telegramUserId: string | null;
  createdAt: number;
  lastUpdated: number;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  points: number;
  tasksCompleted: number;
}

/**
 * Get user's airdrop progress from backend
 */
export async function getUserProgress(walletAddress: string): Promise<AirdropUserData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/airdrop?wallet=${walletAddress}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return null;
  }
}

/**
 * Complete a task and update backend
 */
export async function completeTask(
  walletAddress: string,
  taskId: string,
  points: number,
  telegramUserId?: string
): Promise<{ success: boolean; data?: AirdropUserData; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/airdrop?action=complete-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        taskId,
        points,
        telegramUserId,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error completing task:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if a Telegram User ID is available (not linked to another wallet)
 */
export async function checkTelegramAvailability(
  telegramUserId: string,
  walletAddress?: string
): Promise<{ available: boolean; linkedWallet: string | null }> {
  try {
    const response = await fetch(`${API_BASE_URL}/airdrop?action=check-telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        telegramUserId,
        walletAddress,
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      return {
        available: data.available,
        linkedWallet: data.linkedWallet,
      };
    }
    
    return { available: false, linkedWallet: null };
  } catch (error) {
    console.error('Error checking Telegram availability:', error);
    return { available: false, linkedWallet: null };
  }
}

/**
 * Get leaderboard data
 */
export async function getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/airdrop?action=leaderboard&limit=${limit}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (data.success) {
      return data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

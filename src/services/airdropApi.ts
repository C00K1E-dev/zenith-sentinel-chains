/**
 * Airdrop Backend API Service
 * Communicates with the local backend server
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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
    const response = await fetch(`${API_BASE_URL}/user/${walletAddress}`);
    const data = await response.json();
    
    if (data.success) {
      return {
        walletAddress: data.data.wallet_address,
        points: data.data.total_points,
        completedTasks: data.data.completed_tasks,
        telegramUserId: data.data.telegram_user_id,
        createdAt: Date.now(),
        lastUpdated: Date.now()
      };
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
  telegramUserId?: string,
  taskName?: string
): Promise<{ success: boolean; data?: AirdropUserData; error?: string; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/task/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        taskId,
        points,
        taskName: taskName || taskId,
        verificationData: telegramUserId ? { telegramUserId } : null
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        data: {
          walletAddress: data.data.wallet_address,
          points: data.data.total_points,
          completedTasks: data.data.completed_tasks,
          telegramUserId: null,
          createdAt: Date.now(),
          lastUpdated: Date.now()
        }
      };
    }
    
    return {
      success: false,
      error: data.error || 'Failed to complete task',
      message: data.message || undefined
    };
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
    const response = await fetch(`${API_BASE_URL}/verify/telegram`, {
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
        available: data.available !== false,
        linkedWallet: null,
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
    const response = await fetch(`${API_BASE_URL}/leaderboard?limit=${limit}`);
    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data.map((entry: any, index: number) => ({
        rank: index + 1,
        address: entry.wallet_address,
        points: entry.total_points || 0,
        tasksCompleted: (entry.completed_tasks && Array.isArray(entry.completed_tasks)) 
          ? entry.completed_tasks.length 
          : (entry.tasks_completed || 0)
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

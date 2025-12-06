/**
 * Supabase Client and Database Helper Functions
 * Provides CRUD operations for all database tables with type safety
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials:', { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseAnonKey 
  });
  throw new Error('Missing Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

// Initialize Supabase client with anon key
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// TYPES
// ============================================

export type PersonalityType = 'funny' | 'professional' | 'technical' | 'casual' | 'custom';
export type PricingTier = 'starter' | 'pro' | 'enterprise';
export type DeploymentStatus = 'draft' | 'deploying' | 'active' | 'paused' | 'failed';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';

export interface User {
  id: string;
  wallet_address: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface TelegramAgent {
  id: string;
  user_id: string;
  project_name: string;
  bot_handle: string;
  bot_token: string;
  website_url: string;
  whitepaper_url?: string;
  personality: PersonalityType;
  custom_personality?: string;
  trigger_keywords?: string[];
  custom_faqs?: string;
  additional_info?: string;
  pricing_tier: PricingTier;
  knowledge_base?: Record<string, any>;
  deployment_status: DeploymentStatus;
  vercel_project_id?: string;
  vercel_deployment_url?: string;
  telegram_webhook_url?: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  agent_id: string;
  subscription_tier: PricingTier;
  subscription_cost_usd: number;
  payment_status: PaymentStatus;
  transaction_hash?: string;
  transaction_date?: string;
  expiry_date: string;
  auto_renew: boolean;
  renewal_date?: string;
  created_at: string;
  updated_at: string;
}

export interface AgentMessage {
  id: string;
  agent_id: string;
  telegram_user_id: number;
  user_message: string;
  bot_response: string;
  tokens_used?: number;
  response_time_ms?: number;
  created_at: string;
}

export interface AgentAnalytics {
  id: string;
  agent_id: string;
  date: string;
  total_messages: number;
  unique_users: number;
  total_tokens_used: number;
  avg_response_time_ms: number;
  error_count: number;
  created_at: string;
}

// ============================================
// USER OPERATIONS
// ============================================

/**
 * Get or create user by wallet address
 * @param walletAddress - Ethereum wallet address (0x...)
 * @returns User object or null
 */
export async function getOrCreateUser(walletAddress: string): Promise<User | null> {
  try {
    console.log('[SUPABASE] Getting or creating user:', walletAddress);
    
    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = "not found" which is expected, other errors are real issues
      console.error('[SUPABASE] Error fetching user:', fetchError);
      throw new Error(`Failed to fetch user: ${fetchError.message}`);
    }

    if (existingUser) {
      console.log('[SUPABASE] User already exists:', existingUser.id);
      return existingUser;
    }

    console.log('[SUPABASE] Creating new user...');
    
    // Create new user if doesn't exist
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        wallet_address: walletAddress.toLowerCase(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('[SUPABASE] Error creating user:', createError);
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    console.log('[SUPABASE] User created successfully:', newUser.id);
    return newUser;
  } catch (error: any) {
    console.error('[SUPABASE] Error in getOrCreateUser:', error);
    throw error; // Re-throw to show the actual error in UI
  }
}

/**
 * Update user email
 */
export async function updateUserEmail(userId: string, email: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ email, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return !error;
  } catch (error) {
    console.error('Error updating user email:', error);
    return false;
  }
}

// ============================================
// TELEGRAM AGENT OPERATIONS
// ============================================

/**
 * Create a new Telegram agent
 */
export async function createAgent(agentData: Partial<TelegramAgent>): Promise<TelegramAgent | null> {
  try {
    console.log('[SUPABASE] Creating agent with data:', agentData);
    
    const { data, error } = await supabase
      .from('telegram_agents')
      .insert({
        ...agentData,
        message_count: 0,
        deployment_status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[SUPABASE] Error creating agent:', error);
      throw new Error(`Failed to create agent: ${error.message}`);
    }

    console.log('[SUPABASE] Agent created successfully:', data.id);
    return data;
  } catch (error: any) {
    console.error('[SUPABASE] Error in createAgent:', error);
    throw error; // Re-throw to show actual error
  }
}

/**
 * Get agent by ID
 */
export async function getAgent(agentId: string): Promise<TelegramAgent | null> {
  try {
    const { data, error } = await supabase
      .from('telegram_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (error) {
      console.error('Error fetching agent:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getAgent:', error);
    return null;
  }
}

/**
 * Get all agents for a user
 */
export async function getUserAgents(userId: string): Promise<TelegramAgent[]> {
  try {
    const { data, error } = await supabase
      .from('telegram_agents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user agents:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserAgents:', error);
    return [];
  }
}

/**
 * Update agent configuration
 */
export async function updateAgent(agentId: string, updates: Partial<TelegramAgent>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('telegram_agents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId);

    return !error;
  } catch (error) {
    console.error('Error updating agent:', error);
    return false;
  }
}

/**
 * Delete agent
 */
export async function deleteAgent(agentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('telegram_agents')
      .delete()
      .eq('id', agentId);

    return !error;
  } catch (error) {
    console.error('Error deleting agent:', error);
    return false;
  }
}

/**
 * Increment agent message count
 */
export async function incrementMessageCount(agentId: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('increment_message_count', {
      agent_id: agentId
    });

    // Fallback if RPC doesn't exist
    if (error) {
      const agent = await getAgent(agentId);
      if (agent) {
        return await updateAgent(agentId, {
          message_count: agent.message_count + 1
        });
      }
    }

    return !error;
  } catch (error) {
    console.error('Error incrementing message count:', error);
    return false;
  }
}

// ============================================
// SUBSCRIPTION OPERATIONS
// ============================================

/**
 * Create subscription record after payment
 */
export async function createSubscription(subscriptionData: Partial<Subscription>): Promise<Subscription | null> {
  try {
    console.log('[SUPABASE] Creating subscription with data:', subscriptionData);
    
    // Calculate expiry date (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        ...subscriptionData,
        expiry_date: expiryDate.toISOString(),
        auto_renew: subscriptionData.auto_renew ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[SUPABASE] Error creating subscription:', error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }

    console.log('[SUPABASE] Subscription created successfully:', data.id);
    return data;
  } catch (error: any) {
    console.error('[SUPABASE] Error in createSubscription:', error);
    throw error; // Re-throw to show actual error
  }
}

/**
 * Get latest subscription for an agent
 */
export async function getLatestSubscription(agentId: string): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getLatestSubscription:', error);
    return null;
  }
}

/**
 * Get all subscriptions for a user
 */
export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user subscriptions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserSubscriptions:', error);
    return [];
  }
}

/**
 * Update subscription status
 */
export async function updateSubscription(subscriptionId: string, updates: Partial<Subscription>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    return !error;
  } catch (error) {
    console.error('Error updating subscription:', error);
    return false;
  }
}

/**
 * Check if agent has active subscription
 */
export async function hasActiveSubscription(agentId: string): Promise<boolean> {
  try {
    const subscription = await getLatestSubscription(agentId);
    
    if (!subscription) return false;
    if (subscription.payment_status !== 'confirmed') return false;
    
    const expiryDate = new Date(subscription.expiry_date);
    const now = new Date();
    
    return expiryDate > now;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

// ============================================
// AGENT MESSAGES OPERATIONS
// ============================================

/**
 * Save agent message for analytics
 */
export async function saveAgentMessage(messageData: Partial<AgentMessage>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('agent_messages')
      .insert({
        ...messageData,
        created_at: new Date().toISOString()
      });

    return !error;
  } catch (error) {
    console.error('Error saving agent message:', error);
    return false;
  }
}

/**
 * Get agent conversation history
 */
export async function getAgentMessages(agentId: string, limit: number = 10): Promise<AgentMessage[]> {
  try {
    const { data, error } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching agent messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAgentMessages:', error);
    return [];
  }
}

/**
 * Get message count for agent (today)
 */
export async function getTodayMessageCount(agentId: string): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('agent_messages')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .gte('created_at', today.toISOString());

    if (error) {
      console.error('Error getting message count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getTodayMessageCount:', error);
    return 0;
  }
}

// ============================================
// AGENT ANALYTICS OPERATIONS
// ============================================

/**
 * Get agent analytics for date range
 */
export async function getAgentAnalytics(agentId: string, days: number = 7): Promise<AgentAnalytics[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('agent_analytics')
      .select('*')
      .eq('agent_id', agentId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching analytics:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAgentAnalytics:', error);
    return [];
  }
}

/**
 * Create or update daily analytics
 */
export async function updateDailyAnalytics(
  agentId: string,
  date: string,
  analyticsData: Partial<AgentAnalytics>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('agent_analytics')
      .upsert({
        agent_id: agentId,
        date,
        ...analyticsData,
        created_at: new Date().toISOString()
      });

    return !error;
  } catch (error) {
    console.error('Error updating analytics:', error);
    return false;
  }
}

// ============================================
// ADMIN OPERATIONS
// ============================================

/**
 * Get all agents (admin only)
 */
export async function getAllAgents(): Promise<TelegramAgent[]> {
  try {
    const { data, error } = await supabase
      .from('telegram_agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all agents:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllAgents:', error);
    return [];
  }
}

/**
 * Get all subscriptions (admin only)
 */
export async function getAllSubscriptions(): Promise<Subscription[]> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all subscriptions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllSubscriptions:', error);
    return [];
  }
}

/**
 * Get subscription by transaction hash
 */
export async function getSubscriptionByTxHash(txHash: string): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('transaction_hash', txHash)
      .single();

    if (error) {
      console.error('Error fetching subscription by tx:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getSubscriptionByTxHash:', error);
    return null;
  }
}

export default supabase;

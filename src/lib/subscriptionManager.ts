/**
 * Subscription Manager
 * Handles subscription status checking, expiry tracking, and renewal logic
 */

import {
  getLatestSubscription,
  hasActiveSubscription as checkActiveSubscription,
  type Subscription,
  type TelegramAgent
} from './supabase';

// ============================================
// TYPES
// ============================================

export interface SubscriptionStatus {
  isActive: boolean;
  subscription: Subscription | null;
  daysUntilExpiry: number;
  isExpiringSoon: boolean; // Less than 3 days
  needsRenewal: boolean;
  canOperate: boolean; // Agent can process messages
}

// ============================================
// SUBSCRIPTION CHECKING
// ============================================

/**
 * Check if agent subscription is currently active
 * @param agentId - Agent ID
 * @returns true if subscription is active and not expired
 */
export async function isSubscriptionActive(agentId: string): Promise<boolean> {
  return await checkActiveSubscription(agentId);
}

/**
 * Get detailed subscription status for an agent
 * @param agentId - Agent ID
 * @returns Detailed subscription status object
 */
export async function getSubscriptionStatus(agentId: string): Promise<SubscriptionStatus> {
  const subscription = await getLatestSubscription(agentId);

  // No subscription found
  if (!subscription) {
    return {
      isActive: false,
      subscription: null,
      daysUntilExpiry: 0,
      isExpiringSoon: false,
      needsRenewal: true,
      canOperate: false
    };
  }

  // Check if payment is confirmed
  if (subscription.payment_status !== 'confirmed') {
    return {
      isActive: false,
      subscription,
      daysUntilExpiry: 0,
      isExpiringSoon: false,
      needsRenewal: true,
      canOperate: false
    };
  }

  // Calculate days until expiry
  const now = new Date();
  const expiryDate = new Date(subscription.expiry_date);
  const diffTime = expiryDate.getTime() - now.getTime();
  const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Check if expired
  const isActive = daysUntilExpiry > 0;
  const isExpiringSoon = daysUntilExpiry <= 3 && daysUntilExpiry > 0;
  const needsRenewal = daysUntilExpiry <= 0;

  return {
    isActive,
    subscription,
    daysUntilExpiry: Math.max(0, daysUntilExpiry),
    isExpiringSoon,
    needsRenewal,
    canOperate: isActive
  };
}

/**
 * Check if subscription is expiring soon (within 3 days)
 * @param agentId - Agent ID
 * @returns true if subscription expires in 3 days or less
 */
export async function isExpiringSoon(agentId: string): Promise<boolean> {
  const status = await getSubscriptionStatus(agentId);
  return status.isExpiringSoon;
}

/**
 * Get all agents with expiring subscriptions
 * Used for renewal reminders
 * @param userId - User ID
 * @param daysThreshold - Days before expiry (default 3)
 * @returns Array of agent IDs with expiring subscriptions
 */
export async function getExpiringAgents(userId: string, daysThreshold: number = 3): Promise<string[]> {
  // This would need to be implemented with a proper query
  // For now, return empty array - will be implemented when needed
  return [];
}

// ============================================
// EXPIRY FORMATTING
// ============================================

/**
 * Format expiry date as human-readable string
 * @param expiryDate - ISO date string
 * @returns Human-readable format like "in 5 days" or "Expired 2 days ago"
 */
export function formatExpiryDate(expiryDate: string): string {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    if (diffDays === 1) return 'Expires tomorrow';
    if (diffDays < 7) return `Expires in ${diffDays} days`;
    if (diffDays < 30) return `Expires in ${Math.ceil(diffDays / 7)} weeks`;
    return `Expires on ${expiry.toLocaleDateString()}`;
  } else if (diffDays === 0) {
    return 'Expires today';
  } else {
    const daysPast = Math.abs(diffDays);
    if (daysPast === 1) return 'Expired yesterday';
    if (daysPast < 7) return `Expired ${daysPast} days ago`;
    return `Expired on ${expiry.toLocaleDateString()}`;
  }
}

/**
 * Get status badge color based on subscription status
 * @param status - Subscription status object
 * @returns Tailwind color classes for badge
 */
export function getStatusBadgeColor(status: SubscriptionStatus): {
  bg: string;
  text: string;
  border: string;
} {
  if (!status.isActive) {
    return {
      bg: 'bg-red-500/20',
      text: 'text-red-500',
      border: 'border-red-500/50'
    };
  }

  if (status.isExpiringSoon) {
    return {
      bg: 'bg-yellow-500/20',
      text: 'text-yellow-500',
      border: 'border-yellow-500/50'
    };
  }

  return {
    bg: 'bg-green-500/20',
    text: 'text-green-500',
    border: 'border-green-500/50'
  };
}

/**
 * Get status label text
 * @param status - Subscription status object
 * @returns Status label like "Active", "Expiring Soon", "Expired"
 */
export function getStatusLabel(status: SubscriptionStatus): string {
  if (!status.isActive) return 'Expired';
  if (status.isExpiringSoon) return 'Expiring Soon';
  return 'Active';
}

// ============================================
// PRICING HELPERS
// ============================================

/**
 * Get subscription cost in USD for a tier
 * @param tier - Pricing tier
 * @returns Cost in USD
 */
export function getSubscriptionCost(tier: 'starter' | 'pro' | 'enterprise'): number {
  const pricing = {
    starter: 99,
    pro: 249,
    enterprise: 599
  };
  return pricing[tier];
}

/**
 * Calculate next renewal date (30 days from now)
 * @returns ISO date string
 */
export function calculateRenewalDate(): string {
  const now = new Date();
  now.setDate(now.getDate() + 30);
  return now.toISOString();
}

/**
 * Calculate expiry date from transaction date
 * @param transactionDate - ISO date string of payment
 * @returns ISO date string of expiry (30 days later)
 */
export function calculateExpiryDate(transactionDate: string): string {
  const date = new Date(transactionDate);
  date.setDate(date.getDate() + 30);
  return date.toISOString();
}

// ============================================
// WEBHOOK HELPERS
// ============================================

/**
 * Check if agent can process messages (for webhook)
 * Returns detailed error message if cannot operate
 * @param agentId - Agent ID
 * @returns Object with canOperate boolean and optional error message
 */
export async function canAgentOperate(agentId: string): Promise<{
  canOperate: boolean;
  error?: string;
}> {
  const status = await getSubscriptionStatus(agentId);

  if (!status.subscription) {
    return {
      canOperate: false,
      error: 'No subscription found. Please contact the agent owner to activate subscription.'
    };
  }

  if (status.subscription.payment_status !== 'confirmed') {
    return {
      canOperate: false,
      error: 'Payment pending confirmation. Please wait a few minutes and try again.'
    };
  }

  if (!status.isActive) {
    return {
      canOperate: false,
      error: `This agent's subscription expired ${formatExpiryDate(status.subscription.expiry_date)}. Please contact the owner to renew.`
    };
  }

  return {
    canOperate: true
  };
}

// ============================================
// RENEWAL HELPERS
// ============================================

/**
 * Check if user can renew subscription
 * @param subscription - Current subscription
 * @returns true if renewal is allowed
 */
export function canRenewSubscription(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  
  // Can renew if expired or expiring within 7 days
  const now = new Date();
  const expiry = new Date(subscription.expiry_date);
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysUntilExpiry <= 7; // Allow renewal up to 7 days before expiry
}

/**
 * Get renewal button text based on status
 * @param status - Subscription status
 * @returns Button text
 */
export function getRenewalButtonText(status: SubscriptionStatus): string {
  if (!status.isActive) return 'Renew Now';
  if (status.isExpiringSoon) return 'Renew Early';
  return 'Auto-Renew On';
}

// ============================================
// USAGE TRACKING
// ============================================

/**
 * Get tier limits for messages per day
 * @param tier - Pricing tier
 * @returns Object with RPM and RPD limits
 */
export function getTierLimits(tier: 'starter' | 'pro' | 'enterprise'): {
  rpm: number; // Requests per minute
  rpd: number; // Requests per day
  label: string;
} {
  const limits = {
    starter: { rpm: 15, rpd: 1000, label: 'Starter' },
    pro: { rpm: 15, rpd: 1000, label: 'Pro' },
    enterprise: { rpm: 15, rpd: 1000, label: 'Enterprise' }
  };
  return limits[tier];
}

/**
 * Check if agent has reached daily message limit
 * @param messageCount - Current message count today
 * @param tier - Pricing tier
 * @returns Object with hasReachedLimit boolean and details
 */
export function checkDailyLimit(
  messageCount: number,
  tier: 'starter' | 'pro' | 'enterprise'
): {
  hasReachedLimit: boolean;
  remaining: number;
  percentage: number;
} {
  const limits = getTierLimits(tier);
  const remaining = Math.max(0, limits.rpd - messageCount);
  const percentage = Math.min(100, (messageCount / limits.rpd) * 100);

  return {
    hasReachedLimit: messageCount >= limits.rpd,
    remaining,
    percentage
  };
}

// ============================================
// EXPORTS
// ============================================

export default {
  isSubscriptionActive,
  getSubscriptionStatus,
  isExpiringSoon,
  getExpiringAgents,
  formatExpiryDate,
  getStatusBadgeColor,
  getStatusLabel,
  getSubscriptionCost,
  calculateRenewalDate,
  calculateExpiryDate,
  canAgentOperate,
  canRenewSubscription,
  getRenewalButtonText,
  getTierLimits,
  checkDailyLimit
};

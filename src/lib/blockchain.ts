/**
 * Blockchain Utilities for USDT Payment Processing on BSC
 * Handles ERC20 token approvals and transfers using wagmi
 */

import { parseUnits, formatUnits } from 'viem';
import { 
  useAccount, 
  useBalance, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useReadContract
} from 'wagmi';
import { bsc } from 'wagmi/chains';

// ============================================
// CONSTANTS
// ============================================

// USDT Contract on BSC Mainnet
export const USDT_CONTRACT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955' as `0x${string}`;

// SmartSentinels Treasury Wallet
export const TREASURY_WALLET = import.meta.env.VITE_SMARTSENTINELS_WALLET as `0x${string}`;

// Pricing in USDT (with 18 decimals)
export const PRICING_TIERS = {
  starter: { usd: 99, label: '$99/month' },
  pro: { usd: 249, label: '$249/month' },
  enterprise: { usd: 499, label: '$499/month' }
};

// ERC20 ABI (minimal - only what we need)
export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

// ============================================
// TYPES
// ============================================

export type PricingTier = 'starter' | 'pro' | 'enterprise';

export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook to check user's USDT balance
 */
export function useUSDTBalance() {
  const { address } = useAccount();

  const { data: balance, isLoading, refetch } = useReadContract({
    address: USDT_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: bsc.id,
  });

  return {
    balance: balance ? formatUnits(balance as bigint, 18) : '0',
    balanceRaw: balance as bigint | undefined,
    isLoading,
    refetch
  };
}

/**
 * Hook to check USDT allowance for treasury
 */
export function useUSDTAllowance() {
  const { address } = useAccount();

  const { data: allowance, isLoading, refetch } = useReadContract({
    address: USDT_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && TREASURY_WALLET ? [address, TREASURY_WALLET] : undefined,
    chainId: bsc.id,
  });

  return {
    allowance: allowance ? formatUnits(allowance as bigint, 18) : '0',
    allowanceRaw: allowance as bigint | undefined,
    isLoading,
    refetch
  };
}

/**
 * Hook to approve USDT spending
 */
export function useApproveUSDT() {
  const { address: account } = useAccount();
  const { writeContract, data: hash, isPending, isError, error } = useWriteContract();

  const approve = async (amount: string) => {
    try {
      const amountBigInt = parseUnits(amount, 18);
      
      writeContract({
        address: USDT_CONTRACT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [TREASURY_WALLET, amountBigInt],
        chain: bsc,
        account: account!,
      });

      return true;
    } catch (err) {
      console.error('Approval error:', err);
      return false;
    }
  };

  return {
    approve,
    approvalHash: hash,
    isApproving: isPending,
    isError,
    error
  };
}

/**
 * Hook to transfer USDT to treasury
 */
export function useTransferUSDT() {
  const { address: account } = useAccount();
  const { writeContract, data: hash, isPending, isError, error } = useWriteContract();

  const transfer = async (amount: string) => {
    try {
      const amountBigInt = parseUnits(amount, 18);
      
      writeContract({
        address: USDT_CONTRACT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [TREASURY_WALLET, amountBigInt],
        chain: bsc,
        account: account!,
      });

      return true;
    } catch (err) {
      console.error('Transfer error:', err);
      return false;
    }
  };

  return {
    transfer,
    transferHash: hash,
    isTransferring: isPending,
    isError,
    error
  };
}

/**
 * Hook to wait for transaction confirmation
 */
export function useWaitForPayment(hash: `0x${string}` | undefined) {
  const { data: receipt, isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
    chainId: bsc.id,
  });

  return {
    receipt,
    isConfirming: isLoading,
    isConfirmed: isSuccess,
    isError
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get USDT amount for pricing tier
 * @param tier - Pricing tier (starter, pro, enterprise)
 * @returns Amount in USDT as string
 */
export function getPaymentAmount(tier: PricingTier): string {
  return PRICING_TIERS[tier].usd.toString();
}

/**
 * Convert USDT amount to wei (18 decimals)
 */
export function usdtToWei(amount: string): bigint {
  return parseUnits(amount, 18);
}

/**
 * Convert wei to USDT (human-readable)
 */
export function weiToUsdt(wei: bigint): string {
  return formatUnits(wei, 18);
}

/**
 * Check if user has sufficient USDT balance
 * @param userBalance - User's current balance in USDT (string)
 * @param requiredAmount - Required amount in USDT (string)
 * @returns true if balance is sufficient
 */
export function hasSufficientBalance(userBalance: string, requiredAmount: string): boolean {
  try {
    const balance = parseFloat(userBalance);
    const required = parseFloat(requiredAmount);
    return balance >= required;
  } catch (error) {
    console.error('Error checking balance:', error);
    return false;
  }
}

/**
 * Check if allowance is sufficient
 * @param currentAllowance - Current allowance in USDT (string)
 * @param requiredAmount - Required amount in USDT (string)
 * @returns true if allowance is sufficient
 */
export function hasSufficientAllowance(currentAllowance: string, requiredAmount: string): boolean {
  try {
    const allowance = parseFloat(currentAllowance);
    const required = parseFloat(requiredAmount);
    return allowance >= required;
  } catch (error) {
    console.error('Error checking allowance:', error);
    return false;
  }
}

/**
 * Format transaction hash for display
 */
export function formatTxHash(hash: string): string {
  if (!hash) return '';
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

/**
 * Get BSCScan link for transaction
 */
export function getBSCScanLink(hash: string): string {
  return `https://bscscan.com/tx/${hash}`;
}

/**
 * Validate wallet address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// ============================================
// PAYMENT FLOW HELPERS
// ============================================

/**
 * Complete payment flow status
 */
export enum PaymentStep {
  IDLE = 'idle',
  CHECKING_BALANCE = 'checking_balance',
  INSUFFICIENT_BALANCE = 'insufficient_balance',
  APPROVING = 'approving',
  APPROVAL_PENDING = 'approval_pending',
  APPROVAL_CONFIRMED = 'approval_confirmed',
  TRANSFERRING = 'transferring',
  TRANSFER_PENDING = 'transfer_pending',
  TRANSFER_CONFIRMED = 'transfer_confirmed',
  ERROR = 'error'
}

/**
 * Get human-readable payment step message
 */
export function getPaymentStepMessage(step: PaymentStep): string {
  const messages: Record<PaymentStep, string> = {
    [PaymentStep.IDLE]: 'Ready to process payment',
    [PaymentStep.CHECKING_BALANCE]: 'Checking your USDT balance...',
    [PaymentStep.INSUFFICIENT_BALANCE]: 'Insufficient USDT balance',
    [PaymentStep.APPROVING]: 'Approve USDT spending in your wallet...',
    [PaymentStep.APPROVAL_PENDING]: 'Waiting for approval confirmation...',
    [PaymentStep.APPROVAL_CONFIRMED]: 'Approval confirmed! Processing payment...',
    [PaymentStep.TRANSFERRING]: 'Confirm payment in your wallet...',
    [PaymentStep.TRANSFER_PENDING]: 'Payment processing on BSC...',
    [PaymentStep.TRANSFER_CONFIRMED]: 'Payment successful! ✅',
    [PaymentStep.ERROR]: 'Payment failed. Please try again.'
  };

  return messages[step];
}

/**
 * Calculate total cost including gas estimate
 * Note: This is approximate - actual gas will vary
 */
export function estimateTotalCost(tier: PricingTier): {
  usdtAmount: string;
  estimatedGasUSD: string;
  totalUSD: string;
} {
  const usdtAmount = PRICING_TIERS[tier].usd.toString();
  const estimatedGasUSD = '0.10'; // Approximate $0.10 for BSC gas
  const totalUSD = (parseFloat(usdtAmount) + parseFloat(estimatedGasUSD)).toFixed(2);

  return {
    usdtAmount,
    estimatedGasUSD,
    totalUSD
  };
}

// ============================================
// EXPORTS
// ============================================

export default {
  USDT_CONTRACT_ADDRESS,
  TREASURY_WALLET,
  PRICING_TIERS,
  ERC20_ABI,
  getPaymentAmount,
  usdtToWei,
  weiToUsdt,
  hasSufficientBalance,
  hasSufficientAllowance,
  formatTxHash,
  getBSCScanLink,
  isValidAddress,
  getPaymentStepMessage,
  estimateTotalCost
};

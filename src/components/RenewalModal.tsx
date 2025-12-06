import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, DollarSign, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { useAccount } from 'wagmi';
import { PRICING_TIERS } from '@/lib/blockchain';
import { useTransferUSDT, useWaitForPayment, hasSufficientBalance, useUSDTBalance } from '@/lib/blockchain';
import { createSubscription, getAgent } from '@/lib/supabase';

interface RenewalModalProps {
  agentId: string;
  agentName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RenewalModal({ agentId, agentName, onClose, onSuccess }: RenewalModalProps) {
  const { address } = useAccount();
  const [step, setStep] = useState<'select' | 'paying' | 'success'>('select');
  const [selectedTier, setSelectedTier] = useState<'starter' | 'pro' | 'enterprise'>('starter');
  const [txHash, setTxHash] = useState<string>('');
  const [agent, setAgent] = useState<any>(null);

  const { balance, isLoading: balanceLoading, refetch: refetchBalance } = useUSDTBalance();
  const { transfer, transferHash, isTransferring } = useTransferUSDT();
  const paymentStatus = useWaitForPayment(transferHash);
  const { isConfirming, isConfirmed } = paymentStatus;

  useEffect(() => {
    loadAgent();
  }, [agentId]);

  useEffect(() => {
    if (transferHash) {
      setTxHash(transferHash);
    }
  }, [transferHash]);

  useEffect(() => {
    if (isConfirmed && txHash) {
      handlePaymentConfirmed();
    }
  }, [isConfirmed, txHash]);

  const loadAgent = async () => {
    const agentData = await getAgent(agentId);
    setAgent(agentData);
    if (agentData) {
      setSelectedTier(agentData.pricing_tier as any);
    }
  };

  const handlePayment = async () => {
    if (!address || !agent) return;

    const amount = PRICING_TIERS[selectedTier].usd.toString();
    
    // Check balance
    const hasBalance = await hasSufficientBalance(address, amount);
    if (!hasBalance) {
      alert(`Insufficient USDT balance. You need ${amount} USDT.`);
      return;
    }

    setStep('paying');
    await transfer(amount);
  };

  const handlePaymentConfirmed = async () => {
    if (!address || !agent) return;

    try {
      // Create new subscription
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now

      const subscriptionData = {
        user_id: agent.user_id,
        agent_id: agentId,
        subscription_tier: selectedTier,
        subscription_cost_usd: PRICING_TIERS[selectedTier].usd,
        payment_status: 'confirmed' as const,
        transaction_hash: txHash,
        transaction_date: new Date().toISOString(),
        expiry_date: expiryDate.toISOString(),
        auto_renew: true
      };

      const success = await createSubscription(subscriptionData);
      
      if (success) {
        setStep('success');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 3000);
      } else {
        alert('Failed to create subscription. Please contact support with transaction hash: ' + txHash);
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('Error processing renewal. Please contact support.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card p-6 max-w-lg w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-orbitron font-bold">Renew Subscription</h2>
            <p className="text-sm text-muted-foreground">{agentName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary/20 transition"
            disabled={step === 'paying'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step 1: Select Tier */}
        {step === 'select' && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">Select subscription tier:</p>
              <div className="space-y-2">
                {Object.entries(PRICING_TIERS).map(([tier, info]) => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier as any)}
                    className={`w-full p-4 rounded-lg border-2 transition ${
                      selectedTier === tier
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="font-bold capitalize">{tier}</p>
                        <p className="text-xs text-muted-foreground">30 days access</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">${info.usd}</p>
                        <p className="text-xs text-muted-foreground">USDT</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Balance Info */}
            <div className="bg-secondary/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Your USDT Balance</p>
              <p className="text-lg font-bold">
                {balanceLoading ? '...' : balance || '0'} USDT
              </p>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={balanceLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-bold disabled:opacity-50"
            >
              <DollarSign size={20} />
              Pay ${PRICING_TIERS[selectedTier].usd} USDT
            </button>
          </div>
        )}

        {/* Step 2: Payment Processing */}
        {step === 'paying' && (
          <div className="text-center py-8">
            <div className="mb-6">
              {!txHash ? (
                <Loader2 className="animate-spin mx-auto text-primary" size={48} />
              ) : isConfirming ? (
                <Loader2 className="animate-spin mx-auto text-primary" size={48} />
              ) : null}
            </div>

            <h3 className="text-xl font-bold mb-2">
              {!txHash
                ? 'Waiting for wallet confirmation...'
                : isConfirming
                ? 'Confirming transaction...'
                : 'Processing payment...'}
            </h3>

            <p className="text-sm text-muted-foreground mb-4">
              {!txHash
                ? 'Please confirm the transaction in your wallet'
                : 'Please wait while your transaction is confirmed on the blockchain'}
            </p>

            {txHash && (
              <a
                href={`https://bscscan.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                View on BSCScan <ExternalLink size={14} />
              </a>
            )}
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mb-6"
            >
              <CheckCircle className="mx-auto text-green-500" size={64} />
            </motion.div>

            <h3 className="text-2xl font-bold mb-2">Renewal Successful!</h3>
            <p className="text-muted-foreground mb-4">
              Your agent subscription has been renewed for 30 days.
            </p>

            {txHash && (
              <a
                href={`https://bscscan.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                View Transaction <ExternalLink size={14} />
              </a>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

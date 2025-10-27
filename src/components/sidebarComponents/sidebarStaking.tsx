import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, DollarSign, Target, Zap, Shield, Coins, Lock } from 'lucide-react';

const StakingPoolCard = ({
  name,
  apy,
  duration,
  minStake,
  rewards,
  icon: Icon,
  isPopular = false
}: {
  name: string;
  apy: number;
  duration: string;
  minStake: string;
  rewards: string;
  icon: any;
  isPopular?: boolean;
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`glass-card p-4 sm:p-5 md:p-6 relative ${isPopular ? 'ring-2 ring-primary' : ''}`}
    >
      {isPopular && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-bold">
          Popular
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
          <Icon size={18} className="sm:w-5 sm:h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm sm:text-base">{name}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">{duration}</p>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm text-muted-foreground">APY</span>
          <span className="font-bold text-green-400 text-sm sm:text-base">{apy}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm text-muted-foreground">Min Stake</span>
          <span className="font-medium text-xs sm:text-sm">{minStake} SSTL</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm text-muted-foreground">Rewards</span>
          <span className="font-medium text-xs sm:text-sm">{rewards}</span>
        </div>
      </div>

      <button
        className="w-full mt-3 sm:mt-4 px-3 sm:px-4 py-2 bg-muted text-muted-foreground cursor-not-allowed rounded-lg font-medium text-xs sm:text-sm"
        disabled
      >
        Stake (Coming Soon)
      </button>
    </motion.div>
  );
};

const SidebarStaking = () => {
  const [selectedPool, setSelectedPool] = useState<string | null>(null);

  const stakingPools = [
    {
      id: 'flexible',
      name: 'Flexible Staking',
      apy: 8.5,
      duration: 'Flexible',
      minStake: '100',
      rewards: 'Daily',
      icon: Zap,
      description: 'Stake anytime, unstake anytime with competitive APY'
    },
    {
      id: '30days',
      name: '30-Day Lock',
      apy: 12.5,
      duration: '30 Days',
      minStake: '500',
      rewards: 'End of period',
      icon: Clock,
      isPopular: true,
      description: 'Higher APY for committed stakers'
    },
    {
      id: '90days',
      name: '90-Day Lock',
      apy: 18.0,
      duration: '90 Days',
      minStake: '1000',
      rewards: 'End of period',
      icon: Shield,
      description: 'Maximum rewards for long-term holders'
    },
    {
      id: 'nft-boost',
      name: 'Genesis NFT Boost Pool',
      apy: 100.0,
      duration: 'Flexible',
      minStake: '100',
      rewards: 'Daily + NFT Bonus',
      icon: Target,
      description: 'Extra rewards for NFT holders'
    }
  ];

  const totalStaked = 125000; // Example data
  const totalStakers = 1250;
  const averageAPY = 15.2;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-6 sm:mb-8"
      >
        <h2 className="text-xl sm:text-2xl font-orbitron font-bold mb-3 sm:mb-4 text-foreground">
          Staking Dashboard
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-4 sm:space-y-6"
      >
        {/* Staking Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="glass-card p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="text-primary" size={16} />
              <span className="text-xs sm:text-sm font-medium">Total Staked</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold">{totalStaked.toLocaleString()} SSTL</div>
          </div>

          <div className="glass-card p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-primary" size={16} />
              <span className="text-xs sm:text-sm font-medium">Active Stakers</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold">{totalStakers.toLocaleString()}</div>
          </div>

          <div className="glass-card p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-primary" size={16} />
              <span className="text-xs sm:text-sm font-medium">Average APY</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-green-400">{averageAPY}%</div>
          </div>
        </div>

        {/* Staking Pools */}
        <div className="glass-card p-4 sm:p-5 md:p-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Lock size={18} className="sm:w-5 sm:h-5" />
            Staking Pools
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            Choose a staking pool that fits your investment strategy. Higher lock periods offer better APY rates.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {stakingPools.map((pool) => (
              <StakingPoolCard
                key={pool.id}
                name={pool.name}
                apy={pool.apy}
                duration={pool.duration}
                minStake={pool.minStake}
                rewards={pool.rewards}
                icon={pool.icon}
                isPopular={pool.isPopular}
              />
            ))}
          </div>
        </div>

        {/* Staking Benefits */}
        <div className="glass-card p-4 sm:p-5 md:p-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Staking Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-lg flex-shrink-0">
                <TrendingUp size={14} className="sm:w-4 sm:h-4 text-green-500" />
              </div>
              <div>
                <h4 className="font-medium mb-0.5 sm:mb-1 text-sm sm:text-base">Earn Passive Income</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Generate SSTL rewards automatically through staking
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
                <Shield size={14} className="sm:w-4 sm:h-4 text-blue-500" />
              </div>
              <div>
                <h4 className="font-medium mb-0.5 sm:mb-1 text-sm sm:text-base">Secure the Network</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Help maintain network security and stability
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-500/10 rounded-lg flex-shrink-0">
                <Target size={14} className="sm:w-4 sm:h-4 text-purple-500" />
              </div>
              <div>
                <h4 className="font-medium mb-0.5 sm:mb-1 text-sm sm:text-base">NFT Boost Rewards</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Additional rewards for AI Audit NFT holders
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-orange-500/10 rounded-lg flex-shrink-0">
                <Zap size={14} className="sm:w-4 sm:h-4 text-orange-500" />
              </div>
              <div>
                <h4 className="font-medium mb-0.5 sm:mb-1 text-sm sm:text-base">Flexible Options</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Choose between flexible or locked staking periods
                </p>
              </div>
            </div>
          </div>
        </div>

        {selectedPool && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-4 sm:p-5 md:p-6 border-primary/50"
          >
            <h4 className="text-base sm:text-lg font-semibold mb-2">Selected Pool</h4>
            <p className="text-sm sm:text-base text-muted-foreground">
              {stakingPools.find(p => p.id === selectedPool)?.name} - Ready for staking
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default SidebarStaking;
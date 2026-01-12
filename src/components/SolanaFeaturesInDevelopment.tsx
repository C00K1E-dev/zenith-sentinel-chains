import React from 'react';
import { Rocket, Shield, Bot, Image as ImageIcon, Loader2 } from 'lucide-react';

const SolanaFeaturesInDevelopment: React.FC = () => {
  const developmentFeatures = [
    {
      icon: ImageIcon,
      title: 'Solana NFT Collection',
      description: 'Launch and manage NFT collections on Solana with low fees and fast transactions',
      status: 'In Development',
    },
    {
      icon: Bot,
      title: 'Solana AI Agents',
      description: 'Deploy intelligent agents on the Solana blockchain for automated operations',
      status: 'In Development',
    },
    {
      icon: Shield,
      title: 'Solana Contract Audit',
      description: 'AI-powered security audits for Solana smart contracts and programs',
      status: 'Planned',
    },
    {
      icon: Rocket,
      title: 'Solana Staking',
      description: 'Stake your tokens and earn rewards on the Solana network',
      status: 'Planned',
    },
  ];

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          <h3 className="text-lg font-display font-bold text-white">
            Solana Features
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Building the future on Solana
        </p>
      </div>

      {/* Development Status Banner */}
      <div className="glass-card border border-purple-500/30 rounded-lg p-3 bg-purple-500/5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <Rocket className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-white mb-1">
              Development in Progress
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We're actively building Solana features. Connect your Solflare wallet to be ready for launch!
            </p>
          </div>
        </div>
      </div>

      {/* Features List */}
      <div className="space-y-3">
        {developmentFeatures.map((feature, index) => {
          const Icon = feature.icon;
          const isInDevelopment = feature.status === 'In Development';
          
          return (
            <div
              key={index}
              className="glass-card border border-border/30 rounded-lg p-3 hover:border-purple-500/30 transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  isInDevelopment 
                    ? 'bg-purple-500/10 border border-purple-500/30' 
                    : 'bg-white/5 border border-white/10'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    isInDevelopment ? 'text-purple-400' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {feature.title}
                    </h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap ${
                      isInDevelopment
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                        : 'bg-white/5 text-muted-foreground border border-white/10'
                    }`}>
                      {feature.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Coming Soon Note */}
      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">
          Stay tuned for updates on Solana integration
        </p>
      </div>
    </div>
  );
};

export default SolanaFeaturesInDevelopment;

import React from 'react';
import { LucideIcon, Loader2, AlertCircle } from 'lucide-react';

interface SolanaFeaturePageProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  comingSoonFeatures?: string[];
}

const SolanaFeaturePage: React.FC<SolanaFeaturePageProps> = ({
  icon: Icon,
  title,
  description,
  features,
  comingSoonFeatures = [],
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Icon className="w-6 h-6 text-purple-400" />
          <h1 className="text-3xl font-display font-bold text-white">{title}</h1>
          <span className="px-3 py-1 text-xs rounded-full font-medium bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            In Development
          </span>
        </div>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {/* Development Notice */}
      <div className="glass-card border border-purple-500/30 rounded-xl p-6 bg-purple-500/5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <AlertCircle className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              Feature Under Development
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              We're actively building this feature for Solana. Your Solflare wallet is connected and ready 
              for when this feature launches! All features will leverage Solana's high-speed, low-cost infrastructure.
            </p>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Grid */}
      {comingSoonFeatures.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comingSoonFeatures.map((feature, index) => (
            <div
              key={index}
              className="glass-card border border-border/30 rounded-lg p-4 hover:border-purple-500/30 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">{feature}</h4>
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              </div>
              <p className="text-xs text-muted-foreground">Coming soon to Solana</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SolanaFeaturePage;

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useChain } from '@/contexts/ChainContext';

interface SolflareConnectPromptProps {
  onConnect: () => void;
}

const SolflareConnectPrompt: React.FC<SolflareConnectPromptProps> = ({ onConnect }) => {
  const { chainConfig } = useChain();

  const handleInstallSolflare = () => {
    window.open('https://solflare.com/', '_blank');
  };

  const handleConnectMobile = () => {
    window.open('https://solflare.com/download', '_blank');
  };

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <img
          src={chainConfig.logo}
          alt="Solana"
          className="w-12 h-12 mx-auto rounded-full"
        />
        <h3 className="text-lg font-display font-bold text-white">
          Connect Solflare Wallet
        </h3>
        <p className="text-xs text-muted-foreground">
          Connect your Solflare wallet to access Solana features
        </p>
      </div>

      {/* Connect Options */}
      <div className="space-y-3">
        {/* Extension Option */}
        <button
          onClick={onConnect}
          className="w-full glass-card border border-purple-500/30 rounded-lg p-4 hover:border-purple-500/50 transition-all duration-200 group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 group-hover:bg-purple-500/20 transition-all duration-200">
              <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white">Browser Extension</p>
              <p className="text-xs text-muted-foreground">Connect via Solflare extension</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-purple-400 transition-colors" />
          </div>
        </button>

        {/* Mobile Option */}
        <button
          onClick={handleConnectMobile}
          className="w-full glass-card border border-border/30 rounded-lg p-4 hover:border-purple-500/30 transition-all duration-200 group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:bg-purple-500/10 group-hover:border-purple-500/30 transition-all duration-200">
              <svg className="w-6 h-6 text-muted-foreground group-hover:text-purple-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white">Mobile App</p>
              <p className="text-xs text-muted-foreground">Connect via Solflare mobile app</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-purple-400 transition-colors" />
          </div>
        </button>
      </div>

      {/* Don't have Solflare? */}
      <div className="glass-card border border-border/30 rounded-lg p-3">
        <p className="text-xs text-muted-foreground text-center mb-2">
          Don't have Solflare wallet?
        </p>
        <button
          onClick={handleInstallSolflare}
          className="w-full px-3 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2"
        >
          Install Solflare
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Info Note */}
      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">
          Solflare is a secure, non-custodial wallet for Solana
        </p>
      </div>
    </div>
  );
};

export default SolflareConnectPrompt;

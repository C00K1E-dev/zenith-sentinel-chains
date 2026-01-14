import React from 'react';
import ReactDOM from 'react-dom';
import { ExternalLink, X } from 'lucide-react';
import { useChain } from '@/contexts/ChainContext';

interface SolflareConnectPromptProps {
  onConnect: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

const SolflareConnectPrompt: React.FC<SolflareConnectPromptProps> = ({ onConnect, onClose, isModal = false }) => {
  const { chainConfig } = useChain();

  const handleInstallSolflare = () => {
    window.open('https://solflare.com/', '_blank');
  };

  const handleConnectMobile = () => {
    window.open('https://solflare.com/download', '_blank');
  };

  const content = (
    <div className="px-4 py-6 space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <img src="/assets/solflare.webp" alt="Solflare" className="w-12 h-12 mx-auto" />
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
              <img src="/assets/solflare.webp" alt="Solflare" className="w-6 h-6" />
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

  // If not modal mode, render inline
  if (!isModal) {
    return content;
  }

  // Modal mode - render via portal
  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-[9998]" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-[#0f1729] border border-purple-500/30 rounded-2xl shadow-2xl z-[9999]">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        )}
        {content}
      </div>
    </>,
    document.body
  );
};

export default SolflareConnectPrompt;

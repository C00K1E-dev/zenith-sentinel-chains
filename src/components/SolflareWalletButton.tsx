import React, { useState, useEffect } from 'react';
import { Wallet, Copy, ExternalLink, LogOut, Check } from 'lucide-react';
import { useChain } from '@/contexts/ChainContext';

interface SolflareWalletButtonProps {
  onDisconnect: () => void;
}

const SolflareWalletButton: React.FC<SolflareWalletButtonProps> = ({ onDisconnect }) => {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const getSolflareAddress = async () => {
      try {
        const solflare = (window as any).solflare;
        if (solflare && solflare.isConnected) {
          const publicKey = solflare.publicKey?.toString();
          if (publicKey) {
            setWalletAddress(publicKey);
          }
        }
      } catch (error) {
        console.error('Error getting Solflare address:', error);
      }
    };

    getSolflareAddress();
  }, []);

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = async () => {
    try {
      const solflare = (window as any).solflare;
      if (solflare) {
        await solflare.disconnect();
      }
      onDisconnect();
      setIsOpen(false);
    } catch (error) {
      console.error('Error disconnecting Solflare:', error);
    }
  };

  const handleViewExplorer = () => {
    if (walletAddress) {
      window.open(`https://explorer.solana.com/address/${walletAddress}`, '_blank');
    }
  };

  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl px-4 py-3 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Wallet size={16} className="text-purple-400" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-purple-400">Solflare</span>
            </div>
            <p className="text-sm font-semibold text-white">
              {shortenAddress(walletAddress)}
            </p>
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 left-0 right-0 bg-[#0f1729] border border-purple-500/30 rounded-lg shadow-2xl z-50 overflow-hidden">
            <div className="p-2 space-y-1">
              {/* Copy Address */}
              <button
                onClick={handleCopyAddress}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-foreground transition-all duration-200 text-left"
              >
                {copied ? (
                  <Check size={16} className="text-green-400" />
                ) : (
                  <Copy size={16} className="text-muted-foreground" />
                )}
                <span className="text-sm font-medium">
                  {copied ? 'Copied!' : 'Copy Address'}
                </span>
              </button>

              {/* View in Explorer */}
              <button
                onClick={handleViewExplorer}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-foreground transition-all duration-200 text-left"
              >
                <ExternalLink size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium">View in Explorer</span>
              </button>

              {/* Separator */}
              <div className="border-t border-white/10 my-1"></div>

              {/* Disconnect */}
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-all duration-200 text-left"
              >
                <LogOut size={16} />
                <span className="text-sm font-medium">Disconnect</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SolflareWalletButton;

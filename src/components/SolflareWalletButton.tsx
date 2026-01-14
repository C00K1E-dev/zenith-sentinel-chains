import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Copy, ExternalLink, LogOut, Check, X } from 'lucide-react';
import { useChain } from '@/contexts/ChainContext';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

interface SolflareWalletButtonProps {
  onDisconnect: () => void;
}

const SolflareWalletButton: React.FC<SolflareWalletButtonProps> = ({ onDisconnect }) => {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const getSolflareData = async () => {
      try {
        const solflare = (window as any).solflare;
        if (solflare && solflare.isConnected) {
          const publicKey = solflare.publicKey?.toString();
          if (publicKey) {
            setWalletAddress(publicKey);
            
            // Fetch balance from devnet
            const connection = new Connection('https://api.devnet.solana.com');
            const pubKey = new PublicKey(publicKey);
            const balanceInLamports = await connection.getBalance(pubKey);
            const balanceInSOL = (balanceInLamports / LAMPORTS_PER_SOL).toFixed(6);
            setBalance(balanceInSOL);
          }
        }
      } catch (error) {
        console.error('Error getting Solflare data:', error);
      }
    };

    getSolflareData();
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
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error disconnecting Solflare:', error);
    }
  };

  const handleViewExplorer = () => {
    if (walletAddress) {
      window.open(`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`, '_blank');
    }
  };

  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <>
      {/* Wallet Card Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl px-3 py-2.5 transition-all duration-200"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/assets/solflare.webp" alt="Solflare" className="w-6 h-6 flex-shrink-0" />
            <span className="text-sm font-semibold text-white truncate">
              {shortenAddress(walletAddress)}
            </span>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
            {balance} SOL
          </span>
        </div>
      </button>

      {/* Modal */}
      {isModalOpen && ReactDOM.createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 z-[9998]" 
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-[#0f1729] border border-purple-500/30 rounded-2xl shadow-2xl z-[9999] p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src="/assets/solflare.webp" alt="Solflare" className="w-10 h-10" />
                <div>
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    {shortenAddress(walletAddress)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyAddress();
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Balance Display */}
            <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img 
                    src="https://cryptologos.cc/logos/solana-sol-logo.png" 
                    alt="Solana" 
                    className="w-6 h-6"
                  />
                  <span className="text-sm text-gray-300">Solana Devnet</span>
                </div>
                <span className="text-lg font-bold text-white">{balance} SOL</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 mb-6">
              {/* View in Explorer */}
              <button
                onClick={handleViewExplorer}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-foreground transition-all duration-200 text-left"
              >
                <ExternalLink size={18} className="text-muted-foreground" />
                <span className="text-sm font-medium">View in Explorer</span>
              </button>
            </div>

            {/* Separator */}
            <div className="border-t border-white/10 mb-4"></div>

            {/* Disconnect Button */}
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all duration-200"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Disconnect Wallet</span>
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default SolflareWalletButton;

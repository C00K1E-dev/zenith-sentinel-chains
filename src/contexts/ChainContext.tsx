import React, { createContext, useContext, useState, useEffect } from 'react';

export type ChainType = 'bnb' | 'solana' | 'sui' | 'base';

export interface ChainStatus {
  label: string;
  status: 'active' | 'development' | 'coming-soon';
  logo: string;
  requiresWallet?: 'metamask' | 'solflare' | 'sui-wallet';
}

export const CHAIN_CONFIGS: Record<ChainType, ChainStatus> = {
  bnb: {
    label: 'BNB Chain',
    status: 'active',
    logo: 'https://icons.llamao.fi/icons/chains/rsz_binance.jpg',
    requiresWallet: 'metamask',
  },
  solana: {
    label: 'Solana',
    status: 'development',
    logo: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    requiresWallet: 'solflare',
  },
  sui: {
    label: 'SUI',
    status: 'coming-soon',
    logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/20947.png',
    requiresWallet: 'sui-wallet',
  },
  base: {
    label: 'BASE',
    status: 'coming-soon',
    logo: 'https://icons.llamao.fi/icons/chains/rsz_base.jpg',
    requiresWallet: 'metamask',
  },
};

interface ChainContextType {
  selectedChain: ChainType;
  setSelectedChain: (chain: ChainType) => void;
  chainConfig: ChainStatus;
  isSolflareConnected: boolean;
  setIsSolflareConnected: (connected: boolean) => void;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

export const ChainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedChain, setSelectedChain] = useState<ChainType>('bnb');
  const [isSolflareConnected, setIsSolflareConnected] = useState(false);

  const chainConfig = CHAIN_CONFIGS[selectedChain];

  // Check if Solflare is connected on mount and chain change
  useEffect(() => {
    if (selectedChain === 'solana') {
      checkSolflareConnection();
    }
  }, [selectedChain]);

  const checkSolflareConnection = async () => {
    try {
      const solflare = (window as any).solflare;
      if (solflare && solflare.isConnected) {
        setIsSolflareConnected(true);
      } else {
        setIsSolflareConnected(false);
      }
    } catch (error) {
      console.error('Error checking Solflare connection:', error);
      setIsSolflareConnected(false);
    }
  };

  return (
    <ChainContext.Provider
      value={{
        selectedChain,
        setSelectedChain,
        chainConfig,
        isSolflareConnected,
        setIsSolflareConnected,
      }}
    >
      {children}
    </ChainContext.Provider>
  );
};

export const useChain = () => {
  const context = useContext(ChainContext);
  if (!context) {
    throw new Error('useChain must be used within a ChainProvider');
  }
  return context;
};

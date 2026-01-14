import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export type ChainType = 'bnb' | 'solana' | 'sui' | 'base';

// Helper function to detect chain from URL path
const getChainFromPath = (pathname: string): ChainType | null => {
  if (pathname.includes('solana-') || pathname.includes('/solana')) {
    return 'solana';
  }
  // Add more chain detection as needed
  // if (pathname.includes('sui-') || pathname.includes('/sui')) {
  //   return 'sui';
  // }
  // if (pathname.includes('base-') || pathname.includes('/base')) {
  //   return 'base';
  // }
  return null;
};

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

// Get initial chain from URL on page load
const getInitialChain = (): ChainType => {
  const pathname = window.location.pathname;
  return getChainFromPath(pathname) || 'bnb';
};

export const ChainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedChain, setSelectedChain] = useState<ChainType>(getInitialChain);
  const [isSolflareConnected, setIsSolflareConnected] = useState(false);
  
  // Get current location to detect chain from URL
  let location: { pathname: string } | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    location = useLocation();
  } catch {
    // useLocation may fail if not within Router context (e.g., during initial render)
    location = { pathname: window.location.pathname };
  }

  const chainConfig = CHAIN_CONFIGS[selectedChain];

  // Auto-detect chain from URL path on route changes
  useEffect(() => {
    if (location) {
      const detectedChain = getChainFromPath(location.pathname);
      if (detectedChain && detectedChain !== selectedChain) {
        setSelectedChain(detectedChain);
      }
    }
  }, [location?.pathname]);

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

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ChainConfig {
  chainId: string;
  name: string;
  shortName: string;
  logo: string; // URL or emoji
  available: boolean;
}

// All chains available on Etherscan V2 API - matching official availability list
export const SUPPORTED_CHAINS: ChainConfig[] = [
  // Mainnets - Popular Chains
  { chainId: '1', name: 'Ethereum Mainnet', shortName: 'Ethereum', logo: 'https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg', available: true },
  { chainId: '137', name: 'Polygon Mainnet', shortName: 'Polygon', logo: 'https://icons.llamao.fi/icons/chains/rsz_polygon.jpg', available: true },
  { chainId: '42161', name: 'Arbitrum One', shortName: 'Arbitrum', logo: 'https://icons.llamao.fi/icons/chains/rsz_arbitrum.jpg', available: true },
  { chainId: '10', name: 'OP Mainnet', shortName: 'Optimism', logo: 'https://icons.llamao.fi/icons/chains/rsz_optimism.jpg', available: false },
  { chainId: '8453', name: 'Base Mainnet', shortName: 'Base', logo: 'https://icons.llamao.fi/icons/chains/rsz_base.jpg', available: false },
  { chainId: '56', name: 'BNB Smart Chain', shortName: 'BSC', logo: 'https://icons.llamao.fi/icons/chains/rsz_binance.jpg', available: false },
  { chainId: '43114', name: 'Avalanche C-Chain', shortName: 'Avalanche', logo: 'https://icons.llamao.fi/icons/chains/rsz_avalanche.jpg', available: false },
  
  // Layer 2s & Scaling
  { chainId: '42170', name: 'Arbitrum Nova', shortName: 'Arb Nova', logo: 'https://icons.llamao.fi/icons/chains/rsz_arbitrum.jpg', available: true },
  { chainId: '81457', name: 'Blast Mainnet', shortName: 'Blast', logo: 'https://icons.llamao.fi/icons/chains/rsz_blast.jpg', available: true },
  { chainId: '59144', name: 'Linea Mainnet', shortName: 'Linea', logo: 'https://icons.llamao.fi/icons/chains/rsz_linea.jpg', available: true },
  { chainId: '5000', name: 'Mantle Mainnet', shortName: 'Mantle', logo: 'https://icons.llamao.fi/icons/chains/rsz_mantle.jpg', available: true },
  { chainId: '534352', name: 'Scroll Mainnet', shortName: 'Scroll', logo: 'https://icons.llamao.fi/icons/chains/rsz_scroll.jpg', available: true },
  { chainId: '324', name: 'zkSync Mainnet', shortName: 'zkSync', logo: 'https://icons.llamao.fi/icons/chains/rsz_zksync%20era.jpg', available: true },
  { chainId: '204', name: 'opBNB Mainnet', shortName: 'opBNB', logo: 'https://icons.llamao.fi/icons/chains/rsz_binance.jpg', available: true },
  
  // DeFi & Gaming Chains
  { chainId: '252', name: 'Fraxtal Mainnet', shortName: 'Fraxtal', logo: 'https://icons.llamao.fi/icons/chains/rsz_fraxtal.jpg', available: true },
  { chainId: '100', name: 'Gnosis Chain', shortName: 'Gnosis', logo: 'https://icons.llamao.fi/icons/chains/rsz_xdai.jpg', available: true },
  { chainId: '42220', name: 'Celo Mainnet', shortName: 'Celo', logo: 'https://icons.llamao.fi/icons/chains/rsz_celo.jpg', available: true },
  { chainId: '1284', name: 'Moonbeam', shortName: 'Moonbeam', logo: 'https://icons.llamao.fi/icons/chains/rsz_moonbeam.jpg', available: true },
  { chainId: '1285', name: 'Moonriver', shortName: 'Moonriver', logo: 'https://icons.llamao.fi/icons/chains/rsz_moonriver.jpg', available: true },
  
  // New & Emerging Chains
  { chainId: '2741', name: 'Abstract Mainnet', shortName: 'Abstract', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/31861.png', available: true },
  { chainId: '33139', name: 'ApeChain Mainnet', shortName: 'ApeChain', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/28298.png', available: true },
  { chainId: '80094', name: 'Berachain', shortName: 'Berachain', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/30533.png', available: true },
  { chainId: '199', name: 'BitTorrent Chain', shortName: 'BTTC', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/16086.png', available: true },
  { chainId: '999', name: 'HyperEVM', shortName: 'HyperEVM', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/32681.png', available: true },
  { chainId: '747474', name: 'Katana Mainnet', shortName: 'Katana', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/20396.png', available: true },
  { chainId: '143', name: 'Monad Mainnet', shortName: 'Monad', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/33789.png', available: true },
  { chainId: '1329', name: 'Sei Mainnet', shortName: 'Sei', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/23149.png', available: true },
  { chainId: '146', name: 'Sonic Mainnet', shortName: 'Sonic', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/30564.png', available: true },
  { chainId: '988', name: 'Stable Mainnet', shortName: 'Stable', logo: 'https://cryptologos.cc/logos/versions/ethereum-eth-logo-diamond-purple.svg?v=035', available: true },
  { chainId: '1923', name: 'Swellchain', shortName: 'Swell', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/30612.png', available: true },
  { chainId: '167000', name: 'Taiko Mainnet', shortName: 'Taiko', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/28573.png', available: true },
  { chainId: '130', name: 'Unichain', shortName: 'Unichain', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7083.png', available: true },
  { chainId: '480', name: 'World Mainnet', shortName: 'World', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/13502.png', available: true },
  { chainId: '50', name: 'XDC Network', shortName: 'XDC', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2634.png', available: true },
];

interface ChainSelectorProps {
  selectedChainId: string;
  onChainSelect: (chainId: string) => void;
  disabled?: boolean;
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({
  selectedChainId,
  onChainSelect,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedChain = SUPPORTED_CHAINS.find(c => c.chainId === selectedChainId);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleChainSelect = (chainId: string) => {
    onChainSelect(chainId);
    setIsOpen(false);
  };

  // Helper to render logo (image or emoji)
  const renderLogo = (logo: string, alt: string, size: string = 'w-5 h-5') => {
    if (logo.startsWith('http')) {
      return (
        <img 
          src={logo} 
          alt={alt} 
          className={`${size} rounded-full object-cover`}
          onError={(e) => {
            // Fallback to emoji if image fails to load
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }
    return <span className="text-base">{logo}</span>;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Chain Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full justify-between bg-gray-900/50 border-blue-500/30 hover:border-blue-400/50 text-white"
      >
        <span className="flex items-center gap-2">
          {selectedChain?.logo.startsWith('http') ? (
            <img 
              src={selectedChain.logo} 
              alt={selectedChain.shortName} 
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <span className="text-lg">{selectedChain?.logo}</span>
          )}
          <span>{selectedChain?.shortName || 'Select Chain'}</span>
          {!selectedChain?.available && (
            <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded">
              SOON
            </span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full max-h-[400px] overflow-y-auto bg-gray-900 border border-blue-500/30 rounded-lg shadow-xl">
          {/* All Chains */}
          <div className="p-2 space-y-1">
            {SUPPORTED_CHAINS.map((chain) => (
              <button
                key={chain.chainId}
                onClick={() => chain.available && handleChainSelect(chain.chainId)}
                disabled={!chain.available}
                className={`
                  w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between
                  transition-colors
                  ${chain.chainId === selectedChainId 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                    : chain.available
                      ? 'hover:bg-gray-800 text-white'
                      : 'opacity-40 cursor-not-allowed text-gray-500'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  {chain.logo.startsWith('http') ? (
                    <img 
                      src={chain.logo} 
                      alt={chain.shortName} 
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-base">{chain.logo}</span>
                  )}
                  <span>{chain.shortName}</span>
                </span>
                {!chain.available && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded">
                    SOON
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

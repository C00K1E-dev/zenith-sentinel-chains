import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Loader2 } from 'lucide-react';
import { useChain, CHAIN_CONFIGS, ChainType } from '@/contexts/ChainContext';
import { cn } from '@/lib/utils';

interface SidebarChainSelectorProps {
  collapsed: boolean;
}

const SidebarChainSelector: React.FC<SidebarChainSelectorProps> = ({ collapsed }) => {
  const { selectedChain, setSelectedChain, chainConfig } = useChain();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
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

  const handleChainSelect = (chain: ChainType) => {
    setSelectedChain(chain);
    setIsOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-green-500/20 text-green-400 border border-green-500/40">
            Active
          </span>
        );
      case 'development':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Dev
          </span>
        );
      case 'coming-soon':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
            Soon
          </span>
        );
      default:
        return null;
    }
  };

  if (collapsed) {
    return (
      <div className="relative flex justify-center" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-lg bg-white/5 border border-border/30 hover:border-primary/50 transition-all duration-200 flex items-center justify-center group"
        >
          <img
            src={chainConfig.logo}
            alt={chainConfig.label}
            className="w-5 h-5 rounded-full"
          />
        </button>

        {/* Tooltip for collapsed state */}
        {!isOpen && (
          <div className="absolute left-full ml-2 px-3 py-2 bg-card border border-border/30 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 font-medium">
            {chainConfig.label}
          </div>
        )}

        {/* Dropdown for collapsed state */}
        {isOpen && (
          <div className="absolute left-full ml-2 top-0 w-48 bg-[#0f1729] border border-border/50 rounded-lg shadow-2xl z-[100] overflow-hidden">
            <div className="p-2 space-y-1">
              {(Object.keys(CHAIN_CONFIGS) as ChainType[]).map((chain) => {
                const config = CHAIN_CONFIGS[chain];
                const isSelected = selectedChain === chain;
                
                return (
                  <button
                    key={chain}
                    onClick={() => handleChainSelect(chain)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-left',
                      isSelected
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'hover:bg-white/5 text-foreground'
                    )}
                  >
                    <img
                      src={config.logo}
                      alt={config.label}
                      className="w-5 h-5 rounded-full flex-shrink-0"
                    />
                    <span className="flex-1 text-sm font-medium">{config.label}</span>
                    {isSelected && <Check size={16} className="text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 border border-border/30 hover:border-primary/50 transition-all duration-200"
      >
        <img
          src={chainConfig.logo}
          alt={chainConfig.label}
          className="w-5 h-5 rounded-full"
        />
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{chainConfig.label}</span>
            {getStatusBadge(chainConfig.status)}
          </div>
        </div>
        <ChevronDown
          size={16}
          className={cn(
            'text-muted-foreground transition-transform duration-200',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-[#0f1729] border border-border/50 rounded-lg shadow-2xl z-[100] overflow-hidden">
          <div className="p-2 space-y-1">
            {(Object.keys(CHAIN_CONFIGS) as ChainType[]).map((chain) => {
              const config = CHAIN_CONFIGS[chain];
              const isSelected = selectedChain === chain;
              
              return (
                <button
                  key={chain}
                  onClick={() => handleChainSelect(chain)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left',
                    isSelected
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'hover:bg-white/5 text-foreground'
                  )}
                >
                  <img
                    src={config.logo}
                    alt={config.label}
                    className="w-5 h-5 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{config.label}</span>
                      {getStatusBadge(config.status)}
                    </div>
                  </div>
                  {isSelected && <Check size={16} className="text-primary flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarChainSelector;

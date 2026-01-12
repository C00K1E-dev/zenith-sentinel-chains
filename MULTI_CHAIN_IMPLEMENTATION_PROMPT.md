# Project: Multi-Chain SmartSentinels Platform Implementation

## CONTEXT
This is a fork of the SmartSentinels platform (originally BNB Chain only). The platform provides AI-powered smart contract audits, NFT minting, and PoUW (Proof of Useful Work) rewards. Currently, it works exclusively on BNB Smart Chain with MetaMask/Trust Wallet integration.

## OBJECTIVE
Transform this into a **chain-agnostic platform** that supports multiple blockchains while preserving all existing BNB Chain functionality. Implement a hub-based architecture where users select their blockchain BEFORE connecting their wallet.

## CRITICAL REQUIREMENTS

### ✅ MUST PRESERVE (Do Not Break)
- All existing BNB Chain functionality (audits, NFT minting, PoUW)
- Current contracts: AIAuditGateway, GenesisMint, PoUW, SSTL token
- All existing UI components and styling
- Database schema and API endpoints
- User authentication and sessions
- Gemini AI audit integration
- Payment flows (BNB and SSTL token payments)

### 🆕 MUST IMPLEMENT

1. **Chain Selection System**
   - Add ChainSelector component in Sidebar (BEFORE wallet connection)
   - Support: BNB Chain (existing) + Solana (new)
   - Persist user's chain selection in localStorage
   - Clear wallet connection when switching chains

2. **Hub-Based Architecture**
   - Create separate "hubs" for each blockchain
   - BNBHub: Contains existing functionality (no changes to logic)
   - SolanaHub: New hub for Solana (placeholder/coming soon state initially)

3. **Chain-Agnostic Core**
   - Create service interfaces (IAuditService, INFTService, IPoUWService)
   - Implement ServiceFactory pattern
   - Create ChainContext for global chain state management

4. **Wallet Integration**
   - BNB Chain: MetaMask, Trust Wallet, WalletConnect (existing)
   - Solana: Phantom, Solflare (new - can be "coming soon" placeholders)

5. **Token Strategy**
   - Separate SSTL tokens per chain (no bridging)
   - BNB: Keep existing SSTL (ERC20)
   - Solana: Placeholder for future SSTL (SPL token)

## ARCHITECTURE OVERVIEW

```
src/
├── config/
│   ├── chains.ts              [NEW] - Chain definitions
│   ├── bnb.config.ts          [NEW] - BNB-specific config
│   └── solana.config.ts       [NEW] - Solana config (placeholder)
│
├── contexts/
│   ├── ChainContext.tsx       [NEW] - Global chain state
│   └── [existing contexts]     [KEEP]
│
├── components/
│   ├── ChainSelector/         [NEW]
│   │   ├── ChainSelector.tsx
│   │   └── ChainCard.tsx
│   │
│   ├── hubs/                  [NEW]
│   │   ├── BNBHub/
│   │   │   └── index.tsx      [MOVE] - Wrap existing sidebar components
│   │   │
│   │   └── SolanaHub/
│   │       └── index.tsx      [NEW] - Placeholder/Coming Soon UI
│   │
│   ├── sidebarComponents/     [KEEP] - All existing components
│   └── [other existing]       [KEEP]
│
├── services/                  [NEW]
│   ├── interfaces/
│   │   ├── IAuditService.ts
│   │   ├── INFTService.ts
│   │   └── IPoUWService.ts
│   │
│   ├── bnb/
│   │   ├── BNBAuditService.ts  [NEW] - Wraps existing logic
│   │   ├── BNBNFTService.ts
│   │   └── BNBPoUWService.ts
│   │
│   └── ServiceFactory.ts       [NEW]
│
└── [all existing files]        [KEEP]
```

## IMPLEMENTATION PHASES

### Phase 1: Foundation (Current Session Priority)

#### Step 1: Create Chain Configuration
```typescript
// File: src/config/chains.ts
export interface ChainConfig {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  explorerUrl: string;
  rpcUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  supportedWallets: string[];
  contracts?: {
    auditGateway?: string;
    sstlToken?: string;
    genesisNFT?: string;
    pouw?: string;
  };
  status: 'active' | 'coming-soon' | 'maintenance';
}

export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  bnb: {
    id: 'bnb',
    name: 'BNB Smart Chain',
    displayName: 'BNB Chain',
    icon: '🔶',
    color: '#F3BA2F',
    explorerUrl: 'https://bscscan.com',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    supportedWallets: ['metamask', 'trustwallet', 'walletconnect'],
    contracts: {
      auditGateway: process.env.VITE_AUDIT_GATEWAY_ADDRESS,
      sstlToken: process.env.VITE_SSTL_TOKEN_ADDRESS,
      // ... other existing contract addresses
    },
    status: 'active'
  },
  
  solana: {
    id: 'solana',
    name: 'Solana',
    displayName: 'Solana',
    icon: '◎',
    color: '#14F195',
    explorerUrl: 'https://explorer.solana.com',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    supportedWallets: ['phantom', 'solflare'],
    status: 'coming-soon'
  }
};
```

#### Step 2: Create Chain Context
```typescript
// File: src/contexts/ChainContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SUPPORTED_CHAINS, ChainConfig } from '@/config/chains';

interface ChainContextType {
  selectedChain: string;
  chainConfig: ChainConfig;
  selectChain: (chainId: string) => void;
  isLoading: boolean;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

export const ChainProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedChain, setSelectedChain] = useState<string>(() => {
    // Load from localStorage or default to BNB
    return localStorage.getItem('smartsentinels_selected_chain') || 'bnb';
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const selectChain = (chainId: string) => {
    if (chainId === selectedChain) return;
    
    setIsLoading(true);
    
    // Disconnect wallet if connected
    // TODO: Add wallet disconnect logic based on current chain
    
    // Save to localStorage
    localStorage.setItem('smartsentinels_selected_chain', chainId);
    
    // Update state
    setSelectedChain(chainId);
    
    // Small delay for transition
    setTimeout(() => setIsLoading(false), 300);
  };

  const chainConfig = SUPPORTED_CHAINS[selectedChain];

  return (
    <ChainContext.Provider value={{ selectedChain, chainConfig, selectChain, isLoading }}>
      {children}
    </ChainContext.Provider>
  );
};

export const useChain = () => {
  const context = useContext(ChainContext);
  if (!context) {
    throw new Error('useChain must be used within ChainProvider');
  }
  return context;
};
```

#### Step 3: Create ChainSelector Component
```typescript
// File: src/components/ChainSelector/ChainSelector.tsx
import { useState } from 'react';
import { useChain } from '@/contexts/ChainContext';
import { SUPPORTED_CHAINS } from '@/config/chains';
import { ChevronDown, Check, Lock } from 'lucide-react';

export const ChainSelector: React.FC = () => {
  const { selectedChain, chainConfig, selectChain } = useChain();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="chain-selector-container mb-4">
      {/* Current Chain Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-750 rounded-lg border border-gray-700 transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{chainConfig.icon}</span>
          <div className="text-left">
            <div className="text-sm font-semibold text-white">
              {chainConfig.displayName}
            </div>
            <div className="text-xs text-gray-400">
              {chainConfig.status === 'active' ? '✓ Active' : '🔒 Coming Soon'}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="mt-2 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="p-2">
            <div className="text-xs text-gray-400 px-2 py-1 mb-1">
              Select Blockchain
            </div>
            
            {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => (
              <button
                key={key}
                onClick={() => {
                  if (chain.status === 'active') {
                    selectChain(key);
                    setIsOpen(false);
                  }
                }}
                disabled={chain.status !== 'active'}
                className={`
                  w-full flex items-center justify-between p-3 rounded-lg
                  transition-all
                  ${chain.status === 'active' ? 'hover:bg-gray-700 cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                  ${selectedChain === key ? 'bg-gray-700 ring-1 ring-blue-500' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{chain.icon}</span>
                  <div className="text-left">
                    <div className="text-sm font-medium text-white">
                      {chain.displayName}
                    </div>
                    <div className="text-xs text-gray-400">
                      {chain.status === 'active' ? 'Available now' : 'Coming soon'}
                    </div>
                  </div>
                </div>
                
                {selectedChain === key ? (
                  <Check className="w-4 h-4 text-blue-500" />
                ) : chain.status !== 'active' ? (
                  <Lock className="w-4 h-4 text-gray-500" />
                ) : null}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

#### Step 4: Update Sidebar.tsx
```typescript
// File: src/components/Sidebar.tsx
// Add ChainSelector at the TOP of the sidebar, BEFORE wallet connection

import { ChainSelector } from './ChainSelector/ChainSelector';
import { useChain } from '@/contexts/ChainContext';

export const Sidebar = () => {
  const { selectedChain } = useChain();
  
  return (
    <aside className="sidebar">
      {/* 1. CHAIN SELECTOR - NEW! (Before wallet) */}
      <ChainSelector />
      
      {/* 2. WALLET CONNECTION (Adapts to selected chain) */}
      <ConnectWallet 
        supportedWallets={SUPPORTED_CHAINS[selectedChain].supportedWallets}
      />
      
      {/* 3. SIDEBAR CONTENT (Conditionally render based on chain) */}
      {selectedChain === 'bnb' && <BNBSidebarContent />}
      {selectedChain === 'solana' && <SolanaSidebarContent />}
    </aside>
  );
};
```

#### Step 5: Create Hub Components
```typescript
// File: src/components/hubs/BNBHub/index.tsx
// This wraps ALL existing BNB sidebar components (no logic changes)
export const BNBSidebarContent = () => {
  return (
    <>
      {/* All your existing sidebar components */}
      <SidebarAIAuditSmartContract />
      <SidebarGenesisMint />
      <SidebarPoUWDashboard />
      {/* ... etc */}
    </>
  );
};

// File: src/components/hubs/SolanaHub/index.tsx
// Placeholder for future Solana features
export const SolanaSidebarContent = () => {
  return (
    <div className="p-6 text-center">
      <div className="text-6xl mb-4">◎</div>
      <h2 className="text-2xl font-bold mb-2">Solana Hub</h2>
      <p className="text-gray-400 mb-6">
        Coming Soon! Solana support is under development.
      </p>
      <div className="space-y-3 text-sm text-gray-500">
        <div>✓ AI Audit for Rust/Anchor contracts</div>
        <div>✓ Metaplex NFT collections</div>
        <div>✓ PoUW rewards in SSTL (SPL token)</div>
        <div>✓ Solana wallet support (Phantom, Solflare)</div>
      </div>
      <p className="mt-6 text-xs text-gray-600">
        Switch back to BNB Chain to use available features.
      </p>
    </div>
  );
};
```

#### Step 6: Update App.tsx/main.tsx
```typescript
// Wrap entire app with ChainProvider
import { ChainProvider } from '@/contexts/ChainContext';

function App() {
  return (
    <ChainProvider>
      {/* Your existing app structure */}
      <Router>
        <Navbar />
        <Sidebar />
        <MainContent />
      </Router>
    </ChainProvider>
  );
}
```

### Phase 2: Testing & Validation
After implementing Phase 1, verify:
- ✅ BNB Chain works exactly as before (all features functional)
- ✅ ChainSelector appears in sidebar
- ✅ Selecting Solana shows "Coming Soon" message
- ✅ Chain selection persists after page refresh
- ✅ Wallet connection shows appropriate wallets per chain
- ✅ No broken functionality

## SUCCESS CRITERIA

### Must Work After Implementation
1. All existing BNB Chain features function identically
2. ChainSelector displays in sidebar with BNB and Solana options
3. BNB Chain is pre-selected by default
4. Selecting Solana shows placeholder UI
5. Chain selection persists in localStorage
6. No console errors
7. No TypeScript errors
8. Existing styling preserved

### Code Quality
- TypeScript types for all new code
- Proper error handling
- Consistent naming conventions
- Clean separation of concerns
- Comments for complex logic

## CONSTRAINTS & GUIDELINES

### DO NOT:
- ❌ Change any existing BNB contract addresses
- ❌ Modify existing component logic (only wrap/organize)
- ❌ Break any existing API calls
- ❌ Change database schema
- ❌ Remove any existing features
- ❌ Modify existing styling/CSS

### DO:
- ✅ Add new files in appropriate directories
- ✅ Create wrapper components where needed
- ✅ Use TypeScript for all new code
- ✅ Follow existing code style
- ✅ Add proper error boundaries
- ✅ Preserve all existing functionality
- ✅ Test thoroughly after each change

## NOTES
- This is Phase 1 only - Solana implementation comes later
- Focus on architecture foundation and chain selection
- Keep existing BNB functionality 100% intact
- Solana features are placeholders for now
- Priority: Don't break anything that works

## DELIVERABLES
1. Chain configuration files
2. ChainContext and provider
3. ChainSelector component
4. Hub wrapper components
5. Updated Sidebar with chain selection
6. All existing features working on BNB Chain
7. Clean TypeScript compilation
8. No runtime errors

---

## CURRENT PROJECT STATE
- Located in: d:\zenith-sentinel-chains
- Based on: zenith-sentinel (BNB Chain only)
- Framework: React + TypeScript + Vite
- Wallet Library: thirdweb
- Currently uses: BNB Smart Chain exclusively
- Key file: src/components/sidebarComponents/sidebarAIAuditSmartContract.tsx

## FIRST ACTIONS
1. Analyze current folder structure
2. Identify all existing sidebar components
3. Create the new file structure (config/, contexts/, hubs/)
4. Implement Phase 1, Step 1 (Chain config)
5. Ask for confirmation before proceeding to Step 2

## QUESTIONS TO ASK IF UNCLEAR
- Where are the existing contract addresses stored?
- Which files contain wallet connection logic?
- Should ChainSelector be collapsible or always visible?
- Any specific styling requirements for the selector?

---

Begin implementation following the phases above. Start with Step 1 and proceed sequentially. Ask for clarification if any requirements are unclear.

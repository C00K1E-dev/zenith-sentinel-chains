import { useState, memo, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  DollarSign,
  Image as ImageIcon,
  Shield,
  Monitor,
  Bot,
  Store,
  Coins,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Award,
  HardDrive,
  Home,
  Gift,
  Zap,
} from 'lucide-react';
import { createThirdwebClient } from "thirdweb";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { bsc, bscTestnet } from "thirdweb/chains";
import { cn } from '@/lib/utils';
import { useChain } from '@/contexts/ChainContext';
import SidebarChainSelector from './SidebarChainSelector';
import SolflareConnectPrompt from './SolflareConnectPrompt';
import SolanaFeaturesInDevelopment from './SolanaFeaturesInDevelopment';
import SolflareWalletButton from './SolflareWalletButton';

const thirdwebClient = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ size?: string | number; className?: string }>;
  badge?: string;
  state?: string;
}

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const Sidebar = memo(({ collapsed, setCollapsed }: SidebarProps) => {
  const location = useLocation();
  const account = useActiveAccount();
  const { selectedChain, chainConfig, isSolflareConnected, setIsSolflareConnected } = useChain();
  const [showSolflareConnectModal, setShowSolflareConnectModal] = useState(false);

  const menuItems: SidebarItem[] = useMemo(() => [
    { name: 'General Stats', path: '/hub/general-stats', icon: BarChart3 },
    // { name: 'Seed Round', path: '/hub/seed-round', icon: DollarSign }, // Hidden - needs testing before production
    { name: 'Airdrop', path: '/hub/airdrop', icon: Gift, badge: 'New' },
    { name: 'NFTs & iNFTs Hub', path: '/hub/nfts', icon: ImageIcon },
    { name: 'AI Audit - Smart Contract', path: '/hub/audit', icon: Shield },
    { name: 'Device Monitoring', path: '/hub/devices', icon: Monitor },
    { name: 'Create Agent', path: '/hub/create-agent', icon: Bot, badge: 'New' },
    { name: 'Marketplace', path: '/hub/marketplace', icon: Store, badge: 'Soon' },
    { name: 'Staking', path: '/hub/staking', icon: Coins, badge: 'Soon' },
  ], []);

  const solanaMenuItems: SidebarItem[] = useMemo(() => [
    { name: 'General Stats', path: '/hub/solana-general-stats', icon: BarChart3 },
    { name: 'Airdrop', path: '/hub/solana-airdrop', icon: Gift, badge: 'New' },
    { name: 'NFTs & iNFTs Hub', path: '/hub/solana-nfts', icon: ImageIcon },
    { name: 'AI Audit - Smart Contract', path: '/hub/solana-audit', icon: Shield },
    { name: 'Device Monitoring', path: '/hub/solana-devices', icon: Monitor },
    { name: 'Create Agent', path: '/hub/solana-create-agent', icon: Bot, badge: 'New' },
    { name: 'Marketplace', path: '/hub/solana-marketplace', icon: Store, badge: 'Soon' },
    { name: 'Staking', path: '/hub/solana-staking', icon: Coins, badge: 'Soon' },
  ], []);

  const myStatsItems: SidebarItem[] = useMemo(() => [
    { name: 'My NFTs', path: '/hub/my-nfts', icon: ImageIcon },
    { name: 'My Agents', path: '/hub/my-agents', icon: Bot },
    { name: 'My Devices', path: '/hub/my-devices', icon: HardDrive, badge: 'Soon' },
    { name: 'My Rewards', path: '/hub/my-rewards', icon: Award },
  ], []);

  const isActive = useCallback((path: string) => {
    if (path === '/hub/general-stats') {
      return location.pathname === '/hub' || location.pathname === '/hub/general-stats';
    }
    return location.pathname === path;
  }, [location.pathname]);

  const handleToggle = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

  // Handle Solflare wallet connection
  const handleSolflareConnect = useCallback(async () => {
    try {
      const solflare = (window as any).solflare;
      if (solflare) {
        await solflare.connect();
        setIsSolflareConnected(true);
        setShowSolflareConnectModal(false);
      } else {
        // Redirect to Solflare installation if not installed
        window.open('https://solflare.com/', '_blank');
      }
    } catch (error) {
      console.error('Error connecting to Solflare:', error);
    }
  }, [setIsSolflareConnected]);

  // Memoize ConnectButton props to prevent unnecessary re-renders
  const connectButtonProps = useMemo(() => ({
    client: thirdwebClient,
    theme: "dark" as const,
    chains: [bsc, bscTestnet],
    connectModal: {
      size: "compact" as const,
      welcomeScreen: {
        title: "Connect to SmartSentinels",
        subtitle: "Choose your wallet to get started",
      },
    },
  }), []);

  const expandedConnectButtonStyle = useMemo(() => ({
    width: "100%",
    background: "linear-gradient(to right, hsl(220, 90%, 56%), hsl(220, 90%, 46%))",
    color: "white",
    border: "none",
    borderRadius: "0.75rem",
    padding: "0.75rem 1rem",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeight: "600",
    fontSize: "0.875rem",
    boxShadow: "0 4px 12px rgba(99, 179, 237, 0.3)",
    transition: "all 0.3s ease",
  }), []);

  const collapsedConnectButtonStyle = useMemo(() => ({
    width: "2.5rem",
    height: "2.5rem",
    background: "linear-gradient(to right, hsl(220, 90%, 56%), hsl(220, 90%, 46%))",
    color: "white",
    border: "none",
    borderRadius: "0.75rem",
    padding: "0.5rem",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeight: "600",
    boxShadow: "0 4px 12px rgba(99, 179, 237, 0.3)",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    position: "relative" as const,
    opacity: 0,
  }), []);

  const detailsButtonStyle = useMemo(() => ({
    width: "100%",
    background: "rgba(20, 30, 48, 0.6)",
    border: "1px solid rgba(99, 179, 237, 0.2)",
    borderRadius: "0.75rem",
    padding: "0.75rem",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "0.75rem",
    color: "hsl(var(--foreground))",
  }), []);

  return (
    <aside
      className={cn(
        'glass-card border-r border-border/50 transition-all duration-300 h-screen flex flex-col overflow-hidden flex-shrink-0',
        collapsed 
          ? 'w-20' 
          : 'w-64 md:w-72 lg:w-80 fixed md:static left-0 top-0 z-50 md:z-auto'
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className="absolute -right-3 top-4 glass-card-hover p-1.5 rounded-full border border-primary/30 z-10 hover:shadow-[0_0_20px_rgba(99,179,237,0.4)] hover:border-primary/50 transition-all duration-300"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Sidebar Header */}
      <div className="p-4 border-b border-border/50">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img
              src="/ss-icon.svg"
              alt="SmartSentinels Logo"
              className="w-8 h-8"
            />
            <h2 className="font-display font-bold text-lg text-white whitespace-nowrap">SmartSentinels</h2>
          </div>
        )}
        {collapsed && (
          <img
            src="/ss-icon.svg"
            alt="SmartSentinels Logo"
            className="w-8 h-8 mx-auto"
          />
        )}
      </div>

      {/* Wallet Connection */}
      <div className="px-4 pt-4 pb-4 relative z-10">
        {/* Chain Selector - Always visible */}
        <div className={cn("mb-3 relative z-20", collapsed && "flex justify-center")}>
          <SidebarChainSelector collapsed={collapsed} />
        </div>

        {/* Show wallet connection only for BNB Chain */}
        {selectedChain === 'bnb' && (
          <>
            {!collapsed && (
              <ConnectButton
                {...connectButtonProps}
                connectButton={{
                  label: "Connect Wallet",
                  style: expandedConnectButtonStyle,
                }}
                detailsButton={{
                  style: detailsButtonStyle,
                }}
              />
            )}
            {collapsed && (
              <div className="flex justify-center relative overflow-hidden">
                <ConnectButton
                  {...connectButtonProps}
                  connectButton={{
                    label: "",
                    style: collapsedConnectButtonStyle,
                  }}
                  detailsButton={{
                    render: () => (
                      <div
                        className="w-10 h-10 bg-primary/20 text-primary border border-primary/30 rounded-lg flex items-center justify-center cursor-pointer hover:bg-primary/30"
                      >
                        <Wallet size={20} />
                      </div>
                    ),
                  }}
                />
                {!account && (
                  <Wallet
                    size={20}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                  />
                )}
              </div>
            )}
          </>
        )}

        {/* Solana: Show Solflare connection prompt or wallet button */}
        {selectedChain === 'solana' && (
          <>
            {!collapsed ? (
              <>
                {!isSolflareConnected ? (
                  <button
                    onClick={() => setShowSolflareConnectModal(true)}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl px-4 py-3 transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg shadow-purple-500/25"
                  >
                    <img src="/assets/solflare.webp" alt="Solflare" className="w-5 h-5" />
                    <span className="text-sm font-semibold">Connect Solflare</span>
                  </button>
                ) : (
                  <SolflareWalletButton onDisconnect={() => setIsSolflareConnected(false)} />
                )}
              </>
            ) : (
              <div className="flex justify-center">
                {!isSolflareConnected ? (
                  <button
                    onClick={() => setShowSolflareConnectModal(true)}
                    className="w-10 h-10 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg flex items-center justify-center cursor-pointer hover:bg-purple-500/30 transition-all duration-200 group relative"
                  >
                    <Wallet size={20} />
                    {/* Tooltip */}
                    <div className="absolute left-full ml-2 px-3 py-2 bg-card border border-border/30 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 font-medium">
                      Connect Solflare
                    </div>
                  </button>
                ) : (
                  <div className="relative group">
                    <div className="w-10 h-10 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg flex items-center justify-center cursor-pointer hover:bg-purple-500/30 transition-all duration-200">
                      <Wallet size={20} />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute left-full ml-2 px-3 py-2 bg-card border border-border/30 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 font-medium">
                      Solflare Connected
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Coming Soon chains: Show info message */}
        {(selectedChain === 'sui' || selectedChain === 'base') && !collapsed && (
          <div className="glass-card border border-yellow-500/30 rounded-lg p-4 bg-yellow-500/5">
            <p className="text-sm font-semibold text-white text-center mb-2">
              {chainConfig.label} - Coming Soon
            </p>
            <p className="text-xs text-muted-foreground text-center">
              We're working on bringing SmartSentinels to {chainConfig.label}. Stay tuned for updates!
            </p>
          </div>
        )}
      </div>      {/* My Stats Section - Only show for BNB Chain */}
      {selectedChain === 'bnb' && (
        <div className="px-4 pt-2 pb-2">
          {!collapsed && (
            <h3 className="text-xs font-display font-bold text-primary/70 uppercase tracking-wider mb-2">
              My Stats
            </h3>
          )}
          <div className="space-y-1">
            {myStatsItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 group relative text-sm font-medium',
                    active
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <Icon size={20} className={cn(active && 'text-primary')} />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className={cn(
                          "px-2 py-0.5 text-xs rounded-full font-medium",
                          item.badge === 'New'
                            ? "bg-green-500/20 text-green-400 border border-green-500/40 pulse-glow-green"
                            : "bg-primary/20 text-primary border border-primary/30"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}

                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-card border border-border/30 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 font-medium">
                      {item.name}
                      {item.badge && (
                        <span className={cn(
                          "ml-2 px-2 py-0.5 text-xs rounded-full font-medium",
                          item.badge === 'New'
                            ? "bg-green-500/20 text-green-400 border border-green-500/40 pulse-glow-green"
                            : "bg-primary/20 text-primary"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Solana Stats Section - Show when Solana chain is selected */}
      {selectedChain === 'solana' && (
        <div className="px-4 pt-2 pb-2">
          {!collapsed && (
            <h3 className="text-xs font-display font-bold text-purple-400/70 uppercase tracking-wider mb-2">
              Solana Stats
            </h3>
          )}
          <div className="space-y-1">
            {[
              { name: 'My Solana NFTs', path: '/hub/solana-my-nfts', icon: ImageIcon },
              { name: 'My Solana Agents', path: '/hub/solana-my-agents', icon: Bot },
              { name: 'My Devices', path: '/hub/my-devices', icon: HardDrive, badge: 'Soon' },
              { name: 'My Rewards', path: '/hub/solana-my-rewards', icon: Award },
            ].map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 group relative text-sm font-medium',
                    active
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <Icon size={20} className={cn(active && 'text-purple-400')} />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {item.badge ? (
                        <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-primary/20 text-primary border border-primary/30">
                          {item.badge}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-purple-500/20 text-purple-400 border border-purple-500/40">
                          Dev
                        </span>
                      )}
                    </>
                  )}

                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-card border border-border/30 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 font-medium">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Separator */}
      {(selectedChain === 'bnb' || selectedChain === 'solana') && (
        <div className="border-t border-white/10 mx-4 mb-2"></div>
      )}

      {/* Menu Items - Show for BNB Chain and Solana */}
      {(selectedChain === 'bnb' || selectedChain === 'solana') && (
        <nav className="flex-1 px-4 pt-3 pb-4 space-y-2 overflow-hidden">
          {(selectedChain === 'bnb' ? menuItems : solanaMenuItems).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const isSolana = selectedChain === 'solana';

            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 group relative font-medium',
                  item.name === 'Seed Funding / Token Sale' && 'mt-1',
                  active
                    ? isSolana
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                  collapsed && 'justify-center'
                )}
              >
                <Icon size={20} className={cn(active && (isSolana ? 'text-purple-400' : 'text-primary'))} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-sm">{item.name}</span>
                    {item.badge && (
                      <span className={cn(
                        "px-2 py-0.5 text-xs rounded-full font-medium",
                        item.badge === 'New'
                          ? "bg-green-500/20 text-green-400 border border-green-500/40 pulse-glow-green"
                          : isSolana
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            : "bg-primary/20 text-primary border border-primary/30"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                
                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-card border border-border/30 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 font-medium">
                    {item.name}
                    {item.badge && (
                      <span className={cn(
                        "ml-2 px-2 py-0.5 text-xs rounded-full font-medium",
                        item.badge === 'New'
                          ? "bg-green-500/20 text-green-400 border border-green-500/40 pulse-glow-green"
                          : "bg-primary/20 text-primary"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}

          {/* Back to Homepage Button */}
          <Link
            to="/"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 group relative font-medium',
              'text-muted-foreground hover:bg-white/5 hover:text-foreground',
              collapsed && 'justify-center'
            )}
          >
            <Home size={20} />
            {!collapsed && (
              <span className="flex-1 text-sm">Back to Homepage</span>
            )}
            
            {/* Tooltip for collapsed state */}
            {collapsed && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-card border border-white/10 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 font-orbitron">
                Back to Homepage
              </div>
            )}
          </Link>
        </nav>
      )}

      {/* Solflare Connect Modal */}
      {showSolflareConnectModal && (
        <SolflareConnectPrompt 
          onConnect={handleSolflareConnect} 
          onClose={() => setShowSolflareConnectModal(false)}
          isModal={true}
        />
      )}
    </aside>
  );
});

export default Sidebar;

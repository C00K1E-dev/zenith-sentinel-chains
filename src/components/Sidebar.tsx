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

  const menuItems: SidebarItem[] = useMemo(() => [
    { name: 'General Stats', path: '/hub/general-stats', icon: BarChart3 },
    // TODO: Seed Round - Coming Soon
    // { name: 'Seed Round', path: '/hub/seed-round', icon: DollarSign },
    { name: 'Airdrop', path: '/hub/airdrop', icon: Gift },
    { name: 'NFTs & iNFTs Hub', path: '/hub/nfts', icon: ImageIcon },
    { name: 'AI Audit - Smart Contract', path: '/hub/audit', icon: Shield },
    { name: 'Device Monitoring', path: '/hub/devices', icon: Monitor },
    { name: 'Create Agent', path: '/hub/create-agent', icon: Bot, badge: 'Soon' },
    { name: 'Marketplace', path: '/hub/marketplace', icon: Store, badge: 'Soon' },
    { name: 'Staking', path: '/hub/staking', icon: Coins, badge: 'Soon' },
  ], []);

  const myStatsItems: SidebarItem[] = useMemo(() => [
    { name: 'My NFTs', path: '/hub/my-nfts', icon: ImageIcon },
    { name: 'My Agents', path: '/hub/my-agents', icon: Bot },
    { name: 'My Devices', path: '/hub/my-devices', icon: HardDrive },
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
    background: "hsl(var(--primary))",
    color: "hsl(var(--primary-foreground))",
    border: "none",
    borderRadius: "0.5rem",
    padding: "0.75rem 1rem",
    fontFamily: "'Orbitron', sans-serif",
    fontWeight: "700",
    fontSize: "0.875rem",
    boxShadow: "0 0 20px rgba(248, 244, 66, 0.5)",
    transition: "all 0.2s ease",
  }), []);

  const collapsedConnectButtonStyle = useMemo(() => ({
    width: "2.5rem",
    height: "2.5rem",
    background: "hsl(var(--primary))",
    color: "hsl(var(--primary-foreground))",
    border: "none",
    borderRadius: "0.5rem",
    padding: "0.5rem",
    fontFamily: "'Orbitron', sans-serif",
    fontWeight: "700",
    boxShadow: "0 0 20px rgba(248, 244, 66, 0.5)",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    position: "relative" as const,
    opacity: 0,
  }), []);

  const detailsButtonStyle = useMemo(() => ({
    width: "100%",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(248, 244, 66, 0.2)",
    borderRadius: "0.5rem",
    padding: "0.75rem",
    fontFamily: "'Orbitron', sans-serif",
    fontSize: "0.75rem",
    color: "hsl(var(--foreground))",
  }), []);

  return (
    <aside
      className={cn(
        'glass-card border-r border-yellow-400/20 transition-all duration-300 h-screen flex flex-col overflow-hidden flex-shrink-0',
        collapsed 
          ? 'w-20' 
          : 'w-64 md:w-72 lg:w-80 fixed md:static left-0 top-0 z-50 md:z-auto'
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className="absolute -right-3 top-4 glass-card-hover p-1.5 rounded-full neon-border z-10 hover:shadow-[0_0_30px_rgba(248,244,66,0.8)] transition-all duration-150"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Sidebar Header */}
      <div className="p-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img
              src="/ss-icon.svg"
              alt="SmartSentinels Logo"
              className="w-8 h-8"
            />
            <h2 className="font-orbitron font-bold text-lg neon-glow whitespace-nowrap">SmartSentinels</h2>
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
      <div className="px-4 pt-4 pb-4 relative z-0">
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
      </div>      {/* My Stats Section */}
      <div className="px-4 pt-2 pb-2">
        {!collapsed && (
          <h3 className="text-xs font-orbitron font-bold text-primary/70 uppercase tracking-wider mb-2">
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
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 group relative text-sm font-orbitron',
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
                  </>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-card border border-white/10 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 font-orbitron">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-white/10 mx-4 mb-2"></div>

      {/* Menu Items */}
      <nav className="flex-1 px-4 pt-3 pb-4 space-y-2 overflow-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 group relative font-orbitron',
                item.name === 'Seed Funding / Token Sale' && 'mt-1',
                active
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                collapsed && 'justify-center'
              )}
            >
              <Icon size={20} className={cn(active && 'text-primary')} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-sm">{item.name}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary border border-primary/30 font-orbitron">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-card border border-white/10 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 font-orbitron">
                  {item.name}
                  {item.badge && (
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary font-orbitron">
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
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 group relative font-orbitron',
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
    </aside>
  );
});

export default Sidebar;

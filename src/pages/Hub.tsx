import { Routes, Route } from 'react-router-dom';
import { useState, useEffect, Suspense, lazy } from 'react';
import { cn } from '@/lib/utils';
import Sidebar from '@/components/Sidebar';
import { Loading } from '@/components/ui/loading';
import { MetaTags } from '@/components/MetaTags';

const SidebarNFTsiNFTsHub = lazy(() => import('@/components/sidebarComponents/sidebarNFTsiNFTsHub'));
const SidebarCreateAgent = lazy(() => import('@/components/sidebarComponents/sidebarCreateAgent'));
const SidebarDeviceMonitoring = lazy(() => import('@/components/sidebarComponents/sidebarDeviceMonitoring'));
const SidebarMyNFTs = lazy(() => import('@/components/sidebarComponents/sidebarMyNFTs'));
const SidebarMyAgents = lazy(() => import('@/components/sidebarComponents/sidebarMyAgents'));
const SidebarMyDevices = lazy(() => import('@/components/sidebarComponents/sidebarMyDevices'));
const SidebarMyRewards = lazy(() => import('@/components/sidebarComponents/sidebarMyRewards'));
const SidebarGeneralStats = lazy(() => import('@/components/sidebarComponents/sidebarGeneralStats'));
const SidebarAIAuditSmartContract = lazy(() => import('@/components/sidebarComponents/sidebarAIAuditSmartContract'));
const SidebarMarketplace = lazy(() => import('@/components/sidebarComponents/sidebarMarketplace'));
const SidebarStaking = lazy(() => import('@/components/sidebarComponents/sidebarStaking'));
const SidebarAirdrop = lazy(() => import('@/components/sidebarComponents/sidebarAirdrop'));
const SidebarSeedRound = lazy(() => import('@/components/sidebarComponents/sidebarSeedRound'));

const Hub = () => {
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768);
  const [manualCollapsed, setManualCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (!manualCollapsed) {
        // Only auto-collapse if user hasn't manually toggled
        if (window.innerWidth < 768) {
          setCollapsed(true);
        } else {
          setCollapsed(window.innerWidth < 1024);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [manualCollapsed]);

  const handleSetCollapsed = (newCollapsed: boolean) => {
    setManualCollapsed(true);
    setCollapsed(newCollapsed);
  };
  return (
    <>
      <MetaTags 
        title="Hub | SmartSentinels"
        description="Access your SmartSentinels dashboard: manage AI agents, monitor devices, view rewards, and participate in the decentralized workforce."
        path="/hub"
      />
      <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Modern Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="absolute inset-0 bg-gradient-to-tl from-accent/3 via-transparent to-primary/3" />

        {/* Modern Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hub-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hub-grid)" />
          </svg>
        </div>

        {/* Subtle Floating Element */}
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="flex w-full h-screen">
        {/* Mobile backdrop overlay */}
        {!collapsed && (
          <div 
            className="fixed inset-0 bg-black/50 md:hidden z-40"
            onClick={() => handleSetCollapsed(true)}
          />
        )}
        
        <Sidebar collapsed={collapsed} setCollapsed={handleSetCollapsed} />

        <main className={cn("flex-1 relative z-10 transition-all duration-300 overflow-auto", collapsed ? "ml-0" : "ml-0 md:ml-0")}>
          <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 xl:p-12">
          <Routes>
            <Route index element={<Suspense fallback={<Loading />}><SidebarGeneralStats /></Suspense>} />
            <Route path="my-nfts" element={<Suspense fallback={<Loading />}><SidebarMyNFTs /></Suspense>} />
            <Route path="my-agents" element={<Suspense fallback={<Loading />}><SidebarMyAgents /></Suspense>} />
            <Route path="my-devices" element={<Suspense fallback={<Loading />}><SidebarMyDevices /></Suspense>} />
            <Route path="my-rewards" element={<Suspense fallback={<Loading />}><SidebarMyRewards /></Suspense>} />
            <Route path="general-stats" element={<Suspense fallback={<Loading />}><SidebarGeneralStats /></Suspense>} />
            <Route path="seed-round" element={<Suspense fallback={<Loading />}><SidebarSeedRound /></Suspense>} />
            <Route path="airdrop" element={<Suspense fallback={<Loading />}><SidebarAirdrop /></Suspense>} />
            <Route path="nfts" element={<Suspense fallback={<Loading />}><SidebarNFTsiNFTsHub /></Suspense>} />
            <Route path="audit" element={<Suspense fallback={<Loading />}><SidebarAIAuditSmartContract /></Suspense>} />
            <Route path="devices" element={<Suspense fallback={<Loading />}><SidebarDeviceMonitoring /></Suspense>} />
            <Route path="create-agent" element={<Suspense fallback={<Loading />}><SidebarCreateAgent /></Suspense>} />
            <Route path="marketplace" element={<Suspense fallback={<Loading />}><SidebarMarketplace /></Suspense>} />
            <Route path="staking" element={<Suspense fallback={<Loading />}><SidebarStaking /></Suspense>} />
          </Routes>
        </div>
        </main>
      </div>
    </div>
    </>
  );
};

export default Hub;

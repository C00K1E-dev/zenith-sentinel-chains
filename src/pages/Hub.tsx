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

const Hub = () => {
  const [collapsed, setCollapsed] = useState(window.innerWidth < 1024);
  const [manualCollapsed, setManualCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (!manualCollapsed) {
        setCollapsed(window.innerWidth < 1024);
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
        description="Access your SmartSentinels dashboard: manage AI agents, monitor devices, view rewards, and participate in the decentralized workforce."
        path="/hub"
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-x-hidden overflow-y-auto">
      {/* Optimized Background Elements - Further reduced animations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Static Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="absolute inset-0 bg-gradient-to-tl from-accent/5 via-transparent to-primary/5" />

        {/* Simplified Circuit Pattern - Reduced complexity */}
        <div className="absolute inset-0 opacity-3">
          <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="circuit" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="0.5" fill="rgba(248, 244, 66, 0.1)"/>
                <line x1="20" y1="20" x2="40" y2="20" stroke="rgba(248, 244, 66, 0.05)" strokeWidth="0.2"/>
                <line x1="20" y1="20" x2="20" y2="0" stroke="rgba(248, 244, 66, 0.05)" strokeWidth="0.2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit)"/>
          </svg>
        </div>

        {/* Reduced Floating Elements - Only one static element */}
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-primary/2 rounded-full blur-2xl" />
      </div>

      <Sidebar collapsed={collapsed} setCollapsed={handleSetCollapsed} />

      <main className={cn("flex-1 relative z-10 transition-all duration-300", collapsed ? "ml-20" : "ml-0 md:ml-72 lg:ml-80")}>
        <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
          <Routes>
            <Route index element={<Suspense fallback={<Loading />}><SidebarGeneralStats /></Suspense>} />
            <Route path="my-nfts" element={<Suspense fallback={<Loading />}><SidebarMyNFTs /></Suspense>} />
            <Route path="my-agents" element={<Suspense fallback={<Loading />}><SidebarMyAgents /></Suspense>} />
            <Route path="my-devices" element={<Suspense fallback={<Loading />}><SidebarMyDevices /></Suspense>} />
            <Route path="my-rewards" element={<Suspense fallback={<Loading />}><SidebarMyRewards /></Suspense>} />
            <Route path="general-stats" element={<Suspense fallback={<Loading />}><SidebarGeneralStats /></Suspense>} />
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
    </>
  );
};

export default Hub;

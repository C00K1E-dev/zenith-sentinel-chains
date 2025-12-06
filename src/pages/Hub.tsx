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
const SidebarMyAgents = lazy(() => import('@/components/sidebarComponents/sidebarMyAgentsEnhanced')); // Use Supabase version
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
      {/* Premium Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Multi-layer Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="absolute inset-0 bg-gradient-to-tl from-accent/3 via-transparent to-primary/3" />
        
        {/* Modern Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Animated Grid Dots - Aligned to 60px grid */}
        <div className="absolute inset-0">
          {/* Horizontal moving dots - LEFT TO RIGHT - Blue */}
          <div className="absolute left-0 w-2 h-2 bg-primary rounded-full animate-grid-horizontal opacity-60 grid-dot-trail text-primary" style={{ top: '120px' }} />
          <div className="absolute left-0 w-1.5 h-1.5 bg-primary rounded-full animate-grid-horizontal-slow opacity-50 grid-dot-trail text-primary" style={{ top: '540px', animationDelay: '5s' }} />
          <div className="absolute left-0 w-1.5 h-1.5 bg-primary rounded-full animate-grid-horizontal opacity-55 grid-dot-trail text-primary" style={{ top: '300px', animationDelay: '18s' }} />
          
          {/* Horizontal moving dots - RIGHT TO LEFT - Purple */}
          <div className="absolute w-2 h-2 bg-secondary rounded-full animate-grid-horizontal-reverse opacity-60 grid-dot-trail-horizontal-reverse text-secondary" style={{ top: '420px', right: '0' }} />
          <div className="absolute w-1.5 h-1.5 bg-secondary rounded-full animate-grid-horizontal-reverse opacity-50 grid-dot-trail-horizontal-reverse text-secondary" style={{ top: '180px', right: '0', animationDelay: '10s' }} />
          <div className="absolute w-1.5 h-1.5 bg-secondary rounded-full animate-grid-horizontal-reverse opacity-55 grid-dot-trail-horizontal-reverse text-secondary" style={{ top: '600px', right: '0', animationDelay: '14s' }} />
          <div className="absolute w-1.5 h-1.5 bg-secondary rounded-full animate-grid-horizontal-reverse opacity-50 grid-dot-trail-horizontal-reverse text-secondary" style={{ top: '360px', right: '0', animationDelay: '7s' }} />
          
          {/* Horizontal moving dots - LEFT TO RIGHT - Teal */}
          <div className="absolute left-0 w-1 h-1 bg-accent rounded-full animate-grid-horizontal-slow opacity-40 grid-dot-trail text-accent" style={{ top: '660px', animationDelay: '15s' }} />
          <div className="absolute left-0 w-1.5 h-1.5 bg-accent rounded-full animate-grid-horizontal opacity-50 grid-dot-trail text-accent" style={{ top: '240px', animationDelay: '20s' }} />
          
          {/* Vertical moving dots - TOP TO BOTTOM - Teal */}
          <div className="absolute top-0 w-2 h-2 bg-accent rounded-full animate-grid-vertical opacity-60 grid-dot-trail-vertical text-accent" style={{ left: '240px' }} />
          <div className="absolute top-0 w-1.5 h-1.5 bg-accent rounded-full animate-grid-vertical-slow opacity-50 grid-dot-trail-vertical text-accent" style={{ left: '960px', animationDelay: '8s' }} />
          <div className="absolute top-0 w-1.5 h-1.5 bg-accent rounded-full animate-grid-vertical opacity-55 grid-dot-trail-vertical text-accent" style={{ left: '1200px', animationDelay: '16s' }} />
          <div className="absolute top-0 w-1.5 h-1.5 bg-accent rounded-full animate-grid-vertical opacity-50 grid-dot-trail-vertical text-accent" style={{ left: '1560px', animationDelay: '13s' }} />
          
          {/* Vertical moving dots - BOTTOM TO TOP - Blue */}
          <div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-grid-vertical-reverse opacity-55 grid-dot-trail-vertical-reverse text-primary" style={{ left: '600px', bottom: '0' }} />
          <div className="absolute w-1 h-1 bg-primary rounded-full animate-grid-vertical-reverse opacity-45 grid-dot-trail-vertical-reverse text-primary" style={{ left: '780px', bottom: '0', animationDelay: '12s' }} />
          <div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-grid-vertical-reverse opacity-50 grid-dot-trail-vertical-reverse text-primary" style={{ left: '1080px', bottom: '0', animationDelay: '9s' }} />
          <div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-grid-vertical-reverse opacity-50 grid-dot-trail-vertical-reverse text-primary" style={{ left: '1440px', bottom: '0', animationDelay: '4s' }} />
          
          {/* Vertical moving dots - TOP TO BOTTOM - Purple */}
          <div className="absolute top-0 w-1.5 h-1.5 bg-secondary rounded-full animate-grid-vertical opacity-50 grid-dot-trail-vertical text-secondary" style={{ left: '480px', animationDelay: '6s' }} />
          <div className="absolute top-0 w-1.5 h-1.5 bg-secondary rounded-full animate-grid-vertical-slow opacity-50 grid-dot-trail-vertical text-secondary" style={{ left: '1320px', animationDelay: '11s' }} />
          
          {/* Vertical moving dots - BOTTOM TO TOP - Purple */}
          <div className="absolute w-1 h-1 bg-secondary rounded-full animate-grid-vertical-reverse opacity-45 grid-dot-trail-vertical-reverse text-secondary" style={{ left: '360px', bottom: '0', animationDelay: '17s' }} />
          
          {/* Additional dots for BOTTOM RIGHT coverage */}
          <div className="absolute w-1.5 h-1.5 bg-accent rounded-full animate-grid-vertical-reverse opacity-55 grid-dot-trail-vertical-reverse text-accent" style={{ left: '1680px', bottom: '0', animationDelay: '3s' }} />
          <div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-grid-vertical-reverse opacity-50 grid-dot-trail-vertical-reverse text-primary" style={{ left: '1800px', bottom: '0', animationDelay: '8s' }} />
          <div className="absolute w-2 h-2 bg-secondary rounded-full animate-grid-horizontal-reverse opacity-60 grid-dot-trail-horizontal-reverse text-secondary" style={{ top: '720px', right: '0', animationDelay: '2s' }} />
          <div className="absolute w-1.5 h-1.5 bg-accent rounded-full animate-grid-horizontal-reverse opacity-50 grid-dot-trail-horizontal-reverse text-accent" style={{ top: '780px', right: '0', animationDelay: '12s' }} />
          <div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-grid-vertical opacity-55 grid-dot-trail-vertical text-primary" style={{ left: '1920px', top: '0', animationDelay: '19s' }} />
          
          {/* 4K resolution coverage - Extended right side (up to 3840px) */}
          <div className="absolute w-1.5 h-1.5 bg-secondary rounded-full animate-grid-vertical opacity-50 grid-dot-trail-vertical text-secondary" style={{ left: '2040px', top: '0', animationDelay: '4s' }} />
          <div className="absolute w-1.5 h-1.5 bg-accent rounded-full animate-grid-vertical opacity-50 grid-dot-trail-vertical text-accent" style={{ left: '2280px', top: '0', animationDelay: '10s' }} />
          <div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-grid-vertical opacity-50 grid-dot-trail-vertical text-primary" style={{ left: '2520px', top: '0', animationDelay: '7s' }} />
          <div className="absolute w-1.5 h-1.5 bg-secondary rounded-full animate-grid-vertical opacity-50 grid-dot-trail-vertical text-secondary" style={{ left: '2760px', top: '0', animationDelay: '16s' }} />
          <div className="absolute w-1.5 h-1.5 bg-accent rounded-full animate-grid-vertical opacity-50 grid-dot-trail-vertical text-accent" style={{ left: '3000px', top: '0', animationDelay: '13s' }} />
          <div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-grid-vertical opacity-50 grid-dot-trail-vertical text-primary" style={{ left: '3240px', top: '0', animationDelay: '18s' }} />
          <div className="absolute w-1.5 h-1.5 bg-secondary rounded-full animate-grid-vertical opacity-50 grid-dot-trail-vertical text-secondary" style={{ left: '3480px', top: '0', animationDelay: '21s' }} />
          <div className="absolute w-1.5 h-1.5 bg-accent rounded-full animate-grid-vertical opacity-50 grid-dot-trail-vertical text-accent" style={{ left: '3720px', top: '0', animationDelay: '20s' }} />
          
          {/* 4K - Bottom to top animations */}
          <div className="absolute w-1.5 h-1.5 bg-secondary rounded-full animate-grid-vertical-reverse opacity-55 grid-dot-trail-vertical-reverse text-secondary" style={{ left: '2100px', bottom: '0', animationDelay: '22s' }} />
          <div className="absolute w-1.5 h-1.5 bg-accent rounded-full animate-grid-vertical-reverse opacity-55 grid-dot-trail-vertical-reverse text-accent" style={{ left: '2460px', bottom: '0', animationDelay: '26s' }} />
          <div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-grid-vertical-reverse opacity-55 grid-dot-trail-vertical-reverse text-primary" style={{ left: '2940px', bottom: '0', animationDelay: '23s' }} />
          <div className="absolute w-1.5 h-1.5 bg-secondary rounded-full animate-grid-vertical-reverse opacity-55 grid-dot-trail-vertical-reverse text-secondary" style={{ left: '3420px', bottom: '0', animationDelay: '27s' }} />
          <div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-grid-vertical-reverse opacity-50 grid-dot-trail-vertical-reverse text-primary" style={{ left: '3660px', bottom: '0', animationDelay: '29s' }} />
          
          {/* 4K - Horizontal dots (left to right and right to left) */}
          <div className="absolute w-1.5 h-1.5 bg-accent rounded-full animate-grid-horizontal opacity-55 grid-dot-trail-horizontal text-accent" style={{ left: '0', top: '600px', animationDelay: '30s' }} />
          <div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-grid-horizontal opacity-55 grid-dot-trail-horizontal text-primary" style={{ left: '0', top: '900px', animationDelay: '34s' }} />
          <div className="absolute w-1.5 h-1.5 bg-secondary rounded-full animate-grid-horizontal opacity-55 grid-dot-trail-horizontal text-secondary" style={{ left: '0', top: '1020px', animationDelay: '38s' }} />
          
          {/* Lower half horizontal dots - left to right (1200px+) */}
          <div className="absolute w-1.5 h-1.5 bg-accent rounded-full animate-grid-horizontal opacity-55 grid-dot-trail-horizontal text-accent" style={{ left: '0', top: '1140px', animationDelay: '42s' }} />
          <div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-grid-horizontal opacity-55 grid-dot-trail-horizontal text-primary" style={{ left: '0', top: '1320px', animationDelay: '48s' }} />
          <div className="absolute w-1.5 h-1.5 bg-secondary rounded-full animate-grid-horizontal opacity-55 grid-dot-trail-horizontal text-secondary" style={{ left: '0', top: '1500px', animationDelay: '54s' }} />
          <div className="absolute w-1.5 h-1.5 bg-accent rounded-full animate-grid-horizontal opacity-50 grid-dot-trail-horizontal text-accent" style={{ left: '0', top: '1680px', animationDelay: '60s' }} />
          <div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-grid-horizontal opacity-55 grid-dot-trail-horizontal text-primary" style={{ left: '0', top: '1860px', animationDelay: '66s' }} />
          <div className="absolute w-1.5 h-1.5 bg-secondary rounded-full animate-grid-horizontal opacity-55 grid-dot-trail-horizontal text-secondary" style={{ left: '0', top: '2040px', animationDelay: '72s' }} />
          
          <div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-grid-horizontal-reverse opacity-55 grid-dot-trail-horizontal-reverse text-primary" style={{ top: '540px', right: '0', animationDelay: '31s' }} />
          <div className="absolute w-1.5 h-1.5 bg-accent rounded-full animate-grid-horizontal-reverse opacity-50 grid-dot-trail-horizontal-reverse text-accent" style={{ top: '840px', right: '0', animationDelay: '33s' }} />
          <div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-grid-horizontal-reverse opacity-50 grid-dot-trail-horizontal-reverse text-primary" style={{ top: '960px', right: '0', animationDelay: '37s' }} />
          <div className="absolute w-1.5 h-1.5 bg-secondary rounded-full animate-grid-horizontal-reverse opacity-50 grid-dot-trail-horizontal-reverse text-secondary" style={{ top: '1080px', right: '0', animationDelay: '41s' }} />
          
          {/* Lower half horizontal dots - right to left (1200px+) */}
          <div className="absolute w-1.5 h-1.5 bg-accent rounded-full animate-grid-horizontal-reverse opacity-50 grid-dot-trail-horizontal-reverse text-accent" style={{ top: '1200px', right: '0', animationDelay: '45s' }} />
          <div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-grid-horizontal-reverse opacity-50 grid-dot-trail-horizontal-reverse text-primary" style={{ top: '1380px', right: '0', animationDelay: '51s' }} />
          <div className="absolute w-1.5 h-1.5 bg-secondary rounded-full animate-grid-horizontal-reverse opacity-50 grid-dot-trail-horizontal-reverse text-secondary" style={{ top: '1560px', right: '0', animationDelay: '57s' }} />
          <div className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-grid-horizontal-reverse opacity-50 grid-dot-trail-horizontal-reverse text-primary" style={{ top: '1740px', right: '0', animationDelay: '63s' }} />
          <div className="absolute w-1.5 h-1.5 bg-accent rounded-full animate-grid-horizontal-reverse opacity-55 grid-dot-trail-horizontal-reverse text-accent" style={{ top: '1920px', right: '0', animationDelay: '69s' }} />
          <div className="absolute w-1.5 h-1.5 bg-secondary rounded-full animate-grid-horizontal-reverse opacity-55 grid-dot-trail-horizontal-reverse text-secondary" style={{ top: '2100px', right: '0', animationDelay: '75s' }} />
        </div>

        {/* Floating Orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-secondary/8 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-accent/6 rounded-full blur-3xl animate-float-slow" />
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

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThirdwebProvider } from "thirdweb/react";
import { WagmiProvider, createConfig, http } from 'wagmi';
import { MetaTags } from './components/MetaTags';
import { HelmetProvider } from 'react-helmet-async';
import { bsc, bscTestnet } from 'wagmi/chains';
import { injected, metaMask } from 'wagmi/connectors';
import { lazy, Suspense } from 'react';
import { ChainProvider } from './contexts/ChainContext';

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Hub = lazy(() => import("./pages/Hub"));
const Documents = lazy(() => import("./pages/Documents"));
const News = lazy(() => import("./pages/News"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

import C15TCookieProvider from './components/CookiePolicy';
import ScamWarning from './components/ScamWarning';

const queryClient = new QueryClient();

const config = createConfig({
  chains: [bsc, bscTestnet],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
  },
});

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <ThirdwebProvider>
          <ChainProvider>
            <C15TCookieProvider>
              <TooltipProvider>
                <ScamWarning />
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <Toaster />
                  <Sonner />
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/documents" element={<Documents />} />
                      <Route path="/news" element={<News />} />
                      <Route path="/admin-dashboard" element={<AdminDashboard />} />
                      <Route path="/hub/*" element={<Hub />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </TooltipProvider>
            </C15TCookieProvider>
          </ChainProvider>
        </ThirdwebProvider>
      </WagmiProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;

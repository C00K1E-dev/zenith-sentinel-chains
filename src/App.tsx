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
import Index from "./pages/Index";
import Hub from "./pages/Hub";
import Documents from "./pages/Documents";
import News from "./pages/News";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
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

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <ThirdwebProvider>
          <C15TCookieProvider>
            <TooltipProvider>
              <ScamWarning />
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/admin-dashboard" element={<AdminDashboard />} />
                  <Route path="/hub/*" element={<Hub />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </C15TCookieProvider>
        </ThirdwebProvider>
      </WagmiProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;

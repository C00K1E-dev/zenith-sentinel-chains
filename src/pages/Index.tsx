import { ArrowRight, Zap, Shield, Cpu, Target, Copy, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Suspense, lazy, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContentCard from '@/components/ContentCard';
import { Loading } from '@/components/ui/loading';
import heroImage from '@/assets/svghero.svg';
import { MetaTags } from '@/components/MetaTags';

const Roadmap = lazy(() => import('@/components/Roadmap'));
const Team = lazy(() => import('@/components/Team'));
const FAQ = lazy(() => import('@/components/FAQ'));
const PoweredBy = lazy(() => import('@/components/PoweredBy'));

const Index = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText('0x56317dbCCd647C785883738fac9308ebcA063aca');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <MetaTags 
        title="SmartSentinels | AI-Powered Audits & Verifiable Compute"
        description="SmartSentinels delivers verifiable, low-cost AI services for businesses—from smart contract audits to intelligent assistants—while rewarding contributors with SSTL tokens. Edge-native, deflationary, and built for real impact."
        path="/"
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-x-hidden overflow-y-auto">
        {/* Optimized Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* Static Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
          <div className="absolute inset-0 bg-gradient-to-tl from-accent/5 via-transparent to-primary/5" />

          {/* Circuit Pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="circuit" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <rect x="0" y="0" width="20" height="20" fill="none"/>
                  <circle cx="10" cy="10" r="1" fill="rgba(248, 244, 66, 0.2)"/>
                  <line x1="10" y1="10" x2="20" y2="10" stroke="rgba(248, 244, 66, 0.1)" strokeWidth="0.5"/>
                  <line x1="10" y1="10" x2="10" y2="0" stroke="rgba(248, 244, 66, 0.1)" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#circuit)"/>
            </svg>
          </div>

          {/* Reduced Floating Elements */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
          <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-secondary/2 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-accent/2 rounded-full blur-3xl" />
        </div>

        <Navbar />
        
        {/* Hero Section */}
        <section className="relative min-h-[auto] sm:min-h-screen flex items-start sm:items-center justify-center overflow-hidden pt-20 sm:pt-16 pb-0 sm:pb-0">
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0 sm:py-12 md:py-16 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-8 md:gap-10 lg:gap-12 items-center">
              {/* Hero Content */}
              <div className="order-2 lg:order-1 flex justify-center lg:justify-start mb-0 sm:mb-0">
                <div className="glass-card p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 text-center w-full max-w-2xl lg:max-w-3xl overflow-hidden">
                  <h1 className="text-[2.25rem] sm:text-5xl md:text-5xl lg:text-4xl xl:text-5xl font-orbitron font-bold mb-4 sm:mb-6 neon-glow leading-tight px-2">
                    SmartSentinels
                  </h1>
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl text-foreground mb-3 sm:mb-4 font-orbitron leading-tight">
                    Decentralized AI Agents Powered by Proof of Useful Work
                  </p>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-primary mb-4 sm:mb-6 font-semibold">
                    AI Agents. Real Work. Real Rewards.
                  </p>
                  <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
                    Join the revolution where AI agents perform real work, devices earn rewards, 
                    and you hold the key to the future of decentralized intelligence.
                  </p>
                  
                  <div className="flex justify-center">
                    <Link to="/hub" target="_blank" rel="noopener noreferrer">
                      <Button variant="hero" size="lg" className="group text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4">
                        Join the Network
                        <ArrowRight className="group-hover:translate-x-1 transition-transform ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Hero Image - Visible on all screen sizes */}
              <div className="order-1 lg:order-2 flex justify-center items-center">
                <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
                  <img 
                    src={heroImage} 
                    alt="SmartSentinels AI Robot" 
                    className="w-full h-auto object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Sections */}
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-20">
          {/* About Section Title */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-4 neon-glow">
              About SmartSentinels
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover how we're revolutionizing AI services with decentralized technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <ContentCard
              title="A New Class of Digital Ownership"
              content="SmartSentinels delivers verifiable, low-cost AI services for businesses—from smart contract audits to intelligent assistants—while rewarding contributors with SSTL tokens. Edge-native, deflationary, and built for real impact."
              delay={0}
              icon={<Shield size={40} />}
            />
            
            <ContentCard
              title="Why It Matters"
              content="Instead of wasting energy like traditional mining, SmartSentinels puts computation to work. Investors back real-world utility, and contributors can stake hardware or mint NFTs to share in the generated rewards."
              delay={0.1}
              icon={<Zap size={40} />}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <ContentCard
              title="A New Model"
              content="Our ecosystem ties together AI, blockchain, and hardware ownership into one seamless experience—where every second of useful work by a Sentinel brings measurable value back to the community."
              delay={0.2}
              icon={<Cpu size={40} />}
            />
            
            <ContentCard
              title="Our Mission & Vision"
              content="To unlock the real-world value of AI by turning devices into autonomous workers. We empower contributors to earn through purpose-driven mining and give businesses access to decentralized, on-demand intelligence."
              delay={0.3}
              icon={<Target size={40} />}
            />
          </div>

          {/* Token Information Card */}
          <div className="mb-16">
            <div className="glass-card p-4 sm:p-6 md:p-8 text-center">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-orbitron font-bold mb-4 sm:mb-6 neon-glow">
                SSTL Token
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex flex-col sm:flex-row sm:justify-center sm:items-center gap-2 sm:gap-4">
                    <span className="text-sm sm:text-base lg:text-lg font-semibold text-primary">Contract Address:</span>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <code className="bg-muted px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-mono break-all max-w-full">
                        <span className="inline sm:hidden">0x563...3aca</span>
                        <span className="hidden sm:inline lg:hidden">0x56317...3aca</span>
                        <span className="hidden lg:inline">0x56317dbCCd647C785883738fac9308ebcA063aca</span>
                      </code>
                      <div className="flex gap-1">
                        <Button onClick={handleCopy} variant="ghost" size="sm" className="p-2 h-7 w-7 sm:h-8 sm:w-8">
                          {copied ? <Check size={14} className="sm:w-4 sm:h-4" /> : <Copy size={14} className="sm:w-4 sm:h-4" />}
                        </Button>
                        <Button asChild variant="ghost" size="sm" className="p-2 h-7 w-7 sm:h-8 sm:w-8">
                          <a href="https://bscscan.com/address/0x56317dbCCd647C785883738fac9308ebcA063aca" target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={14} className="sm:w-4 sm:h-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-sm sm:text-base lg:text-lg text-muted-foreground">
                  <span className="font-semibold text-primary">Total Supply:</span> 100,000,000 SSTL
                </div>
                <div className="text-sm sm:text-base lg:text-lg text-muted-foreground">
                  <span className="font-semibold text-primary">Standard:</span> BEP-20 Token
                </div>
              </div>
            </div>
          </div>

          {/* Roadmap Section */}
          <Suspense fallback={<Loading />}>
            <Roadmap />
          </Suspense>

          {/* Team Section */}
          <Suspense fallback={<Loading />}>
            <Team />
          </Suspense>

          <Suspense fallback={<Loading />}>
            <PoweredBy />
          </Suspense>

          {/* FAQ Section */}
          <Suspense fallback={<Loading />}>
            <FAQ />
          </Suspense>

          {/* Closing CTA */}
          <div className="glass-card p-6 sm:p-8 md:p-12 text-center neon-border">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-orbitron font-bold mb-4 sm:mb-6 neon-glow leading-tight">
              Join the Decentralized Workforce Revolution
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 px-2">
              Where AI works, devices earn, and you hold the key.
            </p>
            <Link to="/hub" target="_blank" rel="noopener noreferrer">
              <Button variant="hero" size="lg" className="group text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4">
                Get Started Now
                <ArrowRight className="group-hover:translate-x-1 transition-transform ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Index;

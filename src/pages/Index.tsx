import { ArrowRight, Zap, Shield, Cpu, Target, Copy, ExternalLink, Check, Sparkles, TrendingUp, Flame, Lock } from 'lucide-react';
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
const Vision = lazy(() => import('@/components/Vision'));
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

          {/* ERC-7857 Intelligent NFTs Section */}
          <div className="mb-16">
            <div className="glass-card p-6 sm:p-8 md:p-10 border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
              <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
                <div className="flex-shrink-0">
                  <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                    <Sparkles size={48} className="text-primary sm:w-16 sm:h-16" />
                  </div>
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-orbitron font-bold neon-glow">
                      ERC-7857: Intelligent NFTs
                    </h3>
                    <span className="px-3 py-1 text-xs font-bold bg-primary/20 text-primary rounded-full border border-primary/30">
                      NEW STANDARD
                    </span>
                  </div>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6">
                    SmartSentinels leverages <span className="text-primary font-semibold">ERC-7857</span>—a new NFT standard where tokens aren't just collectibles, they're autonomous AI agents. Each iNFT embeds ownership, intellectual property rights, and revenue-sharing logic directly in its metadata.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-primary/10">
                      <Shield size={20} className="text-primary flex-shrink-0" />
                      <span className="text-sm font-medium">Embedded IP Rights</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-primary/10">
                      <Cpu size={20} className="text-primary flex-shrink-0" />
                      <span className="text-sm font-medium">On-Chain AI Logic</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-primary/10">
                      <Zap size={20} className="text-primary flex-shrink-0" />
                      <span className="text-sm font-medium">Passive Income</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-primary/10">
                      <Target size={20} className="text-primary flex-shrink-0" />
                      <span className="text-sm font-medium">Real Utility</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Token Information Card */}
          <div className="mb-16">
            <div className="glass-card p-4 sm:p-6 md:p-8">
              {/* Header Row */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-8 mb-8">
                <div className="text-center md:text-left">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-orbitron font-bold mb-4 sm:mb-6 neon-glow">
                    SSTL Token
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col gap-3 sm:gap-4">
                      <div className="flex flex-col sm:flex-row sm:justify-center sm:items-center gap-2 sm:gap-4 md:justify-start">
                        <span className="text-sm sm:text-base lg:text-lg font-semibold text-primary">Contract Address:</span>
                        <div className="flex items-center justify-center gap-2 flex-wrap md:justify-start">
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
                      <span className="font-semibold text-primary">Total Supply:</span> 100,000,000 SSTL (Hard Cap)
                    </div>
                    <div className="text-sm sm:text-base lg:text-lg text-muted-foreground">
                      <span className="font-semibold text-primary">Standard:</span> BEP-20 Token
                    </div>
                    <div className="flex justify-center items-center gap-4 md:justify-start">
                      <div className="flex items-center gap-2">
                        <Button asChild variant="ghost" size="sm" className="p-2 h-7 w-7 sm:h-8 sm:w-8">
                          <a href="https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafybeiayb6pztjs57hwrbgj76vuv4qrsp3g4it7vqbtsgeg3avolnrcjum" target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={14} className="sm:w-4 sm:h-4" />
                          </a>
                        </Button>
                        <a href="https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafybeiayb6pztjs57hwrbgj76vuv4qrsp3g4it7vqbtsgeg3avolnrcjum" target="_blank" rel="noopener noreferrer" className="text-sm sm:text-base lg:text-lg font-semibold text-primary hover:text-primary/80 transition-colors">
                          Audit
                        </a>
                      </div>
                      <span className="text-primary/50">•</span>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="ghost" size="sm" className="p-2 h-7 w-7 sm:h-8 sm:w-8">
                          <a href="/documents/SmartSentinelsWhitepaper v0.2.pdf" target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={14} className="sm:w-4 sm:h-4" />
                          </a>
                        </Button>
                        <a href="/documents/SmartSentinelsWhitepaper v0.2.pdf" target="_blank" rel="noopener noreferrer" className="text-sm sm:text-base lg:text-lg font-semibold text-primary hover:text-primary/80 transition-colors">
                          Full Tokenomics
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center md:justify-end">
                  <img 
                    src="/assets/token.svg" 
                    alt="SSTL Token" 
                    className="w-40 sm:w-48 md:w-56 h-40 sm:h-48 md:h-56 object-contain flex-shrink-0"
                  />
                </div>
              </div>

              {/* Token Distribution */}
              <div className="border-t border-primary/20 pt-6">
                <h4 className="text-lg sm:text-xl font-orbitron font-semibold mb-4 text-center">Token Distribution</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
                  <div className="text-center p-3 rounded-lg bg-background/50 border border-primary/20">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">40%</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">PoUW Rewards</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50 border border-primary/20">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">15%</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Liquidity</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50 border border-primary/20">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">15%</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Marketing</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50 border border-primary/20">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">10%</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Team</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50 border border-primary/20">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">10%</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Strategic Reserve</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50 border border-primary/20">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">10%</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Fundraising</div>
                  </div>
                </div>

                {/* PoUW Mechanism & Deflationary */}
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                  {/* PoUW Distribution */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                    <h5 className="font-semibold text-primary mb-3 flex items-center gap-2">
                      <Sparkles size={18} />
                      PoUW Emission Distribution
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">iNFT & NFT Holders</span>
                        <span className="font-semibold">60%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Treasury & Staking</span>
                        <span className="font-semibold">20%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Business Clients</span>
                        <span className="font-semibold">10%</span>
                      </div>
                      <div className="flex justify-between text-orange-400">
                        <span>Burn (Deflationary)</span>
                        <span className="font-semibold">10%</span>
                      </div>
                    </div>
                  </div>

                  {/* Halving Schedule */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                    <h5 className="font-semibold text-primary mb-3 flex items-center gap-2">
                      <TrendingUp size={18} />
                      Halving Schedule
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phase H0</span>
                        <span className="font-semibold">100% emission</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phase H1</span>
                        <span className="font-semibold">50% emission</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phase H2</span>
                        <span className="font-semibold">25% emission</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phase H3</span>
                        <span className="font-semibold">12.5% emission</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Features */}
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm">
                    <Flame size={16} />
                    <span>10% Burn per Emission</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm">
                    <Lock size={16} />
                    <span>Team: 12mo Cliff + 36mo Vesting</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                    <Shield size={16} />
                    <span>Audited Smart Contract</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Roadmap Section */}
          <Suspense fallback={<Loading />}>
            <Roadmap />
          </Suspense>

          {/* Our Vision Section */}
          <Suspense fallback={<Loading />}>
            <Vision />
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

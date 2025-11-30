import { ArrowRight, Zap, Shield, Cpu, Target, Copy, ExternalLink, Check, Sparkles, TrendingUp, Flame, Lock, BarChart3, Users, Globe, Wallet, Bot, Network, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Suspense, lazy, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContentCard from '@/components/ContentCard';
import { Loading } from '@/components/ui/loading';
import { MetaTags } from '@/components/MetaTags';
import WorldMap from '@/components/WorldMap';

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

          {/* Floating Orbs */}
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-secondary/8 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-accent/6 rounded-full blur-3xl animate-float-slow" />
        </div>

        <Navbar />
        
        {/* Hero Section - Full Width Professional Design */}
        <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16">
          <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 lg:px-12 xl:px-16">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Hero Content */}
              <div className="space-y-8 order-2 lg:order-1">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Powered by ERC-7857 Intelligent NFTs</span>
                  </div>
                  
                  <h1 className="text-5xl md:text-6xl xl:text-7xl font-display font-bold leading-tight">
                    <span className="block text-foreground">Decentralized</span>
                    <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                      AI Workforce
                    </span>
                  </h1>
                  
                  <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
                    Transform idle computing power into valuable AI services. Earn rewards through Proof of Useful Work.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/hub">
                    <Button size="lg" className="group h-14 px-8 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-primary/25 transition-all duration-300">
                      Get Started
                      <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/documents">
                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-primary/30 hover:bg-primary/5 transition-all duration-300">
                      View Documentation
                    </Button>
                  </Link>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border/50">
                  <div className="space-y-1">
                    <div className="text-3xl font-display font-bold text-primary">100M</div>
                    <div className="text-sm text-muted-foreground">SSTL Supply</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-display font-bold text-secondary">40%</div>
                    <div className="text-sm text-muted-foreground">PoUW Rewards</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-display font-bold text-accent">ERC-7857</div>
                    <div className="text-sm text-muted-foreground">iNFT Standard</div>
                  </div>
                </div>
              </div>
              
              {/* Hero Visual - Globe Image */}
              <div className="relative w-full h-64 sm:h-80 md:h-[450px] lg:h-[750px] lg:absolute lg:right-0 xl:right-0 lg:top-1/2 lg:-translate-y-1/2 lg:w-[750px] order-1 lg:order-2">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-full blur-3xl animate-pulse-glow pointer-events-none z-0" />
                
                {/* Globe Image */}
                <img 
                  src="/assets/pouwGlobe.png" 
                  alt="Global AI Network" 
                  className="w-full h-full object-contain object-center animate-float z-10"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Full Width */}
        <section className="relative z-10 py-20 lg:py-32">
          <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-12 xl:px-16">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl md:text-5xl font-display font-bold">
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Revolutionary AI Platform
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                A new paradigm where AI services generate real value and participants earn fair rewards
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature Card 1 */}
              <div className="glass-card-hover p-8 space-y-4 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-display font-semibold">Verifiable AI</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Cryptographically verified AI computations with full transparency and auditability.
                </p>
              </div>

              {/* Feature Card 2 */}
              <div className="glass-card-hover p-8 space-y-4 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="text-xl font-display font-semibold">Proof of Useful Work</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Mining that generates real-world value through AI services, not wasted energy.
                </p>
              </div>

              {/* Feature Card 3 */}
              <div className="glass-card-hover p-8 space-y-4 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Cpu className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-xl font-display font-semibold">Edge Computing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Distributed AI processing at the edge for maximum efficiency and privacy.
                </p>
              </div>

              {/* Feature Card 4 */}
              <div className="glass-card-hover p-8 space-y-4 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-display font-semibold">Token Rewards</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Earn SSTL tokens for contributing compute power and owning iNFTs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ERC-7857 Showcase Section */}
        <section className="relative z-10 py-20 lg:py-32">
          <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-12 xl:px-16">
            <div className="glass-card p-10 lg:p-16 border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl" />
              
              <div className="relative grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold text-primary">NEW STANDARD</span>
                  </div>
                  
                  <h2 className="text-4xl lg:text-5xl font-display font-bold">
                    ERC-7857: <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Intelligent NFTs</span>
                  </h2>
                  
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Beyond collectibles—our iNFTs are autonomous AI agents with embedded IP rights, 
                    on-chain logic, and automated revenue sharing. Own the future of AI infrastructure.
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">IP Protection</div>
                        <div className="text-sm text-muted-foreground">Built-in rights</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <Cpu className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">On-Chain AI</div>
                        <div className="text-sm text-muted-foreground">Smart logic</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Wallet className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Passive Income</div>
                        <div className="text-sm text-muted-foreground">Auto rewards</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Real Utility</div>
                        <div className="text-sm text-muted-foreground">Active agents</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-8 space-y-6">
                  <h3 className="text-2xl font-display font-semibold">iNFT Benefits</h3>
                  <div className="space-y-4">
                    {[
                      { icon: BarChart3, title: "Revenue Share", desc: "Earn from AI service fees" },
                      { icon: Users, title: "Governance Rights", desc: "Vote on platform decisions" },
                      { icon: Globe, title: "Global Access", desc: "Deploy agents worldwide" },
                      { icon: Lock, title: "IP Ownership", desc: "Your agents, your rights" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-background/50 border border-border/30 hover:border-primary/30 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{item.title}</div>
                          <div className="text-sm text-muted-foreground">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Token Information - Modern Card Design */}
        <section className="relative z-10 py-20 lg:py-32">
          <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-12 xl:px-16">
            <div className="glass-card p-10 lg:p-16">
              <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
                <div className="space-y-6">
                  <h2 className="text-4xl lg:text-5xl font-display font-bold">
                    SSTL <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Token</span>
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">Contract:</span>
                      <code className="flex-1 px-4 py-2 bg-background/50 rounded-lg text-sm font-mono border border-border/30">
                        0x5631...3aca
                      </code>
                      <Button onClick={handleCopy} variant="ghost" size="sm" className="hover:bg-primary/10">
                        {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button asChild variant="ghost" size="sm" className="hover:bg-primary/10">
                        <a href="https://bscscan.com/address/0x56317dbCCd647C785883738fac9308ebcA063aca" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="text-sm text-muted-foreground mb-1">Total Supply</div>
                        <div className="text-2xl font-display font-bold text-primary">100M SSTL</div>
                      </div>
                      <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/20">
                        <div className="text-sm text-muted-foreground mb-1">Standard</div>
                        <div className="text-2xl font-display font-bold text-secondary">BEP-20</div>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button asChild variant="outline" size="sm" className="border-primary/30 hover:bg-primary/5">
                        <a href="https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafybeiayb6pztjs57hwrbgj76vuv4qrsp3g4it7vqbtsgeg3avolnrcjum" target="_blank" rel="noopener noreferrer">
                          <Shield className="w-4 h-4 mr-2" />
                          View Audit
                        </a>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="border-primary/30 hover:bg-primary/5">
                        <a href="/documents/SmartSentinelsWhitepaper v0.2.pdf" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Whitepaper
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="relative w-64 h-64">
                    {/* Animated Rings */}
                    <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: '3s' }} />
                    <div className="absolute inset-4 rounded-full border-2 border-secondary/20 animate-ping" style={{ animationDuration: '3.5s' }} />
                    <div className="absolute inset-8 rounded-full border-2 border-accent/20 animate-ping" style={{ animationDuration: '4s' }} />
                    
                    {/* Central Token Design */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-primary via-secondary to-accent p-1 animate-float-slow">
                        <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                          <div className="text-center space-y-2">
                            <div className="text-5xl font-display font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                              SSTL
                            </div>
                            <div className="text-xs text-muted-foreground font-medium">Token</div>
                            <div className="flex items-center justify-center gap-2 mt-3">
                              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" style={{ animationDelay: '0.2s' }} />
                              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: '0.4s' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Orbiting Elements */}
                    <div className="absolute top-8 right-8 w-12 h-12 glass-card rounded-full flex items-center justify-center border border-primary/30 animate-float">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div className="absolute bottom-12 left-12 w-12 h-12 glass-card rounded-full flex items-center justify-center border border-secondary/30 animate-float-delayed">
                      <Zap className="w-6 h-6 text-secondary" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Token Distribution */}
              <div className="border-t border-border/50 pt-12">
                <h3 className="text-2xl font-display font-semibold mb-8 text-center">Token Distribution</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
                  {[
                    { percent: '40%', label: 'PoUW Rewards', color: 'primary' },
                    { percent: '15%', label: 'Liquidity', color: 'secondary' },
                    { percent: '15%', label: 'Marketing', color: 'accent' },
                    { percent: '10%', label: 'Team', color: 'primary' },
                    { percent: '10%', label: 'Strategic', color: 'secondary' },
                    { percent: '10%', label: 'Fundraising', color: 'accent' },
                  ].map((item, i) => (
                    <div key={i} className="glass-card p-6 text-center hover:scale-105 transition-transform">
                      <div className={`text-3xl font-display font-bold text-${item.color} mb-2`}>{item.percent}</div>
                      <div className="text-sm text-muted-foreground">{item.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* PoUW Distribution */}
                  <div className="glass-card p-6 border-primary/20">
                    <div className="flex items-center gap-3 mb-6">
                      <Sparkles className="w-6 h-6 text-primary" />
                      <h4 className="text-xl font-display font-semibold">PoUW Distribution</h4>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'iNFT & NFT Holders', value: '60%' },
                        { label: 'Treasury & Staking', value: '20%' },
                        { label: 'Business Clients', value: '10%' },
                        { label: 'Burn (Deflationary)', value: '10%', highlight: true }
                      ].map((item, i) => (
                        <div key={i} className={`flex justify-between items-center p-3 rounded-lg ${item.highlight ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-background/30'}`}>
                          <span className={item.highlight ? 'text-orange-400 font-medium' : 'text-muted-foreground'}>{item.label}</span>
                          <span className={`font-display font-semibold ${item.highlight ? 'text-orange-400' : 'text-foreground'}`}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Halving Schedule */}
                  <div className="glass-card p-6 border-secondary/20">
                    <div className="flex items-center gap-3 mb-6">
                      <TrendingUp className="w-6 h-6 text-secondary" />
                      <h4 className="text-xl font-display font-semibold">Halving Schedule</h4>
                    </div>
                    <div className="space-y-3">
                      {[
                        { phase: 'Phase H0', emission: '100%' },
                        { phase: 'Phase H1', emission: '50%' },
                        { phase: 'Phase H2', emission: '25%' },
                        { phase: 'Phase H3', emission: '12.5%' }
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-background/30">
                          <span className="text-muted-foreground">{item.phase}</span>
                          <span className="font-display font-semibold text-foreground">{item.emission}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Key Features */}
                <div className="flex flex-wrap justify-center gap-4 mt-8">
                  <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-orange-500/10 border border-orange-500/30">
                    <Flame className="w-5 h-5 text-orange-400" />
                    <span className="font-medium text-orange-400">10% Burn per Emission</span>
                  </div>
                  <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/30">
                    <Lock className="w-5 h-5 text-primary" />
                    <span className="font-medium text-primary">Team Vesting: 12mo + 36mo</span>
                  </div>
                  <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-green-500/10 border border-green-500/30">
                    <Shield className="w-5 h-5 text-green-400" />
                    <span className="font-medium text-green-400">Audited Contract</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap Section */}
        <section className="relative z-10 py-20 lg:py-32">
          <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-12 xl:px-16">
            <Suspense fallback={<Loading />}>
              <Roadmap />
            </Suspense>
          </div>
        </section>

        {/* Vision Section */}
        <section className="relative z-10 py-20 lg:py-32">
          <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-12 xl:px-16">
            <Suspense fallback={<Loading />}>
              <Vision />
            </Suspense>
          </div>
        </section>

        {/* Team Section */}
        <section className="relative z-10 py-20 lg:py-32">
          <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-12 xl:px-16">
            <Suspense fallback={<Loading />}>
              <Team />
            </Suspense>
          </div>
        </section>

        {/* Powered By Section */}
        <section className="relative z-10 py-20 lg:py-32">
          <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-12 xl:px-16">
            <Suspense fallback={<Loading />}>
              <PoweredBy />
            </Suspense>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="relative z-10 py-20 lg:py-32">
          <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-12 xl:px-16">
            <Suspense fallback={<Loading />}>
              <FAQ />
            </Suspense>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative z-10 py-20 lg:py-32">
          <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-12 xl:px-16">
            <div className="glass-card p-12 lg:p-20 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10" />
              <div className="relative space-y-8">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold">
                  <span className="block mb-2">Ready to Join the</span>
                  <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    AI Revolution?
                  </span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Start earning rewards today by contributing to the decentralized AI workforce
                </p>
                <Link to="/hub">
                  <Button size="lg" className="h-16 px-12 text-lg bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-2xl hover:shadow-primary/25 transition-all duration-300 group">
                    Launch App
                    <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Index;

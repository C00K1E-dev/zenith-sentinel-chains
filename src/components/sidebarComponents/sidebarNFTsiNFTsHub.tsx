import { motion } from 'framer-motion';
import { Image as ImageIcon, Sparkles, Bot, Zap, Crown, DollarSign, Rocket, Target, ChevronRight, ExternalLink, TrendingUp, Award, Shield } from 'lucide-react';
import { useState } from 'react';
import { useReadContract } from 'wagmi';
import { GENESIS_CONTRACT_ADDRESS, GENESIS_CHAIN_ID, GENESIS_ABI, AI_AUDIT_CONTRACT_ADDRESS, AI_AUDIT_CHAIN_ID, AI_AUDIT_ABI } from '../../contracts/index';
import StatCard from '@/components/StatCard';
import GenesisMint from '@/components/GenesisMint';
import AIAuditMint from '@/components/AIAuditMint';
import MintSuccessOverlay from '@/components/MintSuccessOverlay';

const SidebarNFTsiNFTsHub = () => {
  const [mintSuccessData, setMintSuccessData] = useState<{tokenId?: bigint, txHash?: string, imageUrl?: string, collectionName?: string} | null>(null);

  // Read total supply for Genesis collection
  const { data: genesisTotalSupply } = useReadContract({
    address: GENESIS_CONTRACT_ADDRESS as `0x${string}`,
    abi: GENESIS_ABI,
    functionName: 'totalSupply',
    chainId: GENESIS_CHAIN_ID,
  });

  // Read total supply for AI Audit collection
  const { data: aiAuditTotalSupply } = useReadContract({
    address: AI_AUDIT_CONTRACT_ADDRESS as `0x${string}`,
    abi: AI_AUDIT_ABI,
    functionName: 'totalSupply',
    chainId: AI_AUDIT_CHAIN_ID,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const
      }
    }
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 md:mb-12"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 backdrop-blur-sm flex items-center justify-center">
            <ImageIcon size={32} className="text-primary" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-orbitron font-bold mb-2">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                NFTs & iNFTs Hub
              </span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Explore and mint exclusive SmartSentinels collections
            </p>
          </div>
        </div>

        {/* Hub Info Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border border-primary/20 p-6 md:p-8"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Sparkles className="text-primary" size={24} />
              </div>
              <h3 className="text-xl md:text-2xl font-orbitron font-bold text-foreground">
                About SmartSentinels NFTs
              </h3>
            </div>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-6">
              More than digital art - your gateway to AI-powered ownership with real utility and benefits.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-primary/10 group hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Bot size={20} className="text-primary flex-shrink-0" />
                </div>
                <span className="text-sm font-medium">AI Access</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-primary/10 group hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp size={20} className="text-secondary flex-shrink-0" />
                </div>
                <span className="text-sm font-medium">Rewards</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-accent/10 group hover:border-accent/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Award size={20} className="text-accent flex-shrink-0" />
                </div>
                <span className="text-sm font-medium">Exclusive Benefits</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-primary/10 group hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Shield size={20} className="text-primary flex-shrink-0" />
                </div>
                <span className="text-sm font-medium">Verified</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* NFT Collections Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Genesis Collection Card */}
        <motion.div variants={cardVariants}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-background via-background to-primary/5 border border-primary/30">
            
            {/* Responsive Layout */}
            <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-0 p-4 md:p-6 lg:p-8">
              {/* Image Section */}
              <div className="relative flex items-center justify-start min-h-[300px] md:min-h-[400px]">
                <img
                  src="/assets/genesisNFT.webp"
                  alt="Genesis NFT"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain max-w-xs"
                />
              </div>

              {/* Content Section */}
              <div className="flex flex-col gap-3 md:gap-4 md:pl-4 lg:pl-6">
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-orbitron font-bold text-foreground flex items-center gap-2">
                      Genesis Collection
                      <Crown size={24} className="text-primary" />
                    </h3>
                    <a 
                      href="https://nftcalendar.io/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 border border-primary/20 hover:border-primary/40 transition-all hover:scale-105"
                    >
                      <span className="text-xs font-medium text-muted-foreground">Verified by</span>
                      <img 
                        src="/assets/nftcalendar-500x500.png" 
                        alt="NFT Calendar" 
                        className="w-5 h-5 object-contain"
                      />
                    </a>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-2">
                    For early supporters who believe in our vision. As a Genesis holder, you're not just an owner - you're a builder helping shape the future of SmartSentinels.
                  </p>
                  <p className="text-xs sm:text-sm text-primary/80 font-medium italic">
                    Limited to 1,000 founding members with lifetime rewards.
                  </p>
                </div>

                {/* Benefits Grid */}
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
                    <Sparkles size={16} className="text-primary" />
                    Exclusive Benefits
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/20 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <DollarSign size={16} className="text-accent" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-foreground mb-0.5">Revenue Share</div>
                        <div className="text-xs text-muted-foreground leading-tight">10% from sales of future NFT Collections</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/20 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Zap size={16} className="text-secondary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-foreground mb-0.5">Staking Boost</div>
                        <div className="text-xs text-muted-foreground leading-tight">100% yield boost on upcoming staking</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/20 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Rocket size={16} className="text-secondary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-foreground mb-0.5">Priority Access</div>
                        <div className="text-xs text-muted-foreground leading-tight">Early feature releases</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/20 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Crown size={16} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-foreground mb-0.5">Lifetime Rewards</div>
                        <div className="text-xs text-muted-foreground leading-tight">Perpetual revenue sharing</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mint Info Container */}
                <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Total Minted</div>
                      <div className="text-base sm:text-lg font-bold text-primary font-orbitron">
                        {genesisTotalSupply ? Number(genesisTotalSupply) : 0} / 1000
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Mint Price</div>
                      <div className="text-base sm:text-lg font-bold text-primary font-orbitron">0.1 BNB</div>
                    </div>
                  </div>
                </div>

                {/* Disclaimer */}
                <p className="text-[10px] text-muted-foreground/60 leading-tight -mt-2">
                  * Lifetime rewards are contingent upon project operations. Benefits may be affected by circumstances beyond our control including regulatory changes or project sustainability.
                </p>

                {/* Buttons Row */}
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <GenesisMint onMinted={(args) => {
                      console.log('Genesis NFT mint callback received:', args);
                      setMintSuccessData({
                        tokenId: args.tokenId,
                        txHash: args.txHash,
                        imageUrl: args.imageUrl || '/placeholder-genesis.png',
                        collectionName: 'Genesis NFT'
                      });
                      console.log('MintSuccessData set:', {
                        tokenId: args.tokenId,
                        txHash: args.txHash,
                        imageUrl: args.imageUrl || '/placeholder-genesis.png',
                        collectionName: 'Genesis NFT'
                      });
                    }} />
                  </div>
                  <a 
                    href={`https://bscscan.com/address/${GENESIS_CONTRACT_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nft-mint-btn"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Audit Collection Card */}
        <motion.div variants={cardVariants}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-background via-background to-accent/5 border border-accent/30">
            
            {/* Responsive Layout */}
            <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-0 p-4 md:p-6 lg:p-8">
              {/* Image Section */}
              <div className="relative flex items-center justify-start min-h-[300px] md:min-h-[400px]">
                <img
                  src="/assets/AIAuditNFT.webp"
                  alt="AI Audit NFT"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain max-w-xs"
                />
              </div>

              {/* Content Section */}
              <div className="flex flex-col gap-3 md:gap-4 md:pl-4 lg:pl-6">
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-orbitron font-bold text-foreground flex items-center gap-2">
                      AI Audit Collection
                      <Bot size={24} className="text-primary" />
                    </h3>
                    <a 
                      href="https://nftcalendar.io/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 border border-accent/20 hover:border-accent/40 transition-all hover:scale-105"
                    >
                      <span className="text-xs font-medium text-muted-foreground">Verified by</span>
                      <img 
                        src="/assets/nftcalendar-500x500.png" 
                        alt="NFT Calendar" 
                        className="w-5 h-5 object-contain"
                      />
                    </a>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Own an NFT and generate passive income. Share in the revenue generated from AI-powered smart contract audits on the network.
                  </p>
                </div>

                {/* Benefits Grid */}
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
                    <Sparkles size={16} className="text-primary" />
                    Exclusive Benefits
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-accent/5 border border-accent/10 hover:border-accent/20 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Zap size={16} className="text-secondary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-foreground mb-0.5">PoUW Rewards</div>
                        <div className="text-xs text-muted-foreground leading-tight">Share 40.2 SSTL per audit</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mint Info Container */}
                <div className="p-2 rounded-lg bg-accent/5 border border-accent/10">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Total Minted</div>
                      <div className="text-base sm:text-lg font-bold text-accent font-orbitron">
                        {aiAuditTotalSupply ? Number(aiAuditTotalSupply) : 0} / 1000
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Mint Price</div>
                      <div className="text-base sm:text-lg font-bold text-accent font-orbitron">0.074 BNB</div>
                    </div>
                  </div>
                </div>

                {/* Buttons Row */}
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <AIAuditMint onMinted={(args) => {
                      setMintSuccessData({
                        tokenId: args.tokenId,
                        txHash: args.txHash,
                        imageUrl: args.imageUrl || '/placeholder-ai-audit.png',
                        collectionName: 'AI Audit NFT'
                      });
                    }} />
                  </div>
                  <a 
                    href={`https://bscscan.com/address/${AI_AUDIT_CONTRACT_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nft-mint-btn"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AIDA Collection Card (Coming Soon) */}
        <motion.div variants={cardVariants}>
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-background via-background to-muted/20 border border-muted/30 opacity-75">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-muted/10 to-muted/5 rounded-full blur-3xl -z-10"></div>
            
            <div className="flex flex-col lg:flex-row">
              {/* Image Section */}
              <div className="relative lg:w-[360px] xl:w-[420px] flex-shrink-0">
                <div className="aspect-square lg:aspect-auto lg:h-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-muted/10 to-muted/20"></div>
                  <img 
                    src="/assets/aida.webp" 
                    alt="AIDA Collection" 
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                  />
                  {/* Coming Soon Badge */}
                  <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-background/90 backdrop-blur-md border border-muted/30 flex items-center gap-2">
                    <Rocket size={16} className="text-secondary" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Coming Soon</span>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="flex-1 p-6 lg:p-8">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="mb-6">
                    <h3 className="text-2xl sm:text-3xl font-orbitron font-bold text-foreground mb-3 flex items-center gap-3">
                      AIDA Collection
                      <Sparkles size={24} className="text-primary" />
                    </h3>
                    <p className="text-sm text-muted-foreground/80 mb-2 italic">
                      Artificial Intelligence for Doctors and Assistants
                    </p>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      A standalone project implementing AI in medical offices across Romania. Connected to SmartSentinels backend, AIDA NFT holders earn PoUW rewards from real-world AI medical assistance services.
                    </p>
                  </div>

                  {/* Future Benefits */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
                      <Rocket size={16} className="text-secondary" />
                      Key Features
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/5 border border-muted/10">
                        <Shield size={18} className="text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-semibold text-foreground mb-1">Medical AI</div>
                          <div className="text-xs text-muted-foreground">Healthcare assistance in Romania</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/5 border border-muted/10">
                        <Zap size={18} className="text-secondary mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-semibold text-foreground mb-1">PoUW Rewards</div>
                          <div className="text-xs text-muted-foreground">Earn from real-world AI work</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/5 border border-muted/10">
                        <Target size={18} className="text-accent mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-semibold text-foreground mb-1">SmartSentinels Backend</div>
                          <div className="text-xs text-muted-foreground">Integrated with SS ecosystem</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/5 border border-muted/10">
                        <Bot size={18} className="text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-semibold text-foreground mb-1">AI Medical Assistants</div>
                          <div className="text-xs text-muted-foreground">Deployed in Romanian clinics</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-auto pt-6 border-t border-muted/10">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/5 border border-muted/10">
                      <Rocket size={20} className="text-secondary flex-shrink-0" />
                      <div>
                        <div className="text-sm font-semibold text-foreground mb-0.5">In Development</div>
                        <div className="text-xs text-muted-foreground">Join our community for updates on the AIDA release and real-world medical AI implementation</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Mint Success Overlay */}
      <MintSuccessOverlay
        isOpen={!!mintSuccessData}
        onClose={() => setMintSuccessData(null)}
        tokenId={mintSuccessData?.tokenId}
        txHash={mintSuccessData?.txHash}
        imageUrl={mintSuccessData?.imageUrl}
        collectionName={mintSuccessData?.collectionName || "NFT"}
      />
    </div>
  );
};

export default SidebarNFTsiNFTsHub;
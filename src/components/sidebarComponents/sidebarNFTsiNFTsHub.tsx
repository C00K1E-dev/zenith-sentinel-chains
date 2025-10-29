import { motion } from 'framer-motion';
import { Image as ImageIcon, Sparkles, Bot, Zap, Crown, DollarSign, Search, Rocket, Target, ChevronRight, ExternalLink, TrendingUp, Award, Shield } from 'lucide-react';
import { useState } from 'react';
import { useReadContract } from 'wagmi';
import { GENESIS_CONTRACT_ADDRESS, GENESIS_CHAIN_ID, GENESIS_ABI, AI_AUDIT_CONTRACT_ADDRESS, AI_AUDIT_CHAIN_ID, AI_AUDIT_ABI } from '../../contracts/index';
import StatCard from '@/components/StatCard';
import GenesisMint from '@/components/GenesisMint';
import AIAuditMint from '@/components/AIAuditMint';
import MintSuccessOverlay from '@/components/MintSuccessOverlay';
import genesisNFT from '@/assets/genesisNFT.svg';
import aiAuditNFT from '@/assets/AIAuditNFT.svg';
import aidaNFT from '@/assets/aida.svg';

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
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1] as const
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
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 backdrop-blur-sm">
            <ImageIcon size={32} className="text-primary" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-orbitron font-bold text-foreground mb-2">
              NFTs & iNFTs Hub
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
              <Sparkles className="text-primary" size={24} />
              <h3 className="text-xl md:text-2xl font-orbitron font-bold text-foreground">
                About SmartSentinels NFTs
              </h3>
            </div>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-6">
              More than digital art - your gateway to AI-powered ownership with real utility and benefits.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-primary/10">
                <Bot size={20} className="text-primary flex-shrink-0" />
                <span className="text-sm font-medium">AI Access</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-primary/10">
                <TrendingUp size={20} className="text-primary flex-shrink-0" />
                <span className="text-sm font-medium">Rewards</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-primary/10">
                <Award size={20} className="text-primary flex-shrink-0" />
                <span className="text-sm font-medium">Exclusive Benefits</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-primary/10">
                <Shield size={20} className="text-primary flex-shrink-0" />
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
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-background via-background to-primary/5 border border-primary/20 hover:border-primary/40 transition-all duration-500 hover:shadow-xl hover:shadow-primary/20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-accent/10 rounded-full blur-3xl -z-10 group-hover:scale-110 transition-transform duration-700"></div>
            
            {/* Responsive Layout */}
            <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-0 p-4 md:p-6 lg:p-8">
              {/* Image Section */}
              <div className="relative flex items-center justify-start min-h-[300px] md:min-h-[400px]">
                <img
                  src={genesisNFT}
                  alt="Genesis NFT"
                  className="w-full h-full object-contain max-w-xs"
                />
              </div>

              {/* Content Section */}
              <div className="flex flex-col gap-3 md:gap-4 md:pl-4 lg:pl-6">
                {/* Header */}
                <div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-orbitron font-bold text-foreground mb-2 flex items-center gap-2">
                    Genesis Collection
                    <Crown size={24} className="text-primary" />
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    The foundation of SmartSentinels ecosystem. Limited to 1,000 exclusive members with lifetime rewards and governance rights.
                  </p>
                </div>

                {/* Benefits Grid */}
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
                    <Sparkles size={16} className="text-primary" />
                    Exclusive Benefits
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/20 transition-colors">
                      <DollarSign size={16} className="text-primary mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-foreground mb-0.5">Revenue Share</div>
                        <div className="text-xs text-muted-foreground leading-tight">10% from sales of future NFT Collections</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/20 transition-colors">
                      <Zap size={16} className="text-primary mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-foreground mb-0.5">Staking Boost</div>
                        <div className="text-xs text-muted-foreground leading-tight">100% yield boost on upcoming staking</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/20 transition-colors">
                      <Rocket size={16} className="text-primary mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-foreground mb-0.5">Priority Access</div>
                        <div className="text-xs text-muted-foreground leading-tight">Early feature releases</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/20 transition-colors">
                      <Crown size={16} className="text-primary mt-0.5 flex-shrink-0" />
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
                      <div className="text-base sm:text-lg font-bold text-primary font-orbitron">0.074 BNB</div>
                    </div>
                  </div>
                </div>

                {/* Buttons Row */}
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <GenesisMint onMinted={(args) => {
                      setMintSuccessData({
                        tokenId: args.tokenId,
                        txHash: args.txHash,
                        imageUrl: args.imageUrl || '/placeholder-genesis.png',
                        collectionName: 'Genesis NFT'
                      });
                    }} />
                  </div>
                  <a 
                    href={`https://testnet.bscscan.com/address/${GENESIS_CONTRACT_ADDRESS}`}
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
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-background via-background to-accent/5 border border-accent/20 hover:border-accent/40 transition-all duration-500 hover:shadow-xl hover:shadow-accent/20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-accent/20 to-primary/10 rounded-full blur-3xl -z-10 group-hover:scale-110 transition-transform duration-700"></div>
            
            {/* Responsive Layout */}
            <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-0 p-4 md:p-6 lg:p-8">
              {/* Image Section */}
              <div className="relative flex items-center justify-start min-h-[300px] md:min-h-[400px]">
                <img
                  src={aiAuditNFT}
                  alt="AI Audit NFT"
                  className="w-full h-full object-contain max-w-xs"
                />
              </div>

              {/* Content Section */}
              <div className="flex flex-col gap-3 md:gap-4 md:pl-4 lg:pl-6">
                {/* Header */}
                <div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-orbitron font-bold text-foreground mb-2 flex items-center gap-2">
                    AI Audit Collection
                    <Bot size={24} className="text-accent" />
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Access AI-powered smart contract audits and earn PoUW rewards. Limited to 1,000 AI Guardians securing the blockchain.
                  </p>
                </div>

                {/* Benefits Grid */}
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-2 uppercase tracking-wide flex items-center gap-2">
                    <Sparkles size={16} className="text-accent" />
                    Exclusive Benefits
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-accent/5 border border-accent/10 hover:border-accent/20 transition-colors">
                      <Zap size={16} className="text-accent mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-foreground mb-0.5">PoUW Rewards</div>
                        <div className="text-xs text-muted-foreground leading-tight">Earn 40.2 SSTL per audit</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-accent/5 border border-accent/10 hover:border-accent/20 transition-colors">
                      <Bot size={16} className="text-accent mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-foreground mb-0.5">AI Audit Access</div>
                        <div className="text-xs text-muted-foreground leading-tight">Run unlimited audits</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-accent/5 border border-accent/10 hover:border-accent/20 transition-colors">
                      <Search size={16} className="text-accent mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-foreground mb-0.5">Priority Processing</div>
                        <div className="text-xs text-muted-foreground leading-tight">Fast-track audit queue</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-accent/5 border border-accent/10 hover:border-accent/20 transition-colors">
                      <Shield size={16} className="text-accent mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-foreground mb-0.5">Security Reports</div>
                        <div className="text-xs text-muted-foreground leading-tight">Detailed audit insights</div>
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
                    href={`https://testnet.bscscan.com/address/${AI_AUDIT_CONTRACT_ADDRESS}`}
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
                    src={aidaNFT} 
                    alt="AIDA Collection" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                  />
                  {/* Coming Soon Badge */}
                  <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-background/90 backdrop-blur-md border border-muted/30 flex items-center gap-2">
                    <Rocket size={16} className="text-muted-foreground" />
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
                      <Sparkles size={24} className="text-muted-foreground" />
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
                      <Rocket size={16} className="text-muted-foreground" />
                      Key Features
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/5 border border-muted/10">
                        <Shield size={18} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-semibold text-foreground mb-1">Medical AI</div>
                          <div className="text-xs text-muted-foreground">Healthcare assistance in Romania</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/5 border border-muted/10">
                        <Zap size={18} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-semibold text-foreground mb-1">PoUW Rewards</div>
                          <div className="text-xs text-muted-foreground">Earn from real-world AI work</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/5 border border-muted/10">
                        <Target size={18} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-semibold text-foreground mb-1">SmartSentinels Backend</div>
                          <div className="text-xs text-muted-foreground">Integrated with SS ecosystem</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/5 border border-muted/10">
                        <Bot size={18} className="text-muted-foreground mt-0.5 flex-shrink-0" />
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
                      <Rocket size={20} className="text-muted-foreground flex-shrink-0" />
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
import { ArrowLeft, Calendar, Rocket, Trophy, Globe, Zap, Brain, Users, Award, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';
import { useEffect } from 'react';

interface NewsItem {
  id: number;
  title: string;
  date: string;
  content: string;
  emoji?: string;
  image?: string;
}

const renderContentWithLinks = (text: string) => {
  const parts = [];
  let lastIndex = 0;
  
  // Check if content contains HTML (for embedded tweets)
  if (text.includes('<div') || text.includes('<blockquote')) {
    // Split by div tags to separate HTML from text
    const htmlRegex = /(<div[^>]*>[\s\S]*?<\/div>)/g;
    let match;
    
    while ((match = htmlRegex.exec(text)) !== null) {
      // Add text before the HTML
      if (match.index > lastIndex) {
        const textBefore = text.slice(lastIndex, match.index);
        parts.push(renderTextWithLinks(textBefore));
      }
      
      // Add the HTML content
      parts.push(
        <div 
          key={`html-${match.index}`}
          dangerouslySetInnerHTML={{ __html: match[1] }}
        />
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(renderTextWithLinks(text.slice(lastIndex)));
    }
    
    return parts;
  }
  
  return renderTextWithLinks(text);
};

const renderTextWithLinks = (text: string) => {
  const parts = [];
  let lastIndex = 0;
  
  // Pattern to match links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
  let match;
  
  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    // Add the link
    parts.push(
      <a
        key={`link-${match.index}`}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:text-primary/80 font-semibold transition-colors underline"
      >
        {match[1]}
      </a>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts;
};

const News = () => {
  const newsItems: NewsItem[] = [
    {
      id: 6,
      title: 'Join Us at 4AI Twitter Space: AI Identity & Data Protection',
      date: 'December 24, 2025',
      emoji: null,
      content: `Security isn't optional in AI.

SmartSentinels launched with a clear mission: let AI do real, verifiable work — starting with AI-driven smart contract audits that generate measurable proof.

Excited to join this Space on 26.12 and talk about identity, data protection and how PoUW turns AI into something users can finally trust.

<div style="margin: 20px 0; display: flex; justify-content: center;">
<blockquote class="twitter-tweet"><p lang="en" dir="ltr">🎄Christmas Eve is all about the feeling of being safe and sound.<br><br>💛Join us to know more about AI identity, data ownership and user protection in autonomous systems.<br><br>📅 Date: 26 • 12 • 2025<br>📍 Venue: <a href="https://t.co/mQdfxRJwzd">https://t.co/mQdfxRJwzd</a><br><br>🎁 Rewards: $50 USDT – 5 Winners<br><br>🏆 How to Win:<br>1️⃣… <a href="https://t.co/meumgJB8ly">pic.twitter.com/meumgJB8ly</a></p>&mdash; 4AI 🔶 BNB (@4aibsc) <a href="https://twitter.com/4aibsc/status/2003832176517742800?ref_src=twsrc%5Etfw">December 24, 2025</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
</div>

Don't miss this opportunity to learn more about how AI identity and data ownership are being revolutionized through autonomous systems and verifiable proof mechanisms.`
    },
    {
      id: 5,
      title: 'SmartSentinels Airdrop - Powered by theMiracle & MetaMask',
      date: 'December 16, 2025',
      emoji: null,
      content: `We're excited to announce the SmartSentinels Airdrop, powered by [theMiracle](https://www.themiracle.io/) and MetaMask!

SmartSentinels is building the next layer of AI infrastructure — where real work, real demand, and real value meet.

We're not here to promise hype. We're here to turn AI into productive, verifiable utility, powered by a network that rewards contribution, not speculation.

Join our airdrop campaign and be part of the future of decentralized AI infrastructure. Complete tasks, engage with our ecosystem, and earn SSTL tokens as we build something revolutionary.

<div style="margin: 20px 0; display: flex; justify-content: center;">
<blockquote class="twitter-tweet"><p lang="en" dir="ltr">SmartSentinels is building the next layer of AI infrastructure.<br>Where real work, real demand, and real value meet.<br><br>We're not here to promise hype.<br>We're here to turn AI into productive, verifiable utility, powered by a network that rewards contribution, not speculation.<br><br>Our… <a href="https://t.co/JaivRV2EF3">pic.twitter.com/JaivRV2EF3</a></p>&mdash; SmartSentinels (@SmartSentinels_) <a href="https://twitter.com/SmartSentinels_/status/2000594304646222122?ref_src=twsrc%5Etfw">December 15, 2025</a></blockquote>
</div>

Learn more and participate in the airdrop by visiting the Airdrop section on our platform.

Together, we're building real utility, real value, and real impact in the AI and blockchain space.`
    },
    {
      id: 4,
      title: 'Explore SmartSentinels on Micro3 Quest',
      date: 'November 26, 2025',
      emoji: null,
      image: '/assets/micro3.png',
      content: `Join the SmartSentinels Quest on Micro3 and earn rewards while exploring our AI-powered agent network!

We're thrilled to launch an exclusive quest on [Micro3](https://micro3.io/quest/explore-smartsentinels-3891ffbf), the leading SocialFi platform for Web3 engagement. This quest is designed to help you discover the power of SmartSentinels' Proof of Useful Work ecosystem while earning rewards.

What You'll Do:
Complete a series of engaging tasks designed to familiarize you with SmartSentinels' mission, technology, and community. Each task brings you closer to understanding how AI agents create real, measurable value in the decentralized world.

Rewards:
Finish all tasks in the quest to unlock exclusive rewards and recognition within both the SmartSentinels and Micro3 communities.

Why Participate:
• Learn about cutting-edge AI integration in blockchain
• Join a thriving community of Web3 pioneers
• Earn rewards while supporting decentralized intelligence
• Become part of the future of useful work

[Start the Quest Now](https://micro3.io/quest/explore-smartsentinels-3891ffbf) and take your first step into the SmartSentinels ecosystem!

Don't miss this opportunity to engage with innovation at the intersection of AI and blockchain. See you on Micro3!`
    },
    {
      id: 3,
      title: 'SmartSentinels x Micro3 Partnership Announcement',
      date: 'November 23, 2025',
      emoji: null,
      content: `We're excited to announce our strategic partnership with [Micro3](https://micro3.io/), the leading SocialFi platform powering community engagement, user growth, and Web3 adoption through innovative quest mechanics.

Micro3's proven expertise in driving user acquisition and engagement aligns perfectly with SmartSentinels' mission to build a thriving ecosystem around Proof of Useful Work. Through this collaboration, we'll leverage Micro3's sophisticated quest and campaign infrastructure to amplify SmartSentinels' reach and build deeper community engagement.

Together, we're creating new pathways for users to discover, participate in, and earn rewards from our AI-powered agent network. SmartSentinels' agents will gain exposure to Micro3's active community of 1M+ users, while our SSTL token holders benefit from enhanced visibility and growth opportunities.

This partnership represents a synergistic combination of AI-driven utility and Web3 community engagement — bringing SmartSentinels' innovations to a broader audience and accelerating adoption of decentralized intelligence.

Welcome to the future of growth-driven partnerships in Web3.`
    },
    {
      id: 2,
      title: 'SmartSentinels x theMiracle Partnership Announcement',
      date: 'November 14, 2025',
      emoji: null,
      content: `SmartSentinels is excited to announce our partnership with [theMiracle](https://www.themiracle.io/), a pioneer in wallet-native marketing campaigns directly integrated with MetaMask.

Through this collaboration, SmartSentinels' Proof of Useful Work (PoUW) ecosystem — where AI agents perform real-world tasks to generate value — will gain a powerful growth layer that connects directly with users at the wallet level.

theMiracle's unique infrastructure allows brands and blockchain projects to engage users inside their wallets through targeted, data-driven campaigns that respect privacy while maximizing reach and conversion.

Together, we're bridging two powerful forces — AI-driven utility and wallet-native engagement — to accelerate the next wave of adoption for decentralized intelligence.

The future of smart marketing and useful work is here.`
    },
    {
      id: 1,
      title: 'SmartSentinels x Studio Blockchain Partnership Announcement',
      date: 'November 12, 2025',
      emoji: null,
      content: `SmartSentinels x Studio Blockchain Partnership Announcement

We're proud to announce a strategic partnership between SmartSentinels and [Studio Blockchain](https://studio-blockchain.com/)!

Both projects share a bold vision — merging AI and Blockchain to create real, measurable utility in the decentralized world.

Through this collaboration, Studio Blockchain's intelligent agents will soon join our Proof of Useful Work (PoUW) network. Each time their agents perform useful work, SSTL tokens will be minted and distributed to NFT holders from the related agent collections.

This partnership strengthens the foundation of our ecosystem — uniting AI innovation, transparency, and tokenized value creation.

Together, we're building the future of decentralized AI infrastructure.`
    }
  ];

  // Load Twitter widget script for embedded tweet
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.charset = 'utf-8';
    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script when component unmounts
      const existingScript = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <>
      <MetaTags 
        title="News & Announcements | SmartSentinels"
        description="Stay updated with the latest news and announcements from SmartSentinels"
        path="/news"
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-x-hidden overflow-y-auto">
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

        <Navbar />

        {/* News Content */}
        <section className="relative z-10 min-h-[calc(100vh-180px)] pt-24 sm:pt-28 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-12">
              <Link to="/">
                <Button 
                  variant="outline" 
                  className="mb-6 gap-2 border-primary/30 hover:border-primary/60 text-primary hover:text-primary"
                >
                  <ArrowLeft size={16} />
                  <span className="text-xs sm:text-sm">Back to Home</span>
                </Button>
              </Link>
              
              <div className="glass-card p-6 sm:p-8 md:p-10 neon-border">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-4 neon-glow">
                  News & Announcements
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground mb-6">
                  Stay informed about the latest updates and partnerships from SmartSentinels
                </p>
                
                {/* Telegram Subscription Button */}
                <a
                  href="https://t.me/SmartSentinelsOfficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button 
                    className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-[0_0_20px_rgba(248,244,66,0.5)] transition-all duration-300"
                  >
                    <Send size={18} />
                    <span className="font-semibold">Subscribe on Telegram</span>
                  </Button>
                </a>
              </div>
            </div>

            {/* News Items */}
            <div className="space-y-8">
              {newsItems.map((item) => (
                <div 
                  key={item.id}
                  className="glass-card p-6 sm:p-8 md:p-10 neon-border hover:shadow-[0_0_30px_rgba(248,244,66,0.3)] transition-all duration-300"
                >
                  {/* News Item Header */}
                  <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-primary" />
                          <time className="text-sm text-muted-foreground">
                            {item.date}
                          </time>
                        </div>
                        <div className="flex items-center gap-3">
                          <Rocket size={24} className="text-primary" />
                          {item.id === 4 ? (
                            <Trophy size={24} className="text-primary" />
                          ) : (
                            <Globe size={24} className="text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-orbitron font-bold neon-glow mb-6">
                      {item.title}
                    </h2>

                    {/* Partnership Logos */}
                    {item.id === 3 && (
                      <div className="flex items-center justify-center gap-4 sm:gap-8 mb-8 py-6 border-b border-primary/20">
                        <div className="flex flex-col items-center gap-2">
                          <img 
                            src="/ss-icon.svg" 
                            alt="SmartSentinels Logo" 
                            className="w-12 sm:w-16 h-12 sm:h-16 object-contain"
                          />
                          <span className="text-xs sm:text-sm text-muted-foreground font-orbitron">SmartSentinels</span>
                        </div>
                        
                        <div className="text-primary font-bold text-2xl sm:text-3xl">×</div>
                        
                        <div className="flex flex-col items-center gap-2">
                          <img 
                            src="/assets/micro3.png" 
                            alt="Micro3 Logo" 
                            className="w-12 sm:w-16 h-12 sm:h-16 object-contain"
                          />
                          <span className="text-xs sm:text-sm text-muted-foreground font-orbitron">Micro3</span>
                        </div>
                      </div>
                    )}
                    {item.id === 2 && (
                      <div className="flex items-center justify-center gap-4 sm:gap-8 mb-8 py-6 border-b border-primary/20">
                        <div className="flex flex-col items-center gap-2">
                          <img 
                            src="/ss-icon.svg" 
                            alt="SmartSentinels Logo" 
                            className="w-12 sm:w-16 h-12 sm:h-16 object-contain"
                          />
                          <span className="text-xs sm:text-sm text-muted-foreground font-orbitron">SmartSentinels</span>
                        </div>
                        
                        <div className="text-primary font-bold text-2xl sm:text-3xl">×</div>
                        
                        <div className="flex flex-col items-center gap-2">
                          <img 
                            src="/assets/miracle.svg" 
                            alt="theMiracle Logo" 
                            className="w-12 sm:w-16 h-12 sm:h-16 object-contain"
                          />
                          <span className="text-xs sm:text-sm text-muted-foreground font-orbitron">theMiracle</span>
                        </div>
                      </div>
                    )}
                    {item.id === 1 && (
                      <div className="flex items-center justify-center gap-4 sm:gap-8 mb-8 py-6 border-b border-primary/20">
                        <div className="flex flex-col items-center gap-2">
                          <img 
                            src="/ss-icon.svg" 
                            alt="SmartSentinels Logo" 
                            className="w-12 sm:w-16 h-12 sm:h-16 object-contain"
                          />
                          <span className="text-xs sm:text-sm text-muted-foreground font-orbitron">SmartSentinels</span>
                        </div>
                        
                        <div className="text-primary font-bold text-2xl sm:text-3xl">×</div>
                        
                        <div className="flex flex-col items-center gap-2">
                          <img 
                            src="/assets/studio.png" 
                            alt="Studio Blockchain Logo" 
                            className="w-12 sm:w-16 h-12 sm:h-16 object-contain"
                          />
                          <span className="text-xs sm:text-sm text-muted-foreground font-orbitron">Studio Blockchain</span>
                        </div>
                      </div>
                    )}
                    {item.id === 4 && (
                      <div className="flex items-center justify-center gap-4 sm:gap-8 mb-8 py-6 border-b border-primary/20">
                        <div className="flex flex-col items-center gap-2">
                          <img 
                            src="/ss-icon.svg" 
                            alt="SmartSentinels Logo" 
                            className="w-12 sm:w-16 h-12 sm:h-16 object-contain"
                          />
                          <span className="text-xs sm:text-sm text-muted-foreground font-orbitron">SmartSentinels</span>
                        </div>
                        
                        <div className="text-primary font-bold text-2xl sm:text-3xl">×</div>
                        
                        <div className="flex flex-col items-center gap-2">
                          <img 
                            src="/assets/micro3.png" 
                            alt="Micro3 Logo" 
                            className="w-12 sm:w-16 h-12 sm:h-16 object-contain"
                          />
                          <span className="text-xs sm:text-sm text-muted-foreground font-orbitron">Micro3</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* News Item Content */}
                  <div className="prose prose-invert max-w-none">
                    <div className="text-base sm:text-lg leading-relaxed text-foreground whitespace-pre-wrap font-light">
                      {renderContentWithLinks(item.content)}
                      {(item.id === 1 || item.id === 2 || item.id === 3) && (
                        <span className="inline-flex items-center gap-2 ml-2 text-primary">
                          <Globe size={20} />
                          <Zap size={20} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* News Item Footer */}
                  <div className="mt-8 pt-6 border-t border-primary/20">
                    <p className="text-sm text-muted-foreground">
                      For more information, visit our <Link to="/hub" className="text-primary hover:text-primary/80 font-semibold transition-colors">Hub</Link> or connect with us on social media.
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <div className="mt-16 glass-card p-8 sm:p-10 text-center neon-border">
              <h3 className="text-2xl sm:text-3xl font-orbitron font-bold mb-4 neon-glow">
                Join Our Community
              </h3>
              <p className="text-base sm:text-lg text-muted-foreground mb-6">
                Be part of the revolution. Explore SmartSentinels and discover what's possible.
              </p>
              <Link to="/hub/airdrop">
                <Button variant="hero" size="lg" className="text-sm sm:text-base">
                  Explore Now
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default News;

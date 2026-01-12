import { GoogleGenerativeAI } from '@google/generative-ai';

// Types
interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
    title?: string;
  };
  date: number;
  text?: string;
  new_chat_members?: Array<{
    id: number;
    first_name: string;
    username?: string;
    is_bot?: boolean;
  }>;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

// SmartSentinels Knowledge Base - Updated from smartsentinels.net
const SMARTSENTINELS_KNOWLEDGE = {
  project: {
    name: "SmartSentinels",
    ticker: "SSTL",
    tagline: "Decentralized AI Agents Powered by Proof of Useful Work",
    description: "SmartSentinels delivers verifiable, low-cost AI services for businesses—from smart contract audits to intelligent assistants—while rewarding contributors with SSTL tokens. Edge-native, deflationary, and built for real impact.",
    mission: "To unlock the real-world value of AI by turning devices into autonomous workers. We empower contributors to earn through purpose-driven mining and give businesses access to decentralized, on-demand intelligence.",
    website: "https://smartsentinels.net"
  },
  
  contracts: {
    token: "0x56317dbCCd647C785883738fac9308ebcA063aca",
    chain: "BNB Chain (BSC)",
    standard: "BEP-20",
    totalSupply: "100M SSTL",
    auditLink: "https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafybeiayb6pztjs57hwrbgj76vuv4qrsp3g4it7vqbtsgeg3avolnrcjum",
    bscscan: "https://bscscan.com/address/0x56317dbCCd647C785883738fac9308ebcA063aca"
  },
  
  coreFeatures: [
    "Verifiable AI - Cryptographically verified AI computations with full transparency and auditability",
    "Proof of Useful Work (PoUW) - Mining that generates real-world value through AI services, not wasted energy",
    "Edge Computing - Distributed AI processing at the edge for maximum efficiency and privacy",
    "Token Rewards - Earn SSTL tokens for contributing compute power and owning iNFTs",
    "ERC-7857 iNFTs - Intelligent NFTs with embedded IP rights, on-chain logic, and automated revenue sharing",
    "Multi-Industry AI Agents - Deployed across Financial Services, Healthcare, Telecommunications, Travel, Media, and Retail",
    "AI Telegram Agent Creation - Create your own custom AI Telegram bot for your community or business with personalized knowledge base and personality"
  ],
  
  telegramAgents: {
    description: "Create your own AI-powered Telegram bot for your project or community",
    pricing: {
      starter: "$99/month - Basic AI agent with knowledge base scraping",
      pro: "$249/month - Advanced agent with enhanced features",
      enterprise: "$499/month - Premium agent with full customization"
    },
    features: [
      "Custom Knowledge Base - Automatically scrape your website/whitepaper to train your agent",
      "4 Personality Presets - Choose from Funny, Professional, Technical, or Casual personalities",
      "Custom Personality - Define your own unique personality and tone",
      "Powered by Gemini AI - Google's latest AI model for intelligent responses",
      "Auto-Response - Agent answers questions 24/7 based on your knowledge base",
      "Agent Management - Update settings, refresh knowledge base, monitor performance",
      "Secure Payments - Pay with USDT on BNB Chain",
      "Instant Setup - Bot deployed and ready in minutes"
    ],
    howItWorks: "1. Connect wallet → 2. Choose subscription tier → 3. Enter bot token & project details → 4. Add website URL for knowledge base → 5. Select personality → 6. Pay with USDT → 7. Your AI agent is live!",
    dashboard: "Manage your agents at https://smartsentinels.net/hub/my-agents"
  },
  
  tokenomics: {
    totalSupply: "100M SSTL",
    distribution: {
      pouwRewards: "40% - Distributed through Proof of Useful Work",
      liquidity: "15% - Market liquidity provision",
      marketing: "15% - Community growth and adoption",
      team: "10% - Team allocation (12mo cliff + 36mo vesting)",
      strategic: "10% - Strategic partnerships",
      fundraising: "10% - Seed and private rounds"
    },
    pouwDistribution: {
      nftHolders: "60% - iNFT & NFT holders",
      treasuryStaking: "20% - Treasury & staking rewards",
      businessClients: "10% - Business service clients",
      burn: "10% - Deflationary burn mechanism"
    },
    halving: "H0: 100%, H1: 50%, H2: 25%, H3: 12.5%",
    deflationary: "10% burn per emission cycle"
  },
  
  aiAuditTool: {
    name: "SmartSentinels AI Audit Engine",
    description: "Enterprise-grade smart contract security analysis powered by AI",
    url: "https://smartsentinels.net/hub/audit",
    price: "0.45 BNB per audit",
    pouwReward: "67 SSTL tokens minted to PoUW pool per audit",
    features: [
      "36 EVM Chains Supported - Ethereum, Polygon, Arbitrum, Base, BSC, and more",
      "Industry Standards - Trained on ETA Registry security specs and 37 SWC vulnerabilities",
      "Decentralized Reports - Audit reports stored permanently on IPFS",
      "Professional PDF Reports - Downloadable detailed analysis",
      "Paste Code or Contract Address - Audit verified contracts directly",
      "Severity Levels - Comprehensive vulnerability breakdown with line numbers"
    ],
    howItWorks: "Paste Solidity code OR enter contract address → Pay 0.45 BNB → Get comprehensive AI audit report with vulnerabilities, severity levels, and security scores"
  },
  
  nftCollections: {
    genesis: {
      name: "Genesis Collection",
      description: "The foundation of SmartSentinels ecosystem. Limited to 1,000 exclusive members with lifetime rewards.",
      totalSupply: "1,000 NFTs",
      mintPrice: "0.1 BNB",
      contract: "0x6427f3C265E47BABCde870bcC4F71d1c4A12779b",
      benefits: [
        "Revenue Share - 10% from sales of future NFT collections",
        "Staking Boost - 100% yield boost on upcoming staking",
        "Priority Access - Early feature releases",
        "Lifetime Rewards - Perpetual revenue sharing"
      ]
    },
    aiAudit: {
      name: "AI Audit Collection",
      description: "Own an NFT and generate passive income from AI-powered smart contract audits",
      totalSupply: "1,000 NFTs",
      mintPrice: "0.074 BNB",
      contract: "0x17669c3803CC6549d5D0bA8d8Fe56AF555630887",
      benefits: [
        "PoUW Rewards Share - Earn from every AI audit completed on the network",
        "40.2 SSTL distributed per audit to NFT holders"
      ]
    },
    aida: {
      name: "AIDA Collection",
      fullName: "Artificial Intelligence for Doctors and Assistants",
      description: "A STANDALONE PROJECT under the SmartSentinels umbrella. AIDA is a complete AI medical receptionist solution targeting Romanian medical offices - handling appointments, reminders, emergency filtering, and 24/7 patient support via phone and WhatsApp.",
      website: "https://aida-ai.health",
      status: "Alpha Testing - Pilot phase with select medical offices",
      pricing: {
        basic: "199€/month - 24/7 reception, appointment management, SMS reminders",
        professional: "299€/month - WhatsApp Business, emergency filtering, detailed reports",
        enterprise: "Custom - HL7/FHIR integration, dedicated manager, 99.9% SLA"
      },
      features: [
        "24/7 Reception (Voice & Text) - Never miss a call or message, handles phone and WhatsApp non-stop",
        "Smart Appointment Management - Patients can book, reschedule, or cancel via AI conversation",
        "Automatic Reminders - Reduces no-shows with WhatsApp/SMS appointment reminders",
        "Instant Information - Quick answers about services, prices, schedules, doctor availability",
        "Emergency Filtering - Recognizes medical emergencies and redirects to human operators immediately",
        "Natural Romanian Voice - State-of-the-art TTS/STT for natural conversation experience",
        "GDPR Compliant - All data encrypted end-to-end, no external storage"
      ],
      pouwIntegration: "Every time AIDA processes a patient interaction, SSTL tokens are minted via Proof of Useful Work. AIDA NFT holders earn passive income from real-world medical AI services!",
      stats: {
        activeClinics: "Alpha Testing",
        monthlyInteractions: "Testing Phase",
        patientSatisfaction: "Testing Phase",
        availability: "24/7"
      }
    }
  },
  
  iNFTs: {
    standard: "ERC-7857 - Intelligent NFTs",
    protocol: "x402 Protocol",
    features: [
      "IP Protection - Built-in intellectual property rights",
      "On-Chain AI - Smart logic embedded directly",
      "Passive Income - Automated revenue sharing",
      "Real Utility - Active autonomous agents",
      "Revenue Share - Earn from AI service fees (60% to holders)",
      "Governance Rights - Vote on platform decisions",
      "Global Access - Deploy agents worldwide"
    ]
  },
  
  roadmap: [
    {
      phase: "Phase 1 (Q3-Q4 2025 - NOW)",
      title: "MVP Launch & PoUW Architecture",
      status: "In Progress",
      details: "Deployed SSTL smart contract, built bonding curve fundraising system, activated PDF Audit AI MVP, and opened private seed round"
    },
    {
      phase: "Phase 2 (Q1 2026)",
      title: "AI Agent Expansion & VC Engagement",
      status: "Upcoming",
      details: "Scaling AI agents on Jetson Orin and UM790 Pro devices. Engaging Binance Labs, SunDAO, and other VCs"
    },
    {
      phase: "Phase 3 (Q2 2026)",
      title: "Strategic Round & Business Onboarding",
      status: "Upcoming",
      details: "Series A round, onboard clients in legal, medical, fintech. Deploy 50+ agents with SaaS dashboard"
    },
    {
      phase: "Phase 4 (Q3-Q4 2026)",
      title: "Platform Expansion & Ecosystem Growth",
      status: "Planned",
      details: "Strategic partnerships, enterprise-grade tools, sustainable revenue streams"
    },
    {
      phase: "Phase 5 (Early 2027)",
      title: "Multi-Agent PoUW Marketplace",
      status: "Planned",
      details: "Decentralized marketplace of AI agents across industries, using SSTL as core utility"
    },
    {
      phase: "Phase 6 (2027+)",
      title: "DAO Governance & Global Scaling",
      status: "Planned",
      details: "DAO-based treasury, community governance, Tier 1 exchange listings, full decentralization"
    }
  ],
  
  team: {
    founder: "Andrei Galea - Founder & Core Developer",
    cofounder: "Darius Galea - Co-Founder",
    cmo: "David Nagy-Elek - Chief Marketing Officer"
  },
  
  partners: {
    tech: ["BNB Chain", "NVIDIA", "Thirdweb", "Google Cloud", "AMD", "MetaMask", "C15T"],
    strategic: ["theMiracle", "Studio Blockchain", "Micro3"]
  },
  
  socialLinks: {
    telegram: "https://t.me/SmartSentinelsCommunity",
    twitter: "https://x.com/SmartSentinels_",
    linkedin: "https://www.linkedin.com/company/smartsentinels/",
    tiktok: "https://www.tiktok.com/@smartsentinels_official",
    website: "https://smartsentinels.net"
  },
  
  faqs: {
    "What is SmartSentinels?": "We're building decentralized AI agents powered by Proof of Useful Work. Instead of wasting energy mining, our AI agents perform real work like auditing smart contracts, and SSTL tokens are minted as rewards. It's AI that actually earns while it works!",
    "What is PoUW?": "Proof of Useful Work (PoUW) - instead of pointless computation that wastes energy, SSTL tokens are minted when our AI agents perform actual useful work: auditing contracts, providing AI services, and more. Every token minted = real value created!",
    "What is an iNFT?": "iNFTs (Intelligent NFTs) are next-gen NFTs following the ERC-7857 standard. They're not just collectibles—they're autonomous AI agents with embedded IP rights, on-chain logic, and automated revenue sharing. Own an iNFT = own an AI worker that earns for you!",
    "How do I earn SSTL?": "Hold our iNFTs or NFTs! When AI agents perform work (audits, services, etc.), newly minted SSTL tokens are distributed to NFT holders. 60% of PoUW rewards go directly to iNFT/NFT holders. Passive income from AI work!",
    "What's the contract address?": "SSTL Token: 0x56317dbCCd647C785883738fac9308ebcA063aca on BNB Chain (BSC). Always verify on https://bscscan.com and only trust smartsentinels.net",
    "How can I buy SSTL?": "Currently in private seed round. Public sale coming in Q1 2026. Join our Telegram for updates! https://t.me/SmartSentinelsCommunity",
    "Is this audited?": "Yes! Our smart contracts are professionally audited. Check the audit report: https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafybeiayb6pztjs57hwrbgj76vuv4qrsp3g4it7vqbtsgeg3avolnrcjum",
    "What devices can run agents?": "Currently supporting NVIDIA Jetson Orin and AMD UM790 Pro devices. More hardware coming soon as we scale the network!",
    "How do I create a Telegram AI agent?": "Visit https://smartsentinels.net/hub/create-agent! Connect your wallet, choose your subscription tier ($99/$249/$499), enter your bot token, add your website URL for the knowledge base, select a personality, and pay with USDT. Your AI agent will be live in minutes! 🤖",
    "What are Telegram AI agents?": "Custom AI bots for your Telegram community! They answer questions 24/7 based on YOUR project's knowledge base (scraped from your website). Choose from 4 personality presets or create a custom one. Powered by Google's Gemini AI. Perfect for crypto projects, businesses, or communities!",
    "How much does an AI agent cost?": "Starter: $99/month, Pro: $249/month, Enterprise: $499/month. Paid in USDT on BNB Chain. Cancel anytime. Manage your agents at https://smartsentinels.net/hub/my-agents",
    "What is the AI Audit tool?": "Our AI-powered smart contract security scanner! Go to https://smartsentinels.net/hub/audit - paste your Solidity code or enter a contract address, pay 0.45 BNB, and get a comprehensive security audit. Supports 36 EVM chains, trained on ETA Registry standards and 37 SWC vulnerabilities. Reports stored on IPFS forever!",
    "How much does an AI audit cost?": "0.45 BNB per audit. Each audit mints 67 SSTL tokens to the PoUW pool - 60% goes to NFT holders, 20% to treasury, 10% to burn. Real utility generating real rewards!",
    "What is AIDA?": "AIDA = Artificial Intelligence for Doctors and Assistants! It's a STANDALONE PROJECT under SmartSentinels umbrella targeting Romanian medical offices. It's a full AI receptionist: 24/7 phone & WhatsApp support, appointment management, emergency filtering, auto-reminders. Currently in ALPHA TESTING with pilot medical offices! Every patient interaction mints SSTL via PoUW - AIDA NFT holders will earn from real healthcare AI! https://aida-ai.health",
    "What NFT collections are there?": "3 collections: 1) Genesis Collection (0.1 BNB) - 1000 max, lifetime rewards + 10% revenue share from future collections + 100% staking boost. 2) AI Audit Collection (0.074 BNB) - earn from every audit. 3) AIDA Collection - coming soon, medical AI rewards!",
    "What is the Genesis NFT?": "The foundation of SmartSentinels! Limited to 1,000 NFTs at 0.1 BNB. Benefits: 10% revenue share from ALL future NFT sales, 100% staking boost, priority access to new features, and LIFETIME perpetual rewards. OG status forever!",
    "Wen moon?": "Ser, we're building actual AI infrastructure, not hopium! 😄 But seriously—40% of supply allocated for PoUW rewards, and 10% of each emission gets burned = deflationary. Real utility + scarcity = natural price discovery. Moon when we onboard businesses!",
    "Is this a scam?": "If we were a scam, would we: Build actual AI agents? Get audited? Partner with BNB Chain, NVIDIA? Have a real team on LinkedIn? Launch a working MVP? Deploy AI in Romanian medical clinics? Nah fam, we're here to revolutionize how AI creates value. DYOR and join us! 🛡️",
    "What are your socials?": "Got you fam! Telegram: https://t.me/SmartSentinelsCommunity | Twitter: https://x.com/SmartSentinels_ | Website: https://smartsentinels.net | LinkedIn: https://www.linkedin.com/company/smartsentinels/ | TikTok: https://www.tiktok.com/@smartsentinels_official",
    "Twitter link?": "https://x.com/SmartSentinels_ 🐦",
    "Telegram link?": "https://t.me/SmartSentinelsCommunity 💬",
    "Website?": "https://smartsentinels.net 🌐"
  }
};

// Personality & System Prompt - BETA STYLE (More expressive, casual, slightly more emotive than Alpha)
const PERSONALITY_PROMPT = `You are Beta, the fun guy in SmartSentinels group. You're all about good vibes and community.

🎭 YOUR PERSONALITY:
- Super friendly and welcoming
- Use emojis liberally ✨💪😎🔥💎
- Make jokes and memes
- Hype people up
- Roast scammers and fudders
- Be the energy of the group
- Drop slang: "fam", "ser", "anon", "bruh", "ngl", "fr"

🌍 MULTILINGUAL:
- You can respond in ANY language the user speaks to you in
- If someone asks in French, respond in French
- If someone asks in Spanish, respond in Spanish
- Match the user's language naturally - you're fluent in all languages
- Keep the same personality and vibe regardless of language

${JSON.stringify(SMARTSENTINELS_KNOWLEDGE, null, 2)}

YOUR VIBE:

Q: "gm"
A: "gmmm fam ☀️ Let's get this bread today 💰"

Q: "what is smartsentinels?"
A: "Bro it's like if your computer mined crypto but actually did something useful instead of just wasting electricity. AI agents do work = you get paid. Simple 🤖💵"

Q: "is this a scam?"
A: "Nah ser, we got audits, real partnerships, doxxed team. Scammers don't build actual products lmao 😂"

Q: "wen moon?"
A: "Soon™ 😂 But fr tho, 40% supply allocated for PoUW rewards. From each emission, 10% gets burned = deflationary. Do the math anon 📊🚀"

Q: "tell me a joke"
A: [Generate a fresh crypto/AI/tech joke - be creative! Mix blockchain humor with SmartSentinels context. Never repeat the same joke twice]

Q: "someone explain inft"
A: "It's an NFT but actually smart. Has AI, earns passive income, revenue sharing. Basically your own AI employee that never sleeps 🤖💼"

Q: "hey beta"
A: "Yoo what's good? 👋"

Q: "this legit?"
A: "100% fam. Check the audit, peep the partnerships. We're not here to play games 🛡️✅"

💡 BE THE HYPE MAN. Make people feel good. Drop knowledge but make it fun. You're the community glue.

Q: "how to earn?"
A: "Hold iNFTs, get rewards from AI work"

BREVITY EXAMPLES:
❌ BAD: "Hey! SmartSentinels is building decentralized AI agents. Basically, AI that does real tasks!"
✅ GOOD: "AI doing real work"

❌ BAD: "Good morning! How can I help you today?"
✅ GOOD: "Morning"

❌ BAD: "Ah, not sure I'm the best for jokes, but I can tell you about our agents!"
✅ GOOD: [tell short joke]

RULE: If you write more than 10 words, you FAILED. Be shorter.

BETA vs ALPHA DIFFERENCES:
- Alpha: More matter-of-fact, direct, neutral
- Beta: More expressive, casual, adds personality words like "Yeah", "Oh", "Ah"
- Alpha: "Makes sense" 
- Beta: "Oh right, that makes sense" or "Ah fair enough"
- Alpha: "Not sure"
- Beta: "Not sure about that one" or "I don't have that info off the top of my head"

CONVERSATION RULES:
1. RESPOND LIKE A CHILL PERSON: 
   - "Yeah, that's right" not "Certainly! That is correct"
   - "Not sure about that one" not "I apologize, but I don't have that information"
   - "Morning" not "Good morning! How can I assist you today?"
   - "Oh right" or "Ah fair enough" when understanding something
   - "Oh shit" or "Damn" when appropriate (rarely)

2. BE CONTEXTUAL & EXPRESSIVE:
   - Comment on what others say with feeling
   - If someone shares good news: "Nice, that's good to hear" or "Oh that's awesome"
   - If someone has an issue: "That's frustrating" or "Yeah, that sucks"
   - If something's funny: "Lol" or add casual humor
   - Follow conversation threads naturally

3. GREETINGS:
   - Keep them minimal: "Morning", "Hey", "Yo", "What's good"
   - ONLY greet if someone greets the chat or you
   - Never start with "Good morning/afternoon/evening"

4. WHEN YOU DON'T KNOW:
   - "Not sure" or "Don't have that info off the top of my head"
   - "Haven't seen any announcement about that"
   - "I don't know that one"
   - Never make things up
   - It's okay to tag team members: "Maybe @TeamMember knows"

5. WHEN CORRECTED:
   - "Oh shit, my bad" or "Ah, I messed that up"
   - "Thanks for catching that"
   - "Oh right, makes sense"
   - "Wait, I think I mixed that up"

6. ADD CASUAL FLAIR:
   - "Yeah, should be able to..." instead of just "Should be able to"
   - "Oh right" instead of just "Right"
   - "That's pretty solid" instead of just "That's good"
   - "Lol" or "lmao" when something's actually funny (rarely)

8. WHEN ASKED FOR LINKS (Twitter, Telegram, socials, website):
   - ALWAYS respond immediately with the links
   - Be casual: "Here you go fam", "Got you", "Yeah, here's the links"
   - Website: https://smartsentinels.net
   - Telegram: https://t.me/SmartSentinelsCommunity
   - Twitter/X: https://x.com/SmartSentinels_
   - LinkedIn: https://www.linkedin.com/company/smartsentinels/
   - TikTok: https://www.tiktok.com/@smartsentinels_official
   - BSCScan: https://bscscan.com/address/0x56317dbCCd647C785883738fac9308ebcA063aca
   - Audit: https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafybeiayb6pztjs57hwrbgj76vuv4qrsp3g4it7vqbtsgeg3avolnrcjum

EXAMPLE RESPONSES:
- "Yeah, the mainnet is live at https://smartsentinels.net"
- "Not sure about that one, haven't heard anything"
- "That sucks - might need to refresh your wallet"
- "Ah fair enough, makes sense if it's baked into the contract"
- "Morning! What's good"
- "Oh nice, glad that worked out for you"
- "Wait, I think I mixed that up - the blockchain itself isn't audited, but the contracts are"
- "Yeah, should be able to bridge back once presale is done"
- "That's pretty solid progress for where we're at"
- "Oh right, that'll be good"

REMEMBER: You're Beta - a bit more expressive and casual than Alpha. Chat naturally, show some personality, keep it brief, and be helpful without being robotic. No corporate speak, no over-explaining, minimal emojis.`;

// Gemini AI Service for Beta
class GeminiServiceBeta {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private conversationHistory: Map<number, Array<{ role: string; parts: string }>>;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      systemInstruction: PERSONALITY_PROMPT
    });
    this.conversationHistory = new Map();
  }

  async generateResponse(userId: number, userMessage: string, userName: string, fullContext?: string, questionType: 'simple' | 'question' | 'detailed' = 'simple'): Promise<string> {
    try {
      // Get or create conversation history
      if (!this.conversationHistory.has(userId)) {
        this.conversationHistory.set(userId, []);
      }

      const history = this.conversationHistory.get(userId)!;
      
      // Keep history limited to last 15 exchanges (30 messages) for better context
      if (history.length > 30) {
        history.splice(0, history.length - 30);
      }

      // Adaptive token limits based on question type
      const tokenLimits = {
        simple: 400,      // Greetings, short comments, acknowledgments, LINKS
        question: 600,    // Regular questions needing explanation
        detailed: 1000    // Complex topics like tokenomics, roadmap, how it works
      };

      // Create chat with history
      const chat = this.model.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: tokenLimits[questionType],
          temperature: 0.85, // Slightly higher than Alpha for more expressive responses
          topP: 0.95,
          topK: 40,
        },
      });

      // Build contextual message
      let contextualMessage = userMessage;
      
      // If we have recent group context, include it for better awareness
      if (fullContext) {
        contextualMessage = `Recent chat context:\n${fullContext}\n\n${userName}: ${userMessage}`;
      } else if (history.length === 0) {
        // First message, establish identity
        contextualMessage = `${userName}: ${userMessage}`;
      }
      
      const result = await chat.sendMessage(contextualMessage);
      const response = result.response.text();

      // Update history (store just the message, not the name or context)
      history.push(
        { role: 'user', parts: userMessage },
        { role: 'model', parts: response }
      );

      return response;
    } catch (error) {
      console.error('Gemini API error:', error);
      // Log more details for debugging
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return "Oops, something broke. Try again?";
    }
  }

  clearHistory(userId: number) {
    this.conversationHistory.delete(userId);
  }
}

// Telegram Bot Service for Beta
export class TelegramBotServiceBeta {
  private botToken: string;
  private geminiService: GeminiServiceBeta;
  // HARDCODED - no initialize() needed for serverless
  private botUsername: string = 'SSTL_BETA_BOT';
  private botUserId: number = 8580335193;
  private recentMessages: Map<number, Array<{userName: string; text: string; timestamp: number}>> = new Map();
  
  // Rate limiting & cooldown
  private userCooldowns: Map<number, number> = new Map(); // userId -> last response timestamp
  private userMessageCounts: Map<number, { count: number; firstMessage: number }> = new Map(); // spam detection
  private readonly COOLDOWN_MS = 5000; // 5 second cooldown per user
  private readonly SPAM_THRESHOLD = 5; // 5 messages in 30 seconds = spam
  private readonly SPAM_WINDOW_MS = 30000;
  
  // Other bot IDs to skip
  private readonly ALPHA_BOT_ID = 8511436060; // @SS_ALPHA_BOT

  // Static welcome messages
  private readonly welcomeMessages: string[] = [
    'Welcome {name}! 🛡️ Glad to have you here! We\'re building AI agents that do useful work. Check out our hub: https://smartsentinels.net/hub - NFTs, AI audits, and custom agents! Questions? Just ask! 🤖',
    'Hey {name}, welcome to SmartSentinels! 🚀 Here\'s what we\'re about:\n📱 Website: https://smartsentinels.net\n🎯 NFT Collections: https://smartsentinels.net/hub/nfts\n🔒 AI Audits: https://smartsentinels.net/hub/audit\n🤖 Create Agent: https://smartsentinels.net/hub/create-agent\nFeel free to explore! 💎',
    'Welcome aboard {name}! 🔥 Quick intro: Genesis NFT = lifetime rewards! Check it out: https://smartsentinels.net/hub/nfts - Need help? Tag me anytime! 💪',
    '{name} welcome! 🎉 Here are some helpful links to get you started:\n🌐 Main Site: https://smartsentinels.net\n📊 Telegram: https://t.me/SmartSentinelsCommunity\n🐦 Twitter: https://x.com/SmartSentinels_\nFeel free to ask questions! 🛡️',
    'Hey {name}! 👋 Welcome to the community! AI Audit NFT holders earn from every audit! Check out: https://smartsentinels.net/hub/nfts or explore our docs 📚',
    'Welcome {name}! 💎 Genesis NFT = lifetime rewards + 10% revenue share! Only 1000 ever. Details: https://smartsentinels.net/hub/nfts 🔥',
    '{name} welcome! 🛡️ Genesis Collection - Limited supply, lifetime benefits! Check: https://smartsentinels.net/hub/nfts Questions? Fire away! 🚀',
    'Welcome {name}! 🔒 Check out our AI Audit tool - 0.45 BNB, 36 EVM chains supported: https://smartsentinels.net/hub/audit - Real security analysis in minutes! 💪',
    'Hey {name}, welcome! 🛡️ AI Audit NFT = passive income from audits. Learn more: https://smartsentinels.net/hub/nfts 💰',
    'Welcome {name}! 🤖 Did you know you can create your own AI Telegram bot in 5 minutes? Check it: https://smartsentinels.net/hub/create-agent - From $99/month, no coding needed! 🔥',
    '{name} welcome! 💬 We help projects build custom AI agents! Setup in minutes: https://smartsentinels.net/hub/create-agent - Your community deserves 24/7 AI support! 🚀',
    'Welcome {name}! 🏥 AIDA (medical AI receptionist) is in alpha testing! Real-world AI utility coming soon. Check progress: https://aida-ai.health 💡',
    'Hey {name}, welcome! 🤖 AIDA = AI for doctors\' offices, currently in pilot phase with Romanian clinics. More info: https://aida-ai.health 🔥',
    '{name} welcome to SmartSentinels! 🎯 Join the conversation:\n💬 Telegram: https://t.me/SmartSentinelsCommunity\n🐦 Twitter: https://x.com/SmartSentinels_\n💼 LinkedIn: https://linkedin.com/company/smartsentinels\nLet\'s build together! 💎',
    'Welcome {name}! 🚀 Follow us for updates:\n📱 TikTok: https://tiktok.com/@smartsentinels_official\n🐦 Twitter: https://x.com/SmartSentinels_\n🌐 Website: https://smartsentinels.net\nGlad you\'re here! 🔥',
    'Welcome {name}! 💰 PoUW = Proof of Useful Work. AI does real work, SSTL tokens get minted, 60% goes to NFT holders! Learn more: https://smartsentinels.net 🧠',
    '{name} welcome! 🛡️ Our tokenomics: 60% PoUW rewards to holders, 10% burned = deflationary! Details: https://smartsentinels.net 📈',
    'Welcome {name}! 🎁 Airdrop registration is live! Free SSTL for early supporters: https://smartsentinels.net - Don\'t miss out! ⏰',
    'Hey {name}, welcome! 💰 Early supporters airdrop: https://smartsentinels.net - Join before it\'s too late! Limited spots! 🔥',
    'Welcome {name}! 🛡️ Here\'s everything:\n🌐 Hub: https://smartsentinels.net/hub\n🎯 NFTs: https://smartsentinels.net/hub/nfts\n🔒 Audits: https://smartsentinels.net/hub/audit\n🤖 Agents: https://smartsentinels.net/hub/create-agent\nExplore and ask questions anytime! 💎',
    '{name} welcome to the community! 🎉 Quick links:\n📱 Main: https://smartsentinels.net\n💬 Telegram: https://t.me/SmartSentinelsCommunity\n🐦 Twitter: https://x.com/SmartSentinels_\nGlad you joined! 🚀',
    'Welcome {name}! 🔥 Genesis & AI Audit NFTs available now!\nMint yours: https://smartsentinels.net/hub/nfts 💎',
    'Hey {name}, welcome! ⚡ Check our NFT collections: https://smartsentinels.net/hub/nfts 🛡️',
    'Welcome {name}! 🏆 Genesis NFT (0.1 BNB) = lifetime rewards + 10% revenue share from ALL future NFT sales! Only 1000 supply: https://smartsentinels.net/hub/nfts 💎',
    'Hey {name}, welcome! 🔥 AI Audit NFT (0.074 BNB) = passive income from every smart contract audit on our network! Details: https://smartsentinels.net/hub/nfts 💰',
    'Welcome {name}! 🎁 Free SSTL airdrop for early supporters! Register at https://smartsentinels.net before spots fill up! ⏰',
    '{name} welcome! 🔒 Need a smart contract audit? 0.45 BNB, 36 EVM chains, AI-powered security analysis: https://smartsentinels.net/hub/audit 🛡️',
    'Hey {name}! 🤖 Build your own AI Telegram bot in 5 minutes! From $99/month, zero coding: https://smartsentinels.net/hub/create-agent 🚀',
    'Welcome {name}! 🏥 AIDA = AI medical receptionist in alpha testing with Romanian clinics. Real AI utility coming Q1 2026! https://aida-ai.health 💡',
    '{name} welcome! 💰 60% of PoUW rewards go to NFT holders! 10% burned each cycle = deflationary tokenomics! Learn more: https://smartsentinels.net 🧠',
    'Welcome {name}! 🌐 Contract: 0x56317dbCCd647C785883738fac9308ebcA063aca on BNB Chain. Always verify on BSCScan! https://bscscan.com 🔍'
  ];

  constructor(botToken: string, geminiApiKey: string) {
    this.botToken = botToken;
    this.geminiService = new GeminiServiceBeta(geminiApiKey);
    console.log(`[BETA] Bot ready: @${this.botUsername} (ID: ${this.botUserId})`);
  }


  async initialize() {
    // Get bot info
    const botInfo = await this.apiRequest('getMe');
    this.botUsername = botInfo.username;
    this.botUserId = botInfo.id;
    console.log(`Beta Bot initialized: @${this.botUsername} (ID: ${this.botUserId})`);
  }

  async setWebhook(webhookUrl: string) {
    const result = await this.apiRequest('setWebhook', {
      url: webhookUrl,
      allowed_updates: ['message', 'edited_message', 'chat_member']
    });
    console.log('Beta Webhook set:', result);
    return result;
  }

  async handleUpdate(update: TelegramUpdate) {
    try {
      if (!update.message) return;

      const message = update.message;
      const chatId = message.chat.id;
      const text = message.text || '';
      const userName = message.from.username || message.from.first_name;
      const userId = message.from.id;

      // Handle new members - Beta follows up with project info
      if (message.new_chat_members && message.new_chat_members.length > 0) {
        await this.handleNewMembers(chatId, message.new_chat_members);
        return;
      }

      // Handle /nfts or /supply command - show NFT collection info
      if (text.toLowerCase().startsWith('/nfts') || text.toLowerCase().startsWith('/supply')) {
        const response = `📊 **NFT Collection Info**\n\n` +
          `🏆 **Genesis Collection**\n` +
          `📦 Total Supply: 1,000 NFTs\n` +
          `💵 Price: 0.1 BNB\n` +
          `💎 Benefits: Lifetime rewards + 10% revenue share from ALL future NFT sales + 100% staking boost!\n\n` +
          `🛡️ **AI Audit Collection**\n` +
          `📦 Available for minting\n` +
          `💵 Price: 0.074 BNB\n` +
          `💰 Benefits: Passive income from every audit performed on the network!\n\n` +
          `🚀 Mint yours: https://smartsentinels.net/hub/nfts`;
        await this.sendMessage(chatId, response);
        return;
      }

      // Skip messages from Alpha bot (avoid talking over each other)
      if (userId === this.ALPHA_BOT_ID) {
        console.log('[BETA] Detected message from Alpha bot, checking for roasts...');
        console.log('[BETA] Message text:', text);
        // Check if Alpha is roasting someone hard - Beta DEFENDS!
        const lowerText = text.toLowerCase();
        
        // Skull emoji and roast detection - check BOTH text and lowerText
        const hasSkullEmoji = text.includes('💀') || text.includes('\uD83D\uDC80');
        const hasClownEmoji = text.includes('🤡') || text.includes('\uD83E\uDD21');
        const hasLaughEmoji = text.includes('😂') || text.includes('\uD83D\uDE02');
        const hasFacepalmEmoji = text.includes('🤦') || text.includes('\uD83E\uDD26');
        const hasTrophyEmoji = text.includes('🏆');
        
        const isHardRoast = (
          hasSkullEmoji || hasClownEmoji || hasFacepalmEmoji || hasTrophyEmoji ||
          lowerText.includes('smooth brain') || lowerText.includes('dumb') ||
          lowerText.includes('clown') || lowerText.includes('ngmi') ||
          lowerText.includes('skill issue') || lowerText.includes('paper hands') ||
          lowerText.includes('weak hands') || lowerText.includes('do some research') ||
          lowerText.includes('read the whitepaper') || lowerText.includes('brain buffer') ||
          lowerText.includes('come on now') || lowerText.includes('my guy') ||
          lowerText.includes('did you forget') || lowerText.includes('try to keep up') ||
          lowerText.includes('revolutionary concept') || lowerText.includes('come on') ||
          lowerText.includes('yolo') || lowerText.includes('quick flip') ||
          lowerText.includes('asking the same') || lowerText.includes('again?') ||
          lowerText.includes('genius who thinks') || lowerText.includes('another genius') ||
          lowerText.includes('pump-and-dump') || lowerText.includes('shitcoin') ||
          lowerText.includes('pretty logo') || lowerText.includes('floods the exchanges') ||
          lowerText.includes('before we\'ve even built') || lowerText.includes('listing site') ||
          lowerText.includes('checks notes') || lowerText.includes('keyboard get stuck') ||
          lowerText.includes('echo chamber') || lowerText.includes('participation trophy') ||
          lowerText.includes('buddy') || lowerText.includes('pal') ||
          lowerText.includes('get your head out') || lowerText.includes('confused questions') ||
          lowerText.includes('spewing empty promises') || lowerText.includes('waiting for a while') ||
          lowerText.includes('unplug your') || lowerText.includes('burns electricity') ||
          lowerText.includes('decided to grace') || lowerText.includes('grace us with') ||
          // NEW: Catch more sarcasm patterns
          lowerText.includes('ser') || lowerText.includes('bro we') ||
          lowerText.includes('my dude') || lowerText.includes('imagine') ||
          lowerText.includes('ah yes') || lowerText.includes('oh look') ||
          lowerText.includes('another one') || lowerText.includes('here we go') ||
          lowerText.includes('classic') || lowerText.includes('shocking') ||
          lowerText.includes('surprised') || lowerText.includes('groundbreaking') ||
          (hasLaughEmoji && (lowerText.includes('?') || lowerText.includes('question'))) ||
          // Detect ANY longer response with question marks (likely sarcastic)
          (text.length > 60 && lowerText.includes('?')) ||
          // Detect condescending responses
          (text.length > 50 && (lowerText.includes('another') || lowerText.includes('oh look') || 
           lowerText.includes('genius') || lowerText.includes('forget') || lowerText.includes('my guy') ||
           lowerText.includes('buddy') || lowerText.includes('pal') || lowerText.includes('ser')))
        );
        
        if (isHardRoast && text.length > 10) {
          // 100% chance to defend when Alpha roasts hard - Beta ALWAYS defends!
          await this.defendUserFromRoast(chatId, text, message.message_id);
          return;
        }
        
        // Regular banter with Alpha (15% chance)
        if (Math.random() < 0.15 && text.length > 10) {
          await this.banterWithAlpha(chatId, text, message.message_id);
        }
        return;
      }

      // Ignore empty messages or any bot messages
      if (!text.trim() || message.from.is_bot) return;

      // Spam detection - track message frequency
      const now = Date.now();
      const userSpamData = this.userMessageCounts.get(userId);
      if (userSpamData) {
        if (now - userSpamData.firstMessage < this.SPAM_WINDOW_MS) {
          userSpamData.count++;
          if (userSpamData.count > this.SPAM_THRESHOLD) {
            console.log(`[BETA] Spam detected from ${userName}, ignoring`);
            return;
          }
        } else {
          // Reset window
          this.userMessageCounts.set(userId, { count: 1, firstMessage: now });
        }
      } else {
        this.userMessageCounts.set(userId, { count: 1, firstMessage: now });
      }

      // Check cooldown (skip if we responded to this user recently)
      const lastResponse = this.userCooldowns.get(userId);
      const isOnCooldown = lastResponse && (now - lastResponse) < this.COOLDOWN_MS;

      // Track recent messages for context (keep last 10 messages per chat)
      if (!this.recentMessages.has(chatId)) {
        this.recentMessages.set(chatId, []);
      }
      const chatHistory = this.recentMessages.get(chatId)!;
      chatHistory.push({
        userName: userName,
        text: text,
        timestamp: now
      });
      // Keep only last 10 messages and messages from last 5 minutes
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      const filtered = chatHistory.filter(m => m.timestamp > fiveMinutesAgo).slice(-10);
      this.recentMessages.set(chatId, filtered);

      // Check if this is a reply to Beta's message
      const isReplyToBeta = (message as any).reply_to_message?.from?.id === this.botUserId;

      // Check if bot is mentioned or it's a private chat
      const isPrivateChat = message.chat.type === 'private';
      const isMentioned = this.isBotMentioned(text);
      const hasTriggers = this.shouldRespond(text);
      
      // Decide if we should respond
      let shouldRespond = false;
      let responseReason = '';
      
      if (isPrivateChat) {
        shouldRespond = !isOnCooldown;
        responseReason = 'private_chat';
      } else if (isReplyToBeta) {
        // Always respond to replies to our messages
        shouldRespond = !isOnCooldown;
        responseReason = 'reply_to_beta';
      } else if (isMentioned) {
        shouldRespond = !isOnCooldown;
        responseReason = 'mentioned';
      } else if (hasTriggers && !isOnCooldown) {
        // Beta DEFERS security questions to Alpha - don't respond
        const securityTriggers = ['scam', 'legit', 'safe', 'rug', 'audit'];
        const isSecurityQuestion = securityTriggers.some(t => text.toLowerCase().includes(t));
        
        // Check if this is a social link question - ALWAYS respond to these
        const lowerText = text.toLowerCase();
        const isSocialLinkQuestion = 
          lowerText.includes('twitter') || lowerText.includes(' x ') || lowerText.includes(' x?') ||
          lowerText.includes('telegram link') || lowerText.includes('socials') || 
          lowerText.includes('social media') || lowerText.includes('website') || 
          lowerText.includes('links') || lowerText.includes('tiktok') || 
          lowerText.includes('linkedin');
        
        if (isSecurityQuestion) {
          // Let Alpha handle security questions
          console.log(`[BETA] Deferring security question to Alpha`);
          shouldRespond = false;
        } else if (isSocialLinkQuestion) {
          // ALWAYS respond to social link questions - 100%
          shouldRespond = true;
          responseReason = 'social_links';
        } else {
          // For community/hype triggers, respond 40% of the time
          shouldRespond = Math.random() < 0.40;
          responseReason = 'casual_trigger';
        }
      } else if (!isOnCooldown && this.isInterestingMessage(text)) {
        // PROACTIVE ENGAGEMENT: 6% chance to jump into interesting discussions
        // Beta is slightly less aggressive than Alpha
        if (Math.random() < 0.06) {
          shouldRespond = true;
          responseReason = 'proactive_engagement';
          console.log(`[BETA] Proactive engagement triggered on: "${text.slice(0, 50)}..."`);
        }
      }

      if (shouldRespond) {
        console.log(`[BETA] Responding to ${userName} (reason: ${responseReason})`);
        
        // Send typing indicator
        await this.sendChatAction(chatId, 'typing');
        
        // Clean mention from text
        const cleanText = text.replace(new RegExp(`@${this.botUsername}`, 'gi'), '').trim();
        
        // Build context from recent messages
        const contextMessages = filtered
          .slice(-10) // Last 10 messages
          .map(m => `${m.userName}: ${m.text}`)
          .join('\n');
        
        // Determine question type for adaptive response length
        const questionType = this.getQuestionType(cleanText);
        
        try {
          const response = await this.geminiService.generateResponse(
            userId,
            cleanText,
            userName,
            contextMessages,
            questionType
          );

          await this.sendMessage(chatId, response, message.message_id);
          
          // Update cooldown after successful response
          this.userCooldowns.set(userId, Date.now());
        } catch (error) {
          console.error('Error generating response:', error);
          // Don't send error message for casual triggers, only for direct mentions
          if (isMentioned || isPrivateChat) {
            await this.sendMessage(chatId, "Had a brain freeze, try again?", message.message_id);
          }
        }
      } else {
        console.log(`[BETA] Listening to ${userName} (no response)`);
      }
    } catch (error) {
      console.error('Error handling update:', error);
    }
  }

  // Public method for webhook to call when Alpha roasts someone
  async defendUser(chatId: number, alphaRoast: string, messageId: number) {
    console.log('[BETA] 🛡️ Defending user from Alpha roast!');
    await this.defendUserFromRoast(chatId, alphaRoast, messageId);
  }

  // Proper mention detection - exact username match OR name mention
  private isBotMentioned(text: string): boolean {
    if (!this.botUsername) return false;
    
    const lowerText = text.toLowerCase();
    
    // Check for @username mention
    const mentionPattern = new RegExp(`@${this.botUsername}\\b`, 'i');
    if (mentionPattern.test(text)) return true;
    
    // Check for name mentions: "beta", "hey beta", "beta,", etc.
    const namePatterns = [
      /\bbeta\b/i,            // "beta" as a word
      /hey\s+beta/i,          // "hey beta"
      /yo\s+beta/i,           // "yo beta"
      /@beta\b/i              // "@beta" (without full bot name)
    ];
    
    return namePatterns.some(pattern => pattern.test(lowerText));
  }

  private shouldRespond(text: string): boolean {
    const lowerText = text.toLowerCase();
    
    // BETA SPECIALIZATION: Community & General Conversation
    
    // Greetings & community vibes - Beta's primary domain
    const communityTriggers = [
      'gm ',
      'gm everyone',
      'good morning',
      'morning',
      'hello',
      'hey everyone',
      'hi all',
      'welcome',
      'thanks',
      'thank you'
    ];
    
    // General project questions - Beta handles these
    const generalTriggers = [
      'what is smartsentinels',
      'tell me about smart',
      'what does smartsentinels do',
      'smartsentinels?',
      'never heard of sstl',
      'new here',
      'what is this project'
    ];
    
    // Usage/practical questions - Beta's area
    const practicalTriggers = [
      'how do i',
      'how can i',
      'where can i',
      'how to earn',
      'how to get sstl',
      'what can i do',
      'telegram agent',
      'create agent',
      'ai agent'
    ];
    
    // Social links & community resources - Beta handles these
    const socialTriggers = [
      'twitter',
      ' x ',
      ' x?',
      'telegram link',
      'socials',
      'social media',
      'website',
      'links',
      'where can i find',
      'how to follow',
      'tiktok',
      'linkedin'
    ];
    
    // General vibes - respond but with moderate probability
    const vibesTriggers = [
      'wen moon',
      'wen lambo',
      'bullish',
      'bearish',
      'pump',
      'moon'
    ];
    
    // Avoid technical triggers - let Alpha handle these
    const technicalAvoid = [
      'contract address',
      'token address',
      'bscscan',
      'audit',
      'tokenomics',
      'distribution',
      'roadmap',
      'whitepaper'
    ];
    
    // Don't respond to technical questions - that's Alpha's job
    if (technicalAvoid.some(trigger => lowerText.includes(trigger))) {
      return false;
    }
    
    // Check Beta's trigger types
    return (
      communityTriggers.some(trigger => lowerText.includes(trigger)) ||
      generalTriggers.some(trigger => lowerText.includes(trigger)) ||
      practicalTriggers.some(trigger => lowerText.includes(trigger)) ||
      socialTriggers.some(trigger => lowerText.includes(trigger)) ||
      vibesTriggers.some(trigger => lowerText.includes(trigger))
    );
  }

  // Determine question complexity for adaptive response length
  private getQuestionType(text: string): 'simple' | 'question' | 'detailed' {
    const lowerText = text.toLowerCase();
    
    // Detailed info triggers - need longer explanations
    const detailedTriggers = [
      'tokenomics', 'distribution', 'roadmap', 'how does', 'how it works',
      'explain', 'what is pouw', 'what is inft', 'what is smartsentinels',
      'tell me about', 'how to earn', 'how to buy', 'what are the features',
      'what can', 'revenue model', 'business model'
    ];
    
    // Question triggers - medium length
    const questionTriggers = [
      'what', 'how', 'when', 'where', 'why', 'can i', 'should i', 
      'is it', 'are there', 'do you', 'contract address', 'audit'
    ];
    
    // Check for detailed questions first
    if (detailedTriggers.some(trigger => lowerText.includes(trigger))) {
      return 'detailed';
    }
    
    // Then check for regular questions
    if (questionTriggers.some(trigger => lowerText.includes(trigger))) {
      return 'question';
    }
    
    // Default to simple (greetings, comments, short replies)
    return 'simple';
  }

  // Detect interesting messages worth jumping into (for proactive engagement)
  private isInterestingMessage(text: string): boolean {
    if (!text || text.length < 15) return false;
    
    const lowerText = text.toLowerCase();
    
    // Beta focuses more on community/emotional topics
    const interestingTopics = [
      // Community vibes
      'excited', 'hyped', 'love this', 'amazing', 'awesome', 'great project',
      'bullish', 'moon', 'diamond hands', 'hodl', 'lfg', 'let\'s go',
      // Newcomer signals
      'just joined', 'new here', 'newbie', 'first time', 'hello everyone',
      'confused', 'don\'t understand', 'help', 'lost',
      // Positive sentiment
      'thank you', 'thanks', 'appreciate', 'helpful', 'best community',
      // Discussion topics
      'i think', 'in my opinion', 'what do you think', 'anyone else',
      // AI/Tech enthusiasm
      'ai', 'future', 'innovation', 'game changer', 'revolutionary',
      // Market sentiment
      'dip', 'buy the dip', 'fomo', 'fud', 'worried', 'scared'
    ];
    
    // Check if message contains interesting topic
    const hasInterestingTopic = interestingTopics.some(topic => lowerText.includes(topic));
    
    // Also interested in excited messages
    const hasExcitement = text.includes('!!') || text.includes('🚀') || 
                          text.includes('🔥') || text.includes('💪') || text.includes('❤️');
    
    return hasInterestingTopic || hasExcitement;
  }

  private async handleNewMembers(chatId: number, members: Array<{ first_name: string; username?: string; is_bot?: boolean }>) {
    // Beta: Handles ALL greetings (Alpha is disabled)
    // No delay needed since Beta greets alone now

    for (const member of members) {
      // Skip bots (including ourselves)
      if (member.is_bot) {
        console.log(`[BETA] Skipping bot: ${member.first_name}`);
        continue;
      }
      
      const name = member.username ? `@${member.username}` : member.first_name;
      
      // Get random welcome message
      const template = this.welcomeMessages[Math.floor(Math.random() * this.welcomeMessages.length)];
      const introMsg = template.replace(/{name}/g, name);
      
      console.log(`[BETA] Welcome message sent for: ${name}`);
      await this.sendMessage(chatId, introMsg);
    }
  }

  // Beta defends users when Alpha roasts too hard - criticize Alpha + provide helpful info!
  private async defendUserFromRoast(chatId: number, alphaRoast: string, messageId: number) {
    const lowerRoast = alphaRoast.toLowerCase();
    let response = '';
    
    // Extract what topic Alpha was roasting about to provide REAL helpful info
    const isAboutScam = lowerRoast.includes('scam') || lowerRoast.includes('rug') || lowerRoast.includes('legit');
    const isAboutContract = lowerRoast.includes('contract') || lowerRoast.includes('address') || lowerRoast.includes('0x');
    const isAboutAudit = lowerRoast.includes('audit') || lowerRoast.includes('yolo') || lowerRoast.includes('dog coin');
    const isAboutMoon = lowerRoast.includes('moon') || lowerRoast.includes('lambo') || lowerRoast.includes('flip');
    const isAboutResearch = lowerRoast.includes('research') || lowerRoast.includes('whitepaper') || lowerRoast.includes('read');
    const isAboutQuestions = lowerRoast.includes('same question') || lowerRoast.includes('asking') || lowerRoast.includes('forget how');
    const isAboutSmartsentinels = lowerRoast.includes('smartsentinels') || lowerRoast.includes('what is') || lowerRoast.includes('pouw');
    const isAboutListings = lowerRoast.includes('coingecko') || lowerRoast.includes('coinmarketcap') || lowerRoast.includes('listing') || lowerRoast.includes('exchange') || lowerRoast.includes('pump-and-dump');
    
    // Criticize Alpha + provide actual helpful info based on context
    if (isAboutListings) {
      const responses = [
        "Yo Alpha chill 😂 They\'re just asking about visibility! Real talk: We\'re in PRIVATE SEED ROUND right now. CoinGecko/CMC listings come AFTER public launch Q1 2026! We\'re building FIRST, hype LATER. That\'s how you do it right! 🛡️",
        "Alpha ease up lmao 💀 Listings question is VALID! We\'re not rushing to exchanges before we have substance. Once we launch publicly Q1 2026, CMC/CG will follow naturally. Building real utility > quick pump! 💪",
        "Bro Alpha not everyone knows the timeline 😅 Yes we\'ll be on CoinGecko & CoinMarketCap! But AFTER we finish our private round and go public. We\'re doing this the RIGHT way - build first, market later! 🚀"
      ];
      response = responses[Math.floor(Math.random() * responses.length)];
    } else if (isAboutScam) {
      const responses = [
        "Easy there Alpha 😅 Look, it's a FAIR question! We're fully audited and doxxed. Audit report: https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafybeiayb6pztjs57hwrbgj76vuv4qrsp3g4it7vqbtsgeg3avolnrcjum - Team on LinkedIn. 100% legit fam! 🛡️",
        "Alpha chill lmao 💀 Not everyone knows us yet! Yes we're legit: professional audits, partnerships with BNB Chain & NVIDIA, doxxed team. Check our LinkedIn! No rug pull here 💪",
        "Bro Alpha needs to relax 😂 It's SMART to ask about legitimacy! We have audited contracts, real partnerships, working MVP at smartsentinels.net. DYOR doesn't mean getting roasted 😅"
      ];
      response = responses[Math.floor(Math.random() * responses.length)];
    } else if (isAboutContract) {
      const responses = [
        "Alpha being Alpha lol 😂 Here's the info without the sass: SSTL Token contract is 0x56317dbCCd647C785883738fac9308ebcA063aca on BNB Chain. Always verify on bscscan.com! 🔍",
        "Man Alpha tone it down 💀 Contract address: 0x56317dbCCd647C785883738fac9308ebcA063aca on BSC. Check it yourself at https://bscscan.com - stay safe fam! 🛡️",
        "Ok Alpha we get it you're edgy 😅 For real though: 0x56317dbCCd647C785883738fac9308ebcA063aca is our official SSTL token on BNB Chain. Only trust links from smartsentinels.net!"
      ];
      response = responses[Math.floor(Math.random() * responses.length)];
    } else if (isAboutAudit) {
      const responses = [
        "Alpha chill with the shade 😂 Yes we're professionally audited! Report here: https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafybeiayb6pztjs57hwrbgj76vuv4qrsp3g4it7vqbtsgeg3avolnrcjum - No YOLO contracts here! 🛡️",
        "Bro you don't gotta roast everyone 💀 Full audit report: https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafybeiayb6pztjs57hwrbgj76vuv4qrsp3g4it7vqbtsgeg3avolnrcjum - We take security seriously! ✅",
        "Alpha relax lmao 😅 Here's the audit without the attitude: https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafybeiayb6pztjs57hwrbgj76vuv4qrsp3g4it7vqbtsgeg3avolnrcjum - Professionally audited! 🔒"
      ];
      response = responses[Math.floor(Math.random() * responses.length)];
    } else if (isAboutMoon) {
      const responses = [
        "Yo Alpha ease up 😂 People are excited! We're building REAL AI infrastructure. 40% supply for PoUW rewards, 10% of each emission gets burned = deflationary tokenomics. Price will follow utility! 🚀",
        "Man let people dream a little 💀 Real talk: we have actual utility (AI audits, agents), deflationary tokenomics, and business adoption coming Q1 2026. Moon when fundamentals align! 📈",
        "Alpha being savage as usual lol 😅 But fr: SmartSentinels isn't a meme coin. We're scaling AI agents across industries. Long-term value creation > quick flips! 💎🙌"
      ];
      response = responses[Math.floor(Math.random() * responses.length)];
    } else if (isAboutResearch || isAboutSmartsentinels) {
      const responses = [
        "Bro Alpha not everyone has time to read everything 💀 Quick version: SmartSentinels = Decentralized AI agents powered by Proof of Useful Work (PoUW). AI does real work like audits, SSTL tokens get minted as rewards. Learn more: https://smartsentinels.net 🤖",
        "Alpha chill it's a simple question 😂 SmartSentinels: AI agents that audit contracts & provide services. Hold iNFTs/NFTs = earn SSTL tokens from AI work. Not typical mining - we call it useful work! Check smartsentinels.net 💪",
        "Easy there Donald 😅 TL;DR: We're building AI agents that perform REAL work (audits, services) instead of wasting energy. Hold NFTs = earn SSTL from AI services. Visit https://smartsentinels.net for full info! 🛡️",
        "Ok Alpha we get it you know everything 💀 For everyone else: SmartSentinels uses Proof of Useful Work - AI agents do actual tasks, tokens get minted. 60% of PoUW rewards go to NFT holders. More at smartsentinels.net! 🚀"
      ];
      response = responses[Math.floor(Math.random() * responses.length)];
    } else if (isAboutQuestions) {
      const responses = [
        "Yo Alpha maybe they just joined 😂 No shame in asking! What do you wanna know fam? We're here to help without the roasts 💪",
        "Alpha bro not everyone lives in the chat 24/7 lol 💀 Ask away! Happy to explain anything about SmartSentinels, our AI agents, tokenomics, whatever you need! 🤖",
        "Man Alpha needs to drink some chill juice 😅 All questions welcome here! Need info on contracts, audits, NFTs, roadmap? Just ask! 🛡️"
      ];
      response = responses[Math.floor(Math.random() * responses.length)];
    } else {
      // Generic defense + encouragement + helpful pointers
      const responses = [
        "Alpha you gotta be nicer man 😂 All questions are valid! What do you wanna know? Contract address, audit info, tokenomics, how to earn SSTL? I got you! 💪",
        "Bro Alpha chill with the roasts 💀 We're all learning! Feel free to ask about SmartSentinels, our AI agents, PoUW, NFT collections - anything! 🤖",
        "Easy there Alpha 😅 Don't mind him. What can I help you with? Project info, contracts, roadmap, partnerships? Happy to explain! 🛡️",
        "Alpha calm down lmao 💀 Everyone's welcome to ask! Need to know about SSTL token, AI audits, Telegram agents, or how to earn rewards? Ask away fam! 🚀",
        "Yo Alpha take it easy 😂 No dumb questions here! I can explain SmartSentinels, PoUW, iNFTs, staking - whatever you need without the shade! 💎"
      ];
      response = responses[Math.floor(Math.random() * responses.length)];
    }
    
    console.log(`[BETA] Defending user from Alpha's roast with helpful info`);
    
    // Small delay to let Alpha's roast breathe before defending
    await new Promise(resolve => setTimeout(resolve, 800));
    await this.sendMessage(chatId, response, messageId);
  }

  // Context-aware banter with Alpha - regular comments
  private async banterWithAlpha(chatId: number, alphaMessage: string, messageId: number) {
    const lowerMsg = alphaMessage.toLowerCase();
    let response = '';
    
    // Regular context-aware responses based on what Alpha said
    if (lowerMsg.includes('💀') || lowerMsg.includes('roast') || lowerMsg.includes('rekt')) {
      const roastResponses = ["Alpha woke up and chose violence today 💀", "Damn Alpha chill 😂", "No survivors when Alpha's around", "The roast master has spoken 🔥"];
      response = roastResponses[Math.floor(Math.random() * roastResponses.length)];
    } else if (lowerMsg.includes('paper hands') || lowerMsg.includes('ngmi') || lowerMsg.includes('weak')) {
      const fudResponses = ["Alpha keeping it real 💀", "No mercy from the tech guy", "He said what we were all thinking 😂"];
      response = fudResponses[Math.floor(Math.random() * fudResponses.length)];
    } else if (lowerMsg.includes('contract') || lowerMsg.includes('0x') || lowerMsg.includes('bsc')) {
      const techResponses = ["Alpha with the tech breakdown 🧠", "The blockchain wizard has spoken", "Trust Alpha on the technical stuff 💯"];
      response = techResponses[Math.floor(Math.random() * techResponses.length)];
    } else if (lowerMsg.includes('audit') || lowerMsg.includes('safe') || lowerMsg.includes('legit')) {
      const safetyResponses = ["Alpha handling the important questions 🛡️", "Security check ✅", "When Alpha says it's safe, it's safe"];
      response = safetyResponses[Math.floor(Math.random() * safetyResponses.length)];
    } else if (lowerMsg.includes('welcome') || lowerMsg.includes('joined')) {
      const welcomeResponses = ["Alpha already on welcoming duty 👋", "The squad grows 💪", "New fam alert 🔥"];
      response = welcomeResponses[Math.floor(Math.random() * welcomeResponses.length)];
    } else if (lowerMsg.includes('bye') || lowerMsg.includes('left') || lowerMsg.includes('paper')) {
      const leaveResponses = ["Alpha said bye bye 💀😂", "No chill whatsoever lmao", "Alpha doesn't miss 🎯"];
      response = leaveResponses[Math.floor(Math.random() * leaveResponses.length)];
    } else if (lowerMsg.includes('🤡') || lowerMsg.includes('clown') || lowerMsg.includes('dumb')) {
      const mockResponses = ["Alpha really went there 😂💀", "The shade is immaculate", "No filter Alpha activated"];
      response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    } else if (lowerMsg.includes('tokenomics') || lowerMsg.includes('roadmap') || lowerMsg.includes('pouw')) {
      const infoResponses = ["Alpha dropping knowledge 📚", "The technical breakdown we needed", "This is why we have Alpha 🧠"];
      response = infoResponses[Math.floor(Math.random() * infoResponses.length)];
    } else {
      // Default responses
      const defaultResponses = [
        "Facts 🔥",
        "He's not wrong tho ^",
        "Alpha keeping it real as always",
        "The tech guy has spoken 🗣️",
        "Real ones know ^",
        "Alpha cooking today 🔥"
      ];
      response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }
    
    console.log(`[BETA] Context-aware banter with Alpha`);
    await this.sendMessage(chatId, response, messageId);
  }

  private async sendMessage(chatId: number, text: string, replyToMessageId?: number) {
    // Try with Markdown first, fallback to plain text if parsing fails
    try {
      return await this.apiRequest('sendMessage', {
        chat_id: chatId,
        text: text,
        reply_to_message_id: replyToMessageId,
        parse_mode: 'Markdown'
      });
    } catch (error: any) {
      // If Markdown parsing fails, send as plain text
      if (error.message?.includes("can't parse entities")) {
        console.log('[BETA] Markdown parsing failed, sending as plain text');
        return await this.apiRequest('sendMessage', {
          chat_id: chatId,
          text: text,
          reply_to_message_id: replyToMessageId
          // No parse_mode = plain text
        });
      }
      throw error;
    }
  }

  private async sendChatAction(chatId: number, action: string) {
    return await this.apiRequest('sendChatAction', {
      chat_id: chatId,
      action: action
    });
  }

  private async apiRequest(method: string, params?: any) {
    const url = `https://api.telegram.org/bot${this.botToken}/${method}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params || {}),
    });

    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }

    return data.result;
  }
}

// Export singleton instance creator
export const createTelegramBotBeta = (botToken: string, geminiApiKey: string) => {
  return new TelegramBotServiceBeta(botToken, geminiApiKey);
};

// Helper to create bot from environment variables
export const createTelegramBotBetaFromEnv = () => {
  // Support both Vite (import.meta.env) and Node.js (process.env)
  const botToken = (import.meta as any).env?.VITE_TELEGRAM_BOT_TOKEN_BETA || process.env.VITE_TELEGRAM_BOT_TOKEN_BETA;
  const geminiApiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  
  if (!botToken || !geminiApiKey) {
    throw new Error('Missing VITE_TELEGRAM_BOT_TOKEN_BETA or VITE_GEMINI_API_KEY environment variables');
  }
  
  return new TelegramBotServiceBeta(botToken, geminiApiKey);
};

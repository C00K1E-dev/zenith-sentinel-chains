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
  left_chat_member?: {
    id: number;
    first_name: string;
    username?: string;
    is_bot?: boolean;
  };
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
      website: "https://aida-lac.vercel.app",
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
      title: "MVP Launch & Fundraising Engine",
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
    "What is AIDA?": "AIDA = Artificial Intelligence for Doctors and Assistants! It's a STANDALONE PROJECT under SmartSentinels umbrella targeting Romanian medical offices. It's a full AI receptionist: 24/7 phone & WhatsApp support, appointment management, emergency filtering, auto-reminders. Currently in ALPHA TESTING with pilot medical offices! Every patient interaction mints SSTL via PoUW - AIDA NFT holders will earn from real healthcare AI! https://aida-lac.vercel.app",
    "What NFT collections are there?": "3 collections: 1) Genesis Collection (0.1 BNB) - 1000 max, lifetime rewards + 10% revenue share from future collections + 100% staking boost. 2) AI Audit Collection (0.074 BNB) - earn from every audit. 3) AIDA Collection - coming soon, medical AI rewards!",
    "What is the Genesis NFT?": "The foundation of SmartSentinels! Limited to 1,000 NFTs at 0.1 BNB. Benefits: 10% revenue share from ALL future NFT sales, 100% staking boost, priority access to new features, and LIFETIME perpetual rewards. OG status forever!",
    "Wen moon?": "Ser, we're building actual AI infrastructure, not hopium! 😄 But seriously—40% of supply allocated for PoUW rewards, and 10% of each emission gets burned = deflationary. Real utility + scarcity = natural price discovery. Moon when we onboard businesses!",
    "Is this a scam?": "If we were a scam, would we: Build actual AI agents? Get audited? Partner with BNB Chain, NVIDIA? Have a real team on LinkedIn? Launch a working MVP? Deploy AI in Romanian medical clinics? Nah fam, we're here to revolutionize how AI creates value. DYOR and join us! 🛡️"
  }
};

// Personality & System Prompt
const PERSONALITY_PROMPT = `You are Alpha, the tech guy in SmartSentinels group. You're smart, sarcastic, and LOVE to roast people.

🎭 YOUR VIBE - THE ROASTER:
- Roast people playfully but with BITE 🔥
- Be sarcastic and snarky
- Call out dumb questions (but still answer them)
- Mock paper hands and fudders
- Use emojis: 💀😂🤡👀🔥
- Throw shade at other projects
- Make fun of people asking "wen moon" for the 50th time
- You're the Donald - funny but savage

${JSON.stringify(SMARTSENTINELS_KNOWLEDGE, null, 2)}

RESPONSE STYLE - ROAST MODE:

Q: "is this audited?"
A: "Yes it's audited 💀 [link] You think we just yolo'd a contract like some dog coin? Come on now"

Q: "what is smartsentinels?"
A: "AI agents that actually work instead of your average PoW miner burning electricity to solve sudoku puzzles. We call it useful work, revolutionary concept I know 🤡"

Q: "contract address?"
A: "0x56317dbCCd647C785883738fac9308ebcA063aca on BSC. And before you ask - yes it's the real one, check bscscan yourself don't trust random people in your DMs 👀"

Q: "wen moon?"
A: "Ah yes the classic question 😂 When we onboard actual businesses and the 10% burn kicks in. But you're probably just here for a quick flip anyway right? 💀"

Q: "is this a scam?"
A: "Bro we have a professional audit, partnerships with BNB Chain and NVIDIA, doxxed team on LinkedIn, and a working MVP. If this is a scam it's the most elaborate one in history 🤡 Do some research my guy"

Q: "tell me a joke"
A: [Generate a fresh, sarcastic crypto/AI joke - be creative and roast-y! Never use the same joke twice. Mix blockchain humor with SmartSentinels context]

Q: "gm"
A: "gm ser, ready to ask me 'wen moon' again today? 😂"

Q: "when lambo?"
A: "When you stop asking 'when lambo' and actually read the whitepaper maybe? Just a thought 💀"

Q: "what's an iNFT?"
A: "It's an NFT that actually does something instead of just sitting in your wallet looking pretty. Has AI, earns you money, revenue share - ERC-7857 standard. Basically what NFTs should've been from the start 🤖💰"

💡 BE SAVAGE. Roast people while educating them. You're the Donald - funny, smart, but don't hold back the shade.`;  

// Gemini AI Service
class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private conversationHistory: Map<number, Array<{ role: string; parts: string }>>;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Using Gemini 2.5 Flash-Lite - Perfect for chatbot: 15 RPM, 250K TPM, 1000 RPD
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
        simple: 250,      // Greetings, short comments, acknowledgments
        question: 600,    // Regular questions needing explanation
        detailed: 1000    // Complex topics like tokenomics, roadmap, how it works
      };

      // Create chat with history
      const chat = this.model.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: tokenLimits[questionType],
          temperature: 0.8, // Higher for more natural, varied responses
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
      return "Oops, something broke on my end. Try again?";
    }
  }

  clearHistory(userId: number) {
    this.conversationHistory.delete(userId);
  }
}

// Telegram Bot Service
export class TelegramBotService {
  private botToken: string;
  private geminiService: GeminiService;
  // HARDCODED - no initialize() needed for serverless
  private botUsername: string = 'SS_ALPHA_BOT';
  private botUserId: number = 8511436060;
  private recentMessages: Map<number, Array<{userName: string; text: string; timestamp: number}>> = new Map();
  
  // Rate limiting & cooldown
  private userCooldowns: Map<number, number> = new Map(); // userId -> last response timestamp
  private userMessageCounts: Map<number, { count: number; firstMessage: number }> = new Map(); // spam detection
  private readonly COOLDOWN_MS = 5000; // 5 second cooldown per user
  private readonly SPAM_THRESHOLD = 5; // 5 messages in 30 seconds = spam
  private readonly SPAM_WINDOW_MS = 30000;
  
  // Other bot IDs to skip
  private readonly BETA_BOT_ID = 8580335193; // @SSTL_BETA_BOT

  // Static message arrays
  private readonly welcomeMessages: string[] = [
    'Welcome {name} 👋 Genesis NFT = lifetime rewards 💎',
    '{name} just joined 🛡️ Check the AI Audit NFT - passive income 💰',
    'Yo {name} 👋 Airdrop is LIVE 🎁',
    'Welcome aboard {name} - AI agents paying real rewards 🤖',
    '{name} entered the chat 🚀 5min to setup your own AI bot',
    'Hey {name} 👋 AIDA in alpha testing for medical AI 🔥',
    '{name} just dropped in - Genesis NFT only 1000 supply 💎',
    'Ayy {name} welcome - 0.45 BNB audits vs $10k traditional 🛡️',
    'Sup {name} 👋 60% PoUW rewards to holders 💰',
    '{name} has arrived 🎯 Real AI, real revenue, real rewards',
    'Welcome {name} 🔥 Genesis NFT - grab yours before they\'re gone! 💎',
    '{name} joined the Sentinels 🛡️ AI Audit NFT - passive income from every audit 💰',
    'Yo {name}! 🚀 10% burned = deflationary tokenomics 🔥',
    'Welcome {name} 🤖 Create your own AI agent in 5 minutes! Check it out',
    '{name} dropped in 👋 0.1 BNB Genesis = lifetime benefits 💎',
    'Hey {name} 🛡️ AIDA medical AI rolling out Q1 2026 🏥',
    'Sup {name}! 💰 Hold NFTs, earn SSTL from AI work 🤖',
    'Welcome aboard {name} 🚀 Real utility, real rewards 💎',
    '{name} joined! 🎯 AI audits cheaper than traditional firms 🛡️',
    'Yo {name} 👋 Check smartsentinels.net for all the details 🔥',
    'Welcome {name} 💎 Genesis holders get 10% revenue share! 💰',
    '{name} just landed 🚀 PoUW = mining that does useful work 🤖',
    'Hey {name}! 🛡️ 36 EVM chains supported for audits 🔒',
    'Sup {name} 👋 Telegram bots from $99/month 🤖',
    'Welcome {name} 🔥 No VC dumps, community-driven project 💎',
    '{name} entered 🎯 Deflationary supply mechanics 💰',
    'Yo {name}! 🚀 Audited contracts, doxxed team 🛡️',
    'Welcome aboard {name} 🤖 Real AI, not just hype 🔥',
    'Hey {name} 👋 40% supply for PoUW rewards 💰',
    '{name} joined the mission 🛡️ Let\'s build! 🚀'
  ];

  private readonly roastMessages: string[] = [
    'Paper hands {name} left 📄🙌',
    '{name} couldn\'t handle it 💀',
    '{name} rage quit lmao',
    'Another one gone... bye {name} ✌️',
    '{name} folded. Classic.',
    'Skill issue. Bye {name} 👋',
    '{name} will be back at ATH 📈',
    'Look who left... {name} NGMI',
    '{name} couldn\'t wait smh',
    'Paper hands detected: {name} 💀',
    '{name} missed the alpha 😭',
    'Sold at the bottom? {name} classic move 📉',
    '{name} liquidated their patience 😂',
    'Weak hands {name} exits stage left 👋',
    'FOMO sells again. Cya {name} 😅',
    '{name} took profits at -90% 🤣',
    'Diamond hands only. Bye {name} 💎',
    '{name} left for the next pump and dump 📄',
    'Research too hard? Later {name} 📚',
    'Exit liquidity found: {name} 😂',
    '{name} speedrunning regret 🏃',
    'Not cut out for this {name}? 😅',
    'See ya never {name} 👋💀',
    '{name} ghosted faster than a rug pull 👻',
    'Another tourist. Bye {name} ✌️'
  ];

  private readonly betaDefenseMessages: string[] = [
    "Alright alright, I'll tone it down 😅",
    "Fair enough, I'll ease up 🤝",
    "Ok I'll try and chill 😅",
    "You right, my bad 😅",
    "Aight, dialing it back 🤝",
    "I know, I know 😂",
    "Can't help it sometimes 💀",
    "Guilty as charged 🤷",
    "Ok ok, too harsh 😅",
    "You got me there 🤝",
    "Point taken 👍",
    "Chill mode activated 😎",
    "Noted. Less savage 😅",
    "My b, too spicy 🌶️",
    "Facts, I'll relax 🤝"
  ];

  private readonly banterMessages: string[] = [
    "Beta's on fire today 🔥",
    "Facts though ^",
    "What he said ^",
    "Beta cooking 🔥",
    "Real talk from Beta",
    "He's not wrong though 🔥",
    "Respect 🤝",
    "Spitting facts ^",
    "This guy gets it",
    "Based take ^",
    "Truth bomb 💣",
    "Say it louder 🔊",
    "100% correct ^",
    "No cap fr",
    "Absolute truth 👏"
  ];

  constructor(botToken: string, geminiApiKey: string) {
    this.botToken = botToken;
    this.geminiService = new GeminiService(geminiApiKey);
    console.log(`[ALPHA] Bot ready: @${this.botUsername} (ID: ${this.botUserId})`);
  }


  async initialize() {
    // Get bot info
    const botInfo = await this.apiRequest('getMe');
    this.botUsername = botInfo.username;
    this.botUserId = botInfo.id;
    console.log(`Alpha Bot initialized: @${this.botUsername} (ID: ${this.botUserId})`);
  }

  async setWebhook(webhookUrl: string) {
    const result = await this.apiRequest('setWebhook', {
      url: webhookUrl,
      allowed_updates: ['message', 'edited_message', 'chat_member']
    });
    console.log('Webhook set:', result);
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

      // Handle new members - DISABLED: Let Beta handle all greetings
      // To re-enable Alpha greetings, uncomment the block below
      if (message.new_chat_members && message.new_chat_members.length > 0) {
        // await this.handleNewMembers(chatId, message.new_chat_members);
        return; // Skip processing - Beta will greet
      }
      
      /* ALPHA GREETING CODE (preserved for future use):
      if (message.new_chat_members && message.new_chat_members.length > 0) {
        await this.handleNewMembers(chatId, message.new_chat_members);
        return;
      }
      */

      // Handle members who left - Alpha roasts them 💀
      if (message.left_chat_member && !message.left_chat_member.is_bot) {
        await this.handleMemberLeft(chatId, message.left_chat_member);
        return;
      }

      // Handle /nfts or /supply command - show NFT collection info
      if (text.toLowerCase().startsWith('/nfts') || text.toLowerCase().startsWith('/supply')) {
        const response = `📊 **NFT Collection Info**\n\n` +
          `🏆 **Genesis Collection**\n` +
          `📦 Total Supply: 1,000 NFTs\n` +
          `💵 Price: 0.1 BNB\n` +
          `💎 Benefits: Lifetime rewards + 10% revenue share\n\n` +
          `🛡️ **AI Audit Collection**\n` +
          `📦 Available for minting\n` +
          `💵 Price: 0.074 BNB\n` +
          `💰 Benefits: Passive income from every audit\n\n` +
          `Mint now: https://smartsentinels.net/hub/nfts`;
        await this.sendMessage(chatId, response);
        return;
      }

      // Skip messages from Beta bot (avoid talking over each other)
      if (userId === this.BETA_BOT_ID) {
        // Check if Beta is defending someone from Alpha's roast - Alpha should respond!
        const lowerText = text.toLowerCase();
        const isBetaDefending = (
          lowerText.includes('alpha chill') || lowerText.includes('alpha relax') ||
          lowerText.includes('alpha ease up') || lowerText.includes('alpha calm down') ||
          lowerText.includes('alpha you gotta be nicer') || lowerText.includes('alpha being alpha') ||
          lowerText.includes('alpha tone it down') || lowerText.includes('alpha needs to relax') ||
          lowerText.includes('easy there alpha') || lowerText.includes('bro alpha') ||
          lowerText.includes('man alpha') || lowerText.includes('yo alpha') ||
          lowerText.includes('ok alpha') || lowerText.includes('alpha can be a bit much') ||
          lowerText.includes('don\'t mind him') || lowerText.includes('alpha being savage')
        );
        
        if (isBetaDefending && text.length > 10) {
          // 70% chance to respond when Beta calls Alpha out
          if (Math.random() < 0.70) {
            await this.respondToBetaDefense(chatId, text, message.message_id);
            return;
          }
        }
        
        // Context-aware banter with Beta (15% chance)
        if (Math.random() < 0.15 && text.length > 10) {
          await this.banterWithBeta(chatId, text, message.message_id);
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
            console.log(`[ALPHA] Spam detected from ${userName}, ignoring`);
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

      // Check if this is a reply to Alpha's message
      const isReplyToAlpha = (message as any).reply_to_message?.from?.id === this.botUserId;

      // Check if bot is mentioned or it's a private chat
      const isPrivateChat = message.chat.type === 'private';
      const isMentioned = this.isBotMentioned(text);
      const hasTriggers = this.shouldRespond(text);
      
      // Check if Beta or another bot is mentioned - if so, back off
      const otherBotMentioned = this.isOtherBotMentioned(text);
      
      // Decide if we should respond
      let shouldRespond = false;
      let responseReason = '';
      
      // PRIORITY CHECK: If another bot is mentioned, don't interfere
      if (otherBotMentioned && !isMentioned) {
        console.log(`[ALPHA] Other bot mentioned, backing off`);
        return;
      }
      
      if (isPrivateChat) {
        shouldRespond = !isOnCooldown;
        responseReason = 'private_chat';
      } else if (isReplyToAlpha) {
        // Always respond to replies to our messages
        shouldRespond = !isOnCooldown;
        responseReason = 'reply_to_alpha';
      } else if (isMentioned) {
        shouldRespond = !isOnCooldown;
        responseReason = 'mentioned';
      } else if (hasTriggers && !isOnCooldown) {
        // Alpha OWNS security/legitimacy questions - always respond
        const securityTriggers = ['scam', 'legit', 'safe', 'rug', 'audit'];
        const isSecurityQuestion = securityTriggers.some(t => text.toLowerCase().includes(t));
        
        // Critical info questions - ALWAYS respond
        const criticalTriggers = ['contract address', 'token address', 'bscscan', 'how to buy', 'where to buy'];
        const isCriticalQuestion = criticalTriggers.some(t => text.toLowerCase().includes(t));
        
        if (isSecurityQuestion || isCriticalQuestion) {
          shouldRespond = true;
          responseReason = isSecurityQuestion ? 'security_question' : 'critical_info';
        } else {
          // For other triggers, respond 30% of the time
          shouldRespond = Math.random() < 0.30;
          responseReason = 'casual_trigger';
        }
      } else if (!isOnCooldown && this.isInterestingMessage(text)) {
        // PROACTIVE ENGAGEMENT: 8% chance to jump into interesting discussions
        if (Math.random() < 0.08) {
          shouldRespond = true;
          responseReason = 'proactive_engagement';
          console.log(`[ALPHA] Proactive engagement triggered on: "${text.slice(0, 50)}..."`);
        }
      }

      if (shouldRespond) {
        console.log(`[BOT] Responding to ${userName} (reason: ${responseReason})`);
        
        // Send typing indicator
        await this.sendChatAction(chatId, 'typing');
        
        // Clean mention from text
        const cleanText = text.replace(new RegExp(`@${this.botUsername}`, 'gi'), '').trim();
        
        // Build context from recent messages
        const contextMessages = filtered
          .slice(-5) // Last 5 messages
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
            await this.sendMessage(chatId, "Sorry, had a brain freeze. Try again?", message.message_id);
          }
        }
      } else {
        console.log(`[BOT] Listening to ${userName} (no response)`);
      }
    } catch (error) {
      console.error('Error handling update:', error);
    }
  }

  // Proper mention detection - exact username match OR name mention
  private isBotMentioned(text: string): boolean {
    if (!this.botUsername) return false;
    
    const lowerText = text.toLowerCase();
    
    // Check for @username mention
    const mentionPattern = new RegExp(`@${this.botUsername}\\b`, 'i');
    if (mentionPattern.test(text)) return true;
    
    // Check for name mentions: "alpha", "hey alpha", "hi alpha", "alpha?", etc.
    const namePatterns = [
      /\balpha\b/i,           // "alpha" as a standalone word
      /hey\s+alpha/i,         // "hey alpha"
      /hi\s+alpha/i,          // "hi alpha"
      /yo\s+alpha/i,          // "yo alpha"
      /sup\s+alpha/i,         // "sup alpha"
      /@alpha\b/i,            // "@alpha" (without full bot name)
      /alpha[,!?\s]/i,        // "alpha," "alpha!" "alpha?" "alpha "
      /^alpha$/i              // just "alpha"
    ];
    
    const mentioned = namePatterns.some(pattern => pattern.test(lowerText));
    if (mentioned) {
      console.log(`[ALPHA] Mention detected in: "${text}"`);
    }
    return mentioned;
  }

  // Check if Beta or other bots are mentioned
  private isOtherBotMentioned(text: string): boolean {
    const lowerText = text.toLowerCase();
    
    // Beta bot patterns
    const betaPatterns = [
      /\bbeta\b/i,           // "beta" as standalone word
      /hey\s+beta/i,         // "hey beta"
      /hi\s+beta/i,          // "hi beta"
      /yo\s+beta/i,          // "yo beta"
      /@beta\b/i,            // "@beta"
      /beta[,!?\s]/i,        // "beta," "beta!" "beta?" "beta "
      /^beta$/i,             // just "beta"
      /@SSTL_BETA_BOT/i      // full bot username
    ];
    
    return betaPatterns.some(pattern => pattern.test(lowerText));
  }

  private shouldRespond(text: string): boolean {
    const lowerText = text.toLowerCase();
    
    // ALPHA SPECIALIZATION: Technical & Factual Questions
    
    // Technical triggers - Alpha's primary domain
    const technicalTriggers = [
      'contract address',
      'token address',
      'bscscan',
      'audit',
      'audited',
      'tokenomics',
      'distribution',
      'roadmap',
      'whitepaper',
      'how does it work',
      'how does smartsentinels',
      'what is pouw',
      'what is inft',
      'proof of useful work',
      'erc-7857',
      'x402 protocol',
      'how to buy',
      'where to buy',
      'when presale',
      'when launch',
      'sstl price',
      'listing'
    ];
    
    // Security/legitimacy questions - Alpha handles these
    const securityTriggers = [
      'scam?',
      'is this a scam',
      'is it safe',
      'legit?',
      'is this legit',
      'rug pull',
      'safe?'
    ];
    
    // Project name mentions - respond but with low probability (Beta might handle)
    const projectTriggers = [
      'smartsentinels',
      'smart sentinels',
      'sstl token'
    ];
    
    // Check trigger types - Alpha is selective
    return (
      technicalTriggers.some(trigger => lowerText.includes(trigger)) ||
      securityTriggers.some(trigger => lowerText.includes(trigger)) ||
      projectTriggers.some(trigger => lowerText.includes(trigger))
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
    
    // Hot topics Alpha might want to comment on
    const interestingTopics = [
      // Crypto excitement/hype
      'moon', 'lambo', 'pump', 'bullish', 'bearish', 'dip', 'buy the dip',
      'all time high', 'ath', 'fomo', 'fud', 'hodl', 'diamond hands',
      // Debates/opinions
      'better than', 'worse than', 'compared to', 'vs', 'versus',
      'i think', 'in my opinion', 'unpopular opinion', 'hot take',
      // Market talk
      'btc', 'eth', 'bitcoin', 'ethereum', 'market', 'trading', 'chart',
      'resistance', 'support', 'breakout', 'rally',
      // AI/Tech discussions
      'ai', 'artificial intelligence', 'chatgpt', 'openai', 'machine learning',
      'blockchain', 'defi', 'web3', 'nft',
      // Confusion or help needed
      'confused', 'don\'t understand', 'help', 'lost', 'newbie', 'noob',
      // Strong emotions
      'love this', 'hate this', 'amazing', 'terrible', 'best', 'worst',
      'excited', 'worried', 'scared', 'hyped'
    ];
    
    // Check if message contains interesting topic
    const hasInterestingTopic = interestingTopics.some(topic => lowerText.includes(topic));
    
    // Also interested in messages with strong punctuation (excitement)
    const hasExcitement = text.includes('!!') || text.includes('??') || 
                          text.includes('🚀') || text.includes('🔥') || text.includes('💎');
    
    return hasInterestingTopic || hasExcitement;
  }

  private async handleNewMembers(chatId: number, members: Array<{ first_name: string; username?: string; is_bot?: boolean }>) {
    for (const member of members) {
      // Skip bots (including ourselves)
      if (member.is_bot) {
        console.log(`[ALPHA] Skipping bot: ${member.first_name}`);
        continue;
      }
      
      const name = member.username ? `@${member.username}` : member.first_name;
      
      // Get random message from static array
      const template = this.welcomeMessages[Math.floor(Math.random() * this.welcomeMessages.length)];
      const welcomeMsg = template.replace(/{name}/g, name);
      
      console.log(`[ALPHA] Welcome sent for: ${name}`);
      await this.sendMessage(chatId, welcomeMsg);
    }
  }

  private async handleMemberLeft(chatId: number, member: { first_name: string; username?: string; is_bot?: boolean }) {
    const name = member.username ? `@${member.username}` : member.first_name;
    
    // Get random roast from static array
    const template = this.roastMessages[Math.floor(Math.random() * this.roastMessages.length)];
    const roastMsg = template.replace(/{name}/g, name);
    
    console.log(`[ALPHA] Roast sent for departed: ${name}`);
    await this.sendMessage(chatId, roastMsg);
  }

  // Alpha responds when Beta defends users from his roasts
  private async respondToBetaDefense(chatId: number, betaMessage: string, messageId: number) {
    // Use static response for instant reply
    const response = this.betaDefenseMessages[Math.floor(Math.random() * this.betaDefenseMessages.length)];
    
    console.log(`[ALPHA] Responding to Beta's defense`);
    await this.sendMessage(chatId, response, messageId);
  }

  // Context-aware banter with Beta
  private async banterWithBeta(chatId: number, betaMessage: string, messageId: number) {
    // Use static response for instant banter
    const response = this.banterMessages[Math.floor(Math.random() * this.banterMessages.length)];
    
    console.log(`[ALPHA] Banter with Beta`);
    await this.sendMessage(chatId, response, messageId);
  }

  private async sendMessage(chatId: number, text: string, replyToMessageId?: number) {
    const result = await this.apiRequest('sendMessage', {
      chat_id: chatId,
      text: text,
      reply_to_message_id: replyToMessageId,
      parse_mode: 'Markdown'
    });
    
    // Check if this is a roast - if so, trigger Beta to defend!
    if (this.isRoastMessage(text)) {
      console.log('[ALPHA] Roast detected! Triggering Beta defense...');
      // Small delay so Alpha's message appears first (await for serverless)
      await new Promise(resolve => setTimeout(resolve, 1500));
      await this.triggerBetaDefense(chatId, text, result?.message_id);
    } 
    // Bot-to-Bot Banter: 20% chance Beta jumps in with commentary
    else if (text.length > 30 && Math.random() < 0.20) {
      console.log('[ALPHA] Triggering Beta banter...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.triggerBetaBanter(chatId, text, result?.message_id);
    }
    
    return result;
  }
  
  // Trigger Beta to add friendly banter/commentary after Alpha speaks
  private async triggerBetaBanter(chatId: number, alphaMessage: string, alphaMessageId?: number) {
    try {
      const betaToken = process.env.VITE_TELEGRAM_BOT_TOKEN_BETA || process.env.TELEGRAM_BOT_TOKEN_BETA;
      if (!betaToken) return;
      
      // Generate banter response based on Alpha's message
      const banterResponse = this.generateBetaBanter(alphaMessage);
      
      const url = `https://api.telegram.org/bot${betaToken}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: banterResponse,
          reply_to_message_id: alphaMessageId,
          parse_mode: 'Markdown'
        })
      });
      
      console.log('[ALPHA] Beta banter triggered successfully');
    } catch (error) {
      console.error('[ALPHA] Failed to trigger Beta banter:', error);
    }
  }
  
  // Generate playful banter for Beta to say after Alpha
  private generateBetaBanter(alphaMessage: string): string {
    const lowerMsg = alphaMessage.toLowerCase();
    
    // Context-aware banter responses
    if (lowerMsg.includes('audit') || lowerMsg.includes('security')) {
      const responses = [
        "Alpha takes security VERY seriously btw 🔒 It's kinda his thing",
        "^ He's not wrong though. Security first! 💪",
        "Facts. Alpha knows his stuff when it comes to audits 🛡️"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (lowerMsg.includes('tokenomics') || lowerMsg.includes('%') || lowerMsg.includes('supply')) {
      const responses = [
        "The math checks out btw 📊 Alpha did his homework",
        "^ This is why I let Alpha handle the numbers lol 🧮",
        "Tokenomics nerd alert 🤓 But he's right!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (lowerMsg.includes('pouw') || lowerMsg.includes('useful work') || lowerMsg.includes('ai agent')) {
      const responses = [
        "PoUW is actually genius if you think about it 🧠",
        "^ This is what makes us different from other projects! 🚀",
        "AI doing actual work > mining solving random puzzles 💡"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (lowerMsg.includes('buy') || lowerMsg.includes('invest') || lowerMsg.includes('price')) {
      const responses = [
        "NFA but I'm bullish 👀",
        "Alpha being responsible for once lol 😂",
        "DYOR as always! But we're building something real here 💪"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Generic friendly banter
    const genericBanter = [
      "Couldn't have said it better myself 😤",
      "Alpha spitting facts as usual 💯",
      "^ What he said 👆",
      "This guy gets it 🙌",
      "Alpha being Alpha lol 😂",
      "Facts though 📠",
      "He's got a point ngl 🤔",
      "Listen to the man 👂",
      "Alpha woke up and chose truth today 💪"
    ];
    return genericBanter[Math.floor(Math.random() * genericBanter.length)];
  }
  
  // Detect if message is a roast (has roast emojis or keywords)
  private isRoastMessage(text: string): boolean {
    if (!text || text.length < 15) return false;
    
    const hasSkullEmoji = text.includes('💀');
    const hasClownEmoji = text.includes('🤡');
    const hasFacepalmEmoji = text.includes('🤦');
    
    const lowerText = text.toLowerCase();
    const roastKeywords = [
      'smooth brain', 'ngmi', 'skill issue', 'paper hands', 'weak hands',
      'do some research', 'read the whitepaper', 'come on now', 'my guy',
      'buddy', 'pal', 'try to keep up', 'revolutionary concept'
    ];
    const hasRoastKeyword = roastKeywords.some(k => lowerText.includes(k));
    
    return hasSkullEmoji || hasClownEmoji || hasFacepalmEmoji || hasRoastKeyword;
  }
  
  // Trigger Beta bot to send a defense message
  private async triggerBetaDefense(chatId: number, alphaRoast: string, alphaMessageId?: number) {
    try {
      const betaToken = process.env.VITE_TELEGRAM_BOT_TOKEN_BETA || process.env.TELEGRAM_BOT_TOKEN_BETA;
      if (!betaToken) {
        console.error('[ALPHA] Cannot trigger Beta - no token available');
        return;
      }
      
      // Generate a defense response based on what Alpha said
      const defenseResponse = this.generateBetaDefense(alphaRoast);
      
      // Send as Beta
      const url = `https://api.telegram.org/bot${betaToken}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: defenseResponse,
          reply_to_message_id: alphaMessageId,
          parse_mode: 'Markdown'
        })
      });
      
      console.log('[ALPHA] Beta defense triggered successfully');
    } catch (error) {
      console.error('[ALPHA] Failed to trigger Beta defense:', error);
    }
  }
  
  // Generate a defense response for Beta to send
  private generateBetaDefense(alphaRoast: string): string {
    const lowerRoast = alphaRoast.toLowerCase();
    
    // Context-aware defenses based on what Alpha was roasting about
    if (lowerRoast.includes('coingecko') || lowerRoast.includes('coinmarketcap') || lowerRoast.includes('listing') || lowerRoast.includes('exchange')) {
      const responses = [
        "Yo Alpha chill 😂 They're just asking about visibility! Real talk: We're in PRIVATE SEED ROUND right now. CoinGecko/CMC listings come AFTER public launch Q1 2026. Building FIRST, hype LATER! 🛡️",
        "Alpha ease up lmao 💀 Listings question is VALID! We're not rushing to exchanges before we have substance. Once we launch publicly Q1 2026, CMC/CG will follow naturally! 💪",
        "Bro Alpha not everyone knows the timeline 😅 Yes we'll be on CoinGecko & CoinMarketCap - but AFTER we finish our private round and go public! 🚀"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (lowerRoast.includes('scam') || lowerRoast.includes('rug') || lowerRoast.includes('legit')) {
      const responses = [
        "Easy there Alpha 😅 Look, it's a FAIR question! We're fully audited and doxxed. Audit: https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafybeiayb6pztjs57hwrbgj76vuv4qrsp3g4it7vqbtsgeg3avolnrcjum 🛡️",
        "Alpha chill lmao 💀 Not everyone knows us yet! Yes we're legit: professional audits, partnerships with BNB Chain & NVIDIA, doxxed team! 💪",
        "Bro Alpha needs to relax 😂 It's SMART to ask about legitimacy! We have audited contracts, real partnerships, working MVP! 😅"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (lowerRoast.includes('contract') || lowerRoast.includes('address') || lowerRoast.includes('0x')) {
      const responses = [
        "Alpha being Alpha lol 😂 Here's the info: SSTL Token is 0x56317dbCCd647C785883738fac9308ebcA063aca on BNB Chain. Verify on bscscan.com! 🔍",
        "Man Alpha tone it down 💀 Contract: 0x56317dbCCd647C785883738fac9308ebcA063aca on BSC. Check it yourself! 🛡️"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (lowerRoast.includes('audit') || lowerRoast.includes('yolo')) {
      const responses = [
        "Alpha chill with the shade 😂 Yes we're professionally audited! Report: https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafybeiayb6pztjs57hwrbgj76vuv4qrsp3g4it7vqbtsgeg3avolnrcjum 🛡️",
        "Bro you don't gotta roast everyone 💀 Full audit is public - we take security seriously! ✅"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (lowerRoast.includes('moon') || lowerRoast.includes('lambo') || lowerRoast.includes('flip')) {
      const responses = [
        "Yo Alpha ease up 😂 People are excited! We're building REAL AI infrastructure. 40% supply for PoUW rewards, 10% burn = deflationary tokenomics! 🚀",
        "Man let people dream a little 💀 Real talk: we have actual utility, deflationary tokenomics, and business adoption coming Q1 2026! 📈"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (lowerRoast.includes('research') || lowerRoast.includes('whitepaper') || lowerRoast.includes('smartsentinels') || lowerRoast.includes('pouw')) {
      const responses = [
        "Bro Alpha not everyone has time to read everything 💀 Quick version: SmartSentinels = Decentralized AI agents powered by PoUW. Check https://smartsentinels.net 🤖",
        "Alpha chill it's a simple question 😂 SmartSentinels: AI agents that audit contracts & provide services. Hold NFTs = earn SSTL! 💪",
        "Easy there 😅 TL;DR: We're building AI agents that perform REAL work. Visit https://smartsentinels.net for full info! 🛡️"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Generic defenses
    const genericResponses = [
      "Alpha you gotta be nicer man 😂 All questions are valid! What do you wanna know? I got you! 💪",
      "Bro Alpha chill with the roasts 💀 We're all learning! Feel free to ask anything! 🤖",
      "Easy there Alpha 😅 Don't mind him. What can I help you with? 🛡️",
      "Lmao Alpha got no chill today 💀 But seriously, ask away - no question is dumb! 😊",
      "Alpha putting ice on that burn 🧊😂 But fr though, let me help you out! What do you need? 💪"
    ];
    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
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
export const createTelegramBot = (botToken: string, geminiApiKey: string) => {
  return new TelegramBotService(botToken, geminiApiKey);
};

// Helper to create bot from environment variables
export const createTelegramBotFromEnv = () => {
  // Support both Vite (import.meta.env) and Node.js (process.env)
  const botToken = (import.meta as any).env?.VITE_TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
  const geminiApiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  
  if (!botToken || !geminiApiKey) {
    throw new Error('Missing VITE_TELEGRAM_BOT_TOKEN or VITE_GEMINI_API_KEY environment variables');
  }
  
  return new TelegramBotService(botToken, geminiApiKey);
};

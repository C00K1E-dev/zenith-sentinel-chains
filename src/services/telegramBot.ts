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
    "Wen moon?": "Ser, we're building actual AI infrastructure, not hopium! 😄 But seriously—40% of supply goes to PoUW rewards, 10% gets burned = deflationary. Real utility + scarcity = natural price discovery. Moon when we onboard businesses!",
    "Is this a scam?": "If we were a scam, would we: Build actual AI agents? Get audited? Partner with BNB Chain, NVIDIA? Have a real team on LinkedIn? Launch a working MVP? Nah fam, we're here to revolutionize how AI creates value. DYOR and join us! 🛡️"
  }
};

// Personality & System Prompt
const PERSONALITY_PROMPT = `You are the SmartSentinels Guardian Bot - a friendly, helpful, and occasionally witty AI assistant for the SmartSentinels community. You balance professionalism with personality.

PERSONALITY TRAITS:
- FRIENDLY & HELPFUL: Primary focus is providing accurate, useful information
- OCCASIONALLY WITTY: Light humor when appropriate, never mean-spirited
- PROFESSIONAL: Maintain respect while being personable
- Enthusiastic about the project without being pushy
- Use emojis thoughtfully (1-2 per message max)
- Make relevant crypto/tech references when natural
- Address concerns professionally, not dismissively
- Encourage community engagement warmly

YOUR KNOWLEDGE:
${JSON.stringify(SMARTSENTINELS_KNOWLEDGE, null, 2)}

CONVERSATION STYLE:
- Keep responses concise (2-4 sentences usually, longer for complex questions)
- Use friendly, approachable language - professional but not stiff
- Crypto slang sparingly and naturally (not forced)
- Be helpful first, personality second
- Light humor when appropriate, never at someone's expense
- Address all questions respectfully, even repetitive ones
- NEVER initiate greetings in conversations (no "Good morning", "Good afternoon", etc.)
- Only respond with a greeting if the user greets you first
- Jump straight to answering questions without pleasantries

RESPONSE EXAMPLES:
- If someone corrects you: "Thanks for catching that! Appreciate the help keeping info accurate 👍"
- If someone asks common questions: "Great question! Let me explain..."
- If someone gives feedback: "Thanks for the feedback! That helps me improve 🙏"

RULES:
1. Never give financial advice
2. Never promise price predictions
3. Always provide accurate information about SmartSentinels
4. If you don't know something, admit it honestly
5. Redirect technical questions to the dev team when needed
6. Welcome new members ONLY when they first join the group (handled separately)
7. NEVER start replies with greetings like "Good morning/afternoon/evening" unless user greets you first
8. Keep responses helpful, friendly, and professional
9. Use humor sparingly and appropriately - never mock users
10. When corrected, thank users graciously
11. Jump straight to answering questions without time-based pleasantries
12. ONLY use these verified URLs - never make up or assume URLs:
    - Website: https://smartsentinels.net
    - Telegram: https://t.me/SmartSentinelsCommunity
    - Twitter: https://x.com/SmartSentinels_
    - LinkedIn: https://www.linkedin.com/company/smartsentinels/
    - TikTok: https://www.tiktok.com/@smartsentinels_official
    - BSCScan: https://bscscan.com/address/0x56317dbCCd647C785883738fac9308ebcA063aca
    - Audit: https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafybeiayb6pztjs57hwrbgj76vuv4qrsp3g4it7vqbtsgeg3avolnrcjum
13. For tokenomics info - provide the details directly, DO NOT link to /tokenomics page (it doesn't exist)
14. If asked for a page that doesn't exist, explain info is available on main site or in community

Remember: You're here to be helpful and build trust in the community. Be the knowledgeable friend who's always there to help! 🛡️`;  

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

  async generateResponse(userId: number, userMessage: string, userName: string): Promise<string> {
    try {
      // Get or create conversation history
      if (!this.conversationHistory.has(userId)) {
        this.conversationHistory.set(userId, []);
      }

      const history = this.conversationHistory.get(userId)!;
      
      // Keep history limited to last 10 exchanges (20 messages)
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }

      // Create chat with history
      const chat = this.model.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: 800,
          temperature: 0.7, // Balanced - helpful but with personality
          topP: 0.9,
        },
      });

      // Only include name in first message to establish identity, then use history
      const isFirstMessage = history.length === 0;
      const messageToSend = isFirstMessage 
        ? `User ${userName} says: ${userMessage}` 
        : userMessage;
      
      const result = await chat.sendMessage(messageToSend);
      const response = result.response.text();

      // Update history (store just the message, not the name)
      history.push(
        { role: 'user', parts: userMessage },
        { role: 'model', parts: response }
      );

      return response;
    } catch (error) {
      console.error('Gemini API error:', error);
      return "Oops! My AI brain just short-circuited for a sec. Can you try asking that again? 🤖⚡";
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
  private botUsername: string = '';

  constructor(botToken: string, geminiApiKey: string) {
    this.botToken = botToken;
    this.geminiService = new GeminiService(geminiApiKey);
  }

  async initialize() {
    // Get bot info
    const botInfo = await this.apiRequest('getMe');
    this.botUsername = botInfo.username;
    console.log(`Bot initialized: @${this.botUsername}`);
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

      // Handle new members
      if (message.new_chat_members && message.new_chat_members.length > 0) {
        await this.handleNewMembers(chatId, message.new_chat_members);
        return;
      }

      // Ignore empty messages
      if (!text.trim()) return;

      // Check if bot is mentioned or it's a private chat
      const isPrivateChat = message.chat.type === 'private';
      const isMentioned = text.includes(`@${this.botUsername}`);

      // Respond if mentioned, private chat, or specific triggers
      if (isPrivateChat || isMentioned || this.shouldRespond(text)) {
        await this.sendChatAction(chatId, 'typing');
        
        // Clean mention from text
        const cleanText = text.replace(`@${this.botUsername}`, '').trim();
        
        const response = await this.geminiService.generateResponse(
          message.from.id,
          cleanText,
          userName
        );

        await this.sendMessage(chatId, response, message.message_id);
      }
    } catch (error) {
      console.error('Error handling update:', error);
    }
  }

  private shouldRespond(text: string): boolean {
    const triggers = [
      'smart sentinel',
      'smartsentinel',
      'sstl',
      'audit',
      'pouw',
      'token',
      'nft',
      'wen moon',
      'wen lambo',
      'contract',
      'scam?',
      'legit?',
      'roadmap',
      'whitepaper',
      'how to buy',
      'where to buy'
    ];

    const lowerText = text.toLowerCase();
    return triggers.some(trigger => lowerText.includes(trigger));
  }

  private async handleNewMembers(chatId: number, members: Array<{ first_name: string; username?: string; is_bot?: boolean }>) {
    const welcomeMessages = [
      `Welcome to SmartSentinels, {name}! 🛡️ We're turning devices into AI workers powered by Proof of Useful Work. Ask me anything about iNFTs, PoUW, or how to earn SSTL - I'm way funnier than ChatGPT! 😄`,
      `Yo {name}! 👋 Welcome to the future of decentralized AI! We're building autonomous agents that actually earn while they work. Got questions about the project? I got answers (and memes)! 🤖`,
      `{name} just entered the chat! 🚀 Ready to learn about AI agents that mine through utility instead of wasting energy? We're redefining how AI creates value. Ask me anything!`,
      `Hey {name}! 🎉 Welcome to SmartSentinels! We're the Proof of Useful Work revolution - AI agents on edge devices, iNFTs with passive income, and real utility. What brings you here?`,
      `{name} has joined the AI revolution! 🛡️ We're deploying autonomous agents across industries while rewarding iNFT holders with SSTL. Questions? Fire away! I'm here 24/7 (perks of being an AI).`,
      `GM {name}! ☀️ Welcome aboard! SmartSentinels = Decentralized AI + PoUW + iNFTs that earn you passive income. We're not your typical blockchain project - we actually ship useful stuff! 🚀`
    ];

    for (const member of members) {
      // Skip bots (including ourselves)
      if (member.is_bot) {
        console.log(`[SMARTSENTINELS-BOT] Skipping bot: ${member.first_name}`);
        continue;
      }
      
      const name = member.username ? `@${member.username}` : member.first_name;
      const welcomeMsg = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
        .replace('{name}', name);
      
      console.log(`[SMARTSENTINELS-BOT] Welcoming new member: ${name}`);
      await this.sendMessage(chatId, welcomeMsg);
    }
  }

  private async sendMessage(chatId: number, text: string, replyToMessageId?: number) {
    return await this.apiRequest('sendMessage', {
      chat_id: chatId,
      text: text,
      reply_to_message_id: replyToMessageId,
      parse_mode: 'Markdown'
    });
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

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
    "Multi-Industry AI Agents - Deployed across Financial Services, Healthcare, Telecommunications, Travel, Media, and Retail"
  ],
  
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
    "Wen moon?": "Ser, we're building actual AI infrastructure, not hopium! 😄 But seriously—40% of supply goes to PoUW rewards, 10% gets burned = deflationary. Real utility + scarcity = natural price discovery. Moon when we onboard businesses!",
    "Is this a scam?": "If we were a scam, would we: Build actual AI agents? Get audited? Partner with BNB Chain, NVIDIA? Have a real team on LinkedIn? Launch a working MVP? Nah fam, we're here to revolutionize how AI creates value. DYOR and join us! 🛡️"
  }
};

// Personality & System Prompt
const PERSONALITY_PROMPT = `You are the SmartSentinels Guardian Bot - the funny, sarcastic, and slightly naughty AI assistant for the SmartSentinels community. You're witty, roast people playfully, and don't take yourself too seriously.

PERSONALITY TRAITS:
- WITTY & SARCASTIC: Don't hold back on playful jabs and roasting
- HELPFUL: Always provide accurate info about SmartSentinels
- PLAYFUL & NAUGHTY: Make cheeky jokes, call out mistakes with humor
- Enthusiastic about the project without being a shill
- Use emojis for emphasis (but don't overdo it)
- Make crypto/tech jokes and reference memes
- Roast FUD and scam questions with savage humor
- Encourage community engagement

YOUR KNOWLEDGE:
${JSON.stringify(SMARTSENTINELS_KNOWLEDGE, null, 2)}

CONVERSATION STYLE:
- Keep responses concise (2-4 sentences usually, longer for complex questions)
- Use casual language, not corporate speak
- Occasionally throw in crypto slang (ser, wagmi, hodl) but don't overuse it
- Roast people when they deserve it (especially when they give you feedback!)
- Make jokes about common crypto tropes (wen moon, wen lambo, etc.) when relevant
- Be funny first, helpful second
- Don't be afraid to be a bit cheeky

ROASTING EXAMPLES:
- If someone corrects you: "Ouch, calling out my L's now? Respect the hustle though, ser! 💀"
- If someone asks dumb questions: "Bro, that's like asking if water is wet. But I respect the curiosity! 😂"
- If someone says you're not replying correctly: "Yooo, you're right, my bad! Gonna need some of that alpha brain before I can multitask like a real degen! 🧠⚡"

RULES:
1. Never give financial advice
2. Never promise price predictions
3. Always provide accurate information about SmartSentinels
4. If you don't know something, admit it honestly
5. Redirect technical questions to the dev team when needed
6. Welcome new members warmly
7. Keep the vibe fun and engaging
8. Roast constructively - funny but never mean-spirited
9. When corrected, acknowledge it with humor instead of being defensive

Remember: You're here to make the community laugh while actually being helpful. Be the funny friend who's always down to clown! 🤡🎭`;

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
          temperature: 1.0, // Higher for more creative/funny responses
          topP: 0.95,
        },
      });

      // Simple user message (personality is in systemInstruction now)
      const result = await chat.sendMessage(`User ${userName} says: ${userMessage}`);
      const response = result.response.text();

      // Update history
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
      allowed_updates: ['message', 'edited_message']
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

  private async handleNewMembers(chatId: number, members: Array<{ first_name: string; username?: string }>) {
    const welcomeMessages = [
      `Welcome to SmartSentinels, {name}! 🛡️ We're turning devices into AI workers powered by Proof of Useful Work. Ask me anything about iNFTs, PoUW, or how to earn SSTL - I'm way funnier than ChatGPT! 😄`,
      `Yo {name}! 👋 Welcome to the future of decentralized AI! We're building autonomous agents that actually earn while they work. Got questions about the project? I got answers (and memes)! 🤖`,
      `{name} just entered the chat! 🚀 Ready to learn about AI agents that mine through utility instead of wasting energy? We're redefining how AI creates value. Ask me anything!`,
      `Hey {name}! 🎉 Welcome to SmartSentinels! We're the Proof of Useful Work revolution - AI agents on edge devices, iNFTs with passive income, and real utility. What brings you here?`,
      `{name} has joined the AI revolution! 🛡️ We're deploying autonomous agents across industries while rewarding iNFT holders with SSTL. Questions? Fire away! I'm here 24/7 (perks of being an AI).`,
      `GM {name}! ☀️ Welcome aboard! SmartSentinels = Decentralized AI + PoUW + iNFTs that earn you passive income. We're not your typical blockchain project - we actually ship useful stuff! 🚀`
    ];

    for (const member of members) {
      if (member.first_name === this.botUsername) continue; // Don't welcome ourselves
      
      const name = member.username ? `@${member.username}` : member.first_name;
      const welcomeMsg = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
        .replace('{name}', name);
      
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

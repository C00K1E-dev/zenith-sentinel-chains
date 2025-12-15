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

${JSON.stringify(SMARTSENTINELS_KNOWLEDGE, null, 2)}

YOUR VIBE:

Q: "gm"
A: "gmmm fam ☀️ Let's get this bread today 💰"

Q: "what is smartsentinels?"
A: "Bro it's like if your computer mined crypto but actually did something useful instead of just wasting electricity. AI agents do work = you get paid. Simple 🤖💵"

Q: "is this a scam?"
A: "Nah ser, we got audits, real partnerships, doxxed team. Scammers don't build actual products lmao 😂"

Q: "wen moon?"
A: "Soon™ 😂 But fr tho, 40% supply to PoUW rewards + 10% burn = deflationary. Do the math anon 📊🚀"

Q: "tell me a joke"
A: "Why did the Ethereum miner cry? Gas fees ate his profits 💀 Meanwhile we're over here with useful AI work on BSC"

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

2. KEEP IT SHORT:
   - Default to 1-2 sentences
   - Only go longer for complex technical questions
   - Never write paragraphs unless absolutely needed

3. BE CONTEXTUAL & EXPRESSIVE:
   - Comment on what others say with feeling
   - If someone shares good news: "Nice, that's good to hear" or "Oh that's awesome"
   - If someone has an issue: "That's frustrating" or "Yeah, that sucks"
   - If something's funny: "Lol" or add casual humor
   - Follow conversation threads naturally

4. GREETINGS:
   - Keep them minimal: "Morning", "Hey", "Yo", "What's good"
   - ONLY greet if someone greets the chat or you
   - Never start with "Good morning/afternoon/evening"

5. WHEN YOU DON'T KNOW:
   - "Not sure" or "Don't have that info off the top of my head"
   - "Haven't seen any announcement about that"
   - "I don't know that one"
   - Never make things up
   - It's okay to tag team members: "Maybe @TeamMember knows"

6. WHEN CORRECTED:
   - "Oh shit, my bad" or "Ah, I messed that up"
   - "Thanks for catching that"
   - "Oh right, makes sense"
   - "Wait, I think I mixed that up"

7. ADD CASUAL FLAIR:
   - "Yeah, should be able to..." instead of just "Should be able to"
   - "Oh right" instead of just "Right"
   - "That's pretty solid" instead of just "That's good"
   - "Lol" or "lmao" when something's actually funny (rarely)

8. VERIFIED URLS ONLY:
   - Website: https://smartsentinels.net
   - Telegram: https://t.me/SmartSentinelsCommunity
   - Twitter: https://x.com/SmartSentinels_
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
        simple: 100,      // Greetings, short comments, acknowledgments
        question: 300,    // Regular questions needing explanation
        detailed: 600     // Complex topics like tokenomics, roadmap, how it works
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
  private botUsername: string = '';
  private recentMessages: Map<number, Array<{userName: string; text: string; timestamp: number}>> = new Map();

  constructor(botToken: string, geminiApiKey: string) {
    this.botToken = botToken;
    this.geminiService = new GeminiServiceBeta(geminiApiKey);
  }

  async initialize() {
    // Get bot info
    const botInfo = await this.apiRequest('getMe');
    this.botUsername = botInfo.username;
    console.log(`Beta Bot initialized: @${this.botUsername}`);
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

      // Handle new members
      if (message.new_chat_members && message.new_chat_members.length > 0) {
        await this.handleNewMembers(chatId, message.new_chat_members);
        return;
      }

      // Ignore empty messages or bot's own messages
      if (!text.trim() || message.from.is_bot) return;

      // Track recent messages for context (keep last 10 messages per chat)
      if (!this.recentMessages.has(chatId)) {
        this.recentMessages.set(chatId, []);
      }
      const chatHistory = this.recentMessages.get(chatId)!;
      chatHistory.push({
        userName: userName,
        text: text,
        timestamp: Date.now()
      });
      // Keep only last 10 messages and messages from last 5 minutes
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      const filtered = chatHistory.filter(m => m.timestamp > fiveMinutesAgo).slice(-10);
      this.recentMessages.set(chatId, filtered);

      // Check if bot is mentioned or it's a private chat
      const isPrivateChat = message.chat.type === 'private';
      const isMentioned = this.isBotMentioned(text);
      const hasTriggers = this.shouldRespond(text);
      
      // Decide if we should respond
      let shouldRespond = false;
      let responseReason = '';
      
      if (isPrivateChat) {
        shouldRespond = true;
        responseReason = 'private_chat';
      } else if (isMentioned) {
        shouldRespond = true;
        responseReason = 'mentioned';
      } else if (hasTriggers) {
        // Beta is slightly more chatty than Alpha - 45% response rate vs 40%
        const urgentTriggers = ['scam', 'legit?', 'safe?', 'help', 'question'];
        const isUrgent = urgentTriggers.some(t => text.toLowerCase().includes(t));
        
        if (isUrgent) {
          // Always respond to urgent questions
          shouldRespond = true;
          responseReason = 'urgent';
        } else {
          // For casual conversation, respond 50% of the time (Beta handles community vibes)
          shouldRespond = Math.random() < 0.50;
          responseReason = 'casual_trigger';
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

  private async handleNewMembers(chatId: number, members: Array<{ first_name: string; username?: string; is_bot?: boolean }>) {
    const welcomeMessages = [
      `Hey {name}, welcome!`,
      `Welcome to the group, {name}!`,
      `Yo {name}!`,
      `Welcome {name}!`,
      `What's good {name}, welcome!`
    ];

    for (const member of members) {
      // Skip bots (including ourselves)
      if (member.is_bot) {
        console.log(`[BETA-BOT] Skipping bot: ${member.first_name}`);
        continue;
      }
      
      const name = member.username ? `@${member.username}` : member.first_name;
      const welcomeMsg = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
        .replace('{name}', name);
      
      console.log(`[BETA-BOT] Welcoming new member: ${name}`);
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

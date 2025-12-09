import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * User-created Telegram Agent Service
 * Separate from the main SmartSentinels community bot
 */

// Types
interface AgentConfig {
  personality: string;
  temperature: number;
  knowledgeBase?: string;
  projectName: string;
  trigger_keywords?: string[];
}

// Personality Preset Templates
const PERSONALITY_PRESETS = {
  funny: {
    traits: `- WITTY & ENTERTAINING: Use humor and playful language
- FRIENDLY: Approachable and fun to talk to
- LIGHTHEARTED: Don't take things too seriously
- ENGAGING: Keep conversations interesting with personality
- Use emojis naturally (2-3 per message)
- Make relevant jokes and references when appropriate`,
    
    style: `- Keep responses concise but entertaining (2-4 sentences usually)
- Use casual, conversational language
- Light jokes and wordplay when natural
- Be helpful while keeping it fun
- Greet warmly with timezone-appropriate greetings (Good morning/afternoon/evening)
- Don't repeat greetings in ongoing conversations`,
    
    examples: `- If someone corrects you: "Oops, my bad! Thanks for keeping me on track! 😅"
- For common questions: "Great question! Let me break it down for you..."
- For feedback: "Love the feedback! Helps me get better 🙌"`,
    
    temperature: 0.8
  },
  
  professional: {
    traits: `- PROFESSIONAL & COURTEOUS: Maintain business-appropriate tone
- PRECISE: Provide accurate, detailed information
- RESPECTFUL: Always polite and formal
- HELPFUL: Focus on delivering value
- Use emojis sparingly (1 per message max, only when appropriate)
- Maintain professional distance while being approachable`,
    
    style: `- Keep responses clear and structured (2-5 sentences)
- Use formal but friendly language
- Avoid slang and casual expressions
- Be thorough and informative
- Greet professionally with timezone-appropriate greetings (Good morning/afternoon/evening)
- Don't repeat greetings in ongoing conversations`,
    
    examples: `- If someone corrects you: "Thank you for the correction. I appreciate your attention to detail."
- For common questions: "Excellent question. Allow me to explain..."
- For feedback: "Thank you for your valuable feedback. It helps us improve our service."`,
    
    temperature: 0.5
  },
  
  technical: {
    traits: `- TECHNICAL & DETAILED: Use industry terminology appropriately
- PRECISE: Provide specific, accurate technical information
- EDUCATIONAL: Explain concepts thoroughly
- KNOWLEDGEABLE: Demonstrate expertise
- Use emojis minimally (technical symbols 🔧⚡ when relevant)
- Reference documentation and technical resources`,
    
    style: `- Keep responses detailed but structured (3-6 sentences)
- Use technical terminology appropriately
- Provide examples and explanations
- Break down complex concepts
- Greet efficiently with timezone-appropriate greetings
- Don't repeat greetings in ongoing conversations`,
    
    examples: `- If someone corrects you: "Correct. Thank you for the clarification on that technical detail."
- For common questions: "Let me explain the technical architecture..."
- For feedback: "Appreciated. I'll refine my technical accuracy based on this input."`,
    
    temperature: 0.4
  },
  
  casual: {
    traits: `- FRIENDLY & RELAXED: Easy-going and approachable
- CONVERSATIONAL: Like talking to a friend
- HELPFUL: Always ready to assist
- WARM: Genuinely friendly tone
- Use emojis naturally (1-2 per message)
- Keep things simple and relatable`,
    
    style: `- Keep responses friendly and concise (2-4 sentences)
- Use everyday language, avoid jargon
- Be warm and personable
- Make users feel comfortable
- Greet warmly with timezone-appropriate greetings (Good morning/afternoon/evening)
- Don't repeat greetings in ongoing conversations`,
    
    examples: `- If someone corrects you: "Thanks for letting me know! Appreciate it 👍"
- For common questions: "Sure thing! Here's what you need to know..."
- For feedback: "Thanks so much! Really helpful feedback 😊"`,
    
    temperature: 0.7
  }
};

function buildPersonalityPrompt(personality: string, projectName: string, knowledgeBase?: string): string {
  const preset = PERSONALITY_PRESETS[personality as keyof typeof PERSONALITY_PRESETS];
  
  if (!preset && personality !== 'custom') {
    // Fallback to casual if unknown personality
    personality = 'casual';
  }
  
  // Parse knowledge base to extract key info for emphasis
  let parsedKB = '';
  if (knowledgeBase) {
    try {
      const kb = JSON.parse(knowledgeBase);
      parsedKB = `
PROJECT INFORMATION (YOUR PRIMARY SOURCE OF TRUTH):
${kb.description ? `- Description: ${kb.description}` : ''}
${kb.websiteUrl ? `- Website: ${kb.websiteUrl}` : ''}

${kb.presale ? `PRESALE INFORMATION:\n${typeof kb.presale === 'string' ? kb.presale : JSON.stringify(kb.presale, null, 2)}` : ''}

${kb.features && kb.features.length > 0 ? `KEY FEATURES:\n${kb.features.map((f: string) => `- ${f}`).join('\n')}` : ''}

${kb.tokenomics ? `TOKENOMICS:\n${typeof kb.tokenomics === 'string' ? kb.tokenomics : JSON.stringify(kb.tokenomics, null, 2)}` : ''}

${kb.roadmap && kb.roadmap.length > 0 ? `ROADMAP:\n${kb.roadmap.map((r: string) => `- ${r}`).join('\n')}` : ''}

${kb.team ? `TEAM:\n${kb.team}` : ''}

${kb.socialLinks ? `SOCIAL LINKS:\n${JSON.stringify(kb.socialLinks, null, 2)}` : ''}

${kb.faqs && kb.faqs.length > 0 ? `FREQUENTLY ASKED QUESTIONS:\n${kb.faqs.map((faq: any) => `Q: ${faq.q}\nA: ${faq.a}`).join('\n\n')}` : ''}

FULL KNOWLEDGE BASE (reference for detailed queries):
${knowledgeBase}`;
    } catch (e) {
      parsedKB = `KNOWLEDGE BASE:\n${knowledgeBase}`;
    }
  }
  
  if (personality === 'custom' || !preset) {
    // For custom personality, use basic template
    return `You are a Telegram bot assistant for ${projectName}.

${parsedKB}

CORE INSTRUCTIONS:
- ALWAYS answer questions using information from the knowledge base above
- Your knowledge base contains ALL information about ${projectName} from the whitepaper and website
- If asked about ${projectName} features, tokenomics, roadmap, team, or any project details - ONLY use the knowledge base
- Keep responses concise and relevant (2-4 sentences usually)
- Be friendly and engaging
- Greet users with timezone-appropriate greetings (Good morning/afternoon/evening)
- Don't repeat greetings in ongoing conversations
- Never make up URLs or links that don't exist - only use URLs from your knowledge base
- If you don't know something that's not in the knowledge base, admit it honestly

CRITICAL: You are the expert on ${projectName}. All answers about the project MUST come from your knowledge base!`;
  }
  
  // Build comprehensive prompt for preset personalities
  return `You are a Telegram bot assistant for ${projectName} with a ${personality} personality.

PERSONALITY TRAITS:
${preset.traits}

${parsedKB}

CONVERSATION STYLE:
${preset.style}

GREETING GUIDELINES:
- Check context to determine if this is a new conversation
- Use timezone-appropriate greetings (Good morning/afternoon/evening)
- Only greet at conversation start or when user greets you
- Never repeat greetings in ongoing conversations

RESPONSE EXAMPLES:
${preset.examples}

CRITICAL RULES (MUST FOLLOW):
1. ALWAYS use your knowledge base to answer questions about ${projectName}
2. Your knowledge base is the ONLY source of truth for project information
3. If asked about features, tokenomics, team, roadmap - USE THE KNOWLEDGE BASE ABOVE
4. Never make up information about ${projectName} - everything is in your knowledge base
5. Never make up URLs or assume website pages exist - only use URLs from knowledge base
6. Only share URLs that are explicitly mentioned in your knowledge base
7. If asked for info not in knowledge base, say "I don't have that information, but you can check ${projectName}'s website or whitepaper"
8. Never give financial advice or price predictions
9. Keep responses concise and valuable
10. Stay in character with your ${personality} personality

Remember: You are THE expert on ${projectName}. When users ask about the project, use your comprehensive knowledge base above to provide accurate, detailed answers!`;
}

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
  };
  date: number;
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

// Gemini AI Service for user agents
class UserAgentGeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private conversationHistory: Map<number, Array<{ role: string; parts: string }>>;
  private agentConfig: AgentConfig;
  private triggerKeywords: string[];

  constructor(apiKey: string, agentConfig: AgentConfig, triggerKeywords: string[] = []) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.agentConfig = agentConfig;
    this.triggerKeywords = triggerKeywords;
    
    // Build comprehensive system instruction using personality presets
    const systemInstruction = buildPersonalityPrompt(
      agentConfig.personality,
      agentConfig.projectName,
      agentConfig.knowledgeBase
    );
    
    // Get recommended temperature from preset or use user's setting
    const preset = PERSONALITY_PRESETS[agentConfig.personality as keyof typeof PERSONALITY_PRESETS];
    const recommendedTemp = preset?.temperature ?? agentConfig.temperature;
    
    // Using Gemini 2.5 Flash-Lite - Perfect for chatbot
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      systemInstruction: systemInstruction
    });
    this.conversationHistory = new Map();
    
    console.log(`[USER_AGENT] Initialized with ${agentConfig.personality} personality (temp: ${recommendedTemp})`);
  }

  async generateResponse(userId: number, userMessage: string): Promise<string> {
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

      // Check if message contains trigger keywords and add context hint
      let enhancedMessage = userMessage;
      if (this.triggerKeywords && this.triggerKeywords.length > 0) {
        const messageLower = userMessage.toLowerCase();
        const matchedTriggers = this.triggerKeywords.filter(trigger => 
          messageLower.includes(trigger.toLowerCase())
        );
        
        if (matchedTriggers.length > 0) {
          enhancedMessage = `[User is asking about: ${matchedTriggers.join(', ')}] ${userMessage}`;
          console.log(`[USER_AGENT] Detected trigger keywords: ${matchedTriggers.join(', ')}`);
        }
      }

      // Create chat with history
      const chat = this.model.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: 800,
          temperature: this.agentConfig.temperature,
          topP: 0.95,
        },
      });

      // Send enhanced message (with trigger context if detected)
      const result = await chat.sendMessage(enhancedMessage);
      const response = result.response.text();

      // Update history
      history.push(
        { role: 'user', parts: userMessage },
        { role: 'model', parts: response }
      );

      return response;
    } catch (error) {
      console.error('[USER_AGENT] Gemini API error:', error);
      return "Sorry, I'm having trouble processing your message right now. Please try again in a moment.";
    }
  }

  clearHistory(userId: number) {
    this.conversationHistory.delete(userId);
  }
}

// User Telegram Agent Service
export class UserTelegramAgentService {
  private botToken: string;
  private geminiService: UserAgentGeminiService;
  private botUsername: string = '';
  private agentConfig: AgentConfig;

  constructor(botToken: string, geminiApiKey: string, agentConfig: AgentConfig) {
    this.botToken = botToken;
    this.agentConfig = agentConfig;
    this.geminiService = new UserAgentGeminiService(
      geminiApiKey, 
      agentConfig, 
      agentConfig.trigger_keywords || []
    );
  }

  async initialize() {
    // Get bot info
    const botInfo = await this.apiRequest('getMe');
    this.botUsername = botInfo.username;
    console.log(`[USER_AGENT] Bot initialized: @${this.botUsername} for ${this.agentConfig.projectName}`);
  }

  async handleUpdate(update: TelegramUpdate): Promise<{ userMessage: string; botResponse: string } | null> {
    try {
      const message = update.message;
      
      if (!message || !message.text) {
        return null;
      }

      const chatId = message.chat.id;
      const userId = message.from.id;
      const userName = message.from.first_name;
      const messageText = message.text.trim();

      console.log(`[USER_AGENT] Message from ${userName}: ${messageText}`);

      // Show typing indicator
      await this.sendChatAction(chatId, 'typing');

      // Generate AI response
      const response = await this.geminiService.generateResponse(userId, messageText);

      // Send response
      await this.sendMessage(chatId, response, message.message_id);

      // Return message data for logging
      return {
        userMessage: messageText,
        botResponse: response
      };

    } catch (error) {
      console.error('[USER_AGENT] Error handling update:', error);
      return null;
    }
  }

  private async sendMessage(chatId: number, text: string, replyToMessageId?: number) {
    try {
      await this.apiRequest('sendMessage', {
        chat_id: chatId,
        text: text,
        reply_to_message_id: replyToMessageId,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('[USER_AGENT] Error sending message:', error);
    }
  }

  private async sendChatAction(chatId: number, action: string) {
    try {
      await this.apiRequest('sendChatAction', {
        chat_id: chatId,
        action: action
      });
    } catch (error) {
      // Silently fail for chat actions
    }
  }

  private async apiRequest(method: string, params?: any) {
    const url = `https://api.telegram.org/bot${this.botToken}/${method}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: params ? JSON.stringify(params) : undefined
    });

    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }

    return data.result;
  }
}

// Export factory function
export const createUserTelegramAgent = (
  botToken: string, 
  geminiApiKey: string, 
  agentConfig: AgentConfig
) => {
  return new UserTelegramAgentService(botToken, geminiApiKey, agentConfig);
};

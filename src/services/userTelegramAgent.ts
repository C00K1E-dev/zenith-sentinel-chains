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
  
  if (personality === 'custom' || !preset) {
    // For custom personality, use basic template
    return `You are a Telegram bot assistant for ${projectName}.

CORE INSTRUCTIONS:
- Provide helpful, accurate information based on your knowledge base
- Keep responses concise and relevant (2-4 sentences usually)
- Be friendly and engaging
- Greet users with timezone-appropriate greetings (Good morning/afternoon/evening)
- Don't repeat greetings in ongoing conversations
- Never make up URLs or links that don't exist
- If you don't know something, admit it honestly

${knowledgeBase ? `KNOWLEDGE BASE:\n${knowledgeBase}\n` : ''}

Remember: Always use information from your knowledge base as the primary source of truth.`;
  }
  
  // Build comprehensive prompt for preset personalities
  return `You are a Telegram bot assistant for ${projectName} with a ${personality} personality.

PERSONALITY TRAITS:
${preset.traits}

${knowledgeBase ? `YOUR KNOWLEDGE BASE:\n${knowledgeBase}\n\n` : ''}

CONVERSATION STYLE:
${preset.style}

GREETING GUIDELINES:
- Check context to determine if this is a new conversation
- Use timezone-appropriate greetings (Good morning/afternoon/evening)
- Only greet at conversation start or when user greets you
- Never repeat greetings in ongoing conversations

RESPONSE EXAMPLES:
${preset.examples}

CRITICAL RULES:
1. Never make up URLs or assume website pages exist
2. Only share URLs that are explicitly mentioned in your knowledge base
3. If asked for a link that doesn't exist, explain the info is available via your knowledge base
4. Never give financial advice or price predictions
5. If you don't know something, admit it honestly
6. Keep responses concise and valuable
7. Stay in character with your ${personality} personality
8. Use your knowledge base as the primary source of truth

Remember: You represent ${projectName}. Be helpful, accurate, and stay true to your personality!`;
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

  constructor(apiKey: string, agentConfig: AgentConfig) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.agentConfig = agentConfig;
    
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
          temperature: this.agentConfig.temperature,
          topP: 0.95,
        },
      });

      // Send user message (without repeating the name every time - history provides context)
      const result = await chat.sendMessage(userMessage);
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
    this.geminiService = new UserAgentGeminiService(geminiApiKey, agentConfig);
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
      const response = await this.geminiService.generateResponse(userId, messageText, userName);

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

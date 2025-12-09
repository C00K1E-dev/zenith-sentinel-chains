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
    
    // Build system instruction based on agent config
    let systemInstruction = '';
    
    // Add personality
    if (agentConfig.personality) {
      systemInstruction += `You are a Telegram bot assistant with the following personality: ${agentConfig.personality}.\n\n`;
    }
    
    // Add project context
    systemInstruction += `You are representing the project: ${agentConfig.projectName}.\n\n`;
    
    // Add knowledge base
    if (agentConfig.knowledgeBase) {
      systemInstruction += `Here is your knowledge base about the project:\n${agentConfig.knowledgeBase}\n\n`;
    }
    
    // Add core instructions
    systemInstruction += `CORE INSTRUCTIONS:
- Always provide helpful, accurate information based on your knowledge base
- Stay in character with your assigned personality
- If you don't know something, admit it honestly
- Keep responses concise and relevant (2-4 sentences usually)
- Use the knowledge base as your primary source of truth
- Be friendly and engaging with users`;
    
    // Using Gemini 2.5 Flash-Lite - Perfect for chatbot
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      systemInstruction: systemInstruction
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
          temperature: this.agentConfig.temperature,
          topP: 0.95,
        },
      });

      // Send user message
      const result = await chat.sendMessage(`User ${userName} says: ${userMessage}`);
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

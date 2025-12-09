/**
 * Telegram Webhook Handler
 * THE ENFORCER - Checks subscription status FIRST before processing any messages
 * Deployed to Vercel as serverless function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Types
interface TelegramUpdate {
  message?: {
    chat: {
      id: number;
    };
    text?: string;
    from?: {
      id: number;
      username?: string;
    };
  };
}

/**
 * Main webhook handler
 * CRITICAL: Subscription check happens FIRST
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true }); // Telegram requires 200 OK
  }

  try {
    const update: TelegramUpdate = req.body;
    
    if (!update.message || !update.message.text) {
      return res.status(200).json({ ok: true });
    }

    const chatId = update.message.chat.id;
    const userMessage = update.message.text;
    const telegramUserId = update.message.from?.id;

    // Get agent ID from environment (set during deployment)
    const agentId = process.env.AGENT_ID;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!agentId || !botToken) {
      await sendTelegramMessage(
        chatId,
        '⚠️ Configuration error. Please contact support.',
        botToken || ''
      );
      return res.status(200).json({ ok: true });
    }

    // ============================================
    // STEP 1: CHECK SUBSCRIPTION STATUS (THE GATEKEEPER)
    // ============================================
    const subscriptionCheck = await checkSubscriptionStatus(agentId);
    
    if (!subscriptionCheck.isActive) {
      await sendTelegramMessage(
        chatId,
        subscriptionCheck.message || '⚠️ This agent\'s subscription has expired. Please contact the owner to renew.',
        botToken
      );
      return res.status(200).json({ ok: true });
    }

    // ============================================
    // STEP 2: SUBSCRIPTION IS ACTIVE - PROCESS MESSAGE
    // ============================================
    const startTime = Date.now();
    
    // Load agent configuration
    const agentConfig = await loadAgentConfig(agentId);
    
    if (!agentConfig) {
      await sendTelegramMessage(
        chatId,
        '⚠️ Agent configuration error. Please try again later.',
        botToken
      );
      return res.status(200).json({ ok: true });
    }

    // Generate AI response
    const botResponse = await generateBotResponse(
      userMessage,
      agentConfig
    );

    // Send response
    await sendTelegramMessage(chatId, botResponse, botToken);

    // Track analytics
    const responseTime = Date.now() - startTime;
    await saveMessageToAnalytics(
      agentId,
      telegramUserId || 0,
      userMessage,
      botResponse,
      responseTime
    );

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({ ok: true }); // Still return 200 to Telegram
  }
}

/**
 * Check if agent subscription is active
 * THIS IS THE CRITICAL GATEKEEPER FUNCTION
 */
async function checkSubscriptionStatus(agentId: string): Promise<{
  isActive: boolean;
  message?: string;
}> {
  try {
    // Query Supabase for latest subscription
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        isActive: false,
        message: '⚠️ Database configuration error'
      };
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/subscriptions?agent_id=eq.${agentId}&order=created_at.desc&limit=1`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const subscriptions = await response.json();

    if (!subscriptions || subscriptions.length === 0) {
      return {
        isActive: false,
        message: '⚠️ No subscription found. This agent needs to be activated by the owner.'
      };
    }

    const subscription = subscriptions[0];

    // Check payment status
    if (subscription.payment_status !== 'confirmed') {
      return {
        isActive: false,
        message: '⚠️ Payment confirmation pending. Please wait a few minutes and try again.'
      };
    }

    // Check expiry date
    const expiryDate = new Date(subscription.expiry_date);
    const now = new Date();

    if (expiryDate <= now) {
      const daysExpired = Math.floor((now.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24));
      return {
        isActive: false,
        message: `⚠️ This agent's subscription expired ${daysExpired} day${daysExpired !== 1 ? 's' : ''} ago. Please contact the owner to renew.`
      };
    }

    // Subscription is active
    return {
      isActive: true
    };
  } catch (error) {
    console.error('Subscription check error:', error);
    return {
      isActive: false,
      message: '⚠️ Unable to verify subscription. Please try again later.'
    };
  }
}

/**
 * Load agent configuration from Supabase
 */
async function loadAgentConfig(agentId: string): Promise<any | null> {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_KEY;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/telegram_agents?id=eq.${agentId}&select=*`,
      {
        headers: {
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const agents = await response.json();
    return agents && agents.length > 0 ? agents[0] : null;
  } catch (error) {
    console.error('Config load error:', error);
    return null;
  }
}

/**
 * Generate bot response using Gemini
 */
async function generateBotResponse(
  userMessage: string,
  agentConfig: any
): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Build system instruction
    const systemInstruction = buildSystemInstruction(agentConfig);

    const result = await model.generateContent([
      { text: systemInstruction },
      { text: `User: ${userMessage}` }
    ]);

    return result.response.text();
  } catch (error) {
    console.error('Gemini error:', error);
    return '⚠️ I encountered an error processing your request. Please try again.';
  }
}

/**
 * Build system instruction from agent config
 */
function buildSystemInstruction(agentConfig: any): string {
  const { 
    project_name, 
    personality, 
    custom_personality,
    knowledge_base,
    custom_faqs
  } = agentConfig;

  let instruction = `You are an AI assistant for ${project_name}.\n\n`;

  // Personality
  if (personality === 'custom' && custom_personality) {
    instruction += `Personality: ${custom_personality}\n\n`;
  } else {
    const personalities: Record<string, string> = {
      funny: 'You are funny, engaging, and use crypto slang and memes.',
      professional: 'You are professional, formal, and provide detailed information.',
      technical: 'You are technical, code-focused, and provide detailed specifications.',
      casual: 'You are casual, friendly, and conversational.'
    };
    instruction += `Personality: ${personalities[personality] || personalities.casual}\n\n`;
  }

  // Knowledge base
  if (knowledge_base) {
    instruction += `Project Information:\n${JSON.stringify(knowledge_base, null, 2)}\n\n`;
  }

  // Custom FAQs
  if (custom_faqs) {
    instruction += `Frequently Asked Questions:\n${custom_faqs}\n\n`;
  }

  return instruction;
}

/**
 * Send message to Telegram
 */
async function sendTelegramMessage(
  chatId: number,
  text: string,
  botToken: string
): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      })
    });
  } catch (error) {
    console.error('Telegram send error:', error);
  }
}

/**
 * Save message to analytics
 */
async function saveMessageToAnalytics(
  agentId: string,
  telegramUserId: number,
  userMessage: string,
  botResponse: string,
  responseTime: number
): Promise<void> {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_KEY;

    await fetch(`${supabaseUrl}/rest/v1/agent_messages`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey!,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_id: agentId,
        telegram_user_id: telegramUserId,
        user_message: userMessage,
        bot_response: botResponse,
        response_time_ms: responseTime,
        created_at: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Analytics save error:', error);
  }
}

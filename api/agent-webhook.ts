import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * MULTI-AGENT TELEGRAM WEBHOOK
 * Handles multiple paid Telegram AI agents
 * Does NOT interfere with the main SmartSentinels bot
 */

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    
    // Extract bot token from the update (Telegram includes bot info)
    // We'll identify the agent by the bot_token in the database
    const message = update.message || update.edited_message;
    
    if (!message) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat.id;
    const userMessage = message.text || '';
    const userName = message.from?.first_name || message.from?.username || 'there';
    const userId = message.from?.id?.toString() || 'unknown';
    
    // Get agent ID from query parameter
    const agentId = req.query.agentId as string;
    
    if (!agentId) {
      console.error('[AGENT-WEBHOOK] No agentId provided');
      return res.status(400).json({ error: 'Agent ID required' });
    }

    // Load agent configuration
    const { data: agent, error: agentError } = await supabase
      .from('telegram_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      console.error('[AGENT-WEBHOOK] Agent not found:', agentError);
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Handle new members joining the group
    if (message.new_chat_members && message.new_chat_members.length > 0) {
      console.log('[AGENT-WEBHOOK] New members joined:', message.new_chat_members.length);
      
      for (const newMember of message.new_chat_members) {
        // Don't greet the bot itself
        if (newMember.is_bot) continue;
        
        const memberName = newMember.first_name || newMember.username || 'there';
        const welcomeMessage = `Welcome to ${agent.project_name}, ${memberName}! 🎉\n\nI'm the AI assistant here to help answer your questions. Feel free to ask me anything about the project!`;
        
        await sendTelegramMessage(agent.bot_token, chatId, welcomeMessage);
        console.log('[AGENT-WEBHOOK] Sent welcome message to:', memberName);
      }
      
      return res.status(200).json({ ok: true });
    }
    
    console.log('[AGENT-WEBHOOK] Received message:', { chatId, userMessage, userName });

    if (agentError || !agent) {
      console.error('[AGENT-WEBHOOK] Agent not found:', agentError);
      return res.status(404).json({ error: 'Agent not found' });
    }

    console.log('[AGENT-WEBHOOK] Agent loaded:', agent.project_name);

    // Check subscription status
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!subscription || new Date(subscription.expiry_date) < new Date()) {
      // Subscription expired
      await sendTelegramMessage(
        agent.bot_token,
        chatId,
        '⚠️ Subscription expired. Please renew to continue using this bot.'
      );
      return res.status(200).json({ ok: true });
    }

    // Build knowledge base prompt
    const knowledgeBase = agent.knowledge_base || {};
    const personality = agent.custom_personality || getPersonalityPrompt(agent.personality);
    const triggers = agent.trigger_keywords || [];
    
    console.log('[AGENT-WEBHOOK] Config:', {
      personality: agent.personality,
      triggers,
      hasKnowledgeBase: Object.keys(knowledgeBase).length > 0
    });
    
    // Respond to all messages for better conversation flow
    // Triggers are optional - if set, they act as hints but don't block responses
    console.log('[AGENT-WEBHOOK] Responding to message');

    // Smart greeting logic: Only greet if it's a new conversation
    // 1. Check if message is a greeting ("hi", "hello", "hey", etc.)
    // 2. OR check if last interaction was more than 6 hours ago
    const greetingWords = ['hi', 'hello', 'hey', 'sup', 'yo', 'greetings', 'good morning', 'good afternoon', 'good evening'];
    const isGreeting = greetingWords.some(word => userMessage.toLowerCase().trim().startsWith(word));
    
    // Check last interaction time - use updated_at as fallback if last_interaction doesn't exist
    const { data: agentData } = await supabase
      .from('telegram_agents')
      .select('last_interaction, updated_at')
      .eq('id', agentId)
      .single();
    
    const lastInteractionTime = agentData?.last_interaction || agentData?.updated_at;
    const lastInteraction = lastInteractionTime ? new Date(lastInteractionTime) : null;
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6 hours in milliseconds
    const isNewSession = !lastInteraction || lastInteraction < sixHoursAgo;
    
    const shouldGreet = isGreeting || isNewSession;
    
    console.log('[AGENT-WEBHOOK] Greeting check:', {
      isGreeting,
      isNewSession,
      shouldGreet,
      lastInteraction: lastInteraction?.toISOString(),
      sixHoursAgo: sixHoursAgo.toISOString(),
      message: userMessage.slice(0, 50)
    });

    // Update last interaction time (will only work if column exists)
    try {
      await supabase
        .from('telegram_agents')
        .update({ last_interaction: new Date().toISOString() })
        .eq('id', agentId);
    } catch (error) {
      console.log('[AGENT-WEBHOOK] Could not update last_interaction (column may not exist):', error);
    }

    // Generate response using Gemini with fallback models
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY!);
    
    const greetingInstruction = shouldGreet 
      ? `This is the first interaction with ${userName} today. Start with a friendly greeting using their name, then answer their question.`
      : `IMPORTANT: ${userName} has already been greeted in this conversation. DO NOT greet them again. DO NOT say "hey", "hi", "hello", or any greeting words. Just answer their question directly and naturally.`;
    
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const systemPrompt = `You are ${agent.project_name}'s AI assistant.

PERSONALITY: ${personality}

GREETING RULE: ${greetingInstruction}

CURRENT DATE: ${currentDate} (Use this to determine if events are in the past, present, or future)

PROJECT INFORMATION:
${JSON.stringify(knowledgeBase, null, 2)}

WEBSITE: ${agent.website_url}

CUSTOM FAQS:
${agent.custom_faqs || 'None'}

ADDITIONAL INFO:
${agent.additional_info || 'None'}

CRITICAL ANTI-HALLUCINATION RULES:
- ONLY use facts explicitly stated in PROJECT INFORMATION above
- DO NOT infer, assume, or extrapolate information not directly provided
- DO NOT make up dates, events, numbers, or details
- If a date is AFTER the CURRENT DATE (${currentDate}), use FUTURE tense: "will start", "is coming", "launches on"
- If a date is BEFORE the CURRENT DATE, use PAST tense: "started", "launched", "happened"
- If you don't have specific information, say: "I don't have that information right now. Check ${agent.website_url}"
- DO NOT combine multiple facts to create new information
- DO NOT add context or background not in the data
- When mentioning dates, ALWAYS verify against CURRENT DATE first
- If uncertain about ANY detail, acknowledge uncertainty instead of guessing

IMPORTANT FORMATTING RULES:
- NO markdown formatting (no *, **, ___, etc.)
- Use plain text only
- Maximum 2 emojis per response
- Use natural paragraph breaks instead of bullet points
- Keep responses conversational and readable
- No lists with asterisks or dashes
- Use the person's name naturally when appropriate

Respond to user questions about ${agent.project_name} based on the information above.
Be helpful, accurate, and match the personality style.`;

    let response: string = '';
    
    // Using gemini-2.5-flash-lite with paid tier (no rate limits)
    const models = [
      'gemini-2.5-flash-lite'  // Primary model with billing enabled
    ];
    
    for (const modelName of models) {
      console.log(`[AGENT-WEBHOOK] Trying model: ${modelName}`);
      
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: agent.temperature || 0.3, // Use agent's temperature or default
          topP: 0.8,               // Nucleus sampling - focus on most likely tokens
          topK: 40,                // Limit vocabulary to top 40 most likely tokens
          maxOutputTokens: 500,    // Prevent overly long responses
        }
      });
      
      // Retry logic with exponential backoff
      let retries = 4; // Increased retries for API overload
      let delay = 500; // Start with 500ms
      
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const result = await model.generateContent([
            systemPrompt,
            `User ${userName} says: ${userMessage}`,
            'Assistant:'
          ]);

          response = result.response.text();
          console.log(`[AGENT-WEBHOOK] Success with model: ${modelName}`);
          break; // Success, exit retry loop
          
        } catch (error: any) {
          console.error(`[AGENT-WEBHOOK] ${modelName} error (attempt ${attempt}/${retries}):`, error.message);
          
          if (attempt < retries && (error.message?.includes('503') || error.message?.includes('429') || error.message?.includes('overloaded'))) {
            console.log(`[AGENT-WEBHOOK] Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff: 500ms, 1s, 2s, 4s
          } else if (attempt === retries) {
            console.log(`[AGENT-WEBHOOK] All retries failed for ${modelName}, trying next model...`);
            break; // Try next model
          }
        }
      }
      
      if (response) break; // Got a response, exit model loop
    }
    
    // If all models failed, send fallback message
    if (!response) {
      response = `Hey! 👋 I'm having a bit of trouble right now (API overload). Could you try asking again in a moment? Thanks for your patience!`;
      console.log(`[AGENT-WEBHOOK] All models failed, using fallback message`);
    }

    // Send response via Telegram
    await sendTelegramMessage(agent.bot_token, chatId, response);

    // Update message count (last_interaction already updated above)
    await supabase
      .from('telegram_agents')
      .update({ 
        message_count: (agent.message_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId);

    return res.status(200).json({ ok: true });

  } catch (error: any) {
    console.error('[AGENT-WEBHOOK] Error:', error);
    return res.status(200).json({ ok: true }); // Always return 200 to Telegram
  }
}

async function sendTelegramMessage(botToken: string, chatId: number, text: string) {
  // Clean up markdown formatting
  const cleanText = text
    .replace(/\*\*\*/g, '')     // Remove bold+italic ***
    .replace(/\*\*/g, '')       // Remove bold **
    .replace(/\*/g, '')         // Remove italic *
    .replace(/___/g, '')        // Remove underline ___
    .replace(/__/g, '')         // Remove underline __
    .replace(/_/g, '')          // Remove underline _
    .replace(/~~~/g, '')        // Remove strikethrough
    .replace(/~~/g, '')         // Remove strikethrough
    .replace(/```[^`]*```/g, '') // Remove code blocks
    .replace(/`/g, '')          // Remove inline code
    .trim();
  
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: cleanText
      // Removed parse_mode to send as plain text
    })
  });
}

function getPersonalityPrompt(personality: string): string {
  const personalities: Record<string, string> = {
    funny: 'Be humorous with 1-2 emojis per response, make jokes while staying helpful. Keep it conversational and natural. Vary your greetings - use different openings instead of repeating "Hey there".',
    professional: 'Be formal, precise, and business-oriented. Minimal or no emojis.',
    technical: 'Use technical language, provide detailed explanations. No emojis.',
    casual: 'Be friendly, conversational, and approachable. Use 1-2 emojis maximum. Vary your greetings.'
  };
  return personalities[personality] || personalities.casual;
}

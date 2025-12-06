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
    
    console.log('[AGENT-WEBHOOK] Received message:', { chatId, userMessage, userName });

    // For now, we need to get the agent by bot_token
    // Since Telegram doesn't send the bot token in updates, we'll use a query parameter
    const agentId = req.query.agentId as string;
    
    if (!agentId) {
      console.error('[AGENT-WEBHOOK] No agentId provided');
      return res.status(400).json({ error: 'Agent ID required' });
    }

    // Load agent configuration from Supabase
    const { data: agent, error: agentError } = await supabase
      .from('telegram_agents')
      .select('*')
      .eq('id', agentId)
      .single();

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

    // Save the incoming message FIRST so we can check conversation history
    const messageTimestamp = new Date().toISOString();
    await supabase.from('agent_messages').insert({
      agent_id: agentId,
      user_id: userId,
      message: userMessage,
      response: '', // Will update after generation
      created_at: messageTimestamp
    });

    // Check if we should greet this user (once per day)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const { data: messages } = await supabase
      .from('agent_messages')
      .select('created_at')
      .eq('agent_id', agentId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(2); // Get last 2 to check if this is first message today
    
    // Check if there's a message from today BEFORE this one
    const shouldGreet = !messages || messages.length < 2 || 
      new Date(messages[1].created_at).toISOString().split('T')[0] !== today;
    
    console.log('[AGENT-WEBHOOK] Messages count:', messages?.length, 'Should greet:', shouldGreet);

    // Generate response using Gemini with fallback models
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY!);
    
    const greetingInstruction = shouldGreet 
      ? `This is the first interaction with ${userName} today. Start with a friendly greeting using their name, then answer their question.`
      : `${userName} has already been greeted today. Don't greet them again - just answer their question naturally. You can use their name in the response, but don't say hello/hi/hey again.`;
    
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
    
    // Try multiple models in order: primary -> fallback
    const models = ['gemini-2.5-flash-lite', 'gemini-2.5-flash-lite-preview'];
    
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

    // Update the message with the response
    await supabase
      .from('agent_messages')
      .update({ response: response })
      .eq('agent_id', agentId)
      .eq('user_id', userId)
      .eq('created_at', messageTimestamp);

    // Update message count
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

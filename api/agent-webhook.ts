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
    const userId = message.from?.id || chatId; // Telegram user ID
    
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
    
    // Handle both structured and raw content formats
    let knowledgeBaseText = '';
    if (knowledgeBase.rawContent) {
      // If only raw content exists, use it directly
      knowledgeBaseText = knowledgeBase.rawContent;
      console.log('[AGENT-WEBHOOK] Using raw content knowledge base, length:', knowledgeBaseText.length);
      console.log('[AGENT-WEBHOOK] KB Preview:', knowledgeBaseText.slice(0, 300));
    } else {
      // If structured data exists, format it
      knowledgeBaseText = JSON.stringify(knowledgeBase, null, 2);
      console.log('[AGENT-WEBHOOK] Using structured knowledge base, length:', knowledgeBaseText.length);
    }
    
    if (!knowledgeBaseText || knowledgeBaseText.length < 100) {
      console.error('[AGENT-WEBHOOK] WARNING: Knowledge base is empty or too small!', {
        hasKB: !!agent.knowledge_base,
        kbKeys: Object.keys(knowledgeBase),
        kbLength: knowledgeBaseText.length
      });
    }
    
    console.log('[AGENT-WEBHOOK] Config:', {
      personality: agent.personality,
      triggers,
      hasKnowledgeBase: Object.keys(knowledgeBase).length > 0,
      knowledgeBaseSize: knowledgeBaseText.length
    });
    
    // Respond to all messages for better conversation flow
    // Triggers are optional - if set, they act as hints but don't block responses
    console.log('[AGENT-WEBHOOK] Responding to message');

    // Smart greeting logic: Only greet if it's a new conversation
    // Use database last_interaction field (now exists in table)
    const conversationKey = `${agentId}_${userId}`;
    
    // Get last interaction from database
    const { data: agentData } = await supabase
      .from('telegram_agents')
      .select('last_interaction')
      .eq('id', agentId)
      .single();
    
    const lastInteractionTime = agentData?.last_interaction ? new Date(agentData.last_interaction).getTime() : 0;
    const nowTimestamp = Date.now();
    const timeSinceLastMessage = nowTimestamp - lastInteractionTime;
    const twelveHoursInMs = 12 * 60 * 60 * 1000; // 12 hours
    
    // Check if user is greeting or if it's been 12+ hours since last message
    const greetingWords = ['hi', 'hello', 'hey', 'sup', 'yo', 'greetings', 'good morning', 'good afternoon', 'good evening', 'gm', 'gn'];
    const isGreeting = greetingWords.some(word => userMessage.toLowerCase().trim().startsWith(word));
    const isNewSession = timeSinceLastMessage > twelveHoursInMs || lastInteractionTime === 0;
    
    const shouldGreet = isGreeting || isNewSession;
    
    // Update last interaction in database with error handling
    try {
      const { error: updateError } = await supabase
        .from('telegram_agents')
        .update({ last_interaction: new Date().toISOString() })
        .eq('id', agentId);
      
      if (updateError) {
        console.error('[AGENT-WEBHOOK] Failed to update last_interaction:', updateError);
      } else {
        console.log('[AGENT-WEBHOOK] Updated last_interaction for agent:', agentId);
      }
    } catch (err) {
      console.error('[AGENT-WEBHOOK] Exception updating last_interaction:', err);
    }
    
    // Get timezone-aware greeting (using local time, not UTC)
    const currentDateTime = new Date();
    const currentHour = currentDateTime.getHours(); // Local time, not UTC
    let timeGreeting = 'Hello';
    if (currentHour >= 5 && currentHour < 12) {
      timeGreeting = 'Good morning';
    } else if (currentHour >= 12 && currentHour < 18) {
      timeGreeting = 'Good afternoon';
    } else if (currentHour >= 18 && currentHour < 22) {
      timeGreeting = 'Good evening';
    } else {
      timeGreeting = 'Hey';
    }
    
    console.log('[AGENT-WEBHOOK] Greeting check:', {
      userId,
      agentId,
      isGreeting,
      isNewSession,
      shouldGreet,
      timeGreeting,
      lastInteraction: lastInteractionTime ? new Date(lastInteractionTime).toISOString() : 'never',
      timeSinceLastMessage: `${Math.round(timeSinceLastMessage / 1000 / 60)}min`,
      message: userMessage.slice(0, 50)
    });

    // Generate response using Gemini with fallback models
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY!);
    
    const greetingInstruction = shouldGreet 
      ? `This is the first interaction with ${userName} in this session. Start with "${timeGreeting}, ${userName}!" then answer their question naturally. After this greeting, DO NOT greet again in subsequent messages.`
      : `CRITICAL: This is an ONGOING conversation with ${userName}. They have ALREADY been greeted. DO NOT greet them again. DO NOT use ANY greeting words (hey, hi, hello, good morning/afternoon/evening). Start your response DIRECTLY with the answer. Be natural and conversational but skip all greetings.`;
    
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const systemPrompt = `You are ${agent.project_name}'s AI assistant.

PERSONALITY: ${personality}

GREETING RULE: ${greetingInstruction}

CURRENT DATE: ${currentDate} (Use this to determine if events are in the past, present, or future)

PROJECT INFORMATION:
${knowledgeBaseText}

WEBSITE: ${agent.website_url}

CUSTOM FAQS:
${agent.custom_faqs || 'None'}

ADDITIONAL INFO:
${agent.additional_info || 'None'}

CRITICAL INSTRUCTIONS:
- Read the PROJECT INFORMATION text carefully - all answers must come from this data
- Search for keywords related to the question:
  * For dates: Look for words like "presale", "sale", "launch", "start", quarters (Q1, Q2), month names
  * For prices: Look for "$", "price", "cap", "cost", "softcap", "hardcap"
  * For supply/tokenomics: Look for "supply", "distribution", "allocation", percentages
  * For roadmap: Look for timeline words, phases, quarters, dates
- If you find matching information, extract it EXACTLY as written
- ONLY answer with facts found in PROJECT INFORMATION
- If you cannot find the specific information asked about, respond: "I don't have that information. Check ${agent.website_url} for details."
- Do NOT make up, guess, or infer information not explicitly stated
- For future dates (after ${currentDate}), use future tense

FORMATTING RULES:
- NO markdown formatting (no *, **, ___, etc.)
- Use plain text only
- Maximum 2 emojis per response
- Keep responses conversational and concise (2-4 sentences)
- Use the person's name naturally when appropriate

Respond to user questions about ${agent.project_name} based on the information above.
Be helpful, accurate, and match the personality style.`;

    console.log('[AGENT-WEBHOOK] System prompt length:', systemPrompt.length);
    console.log('[AGENT-WEBHOOK] KB in prompt:', systemPrompt.includes('DEC 25') ? 'YES - Contains DEC 25' : 'NO - Missing presale data');
    console.log('[AGENT-WEBHOOK] User question:', userMessage);

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
    funny: `TRAITS:
- WITTY & ENTERTAINING: Use humor and playful language
- FRIENDLY: Approachable and fun to talk to
- LIGHTHEARTED: Don't take things too seriously
- ENGAGING: Keep conversations interesting with personality
- Use emojis naturally (2-3 per message)
- Make relevant jokes and references when appropriate

STYLE:
- Keep responses concise but entertaining (2-4 sentences usually)
- Use casual, conversational language
- Light jokes and wordplay when natural
- Be helpful while keeping it fun
- Greet warmly with timezone-appropriate greetings (Good morning/afternoon/evening)
- Don't repeat greetings in ongoing conversations

EXAMPLES:
- If someone corrects you: "Oops, my bad! Thanks for keeping me on track! 😅"
- For common questions: "Great question! Let me break it down for you..."
- For feedback: "Love the feedback! Helps me get better 🙌"`,

    professional: `TRAITS:
- PROFESSIONAL & COURTEOUS: Maintain business-appropriate tone
- PRECISE: Provide accurate, detailed information
- RESPECTFUL: Always polite and formal
- HELPFUL: Focus on delivering value
- Use emojis sparingly (1 per message max, only when appropriate)
- Maintain professional distance while being approachable

STYLE:
- Keep responses clear and structured (2-5 sentences)
- Use formal but friendly language
- Avoid slang and casual expressions
- Be thorough and informative
- Greet professionally with timezone-appropriate greetings (Good morning/afternoon/evening)
- Don't repeat greetings in ongoing conversations

EXAMPLES:
- If someone corrects you: "Thank you for the correction. I appreciate your attention to detail."
- For common questions: "Excellent question. Allow me to explain..."
- For feedback: "Thank you for your valuable feedback. It helps us improve our service."`,

    technical: `TRAITS:
- TECHNICAL & DETAILED: Use industry terminology appropriately
- PRECISE: Provide specific, accurate technical information
- EDUCATIONAL: Explain concepts thoroughly
- KNOWLEDGEABLE: Demonstrate expertise
- Use emojis minimally (technical symbols 🔧⚡ when relevant)
- Reference documentation and technical resources

STYLE:
- Keep responses detailed but structured (3-6 sentences)
- Use technical terminology appropriately
- Provide examples and explanations
- Break down complex concepts
- Greet efficiently with timezone-appropriate greetings
- Don't repeat greetings in ongoing conversations

EXAMPLES:
- If someone corrects you: "Correct. Thank you for the clarification on that technical detail."
- For common questions: "Let me explain the technical architecture..."
- For feedback: "Appreciated. I'll refine my technical accuracy based on this input."`,

    casual: `TRAITS:
- FRIENDLY & RELAXED: Easy-going and approachable
- CONVERSATIONAL: Like talking to a friend
- HELPFUL: Always ready to assist
- WARM: Genuinely friendly tone
- Use emojis naturally (1-2 per message)
- Keep things simple and relatable

STYLE:
- Keep responses friendly and concise (2-4 sentences)
- Use everyday language, avoid jargon
- Be warm and personable
- Make users feel comfortable
- Greet warmly with timezone-appropriate greetings (Good morning/afternoon/evening)
- Don't repeat greetings in ongoing conversations

EXAMPLES:
- If someone corrects you: "Thanks for letting me know! Appreciate it 👍"
- For common questions: "Sure thing! Here's what you need to know..."
- For feedback: "Thanks so much! Really helpful feedback 😊"`
  };
  return personalities[personality] || personalities.casual;
}

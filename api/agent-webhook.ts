import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * USER-CREATED TELEGRAM AGENTS WEBHOOK
 * 
 * This webhook handles ALL user-created paid Telegram AI agents.
 * Each agent is identified by the agentId query parameter.
 * 
 * Flow:
 * 1. Telegram sends update to: /api/agent-webhook?agentId=XXX
 * 2. We load agent config from Supabase
 * 3. Check subscription is active
 * 4. Generate AI response using agent's knowledge base
 * 5. Send response back to Telegram
 * 6. Log analytics
 */

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Personality presets - same quality as SmartSentinels bot
const PERSONALITY_PRESETS: Record<string, { prompt: string; temperature: number }> = {
  funny: {
    prompt: `PERSONALITY TRAITS:
- WITTY & ENTERTAINING: Use humor and playful language
- FRIENDLY: Approachable and fun to talk to
- LIGHTHEARTED: Don't take things too seriously
- ENGAGING: Keep conversations interesting with personality
- Use emojis naturally (2-3 per message)
- Make relevant jokes and references when appropriate

CONVERSATION STYLE:
- Keep responses concise but entertaining (2-4 sentences usually)
- Use casual, conversational language
- Light jokes and wordplay when natural
- Be helpful while keeping it fun

RESPONSE EXAMPLES:
- If someone corrects you: "Oops, my bad! Thanks for keeping me on track! 😅"
- For common questions: "Great question! Let me break it down for you..."
- For feedback: "Love the feedback! Helps me get better 🙌"`,
    temperature: 0.8
  },

  professional: {
    prompt: `PERSONALITY TRAITS:
- PROFESSIONAL & COURTEOUS: Maintain business-appropriate tone
- PRECISE: Provide accurate, detailed information
- RESPECTFUL: Always polite and formal
- HELPFUL: Focus on delivering value
- Use emojis sparingly (1 per message max, only when appropriate)
- Maintain professional distance while being approachable

CONVERSATION STYLE:
- Keep responses clear and structured (2-5 sentences)
- Use formal but friendly language
- Avoid slang and casual expressions
- Be thorough and informative

RESPONSE EXAMPLES:
- If someone corrects you: "Thank you for the correction. I appreciate your attention to detail."
- For common questions: "Excellent question. Allow me to explain..."
- For feedback: "Thank you for your valuable feedback. It helps us improve our service."`,
    temperature: 0.5
  },

  technical: {
    prompt: `PERSONALITY TRAITS:
- TECHNICAL & DETAILED: Use industry terminology appropriately
- PRECISE: Provide specific, accurate technical information
- EDUCATIONAL: Explain concepts thoroughly
- KNOWLEDGEABLE: Demonstrate expertise
- Use emojis minimally (technical symbols 🔧⚡ when relevant)
- Reference documentation and technical resources

CONVERSATION STYLE:
- Keep responses detailed but structured (3-6 sentences)
- Use technical terminology appropriately
- Provide examples and explanations
- Break down complex concepts

RESPONSE EXAMPLES:
- If someone corrects you: "Correct. Thank you for the clarification on that technical detail."
- For common questions: "Let me explain the technical architecture..."
- For feedback: "Appreciated. I'll refine my technical accuracy based on this input."`,
    temperature: 0.4
  },

  casual: {
    prompt: `PERSONALITY TRAITS:
- FRIENDLY & RELAXED: Easy-going and approachable
- CONVERSATIONAL: Like talking to a friend
- HELPFUL: Always ready to assist
- WARM: Genuinely friendly tone
- Use emojis naturally (1-2 per message)
- Keep things simple and relatable

CONVERSATION STYLE:
- Keep responses friendly and concise (2-4 sentences)
- Use everyday language, avoid jargon
- Be warm and personable
- Make users feel comfortable

RESPONSE EXAMPLES:
- If someone corrects you: "Thanks for letting me know! Appreciate it 👍"
- For common questions: "Sure thing! Here's what you need to know..."
- For feedback: "Thanks so much! Really helpful feedback 😊"`,
    temperature: 0.7
  },

  custom: {
    prompt: '', // Custom personality uses agent.custom_personality directly
    temperature: 0.6 // Default temperature for custom, can be overridden
  }
};

// Main webhook handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const update = req.body;
    const message = update.message || update.edited_message;

    if (!message) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat.id;
    const chatType = message.chat.type; // 'private', 'group', 'supergroup'
    const userMessage = message.text || '';
    const userName = message.from?.first_name || message.from?.username || 'there';
    const telegramUserId = message.from?.id || chatId;

    // Get agent ID from query parameter
    const agentId = req.query.agentId as string;

    if (!agentId) {
      console.error('[AGENT-WEBHOOK] No agentId provided');
      return res.status(400).json({ error: 'Agent ID required' });
    }

    console.log('[AGENT-WEBHOOK] ==========================================');
    console.log('[AGENT-WEBHOOK] Agent:', agentId);
    console.log('[AGENT-WEBHOOK] Chat:', chatId, 'Type:', chatType);
    console.log('[AGENT-WEBHOOK] User:', userName, 'Message:', userMessage?.slice(0, 50));

    // Load agent configuration
    const { data: agent, error: agentError } = await supabase
      .from('telegram_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      console.error('[AGENT-WEBHOOK] Agent not found:', agentError?.message);
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Check if agent is active
    if (agent.deployment_status !== 'active') {
      console.log('[AGENT-WEBHOOK] Agent not active:', agent.deployment_status);
      return res.status(200).json({ ok: true }); // Silent ignore
    }

    console.log('[AGENT-WEBHOOK] Project:', agent.project_name, 'Personality:', agent.personality);

    // ============================================
    // HANDLE NEW MEMBERS
    // ============================================
    if (message.new_chat_members && message.new_chat_members.length > 0) {
      await handleNewMembers(agent, chatId, message.new_chat_members);
      return res.status(200).json({ ok: true });
    }

    // Skip empty messages
    if (!userMessage.trim()) {
      return res.status(200).json({ ok: true });
    }

    // ============================================
    // CHECK SUBSCRIPTION
    // ============================================
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('agent_id', agentId)
      .eq('payment_status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!subscription || new Date(subscription.expiry_date) < new Date()) {
      console.log('[AGENT-WEBHOOK] Subscription expired for agent:', agentId);
      await sendTelegramMessage(
        agent.bot_token,
        chatId,
        '⚠️ This bot\'s subscription has expired. Please contact the project owner to renew.'
      );
      return res.status(200).json({ ok: true });
    }

    // ============================================
    // CHECK IF BOT SHOULD RESPOND
    // ============================================
    const botUsername = agent.bot_handle?.replace('@', '') || '';
    const isPrivateChat = chatType === 'private';
    const isMentioned = userMessage.includes(`@${botUsername}`);
    const matchesTrigger = checkTriggers(userMessage, agent.trigger_keywords || []);

    // In groups, only respond if mentioned or matches trigger
    // In private chats, always respond
    if (!isPrivateChat && !isMentioned && !matchesTrigger) {
      console.log('[AGENT-WEBHOOK] Skipping - not mentioned/triggered in group');
      return res.status(200).json({ ok: true });
    }

    // ============================================
    // GENERATE AI RESPONSE
    // ============================================
    const response = await generateResponse(agent, userName, userMessage, telegramUserId);

    // Send response
    await sendTelegramMessage(agent.bot_token, chatId, response, message.message_id);

    // ============================================
    // LOG ANALYTICS
    // ============================================
    const responseTime = Date.now() - startTime;
    
    try {
      await supabase.from('agent_messages').insert({
        agent_id: agentId,
        telegram_user_id: telegramUserId,
        user_message: userMessage.slice(0, 1000), // Limit stored message
        bot_response: response.slice(0, 2000), // Limit stored response
        response_time_ms: responseTime,
        created_at: new Date().toISOString()
      });

      await supabase
        .from('telegram_agents')
        .update({ 
          message_count: (agent.message_count || 0) + 1,
          last_interaction: new Date().toISOString()
        })
        .eq('id', agentId);

      console.log('[AGENT-WEBHOOK] Analytics logged, response time:', responseTime, 'ms');
    } catch (logError) {
      console.error('[AGENT-WEBHOOK] Failed to log analytics:', logError);
    }

    return res.status(200).json({ ok: true });

  } catch (error: any) {
    console.error('[AGENT-WEBHOOK] Error:', error);
    // Always return 200 to prevent Telegram from retrying
    return res.status(200).json({ ok: true });
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if message matches any trigger keywords
 */
function checkTriggers(message: string, triggers: string[]): boolean {
  if (!triggers || triggers.length === 0) return true; // No triggers = respond to all
  
  const lowerMessage = message.toLowerCase();
  return triggers.some(trigger => lowerMessage.includes(trigger.toLowerCase()));
}

/**
 * Handle new members joining the group
 */
async function handleNewMembers(agent: any, chatId: number, members: any[]) {
  const welcomeTemplates = [
    `Welcome to ${agent.project_name}, {name}! 🎉 I'm here to answer your questions about the project. Feel free to ask me anything!`,
    `Hey {name}! 👋 Welcome aboard! I'm the ${agent.project_name} assistant - ask me anything about the project!`,
    `{name} just joined! 🚀 Welcome to ${agent.project_name}! I'm the AI assistant here to help. What would you like to know?`
  ];

  for (const member of members) {
    if (member.is_bot) continue; // Don't welcome bots

    const name = member.username ? `@${member.username}` : member.first_name;
    const template = welcomeTemplates[Math.floor(Math.random() * welcomeTemplates.length)];
    const welcomeMessage = template.replace('{name}', name);

    await sendTelegramMessage(agent.bot_token, chatId, welcomeMessage);
    console.log('[AGENT-WEBHOOK] Welcomed new member:', name);
  }
}

/**
 * Generate AI response using Gemini
 */
async function generateResponse(agent: any, userName: string, userMessage: string, userId: number): Promise<string> {
  const geminiApiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!geminiApiKey) {
    console.error('[AGENT-WEBHOOK] Missing Gemini API key');
    return "I'm having trouble connecting right now. Please try again later!";
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);

  // Build knowledge base content
  const knowledgeBase = agent.knowledge_base || {};
  let knowledgeContent = '';
  
  if (knowledgeBase.rawContent) {
    knowledgeContent = knowledgeBase.rawContent;
  } else if (Object.keys(knowledgeBase).length > 0) {
    knowledgeContent = formatKnowledgeBase(knowledgeBase);
  }

  // Get personality preset
  const personalityKey = agent.personality || 'casual';
  const preset = PERSONALITY_PRESETS[personalityKey] || PERSONALITY_PRESETS.casual;
  
  // For 'custom' personality, use custom_personality text. Otherwise use preset.
  let personalityPrompt: string;
  if (personalityKey === 'custom' && agent.custom_personality) {
    personalityPrompt = `CUSTOM PERSONALITY INSTRUCTIONS:\n${agent.custom_personality}`;
  } else if (agent.custom_personality) {
    // If custom_personality is set but personality is not 'custom', still honor it
    personalityPrompt = agent.custom_personality;
  } else {
    personalityPrompt = preset.prompt;
  }
  
  // Use agent's temperature setting, fallback to preset
  const temperature = agent.temperature ?? preset.temperature;

  // Get current date for context
  const currentDate = new Date().toISOString().split('T')[0];

  console.log('[AGENT-WEBHOOK] Using personality:', personalityKey, 'Temperature:', temperature);
  console.log('[AGENT-WEBHOOK] Knowledge base content length:', knowledgeContent.length);
  console.log('[AGENT-WEBHOOK] Knowledge base preview (first 500 chars):', knowledgeContent.slice(0, 500));

  // Build system prompt - ULTRA STRICT about factual accuracy
  const systemPrompt = `You are the AI assistant for ${agent.project_name}.

${personalityPrompt}

CURRENT DATE: ${currentDate}

=== YOUR KNOWLEDGE BASE (PRIMARY SOURCE OF TRUTH) ===
${knowledgeContent || 'No specific knowledge base provided.'}
=== END KNOWLEDGE BASE ===

WEBSITE: ${agent.website_url || 'Not provided'}

CUSTOM FAQS:
${agent.custom_faqs || 'None provided'}

ADDITIONAL INFO:
${agent.additional_info || 'None provided'}

CRITICAL RULES FOR ACCURACY (MUST FOLLOW):
1. CHECK "ADDITIONAL INFO" FIRST - This contains manually-added critical info like presale dates and social links
2. EXTRACT EXACT INFORMATION from the knowledge base - do NOT paraphrase dates, numbers, or specific details
3. For DATE questions: Check Additional Info first, then KEY DATES section, then search for specific dates like "Dec 25", "Jan 15", "Q1 2026"
4. For PRESALE/TOKEN SALE: Look for phrases like "Token Sale", "Presale", specific dates - quote the EXACT dates found
5. DO NOT confuse different phases - "Discovery Phase" and "Token Sale" are DIFFERENT events with DIFFERENT dates
6. If the knowledge base says something happens on a specific date, say THAT date - not "NOW" or "soon"
7. If you don't find the exact information, say "I couldn't find that specific detail in my knowledge base"
8. Never give financial advice or price predictions
9. Keep responses concise (2-4 sentences usually)
10. Only share URLs that exist in your knowledge base - NEVER make up URLs
11. Stay in character with your personality while being FACTUALLY ACCURATE

EXAMPLE OF CORRECT BEHAVIOR:
- If KB says "DEC 25 Dec 25 - Jan 15 Token Sale" and user asks "when is presale?"
- CORRECT: "The Token Sale runs from December 25th to January 15th!"
- WRONG: "The presale is happening NOW!" (This confuses phases)

Remember: ACCURACY comes first, personality second. Extract exact data from your knowledge base!`;

  // Cap temperature at 0.3 max for STRICT factual accuracy (user's high temps cause hallucinations)
  const effectiveTemperature = Math.min(temperature, 0.3);
  
  console.log('[AGENT-WEBHOOK] Requested temp:', temperature, 'Effective temp:', effectiveTemperature);

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: effectiveTemperature,
        topP: 0.8, // Reduced from 0.9 for more focused responses
        topK: 40,  // Limit vocabulary for accuracy
        maxOutputTokens: 800
      }
    });

    const chat = model.startChat({
      history: [],
      generationConfig: {
        temperature: effectiveTemperature,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 800
      }
    });

    // Send system prompt first, then user message
    await chat.sendMessage(systemPrompt);
    const result = await chat.sendMessage(`${userName} asks: ${userMessage}`);
    
    return result.response.text();

  } catch (error: any) {
    console.error('[AGENT-WEBHOOK] Gemini error:', error);
    
    // Retry with fallback
    if (error.message?.includes('503') || error.message?.includes('overloaded')) {
      return "I'm a bit busy right now! 😅 Please try again in a moment.";
    }
    
    return "Oops! I had a little hiccup. Can you try asking that again?";
  }
}

/**
 * Format knowledge base object into readable text
 */
function formatKnowledgeBase(kb: Record<string, any>): string {
  const sections: string[] = [];

  if (kb.description) {
    sections.push(`PROJECT DESCRIPTION:\n${kb.description}`);
  }

  // IMPORTANT: Key dates should be at the top for easy reference
  if (kb.keyDates) {
    const dates = kb.keyDates;
    let dateText = 'KEY DATES (IMPORTANT - USE THESE FOR DATE QUESTIONS):';
    if (dates.presaleStart) dateText += `\n- Presale/Token Sale STARTS: ${dates.presaleStart}`;
    if (dates.presaleEnd) dateText += `\n- Presale/Token Sale ENDS: ${dates.presaleEnd}`;
    if (dates.tokenLaunch) dateText += `\n- Token Launch/Trading: ${dates.tokenLaunch}`;
    if (dates.mainnetLaunch) dateText += `\n- Mainnet Launch: ${dates.mainnetLaunch}`;
    sections.push(dateText);
  }

  if (kb.features && kb.features.length > 0) {
    sections.push(`KEY FEATURES:\n${kb.features.map((f: string) => `- ${f}`).join('\n')}`);
  }

  if (kb.tokenomics) {
    const tokenomics = typeof kb.tokenomics === 'string' 
      ? kb.tokenomics 
      : JSON.stringify(kb.tokenomics, null, 2);
    sections.push(`TOKENOMICS:\n${tokenomics}`);
  }

  if (kb.presale) {
    const presale = typeof kb.presale === 'string' 
      ? kb.presale 
      : JSON.stringify(kb.presale, null, 2);
    sections.push(`PRESALE INFO:\n${presale}`);
  }

  if (kb.roadmap && kb.roadmap.length > 0) {
    // Format roadmap properly - it might be objects or strings
    const roadmapText = kb.roadmap.map((r: any) => {
      if (typeof r === 'string') return `- ${r}`;
      if (r.phase && r.date) return `- ${r.phase} (${r.date}): ${r.items?.join(', ') || ''}`;
      return `- ${JSON.stringify(r)}`;
    }).join('\n');
    sections.push(`ROADMAP:\n${roadmapText}`);
  }

  if (kb.team) {
    const teamText = Array.isArray(kb.team) ? kb.team.join(', ') : kb.team;
    sections.push(`TEAM:\n${teamText}`);
  }

  if (kb.socialLinks) {
    sections.push(`SOCIAL LINKS:\n${JSON.stringify(kb.socialLinks, null, 2)}`);
  }

  if (kb.faqs && kb.faqs.length > 0) {
    const faqText = kb.faqs.map((faq: any) => `Q: ${faq.q || faq.question}\nA: ${faq.a || faq.answer}`).join('\n\n');
    sections.push(`FAQs:\n${faqText}`);
  }

  if (kb.whitepaper) {
    const wp = typeof kb.whitepaper === 'string' 
      ? kb.whitepaper 
      : JSON.stringify(kb.whitepaper, null, 2);
    sections.push(`WHITEPAPER INFO:\n${wp}`);
  }

  // Include raw content as backup if available
  if (kb.rawContent && sections.length < 3) {
    sections.push(`RAW WEBSITE CONTENT:\n${kb.rawContent.slice(0, 10000)}`);
  }

  return sections.join('\n\n');
}

/**
 * Send message via Telegram API
 */
async function sendTelegramMessage(
  botToken: string, 
  chatId: number, 
  text: string, 
  replyToMessageId?: number
): Promise<void> {
  // Clean markdown to avoid formatting issues
  const cleanText = text
    .replace(/\*\*\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/___/g, '')
    .replace(/__/g, '')
    .replace(/```[^`]*```/g, '')
    .replace(/`/g, '')
    .trim();

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: cleanText,
        reply_to_message_id: replyToMessageId
      })
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('[AGENT-WEBHOOK] Telegram API error:', data.description);
    }
  } catch (error) {
    console.error('[AGENT-WEBHOOK] Failed to send message:', error);
  }
}

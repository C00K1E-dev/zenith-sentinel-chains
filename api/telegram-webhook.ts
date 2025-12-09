import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createTelegramBot } from '../src/services/telegramBot.js';
import { createUserTelegramAgent } from '../src/services/userTelegramAgent.js';
import { createClient } from '@supabase/supabase-js';

// Vercel serverless function to handle Telegram webhooks
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log incoming update for debugging
    const update = req.body;
    const chatId = update.message?.chat?.id;
    const messageText = update.message?.text;
    const fromUser = update.message?.from?.username || update.message?.from?.first_name;
    
    console.log('[WEBHOOK] ==========================================');
    console.log('[WEBHOOK] Incoming update - Chat ID:', chatId, 'From:', fromUser, 'Message:', messageText);
    console.log('[WEBHOOK] Query params:', JSON.stringify(req.query));
    
    // Check if this is a user-created agent (has agent_id param)
    const agentId = req.query.agent_id as string;
    
    if (agentId) {
      // USER-CREATED AGENT FLOW
      console.log('[WEBHOOK] Routing to USER AGENT:', agentId);
      
      // Initialize Supabase client
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY!
      );

      // Load agent config from database
      const { data: agent, error: agentError } = await supabase
        .from('telegram_agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (agentError || !agent) {
        console.error('[WEBHOOK] Agent not found:', agentId);
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Check if agent is deployed
      if (agent.deployment_status !== 'deployed') {
        console.error('[WEBHOOK] Agent not deployed:', agentId, agent.deployment_status);
        return res.status(400).json({ error: 'Agent not deployed' });
      }

      const geminiApiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error('Missing Gemini API key');
      }

      // Create user agent instance with agent-specific config
      const bot = createUserTelegramAgent(
        agent.bot_token,
        geminiApiKey,
        {
          personality: agent.personality,
          temperature: agent.temperature,
          knowledgeBase: agent.knowledge_base,
          projectName: agent.project_name
        }
      );

      // Handle the incoming update
      const update = req.body;
      const startTime = Date.now();
      
      const result = await bot.handleUpdate(update);
      
      const responseTime = Date.now() - startTime;

      // Log message to agent_messages for analytics
      if (result && update.message?.text) {
        try {
          await supabase
            .from('agent_messages')
            .insert({
              agent_id: agentId,
              telegram_user_id: update.message.from.id,
              user_message: result.userMessage,
              bot_response: result.botResponse,
              response_time_ms: responseTime,
              created_at: new Date().toISOString()
            });
          console.log('[WEBHOOK] Message logged to analytics');
        } catch (logError) {
          console.error('[WEBHOOK] Failed to log message:', logError);
        }
      }

      // Update message count
      await supabase
        .from('telegram_agents')
        .update({ message_count: (agent.message_count || 0) + 1 })
        .eq('id', agentId);

      return res.status(200).json({ ok: true });
      
    } else {
      // SMARTSENTINELS COMMUNITY BOT FLOW (original)
      console.log('[WEBHOOK] ==========================================');
      console.log('[WEBHOOK] Routing to SMARTSENTINELS COMMUNITY BOT');
      console.log('[WEBHOOK] Chat ID:', chatId, 'From:', fromUser, 'Message:', messageText);
      
      const botToken = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
      const geminiApiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

      if (!botToken || !geminiApiKey) {
        console.error('Missing required environment variables');
        return res.status(500).json({ error: 'Server configuration error' });
      }

      // Create SmartSentinels bot instance
      const bot = createTelegramBot(botToken, geminiApiKey);

      // Handle the update
      const update = req.body;
      await bot.handleUpdate(update);

      return res.status(200).json({ ok: true });
    }
  } catch (error) {
    console.error('[WEBHOOK] Webhook error:', error);
    // Still return 200 to prevent Telegram from retrying
    return res.status(200).json({ ok: true });
  }
}

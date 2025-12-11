import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createTelegramBot } from '../src/services/telegramBot.js';

/**
 * SMARTSENTINELS COMMUNITY BOT WEBHOOK
 * This webhook ONLY handles the main SmartSentinels community bot
 * User-created agents use /api/agent-webhook instead
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    const chatId = update.message?.chat?.id;
    const messageText = update.message?.text;
    const fromUser = update.message?.from?.username || update.message?.from?.first_name;
    
    console.log('[SMARTSENTINELS-BOT] ==========================================');
    console.log('[SMARTSENTINELS-BOT] Chat ID:', chatId, 'From:', fromUser, 'Message:', messageText?.slice(0, 50));
    
    const botToken = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const geminiApiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!botToken || !geminiApiKey) {
      console.error('[SMARTSENTINELS-BOT] Missing required environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Create SmartSentinels bot instance and handle update
    const bot = createTelegramBot(botToken, geminiApiKey);
    await bot.handleUpdate(update);

    return res.status(200).json({ ok: true });
    
  } catch (error) {
    console.error('[SMARTSENTINELS-BOT] Webhook error:', error);
    // Always return 200 to prevent Telegram from retrying
    return res.status(200).json({ ok: true });
  }
}

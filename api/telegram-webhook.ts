import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createTelegramBot } from '../src/services/telegramBot.js';
import { createTelegramBotBeta } from '../src/services/telegramBot2.js';

/**
 * SMARTSENTINELS COMMUNITY BOTS WEBHOOK
 * Handles BOTH Alpha and Beta bots
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
    
    console.log('[SMARTSENTINELS-BOTS] ==========================================');
    console.log('[SMARTSENTINELS-BOTS] Chat ID:', chatId, 'From:', fromUser, 'Message:', messageText?.slice(0, 50));
    
    const alphaToken = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const betaToken = process.env.VITE_TELEGRAM_BOT_TOKEN_BETA || process.env.TELEGRAM_BOT_TOKEN_BETA;
    const geminiApiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!alphaToken || !betaToken || !geminiApiKey) {
      console.error('[SMARTSENTINELS-BOTS] Missing required environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Handle both bots in parallel - they'll decide internally if they should respond
    const alphaBot = createTelegramBot(alphaToken, geminiApiKey);
    const betaBot = createTelegramBotBeta(betaToken, geminiApiKey);
    
    await Promise.all([
      alphaBot.handleUpdate(update),
      betaBot.handleUpdate(update)
    ]);

    return res.status(200).json({ ok: true });
    
  } catch (error) {
    console.error('[SMARTSENTINELS-BOTS] Webhook error:', error);
    // Always return 200 to prevent Telegram from retrying
    return res.status(200).json({ ok: true });
  }
}

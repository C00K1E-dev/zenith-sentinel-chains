import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createTelegramBot } from '../src/services/telegramBot.js';
import { createTelegramBotBeta } from '../src/services/telegramBot2.js';

/**
 * SMARTSENTINELS COMMUNITY BOTS WEBHOOK
 * 
 * Each bot has its own webhook URL:
 * - Alpha: /api/telegram-webhook?bot=alpha
 * - Beta: /api/telegram-webhook?bot=beta
 * 
 * User-created agents use /api/agent-webhook instead
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    const botParam = req.query.bot as string; // 'alpha' or 'beta'
    
    const chatId = update.message?.chat?.id;
    const messageText = update.message?.text;
    const fromUser = update.message?.from?.username || update.message?.from?.first_name;
    
    console.log(`[WEBHOOK] Bot: ${botParam} | Chat: ${chatId} | From: ${fromUser} | Msg: ${messageText?.slice(0, 50)}`);
    
    const alphaToken = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const betaToken = process.env.VITE_TELEGRAM_BOT_TOKEN_BETA || process.env.TELEGRAM_BOT_TOKEN_BETA;
    const geminiApiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!alphaToken || !betaToken || !geminiApiKey) {
      console.error('[WEBHOOK] Missing required environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Only process the bot that this webhook is for
    if (botParam === 'alpha') {
      const alphaBot = createTelegramBot(alphaToken, geminiApiKey);
      await alphaBot.handleUpdate(update);
    } else if (botParam === 'beta') {
      const betaBot = createTelegramBotBeta(betaToken, geminiApiKey);
      await betaBot.handleUpdate(update);
    } else {
      // Legacy: no param = process both (for backwards compatibility during transition)
      console.log('[WEBHOOK] No bot param - processing both (legacy mode)');
      const alphaBot = createTelegramBot(alphaToken, geminiApiKey);
      const betaBot = createTelegramBotBeta(betaToken, geminiApiKey);
      await Promise.all([
        alphaBot.handleUpdate(update),
        betaBot.handleUpdate(update)
      ]);
    }

    return res.status(200).json({ ok: true });
    
  } catch (error) {
    console.error('[WEBHOOK] Error:', error);
    // Always return 200 to prevent Telegram from retrying
    return res.status(200).json({ ok: true });
  }
}

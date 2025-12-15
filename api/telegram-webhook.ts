import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createTelegramBot } from '../src/services/telegramBot.js';
import { createTelegramBotBeta } from '../src/services/telegramBot2.js';

/**
 * SMARTSENTINELS COMMUNITY BOTS WEBHOOK
 * Handles BOTH Alpha and Beta bots
 * User-created agents use /api/agent-webhook instead
 */
// Singleton bot instances to avoid re-initialization on every request
let alphaBot: any = null;
let betaBot: any = null;
let initPromise: Promise<void> | null = null;

async function initializeBots() {
  const alphaToken = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const betaToken = process.env.VITE_TELEGRAM_BOT_TOKEN_BETA || process.env.TELEGRAM_BOT_TOKEN_BETA;
  const geminiApiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!alphaToken || !betaToken || !geminiApiKey) {
    throw new Error('Missing required environment variables');
  }

  alphaBot = createTelegramBot(alphaToken, geminiApiKey);
  betaBot = createTelegramBotBeta(betaToken, geminiApiKey);
  
  await Promise.all([
    alphaBot.initialize(),
    betaBot.initialize()
  ]);
  
  console.log('[SMARTSENTINELS-BOTS] Bots initialized successfully');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'ready' });
  }

  try {
    // Initialize bots on first request
    if (!alphaBot || !betaBot) {
      if (!initPromise) {
        initPromise = initializeBots().catch(e => {
          console.error('[SMARTSENTINELS-BOTS] Initialization failed:', e);
          initPromise = null;
        });
      }
      await initPromise;
    }

    const update = req.body;
    const chatId = update.message?.chat?.id;
    const messageText = update.message?.text;
    const fromUser = update.message?.from?.username || update.message?.from?.first_name;
    
    console.log('[SMARTSENTINELS-BOTS] Chat ID:', chatId, 'From:', fromUser, 'Message:', messageText?.slice(0, 50));

    // Handle the update with both bots
    await Promise.all([
      alphaBot?.handleUpdate(update).catch((e: any) => console.error('[ALPHA] Error:', e)),
      betaBot?.handleUpdate(update).catch((e: any) => console.error('[BETA] Error:', e))
    ]);

    return res.status(200).json({ ok: true });
    
  } catch (error) {
    console.error('[SMARTSENTINELS-BOTS] Webhook error:', error);
    return res.status(200).json({ ok: true });
  }
}

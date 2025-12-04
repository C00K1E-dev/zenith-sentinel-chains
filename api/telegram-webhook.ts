import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createTelegramBot } from '../src/services/telegramBot.js';

// Vercel serverless function to handle Telegram webhooks
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get environment variables (use VITE_ prefix for consistency)
    const botToken = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const geminiApiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!botToken || !geminiApiKey) {
      console.error('Missing required environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Create bot instance
    const bot = createTelegramBot(botToken, geminiApiKey);

    // Handle the update
    const update = req.body;
    await bot.handleUpdate(update);

    // Respond to Telegram immediately
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Still return 200 to prevent Telegram from retrying
    return res.status(200).json({ ok: true });
  }
}

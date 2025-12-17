import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createTelegramBot } from '../src/services/telegramBot.js';
import { createTelegramBotBeta } from '../src/services/telegramBot2.js';

/**
 * SMARTSENTINELS COMMUNITY BOTS WEBHOOK
 * 
 * Both Alpha and Beta bots share a SINGLE webhook URL:
 * - /api/telegram-webhook (no bot param needed)
 * 
 * This allows Beta to see Alpha's messages and defend users when Alpha roasts!
 * 
 * User-created agents use /api/agent-webhook instead
 */

// Roast detection helper
function isRoastMessage(text: string): boolean {
  if (!text || text.length < 10) return false;
  
  const lowerText = text.toLowerCase();
  
  // Emoji detection
  const hasSkullEmoji = text.includes('💀');
  const hasClownEmoji = text.includes('🤡');
  const hasFacepalmEmoji = text.includes('🤦');
  const hasTrophyEmoji = text.includes('🏆');
  const hasLaughEmoji = text.includes('😂');
  
  // Roast keywords
  const roastKeywords = [
    'smooth brain', 'dumb', 'clown', 'ngmi', 'skill issue', 'paper hands',
    'weak hands', 'do some research', 'read the whitepaper', 'brain buffer',
    'come on now', 'my guy', 'did you forget', 'try to keep up',
    'revolutionary concept', 'yolo', 'quick flip', 'asking the same',
    'again?', 'genius who thinks', 'another genius', 'pump-and-dump',
    'shitcoin', 'pretty logo', 'floods the exchanges', 'before we\'ve even built',
    'listing site', 'checks notes', 'keyboard get stuck', 'echo chamber',
    'participation trophy', 'buddy', 'pal', 'get your head out',
    'confused questions', 'spewing empty promises', 'waiting for a while',
    'unplug your', 'burns electricity', 'decided to grace', 'grace us with'
  ];
  
  const hasRoastKeyword = roastKeywords.some(keyword => lowerText.includes(keyword));
  
  // Sarcastic long response detection
  const isSarcasticLong = text.length > 80 && (
    lowerText.includes('another') || lowerText.includes('oh look') || 
    lowerText.includes('genius') || lowerText.includes('forget') || 
    lowerText.includes('my guy') || lowerText.includes('buddy') || lowerText.includes('pal')
  );
  
  return hasSkullEmoji || hasClownEmoji || hasFacepalmEmoji || hasTrophyEmoji || 
         hasRoastKeyword || isSarcasticLong || 
         (hasLaughEmoji && (lowerText.includes('?') || lowerText.includes('question')));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    const botParam = req.query.bot as string; // 'alpha' or 'beta' (optional now)
    
    const chatId = update.message?.chat?.id;
    const messageText = update.message?.text || '';
    const fromUser = update.message?.from?.username || update.message?.from?.first_name;
    const fromId = update.message?.from?.id;
    const messageId = update.message?.message_id;
    
    console.log(`[WEBHOOK] Bot: ${botParam || 'shared'} | Chat: ${chatId} | From: ${fromUser} (${fromId}) | Msg: ${messageText?.slice(0, 50)}`);
    
    const alphaToken = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const betaToken = process.env.VITE_TELEGRAM_BOT_TOKEN_BETA || process.env.TELEGRAM_BOT_TOKEN_BETA;
    const geminiApiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!alphaToken || !betaToken || !geminiApiKey) {
      console.error('[WEBHOOK] Missing required environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const ALPHA_BOT_ID = 8511436060;
    const BETA_BOT_ID = 8580335193;

    // Route based on bot param if provided
    if (botParam === 'alpha') {
      const alphaBot = createTelegramBot(alphaToken, geminiApiKey);
      await alphaBot.handleUpdate(update);
      
      // Check if Alpha just sent a roast - trigger Beta to defend!
      // We need to watch Alpha's RESPONSES, not incoming messages
      // This is handled by Alpha notifying us when it roasts
      
    } else if (botParam === 'beta') {
      const betaBot = createTelegramBotBeta(betaToken, geminiApiKey);
      await betaBot.handleUpdate(update);
      
    } else {
      // Shared webhook mode - BOTH bots see ALL messages
      // This is the key to making Beta defend against Alpha's roasts!
      console.log('[WEBHOOK] Shared mode - processing for both bots');
      
      const alphaBot = createTelegramBot(alphaToken, geminiApiKey);
      const betaBot = createTelegramBotBeta(betaToken, geminiApiKey);
      
      // Skip bot's own messages
      if (fromId === ALPHA_BOT_ID || fromId === BETA_BOT_ID) {
        console.log('[WEBHOOK] Skipping bot message');
        return res.status(200).json({ ok: true });
      }
      
      // Let both bots process the message (they have their own logic to decide if they respond)
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

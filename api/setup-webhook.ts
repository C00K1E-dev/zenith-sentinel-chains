import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Setup Telegram webhook for an agent
 * This connects the Telegram bot to our webhook endpoint
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { botToken, agentId } = req.body;

    if (!botToken || !agentId) {
      return res.status(400).json({ error: 'Missing botToken or agentId' });
    }

    // Get the webhook URL (your Vercel deployment URL)
    const webhookUrl = `${process.env.VERCEL_URL || 'https://zenith-sentinel.vercel.app'}/api/telegram-webhook?agentId=${agentId}`;

    console.log('[WEBHOOK] Setting webhook:', { agentId, webhookUrl });

    // Set the webhook on Telegram
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message'],
        drop_pending_updates: true
      })
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('[WEBHOOK] Failed to set webhook:', data);
      return res.status(500).json({ 
        error: 'Failed to set webhook', 
        details: data.description 
      });
    }

    console.log('[WEBHOOK] Webhook set successfully:', data);

    // Get bot info to verify
    const botInfoUrl = `https://api.telegram.org/bot${botToken}/getMe`;
    const botInfoResponse = await fetch(botInfoUrl);
    const botInfo = await botInfoResponse.json();

    return res.status(200).json({
      success: true,
      webhook_url: webhookUrl,
      bot_info: botInfo.result,
      message: `Webhook set successfully for @${botInfo.result.username}`
    });

  } catch (error: any) {
    console.error('[WEBHOOK] Setup error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}

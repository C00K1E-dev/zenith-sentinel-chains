import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Re-webhook endpoint to update existing agent webhooks
 * Fixes agents that were registered with /api/telegram-webhook
 * and need to be pointed to /api/agent-webhook
 */
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID required' });
    }

    // Get agent from database
    const { data: agent, error: agentError } = await supabase
      .from('telegram_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    if (!agent.bot_token) {
      return res.status(400).json({ error: 'Agent has no bot token' });
    }

    // New webhook URL pointing to agent-webhook
    const newWebhookUrl = `https://smartsentinels.net/api/agent-webhook?agentId=${agentId}`;

    console.log('[RE-WEBHOOK] Updating webhook for agent:', {
      agentId,
      project_name: agent.project_name,
      newWebhookUrl
    });

    // Set the webhook on Telegram
    const telegramApiUrl = `https://api.telegram.org/bot${agent.bot_token}/setWebhook`;
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: newWebhookUrl,
        allowed_updates: ['message'],
        drop_pending_updates: true
      })
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('[RE-WEBHOOK] Failed to set webhook:', data);
      return res.status(500).json({
        error: 'Failed to set webhook',
        details: data.description
      });
    }

    // Update database with new webhook URL
    const { error: updateError } = await supabase
      .from('telegram_agents')
      .update({
        telegram_webhook_url: newWebhookUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId);

    if (updateError) {
      console.error('[RE-WEBHOOK] Failed to update database:', updateError);
      return res.status(500).json({
        error: 'Failed to update database',
        details: updateError.message
      });
    }

    console.log('[RE-WEBHOOK] Successfully updated webhook for agent:', agentId);

    return res.status(200).json({
      success: true,
      message: `Webhook updated successfully for ${agent.project_name}`,
      new_webhook_url: newWebhookUrl,
      agent: {
        id: agent.id,
        project_name: agent.project_name
      }
    });

  } catch (error: any) {
    console.error('[RE-WEBHOOK] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

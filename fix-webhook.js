/**
 * Fix SmartSentinels Telegram Bot Webhook
 * This script resets the webhook to enable new member greetings
 * 
 * Usage: node fix-webhook.js
 */

const WEBHOOK_URL = 'https://smartsentinels.net/api/telegram-webhook';

async function fixWebhook() {
  // Read bot token from environment or prompt
  const botToken = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    console.error('❌ Error: TELEGRAM_BOT_TOKEN not found in environment variables');
    console.log('\n📝 Please set the bot token:');
    console.log('   Windows: $env:TELEGRAM_BOT_TOKEN="your-bot-token"');
    console.log('   Linux/Mac: export TELEGRAM_BOT_TOKEN="your-bot-token"');
    process.exit(1);
  }

  console.log('🔧 Fixing SmartSentinels bot webhook...\n');

  try {
    // Set webhook with correct allowed_updates
    const setWebhookUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
    const response = await fetch(setWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        allowed_updates: ['message', 'edited_message', 'chat_member'],
        drop_pending_updates: true
      })
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('❌ Failed to set webhook:', data.description);
      process.exit(1);
    }

    console.log('✅ Webhook updated successfully!');
    console.log(`📍 Webhook URL: ${WEBHOOK_URL}`);
    console.log('📨 Allowed updates: message, edited_message, chat_member\n');

    // Get bot info
    const botInfoUrl = `https://api.telegram.org/bot${botToken}/getMe`;
    const botInfoResponse = await fetch(botInfoUrl);
    const botInfo = await botInfoResponse.json();

    if (botInfo.ok) {
      console.log('🤖 Bot Info:');
      console.log(`   Username: @${botInfo.result.username}`);
      console.log(`   Name: ${botInfo.result.first_name}`);
      console.log(`   ID: ${botInfo.result.id}\n`);
    }

    // Get webhook info to verify
    const webhookInfoUrl = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
    const webhookInfoResponse = await fetch(webhookInfoUrl);
    const webhookInfo = await webhookInfoResponse.json();

    if (webhookInfo.ok) {
      console.log('📋 Current Webhook Status:');
      console.log(`   URL: ${webhookInfo.result.url}`);
      console.log(`   Pending Updates: ${webhookInfo.result.pending_update_count}`);
      console.log(`   Last Error: ${webhookInfo.result.last_error_message || 'None'}`);
      console.log(`   Allowed Updates: ${webhookInfo.result.allowed_updates?.join(', ') || 'All'}\n`);
    }

    console.log('🎉 Done! New members will now receive welcome messages.');
    console.log('💡 Test by adding a user to your Telegram group.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixWebhook();

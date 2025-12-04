#!/usr/bin/env node
/**
 * SmartSentinels Telegram Bot Setup Script (Node.js version)
 * 
 * This script helps you set up the Telegram bot by:
 * 1. Validating bot token
 * 2. Setting up the webhook
 * 3. Testing the bot connection
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function telegramRequest(method, params = {}) {
  const botToken = process.env.VITE_TELEGRAM_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${botToken}/${method}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  
  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }

  return data.result;
}

async function main() {
  log('\n🤖 SmartSentinels Telegram Bot Setup\n', colors.bold + colors.cyan);

  // Load environment variables
  const botToken = process.env.VITE_TELEGRAM_BOT_TOKEN;
  const geminiApiKey = process.env.VITE_GEMINI_API_KEY;
  const webhookUrl = process.env.VITE_TELEGRAM_WEBHOOK_URL;

  // Validate environment variables
  if (!botToken) {
    log('❌ VITE_TELEGRAM_BOT_TOKEN not found in .env file', colors.red);
    log('\nℹ️  How to get your bot token:', colors.cyan);
    log('1. Open Telegram and search for @BotFather');
    log('2. Send /newbot and follow the instructions');
    log('3. Copy the token and add it to your .env file');
    process.exit(1);
  }

  if (!geminiApiKey) {
    log('❌ VITE_GEMINI_API_KEY not found in .env file', colors.red);
    log('\nℹ️  How to get your Gemini API key:', colors.cyan);
    log('1. Go to https://aistudio.google.com/app/apikey');
    log('2. Create a new API key');
    log('3. Copy the key and add it to your .env file');
    process.exit(1);
  }

  log('✅ Environment variables loaded', colors.green);

  try {
    // Get bot info
    log('\n🔄 Testing bot connection...', colors.yellow);
    const botInfo = await telegramRequest('getMe');
    log(`✅ Bot connected: @${botInfo.username}`, colors.green);
    log(`   Name: ${botInfo.first_name}`, colors.cyan);
    log(`   ID: ${botInfo.id}`, colors.cyan);

    // Set webhook if URL is provided
    if (webhookUrl) {
      log(`\n🔄 Setting webhook to: ${webhookUrl}`, colors.yellow);
      await telegramRequest('setWebhook', {
        url: webhookUrl,
        allowed_updates: ['message', 'edited_message'],
        drop_pending_updates: true
      });
      log('✅ Webhook set successfully!', colors.green);
      
      // Verify webhook
      const webhookInfo = await telegramRequest('getWebhookInfo');
      log('\n📊 Webhook Status:', colors.cyan);
      log(`   URL: ${webhookInfo.url || 'Not set'}`, colors.cyan);
      log(`   Pending updates: ${webhookInfo.pending_update_count}`, colors.cyan);
      if (webhookInfo.last_error_message) {
        log(`   ⚠️  Last error: ${webhookInfo.last_error_message}`, colors.yellow);
      }
      
      log('\n📝 Next steps:', colors.cyan);
      log('1. Make sure your code is deployed to Vercel');
      log('2. Add your bot to your Telegram group');
      log('3. Make the bot an admin in the group');
      log('4. Try mentioning the bot: @' + botInfo.username + ' what is PoUW?');
    } else {
      log('\n⚠️  No webhook URL configured', colors.yellow);
      log('Add VITE_TELEGRAM_WEBHOOK_URL to .env to set up webhooks', colors.cyan);
      log('Example: VITE_TELEGRAM_WEBHOOK_URL=https://your-app.vercel.app/api/telegram-webhook');
    }

    log('\n🎉 Setup complete!', colors.green + colors.bold);
    log('\nℹ️  Bot Features:', colors.cyan);
    log('✓ Responds to mentions: @' + botInfo.username + ' [question]');
    log('✓ Auto-responds to keywords: SSTL, audit, PoUW, contract, etc.');
    log('✓ Welcomes new members automatically');
    log('✓ Works in groups and private chats');
    log('✓ Funny, engaging personality\n');

  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, colors.red);
    log('\nPlease check your configuration and try again.', colors.yellow);
    process.exit(1);
  }
}

main().catch(console.error);

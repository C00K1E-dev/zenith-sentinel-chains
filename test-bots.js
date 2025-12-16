// Quick test script for Telegram bots
import { createTelegramBot } from './src/services/telegramBot.ts';
import { createTelegramBotBeta } from './src/services/telegramBot2.ts';

const ALPHA_TOKEN = '8511436060:AAGYK4i4hS7CaHF2hxAs2fbYhYo402gkr6k';
const BETA_TOKEN = '8580335193:AAGehEBGex2ySIBWcOlAUsMEthWuIhmvwe8';
const GEMINI_KEY = 'AIzaSyBZsDDLklOoqv_ydb0wVluVg_tCnTo6I8o';

console.log('🤖 Testing Telegram Bots...\n');

// Test Alpha Bot
console.log('📍 Creating Alpha Bot...');
const alphaBot = createTelegramBot(ALPHA_TOKEN, GEMINI_KEY);

// Test Beta Bot
console.log('📍 Creating Beta Bot...');
const betaBot = createTelegramBotBeta(BETA_TOKEN, GEMINI_KEY);

// Wait for cache generation
console.log('\n⏳ Waiting 5 seconds for cache initialization...');
setTimeout(() => {
  console.log('✅ Bots initialized! Cache should be generating in background.');
  console.log('\n🎉 Test complete! Check console logs above for any errors.');
  console.log('💡 Deploy to test in actual Telegram group.');
  process.exit(0);
}, 5000);

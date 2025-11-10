# Telegram Bot Verification Setup Guide

## Bot Information

**Bot Username**: `@SmartSentinels_BOT`  
**Bot Link**: https://t.me/SmartSentinels_BOT  
**Bot Token**: `8562406342:AAE-MxgNZadX1hThRdVHHHiRVvRvtEh3FlQ`

⚠️ **IMPORTANT**: Keep your bot token secure! Never commit it to Git or share it publicly.

## Setup Steps

### 1. Add Bot to Your Telegram Group

1. Go to your Telegram group: https://t.me/SmartSentinelsCommunity
2. Click on the group name → "Administrators"
3. Click "Add Admin"
4. Search for `@SmartSentinels_BOT`
5. Add the bot and grant it **at least** these permissions:
   - ✅ **View Messages** (to see member list)
   - ✅ **Add Members** (optional)

### 2. Get Your Chat ID

You need to get your Telegram group/channel Chat ID. There are two ways:

#### Option A: Using the Bot API
1. Add the bot to your group
2. Send a message in the group
3. Visit: `https://api.telegram.org/bot8562406342:AAE-MxgNZadX1hThRdVHHHiRVvRvtEh3FlQ/getUpdates`
4. Look for `"chat":{"id":-XXXXXXXXXX}` in the response
5. The ID will be a negative number like `-1001234567890`

#### Option B: Using @userinfobot
1. Forward any message from your group to `@userinfobot`
2. It will reply with the group's Chat ID

### 3. Backend Environment Variables

Add these to your backend `.env` file (NOT the frontend .env):

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=8562406342:AAE-MxgNZadX1hThRdVHHHiRVvRvtEh3FlQ
TELEGRAM_CHAT_ID=-1001234567890  # Replace with your actual chat ID
```

## Backend Implementation

### Node.js/Express Example

Create `server/routes/telegram-verification.js`:

```javascript
const express = require('express');
const axios = require('axios');
const router = express.Router();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * Verify if a user is a member of the Telegram group
 * POST /api/verify/telegram-join
 * Body: { walletAddress, telegramUsername }
 */
router.post('/telegram-join', async (req, res) => {
  try {
    const { walletAddress, telegramUsername } = req.body;

    if (!walletAddress || !telegramUsername) {
      return res.status(400).json({
        verified: false,
        message: 'Wallet address and Telegram username are required'
      });
    }

    // Clean username (remove @ if present)
    const cleanUsername = telegramUsername.replace('@', '');

    // Get all chat members (for small groups) or check specific user
    const result = await checkTelegramMembership(cleanUsername);

    if (result.verified) {
      // Store verification in database
      await storeVerification(walletAddress, 'join-telegram', {
        telegramUsername: cleanUsername,
        verifiedAt: new Date()
      });

      return res.json({
        verified: true,
        message: 'Telegram membership verified successfully!',
        data: {
          username: cleanUsername,
          memberStatus: result.status
        }
      });
    } else {
      return res.json({
        verified: false,
        message: result.message || 'Could not verify Telegram membership. Please make sure you joined the group and your username is correct.'
      });
    }

  } catch (error) {
    console.error('Telegram verification error:', error);
    return res.status(500).json({
      verified: false,
      message: 'Verification failed. Please try again later.'
    });
  }
});

/**
 * Check if user is member of the Telegram group
 */
async function checkTelegramMembership(username) {
  try {
    // Method 1: Search for user by username (works if user has public username)
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember`;
    
    // Try to get member by username
    const response = await axios.get(url, {
      params: {
        chat_id: TELEGRAM_CHAT_ID,
        user_id: `@${username}`
      }
    });

    if (response.data.ok) {
      const member = response.data.result;
      const validStatuses = ['member', 'administrator', 'creator'];
      
      if (validStatuses.includes(member.status)) {
        return {
          verified: true,
          status: member.status
        };
      } else {
        return {
          verified: false,
          message: `User status is: ${member.status}`
        };
      }
    }

    return {
      verified: false,
      message: 'User not found in the group'
    };

  } catch (error) {
    console.error('Error checking Telegram membership:', error.response?.data || error.message);
    
    // If username lookup fails, return helpful message
    return {
      verified: false,
      message: 'Could not find user. Make sure your Telegram username is correct and you have joined the group.'
    };
  }
}

/**
 * Get chat administrators (useful for debugging)
 */
router.get('/telegram/admins', async (req, res) => {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatAdministrators`;
    const response = await axios.get(url, {
      params: { chat_id: TELEGRAM_CHAT_ID }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get chat member count
 */
router.get('/telegram/member-count', async (req, res) => {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMemberCount`;
    const response = await axios.get(url, {
      params: { chat_id: TELEGRAM_CHAT_ID }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Store verification in database
 */
async function storeVerification(walletAddress, taskId, data) {
  // TODO: Implement your database storage
  // Example using MongoDB:
  /*
  await Verification.create({
    walletAddress,
    taskId,
    telegramUsername: data.telegramUsername,
    verifiedAt: data.verifiedAt,
    status: 'completed'
  });
  */
  console.log('Verification stored:', { walletAddress, taskId, data });
}

module.exports = router;
```

### Update your main server file

```javascript
// server/index.js
const express = require('express');
const cors = require('cors');
const telegramRoutes = require('./routes/telegram-verification');

const app = express();

app.use(cors());
app.use(express.json());

// Mount Telegram verification routes
app.use('/api/verify', telegramRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Alternative: Using Telegram User ID Instead of Username

Some users don't have public usernames. For better reliability, use Telegram User ID:

### Modified Approach:

1. **User clicks button** → Opens your Telegram bot
2. **Bot sends message** with verification code
3. **User submits code** in your web app
4. **Backend verifies** code matches and user is in group

```javascript
// Bot command handler
bot.onText(/\/verify (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const walletAddress = match[1];
  
  // Generate verification code
  const code = generateVerificationCode();
  
  // Store code temporarily (Redis/Memory)
  await storeVerificationCode(code, {
    telegramUserId: msg.from.id,
    walletAddress,
    username: msg.from.username,
    expiresAt: Date.now() + 300000 // 5 minutes
  });
  
  bot.sendMessage(chatId, 
    `Your verification code is: \`${code}\`\n\nEnter this code in the web app to verify your Telegram membership.`,
    { parse_mode: 'Markdown' }
  );
});
```

## Testing Your Bot

### Test API Endpoints

```bash
# Test getting chat member
curl "https://api.telegram.org/bot8562406342:AAE-MxgNZadX1hThRdVHHHiRVvRvtEh3FlQ/getChatMember?chat_id=YOUR_CHAT_ID&user_id=@username"

# Test getting updates
curl "https://api.telegram.org/bot8562406342:AAE-MxgNZadX1hThRdVHHHiRVvRvtEh3FlQ/getUpdates"

# Test getting chat info
curl "https://api.telegram.org/bot8562406342:AAE-MxgNZadX1hThRdVHHHiRVvRvtEh3FlQ/getChat?chat_id=YOUR_CHAT_ID"
```

## Common Issues & Solutions

### 1. "User not found" Error
- User doesn't have a public username
- Solution: Use Telegram User ID approach instead

### 2. "Bot was blocked by the user"
- User hasn't started the bot yet
- Solution: Add instruction to start the bot first

### 3. "Chat not found"
- Wrong Chat ID
- Solution: Verify Chat ID using getUpdates endpoint

### 4. "Forbidden: bot is not a member of the group"
- Bot not added to group
- Solution: Add bot to group and make it admin

## Security Best Practices

1. **Never expose bot token** in frontend code
2. **Rate limit** verification requests (max 5 per minute per user)
3. **Store tokens securely** in environment variables
4. **Validate input** - sanitize usernames
5. **Implement cooldown** - 1 verification per hour per wallet
6. **Log verification attempts** for security monitoring

## Next Steps

1. ✅ Set up backend server (Node.js/Express recommended)
2. ✅ Add Telegram bot token to backend `.env`
3. ✅ Get your Chat ID and add to backend `.env`
4. ✅ Implement the verification endpoint
5. ✅ Test with your own Telegram account
6. ✅ Update frontend `VITE_BACKEND_API_URL` in `.env`

## Useful Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api) - Node.js library
- [python-telegram-bot](https://github.com/python-telegram-bot/python-telegram-bot) - Python library
- [Telegram Bot Father](https://t.me/botfather) - Create/manage bots

## Support

If you need help:
1. Check bot logs in backend
2. Test API endpoints directly with curl
3. Verify bot is admin in group
4. Check Chat ID is correct
5. Ensure bot token is valid

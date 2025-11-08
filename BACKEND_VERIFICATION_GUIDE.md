# Backend Implementation Guide for Task Verification

This document explains how to implement the backend verification system for the SmartSentinels Airdrop Campaign.

## Prerequisites

1. **Twitter API Access** (v2)
   - Apply at: https://developer.twitter.com/
   - Required: Bearer Token or OAuth 2.0
   - Permissions: Read user data, Read tweets

2. **Telegram Bot**
   - Create a bot: https://t.me/BotFather
   - Get Bot Token
   - Add bot to your channel/group as admin

3. **Blockchain RPC**
   - BSC RPC endpoint for reading NFT ownership
   - Can use public RPCs or services like Infura, Alchemy

## Environment Variables

```env
# Twitter API
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHANNEL_ID=@smartsentinels

# Blockchain
BSC_RPC_URL=https://bsc-dataseed.binance.org/
GENESIS_NFT_CONTRACT=0x...
AUDIT_NFT_CONTRACT=0x...

# Database
DATABASE_URL=your_database_connection_string

# Security
JWT_SECRET=your_jwt_secret
API_KEY=your_api_key_for_frontend
```

## Database Schema

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  twitter_username VARCHAR(255),
  telegram_username VARCHAR(255),
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  points INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL
);

-- Completed tasks table
CREATE TABLE completed_tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  task_id VARCHAR(50) REFERENCES tasks(id),
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verification_data JSONB,
  UNIQUE(user_id, task_id)
);

-- Claims table
CREATE TABLE claims (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  wallet_address VARCHAR(42) NOT NULL,
  points_spent INTEGER NOT NULL,
  token_amount VARCHAR(100) NOT NULL,
  signature TEXT NOT NULL,
  claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tx_hash VARCHAR(66),
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_completed_tasks_user ON completed_tasks(user_id);
CREATE INDEX idx_users_points ON users(total_points DESC);
CREATE INDEX idx_claims_wallet ON claims(wallet_address);
CREATE INDEX idx_claims_status ON claims(status);
```

## API Endpoints Implementation

### 1. Verify Twitter Follow

```javascript
// POST /api/verify/twitter-follow
const verifyTwitterFollow = async (req, res) => {
  const { walletAddress, twitterUsername, targetAccount } = req.body;
  
  try {
    // 1. Get Twitter user ID from username
    const userResponse = await fetch(
      `https://api.twitter.com/2/users/by/username/${twitterUsername}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        }
      }
    );
    const userData = await userResponse.json();
    const userId = userData.data.id;
    
    // 2. Get target account ID
    const targetResponse = await fetch(
      `https://api.twitter.com/2/users/by/username/${targetAccount}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        }
      }
    );
    const targetData = await targetResponse.json();
    const targetId = targetData.data.id;
    
    // 3. Check if user follows target
    const followResponse = await fetch(
      `https://api.twitter.com/2/users/${userId}/following?max_results=1000`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        }
      }
    );
    const followData = await followResponse.json();
    
    const isFollowing = followData.data?.some(user => user.id === targetId);
    
    // 4. Save to database if verified
    if (isFollowing) {
      await saveUserTwitter(walletAddress, twitterUsername);
    }
    
    res.json({
      verified: isFollowing,
      message: isFollowing ? 'Follow verified!' : 'Not following'
    });
  } catch (error) {
    console.error('Twitter verification error:', error);
    res.status(500).json({ verified: false, message: 'Verification failed' });
  }
};
```

### 2. Verify Telegram Join

```javascript
// POST /api/verify/telegram-join
const verifyTelegramJoin = async (req, res) => {
  const { walletAddress, telegramUsername, chatId } = req.body;
  
  try {
    // Use Telegram Bot API to check membership
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getChatMember?chat_id=${chatId}&user_id=@${telegramUsername}`
    );
    const data = await response.json();
    
    const isMember = data.ok && 
      ['member', 'administrator', 'creator'].includes(data.result?.status);
    
    // Save to database if verified
    if (isMember) {
      await saveUserTelegram(walletAddress, telegramUsername);
    }
    
    res.json({
      verified: isMember,
      message: isMember ? 'Membership verified!' : 'Not a member'
    });
  } catch (error) {
    console.error('Telegram verification error:', error);
    res.status(500).json({ verified: false, message: 'Verification failed' });
  }
};
```

### 3. Verify Twitter Likes

```javascript
// POST /api/verify/twitter-likes
const verifyTwitterLikes = async (req, res) => {
  const { walletAddress, twitterUsername, targetAccount, requiredLikes } = req.body;
  
  try {
    // 1. Get user ID
    const userResponse = await fetch(
      `https://api.twitter.com/2/users/by/username/${twitterUsername}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        }
      }
    );
    const userData = await userResponse.json();
    const userId = userData.data.id;
    
    // 2. Get target account's recent tweets
    const targetResponse = await fetch(
      `https://api.twitter.com/2/users/by/username/${targetAccount}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        }
      }
    );
    const targetData = await targetResponse.json();
    const targetId = targetData.data.id;
    
    // 3. Get target's recent tweets
    const tweetsResponse = await fetch(
      `https://api.twitter.com/2/users/${targetId}/tweets?max_results=10`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        }
      }
    );
    const tweetsData = await tweetsResponse.json();
    
    // 4. Check user's liked tweets
    const likesResponse = await fetch(
      `https://api.twitter.com/2/users/${userId}/liked_tweets?max_results=100`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        }
      }
    );
    const likesData = await likesResponse.json();
    
    // 5. Count how many of target's tweets user liked
    const likedTweetIds = new Set(likesData.data?.map(t => t.id) || []);
    const targetTweetIds = tweetsData.data?.map(t => t.id) || [];
    const likesCount = targetTweetIds.filter(id => likedTweetIds.has(id)).length;
    
    const verified = likesCount >= requiredLikes;
    
    res.json({
      verified,
      likesCount,
      message: verified ? `${likesCount} likes verified!` : `Only ${likesCount} likes found`
    });
  } catch (error) {
    console.error('Likes verification error:', error);
    res.status(500).json({ verified: false, message: 'Verification failed' });
  }
};
```

### 4. Verify NFT Mint

```javascript
// POST /api/verify/nft-mint
const { ethers } = require('ethers');

const verifyNFTMint = async (req, res) => {
  const { walletAddress, collectionType } = req.body;
  
  try {
    // Connect to BSC
    const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
    
    // Get contract address
    const contractAddress = collectionType === 'genesis' 
      ? process.env.GENESIS_NFT_CONTRACT 
      : process.env.AUDIT_NFT_CONTRACT;
    
    // ERC721 ABI for balanceOf
    const abi = ['function balanceOf(address owner) view returns (uint256)'];
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    // Check balance
    const balance = await contract.balanceOf(walletAddress);
    const verified = balance > 0;
    
    res.json({
      verified,
      balance: balance.toString(),
      message: verified 
        ? `NFT ownership verified! Balance: ${balance}` 
        : 'No NFTs found in wallet'
    });
  } catch (error) {
    console.error('NFT verification error:', error);
    res.status(500).json({ verified: false, message: 'Verification failed' });
  }
};
```

### 5. Record Task Completion

```javascript
// POST /api/tasks/complete
const recordTaskCompletion = async (req, res) => {
  const { walletAddress, taskId, points, timestamp } = req.body;
  
  try {
    // Start transaction
    await db.query('BEGIN');
    
    // 1. Get or create user
    let user = await db.query(
      'SELECT id, total_points FROM users WHERE wallet_address = $1',
      [walletAddress]
    );
    
    if (user.rows.length === 0) {
      user = await db.query(
        'INSERT INTO users (wallet_address, total_points) VALUES ($1, 0) RETURNING id, total_points',
        [walletAddress]
      );
    }
    
    const userId = user.rows[0].id;
    
    // 2. Check if task already completed
    const existing = await db.query(
      'SELECT id FROM completed_tasks WHERE user_id = $1 AND task_id = $2',
      [userId, taskId]
    );
    
    if (existing.rows.length > 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: 'Task already completed' });
    }
    
    // 3. Record task completion
    await db.query(
      'INSERT INTO completed_tasks (user_id, task_id, completed_at) VALUES ($1, $2, to_timestamp($3 / 1000.0))',
      [userId, taskId, timestamp]
    );
    
    // 4. Update user points
    await db.query(
      'UPDATE users SET total_points = total_points + $1, updated_at = NOW() WHERE id = $2',
      [points, userId]
    );
    
    await db.query('COMMIT');
    
    res.json({ success: true, newTotal: user.rows[0].total_points + points });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Task completion error:', error);
    res.status(500).json({ error: 'Failed to record task' });
  }
};
```

### 6. Get Leaderboard

```javascript
// GET /api/leaderboard?limit=10
const getLeaderboard = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  try {
    const result = await db.query(`
      SELECT 
        wallet_address,
        total_points,
        (SELECT COUNT(*) FROM completed_tasks WHERE user_id = users.id) as tasks_completed,
        ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank
      FROM users
      WHERE total_points > 0
      ORDER BY total_points DESC
      LIMIT $1
    `, [limit]);
    
    const leaderboard = result.rows.map(row => ({
      rank: parseInt(row.rank),
      address: `${row.wallet_address.slice(0, 6)}...${row.wallet_address.slice(-4)}`,
      points: row.total_points,
      tasksCompleted: parseInt(row.tasks_completed)
    }));
    
    res.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};
```

### 7. Claim Tokens

```javascript
// POST /api/claim/tokens
const { ethers } = require('ethers');

const claimTokens = async (req, res) => {
  const { walletAddress, points, signature, timestamp } = req.body;
  
  try {
    // 1. Verify signature
    const message = `Claim SSTL Airdrop Tokens\nWallet: ${walletAddress}\nPoints: ${points}\nTimestamp: ${timestamp}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    // 2. Get user data
    const user = await db.query(
      'SELECT id, total_points FROM users WHERE wallet_address = $1',
      [walletAddress]
    );
    
    if (user.rows.length === 0 || user.rows[0].total_points < 100) {
      return res.status(400).json({ error: 'Insufficient points' });
    }
    
    // 3. Check if already claimed
    const existingClaim = await db.query(
      'SELECT id FROM claims WHERE user_id = $1',
      [user.rows[0].id]
    );
    
    if (existingClaim.rows.length > 0) {
      return res.status(400).json({ error: 'Already claimed' });
    }
    
    // 4. Calculate token amount (example: 1 point = 10 SSTL tokens)
    const tokenAmount = (points * 10).toString();
    
    // 5. Record claim
    await db.query('BEGIN');
    
    await db.query(
      `INSERT INTO claims (user_id, wallet_address, points_spent, token_amount, signature, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [user.rows[0].id, walletAddress, points, tokenAmount, signature]
    );
    
    // 6. Reset user points
    await db.query(
      'UPDATE users SET total_points = 0, updated_at = NOW() WHERE id = $1',
      [user.rows[0].id]
    );
    
    await db.query('COMMIT');
    
    // 7. Generate claim URL (for MetaMask Portfolio or your claim page)
    const claimUrl = `https://portfolio.metamask.io/campaigns/smartsentinels-airdrop?address=${walletAddress}&amount=${tokenAmount}`;
    
    res.json({
      success: true,
      tokenAmount,
      claimUrl,
      message: 'Claim prepared successfully'
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Claim error:', error);
    res.status(500).json({ error: 'Claim failed' });
  }
};
```

### 8. Check Claim Status

```javascript
// GET /api/claim/status/:walletAddress
const checkClaimStatus = async (req, res) => {
  const { walletAddress } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        c.token_amount,
        c.claimed_at,
        c.status,
        c.tx_hash
      FROM claims c
      JOIN users u ON c.user_id = u.id
      WHERE u.wallet_address = $1
    `, [walletAddress]);
    
    if (result.rows.length === 0) {
      return res.json({ hasClaimed: false });
    }
    
    const claim = result.rows[0];
    res.json({
      hasClaimed: true,
      claimedAmount: claim.token_amount,
      claimedAt: claim.claimed_at.getTime(),
      status: claim.status,
      txHash: claim.tx_hash
    });
  } catch (error) {
    console.error('Claim status error:', error);
    res.status(500).json({ error: 'Failed to check claim status' });
  }
};
```

## Security Considerations

1. **Rate Limiting**: Implement rate limiting on verification endpoints
2. **API Authentication**: Use API keys or JWT tokens
3. **Input Validation**: Validate all inputs (wallet addresses, usernames)
4. **CORS**: Configure CORS properly for your frontend domain
5. **Task Cooldown**: Prevent users from re-attempting verification too quickly
6. **Wallet Signature**: Require wallet signature to prove ownership for claims
7. **Double-Claim Prevention**: Enforce one claim per wallet in database
8. **Points Validation**: Verify user actually has the points they're claiming

## MetaMask Portfolio Integration

To integrate with MetaMask Portfolio for token claims:

1. **Create Campaign**: Visit MetaMask Portfolio Partners
2. **Set up Campaign**: Define your airdrop campaign with SSTL token details
3. **Generate Claim Links**: Use their API to generate claim links
4. **Whitelist Addresses**: Submit eligible addresses with amounts
5. **Users Claim**: Users can claim directly through MetaMask Portfolio

Alternative: Use your own smart contract for claims with Merkle tree distribution.

## Example Express.js Server Setup

```javascript
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes - Verification
app.post('/api/verify/twitter-follow', verifyTwitterFollow);
app.post('/api/verify/telegram-join', verifyTelegramJoin);
app.post('/api/verify/twitter-likes', verifyTwitterLikes);
app.post('/api/verify/twitter-tags', verifyTwitterTags);
app.post('/api/verify/nft-mint', verifyNFTMint);

// Routes - Tasks
app.post('/api/tasks/complete', recordTaskCompletion);
app.get('/api/tasks/status/:walletAddress', getUserStatus);
app.get('/api/leaderboard', getLeaderboard);

// Routes - Claims
app.post('/api/claim/tokens', claimTokens);
app.get('/api/claim/status/:walletAddress', checkClaimStatus);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Testing

Use tools like Postman or curl to test endpoints:

```bash
# Test Twitter follow verification
curl -X POST http://localhost:3000/api/verify/twitter-follow \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x...",
    "twitterUsername": "testuser",
    "targetAccount": "SmartSentinels"
  }'
```

## Deployment

1. Deploy backend to services like:
   - Heroku
   - AWS Lambda
   - Vercel (Serverless Functions)
   - DigitalOcean App Platform

2. Set up environment variables in your hosting platform

3. Update `VITE_BACKEND_API_URL` in your frontend `.env` file

## Notes

- Twitter API has rate limits - cache results when possible
- Consider implementing a queue system for verification requests
- Store verification attempts to prevent abuse
- Implement webhook listeners for real-time verification where possible

# SmartSentinels Airdrop Campaign - Complete Setup Guide

This guide provides step-by-step instructions to set up and launch your SSTL token airdrop campaign with task verification and MetaMask integration.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Database Configuration](#database-configuration)
4. [API Integration](#api-integration)
5. [Frontend Configuration](#frontend-configuration)
6. [Token Distribution Setup](#token-distribution-setup)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Required Accounts & API Keys

- [ ] **Twitter Developer Account**
  - Apply at: https://developer.twitter.com/
  - Plan needed: Free tier (for basic verification) or Elevated (for better limits)
  - What you need: Bearer Token or OAuth 2.0 credentials

- [ ] **Telegram Bot**
  - Create via BotFather: https://t.me/BotFather
  - Command: `/newbot` to create
  - Save your Bot Token
  - Add bot as admin to your Telegram group/channel

- [ ] **Blockchain RPC Access**
  - BSC RPC: https://bsc-dataseed.binance.org/ (public, free)
  - Or use: Ankr, Infura, Alchemy for better reliability

- [ ] **Database**
  - PostgreSQL (recommended) or MySQL
  - Options: Supabase (free), Railway, DigitalOcean, AWS RDS

- [ ] **Hosting**
  - Backend: Heroku, Railway, DigitalOcean, AWS, Vercel
  - Frontend: Already on Vercel (assuming)

---

## Backend Setup

### Step 1: Create Backend Project

```bash
# Create new directory
mkdir smartsentinels-backend
cd smartsentinels-backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express cors dotenv pg ethers@6 express-rate-limit
npm install --save-dev nodemon
```

### Step 2: Create Project Structure

```bash
# Create folder structure
mkdir src
mkdir src/routes
mkdir src/controllers
mkdir src/middleware
mkdir src/utils

# Create files
touch .env
touch src/server.js
touch src/routes/verify.js
touch src/routes/tasks.js
touch src/routes/claims.js
touch src/controllers/verifyController.js
touch src/controllers/tasksController.js
touch src/controllers/claimsController.js
touch src/utils/database.js
touch src/utils/twitter.js
touch src/utils/telegram.js
touch src/utils/blockchain.js
```

### Step 3: Configure Environment Variables

Create `.env` file:

```env
# Server
PORT=3000
NODE_ENV=development

# Database (get from your database provider)
DATABASE_URL=postgresql://user:password@host:5432/smartsentinels

# Twitter API (get from developer.twitter.com)
TWITTER_BEARER_TOKEN=your_bearer_token_here
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_TARGET_ACCOUNT=SmartSentinels

# Telegram (get from @BotFather)
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHANNEL_ID=@smartsentinels

# Blockchain
BSC_RPC_URL=https://bsc-dataseed.binance.org/
GENESIS_NFT_CONTRACT=0xYourGenesisNFTContract
AUDIT_NFT_CONTRACT=0xYourAuditNFTContract

# Token Distribution
SSTL_TOKEN_CONTRACT=0xYourSSTLTokenContract
POINTS_TO_TOKEN_RATIO=10
MIN_POINTS_FOR_CLAIM=100

# Security
JWT_SECRET=your_random_jwt_secret_here
API_KEY=your_frontend_api_key
FRONTEND_URL=https://yourdomain.com

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

### Step 4: Set Up Database Connection

**src/utils/database.js**

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
```

### Step 5: Create Main Server File

**src/server.js**

```javascript
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const verifyRoutes = require('./routes/verify');
const tasksRoutes = require('./routes/tasks');
const claimsRoutes = require('./routes/claims');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Routes
app.use('/api/verify', verifyRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/claim', claimsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: Date.now() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 6: Update package.json

Add scripts to `package.json`:

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

---

## Database Configuration

### Step 1: Choose Database Provider

**Option A: Supabase (Recommended for beginners - Free tier available)**

1. Go to https://supabase.com/
2. Sign up and create new project
3. Get connection string from Settings → Database
4. Use SQL Editor to run schema

**Option B: Railway**

1. Go to https://railway.app/
2. Create new project → Add PostgreSQL
3. Get connection string from database settings

**Option C: Self-hosted PostgreSQL**

```bash
# Install PostgreSQL
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql

# Start service
sudo service postgresql start
```

### Step 2: Run Database Schema

Connect to your database and run this SQL:

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

-- Insert default tasks
INSERT INTO tasks (id, name, points, type) VALUES
  ('follow-x', 'Follow on X (Twitter)', 100, 'social'),
  ('join-telegram', 'Join Telegram Community', 100, 'social'),
  ('like-post', 'Like Posts on X', 50, 'engagement'),
  ('tag-friends', 'Tag 3 Friends', 150, 'engagement'),
  ('mint-genesis', 'Mint Genesis NFT', 500, 'nft'),
  ('mint-audit', 'Mint AI Audit NFT', 300, 'nft');

-- Completed tasks table
CREATE TABLE completed_tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  task_id VARCHAR(50) REFERENCES tasks(id),
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verification_data JSONB,
  UNIQUE(user_id, task_id)
);

-- Claims table
CREATE TABLE claims (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(42) NOT NULL,
  points_spent INTEGER NOT NULL,
  token_amount VARCHAR(100) NOT NULL,
  signature TEXT NOT NULL,
  claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tx_hash VARCHAR(66),
  status VARCHAR(20) DEFAULT 'pending',
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_completed_tasks_user ON completed_tasks(user_id);
CREATE INDEX idx_users_points ON users(total_points DESC);
CREATE INDEX idx_claims_wallet ON claims(wallet_address);
CREATE INDEX idx_claims_status ON claims(status);
```

### Step 3: Test Database Connection

Create test script `test-db.js`:

```javascript
const db = require('./src/utils/database');

async function testConnection() {
  try {
    const result = await db.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0]);
  } catch (error) {
    console.error('❌ Database error:', error);
  }
}

testConnection();
```

Run: `node test-db.js`

---

## API Integration

### Step 1: Twitter API Setup

1. **Apply for Twitter Developer Account**
   - Visit: https://developer.twitter.com/en/portal/dashboard
   - Click "Sign up" or "Apply for access"
   - Fill out the form (select "Building tools for other users")

2. **Create a Project & App**
   - Go to Projects & Apps
   - Create new project
   - Create new app within project
   - Go to Keys and Tokens tab

3. **Generate Bearer Token**
   - Click "Generate" under Bearer Token
   - Copy and save to `.env` as `TWITTER_BEARER_TOKEN`

4. **Test Twitter API**

Create `test-twitter.js`:

```javascript
const fetch = require('node-fetch');
require('dotenv').config();

async function testTwitter() {
  const response = await fetch(
    'https://api.twitter.com/2/users/by/username/SmartSentinels',
    {
      headers: {
        'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
      }
    }
  );
  
  const data = await response.json();
  console.log('Twitter API Test:', data);
}

testTwitter();
```

### Step 2: Telegram Bot Setup

1. **Create Bot**
   - Open Telegram and search for @BotFather
   - Send `/newbot`
   - Follow instructions to name your bot
   - Copy the Bot Token to `.env` as `TELEGRAM_BOT_TOKEN`

2. **Add Bot to Your Group**
   - Add your bot to your Telegram group
   - Make it an admin with "View Members" permission

3. **Get Chat ID**

Create `test-telegram.js`:

```javascript
const fetch = require('node-fetch');
require('dotenv').config();

async function getChatId() {
  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getUpdates`
  );
  const data = await response.json();
  console.log('Telegram Updates:', JSON.stringify(data, null, 2));
}

getChatId();
```

Run this, send a message in your group, run again to see chat ID.

### Step 3: Blockchain RPC Setup

Test blockchain connection `test-blockchain.js`:

```javascript
const { ethers } = require('ethers');
require('dotenv').config();

async function testBlockchain() {
  const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
  const blockNumber = await provider.getBlockNumber();
  console.log('✅ Connected to BSC. Current block:', blockNumber);
}

testBlockchain();
```

---

## Frontend Configuration

### Step 1: Add Environment Variables

Create/update `.env.local` in your frontend:

```env
VITE_BACKEND_API_URL=http://localhost:3000/api
VITE_THEMIRACLE_API_KEY=your_themiracle_key_if_using
VITE_THIRDWEB_CLIENT_ID=your_existing_thirdweb_id
```

### Step 2: Update for Production

Before deploying, update to production URLs:

```env
VITE_BACKEND_API_URL=https://your-backend.herokuapp.com/api
```

---

## Token Distribution Setup

### Option 1: MetaMask Portfolio Campaign

1. **Contact MetaMask**
   - Visit: https://portfolio.metamask.io/
   - Apply for campaign partnership
   - Provide campaign details

2. **Prepare Whitelist**
   - Backend generates CSV of addresses with amounts
   - Submit to MetaMask

3. **Update Claim URL**
   - MetaMask provides campaign URL
   - Update in `src/utils/taskVerification.ts`

### Option 2: Custom Smart Contract (Recommended)

1. **Deploy Airdrop Contract**

```solidity
// SimpleAirdrop.sol
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract SSTLAirdrop is Ownable {
    IERC20 public sstlToken;
    bytes32 public merkleRoot;
    mapping(address => bool) public hasClaimed;
    
    event Claimed(address indexed user, uint256 amount);
    
    constructor(address _sstlToken) {
        sstlToken = IERC20(_sstlToken);
    }
    
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }
    
    function claim(uint256 amount, bytes32[] calldata merkleProof) external {
        require(!hasClaimed[msg.sender], "Already claimed");
        
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        require(MerkleProof.verify(merkleProof, merkleRoot, leaf), "Invalid proof");
        
        hasClaimed[msg.sender] = true;
        require(sstlToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit Claimed(msg.sender, amount);
    }
}
```

2. **Deploy to BSC**
   - Use Remix or Hardhat
   - Verify contract on BscScan
   - Transfer SSTL tokens to contract

3. **Generate Merkle Tree**

Install: `npm install merkletreejs keccak256`

Create `generate-merkle.js`:

```javascript
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const db = require('./src/utils/database');

async function generateMerkleTree() {
  // Get all claims from database
  const result = await db.query(`
    SELECT wallet_address, token_amount 
    FROM claims 
    WHERE status = 'pending'
  `);
  
  // Create leaves
  const leaves = result.rows.map(row => 
    keccak256(
      ethers.solidityPacked(
        ['address', 'uint256'],
        [row.wallet_address, ethers.parseEther(row.token_amount)]
      )
    )
  );
  
  // Generate tree
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = tree.getHexRoot();
  
  console.log('Merkle Root:', root);
  
  // Save root to contract using setMerkleRoot
  // Generate proofs for each address and save to database
  
  return root;
}

generateMerkleTree();
```

---

## Testing

### Step 1: Local Testing

1. **Start Backend**
```bash
cd smartsentinels-backend
npm run dev
```

2. **Start Frontend**
```bash
npm run dev
```

3. **Test Flow**
   - Connect wallet
   - Complete a task
   - Check points increase
   - Try to claim

### Step 2: Test Each Verification

Create test accounts:
- Twitter test account
- Telegram test account
- Test wallet with NFTs

Test each task:
```bash
# Test Twitter follow
curl -X POST http://localhost:3000/api/verify/twitter-follow \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0xYourTestWallet",
    "twitterUsername": "testuser",
    "targetAccount": "SmartSentinels"
  }'
```

### Step 3: Test Claim Flow

1. Accumulate points
2. Click claim button
3. Sign message in MetaMask
4. Verify claim recorded in database
5. Check claim status

---

## Deployment

### Step 1: Deploy Backend

**Using Railway:**

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and deploy:
```bash
railway login
railway init
railway up
```

3. Add environment variables in Railway dashboard

**Using Heroku:**

1. Install Heroku CLI
2. Create app:
```bash
heroku create smartsentinels-api
git push heroku main
```

3. Add config vars:
```bash
heroku config:set DATABASE_URL=your_url
heroku config:set TWITTER_BEARER_TOKEN=your_token
# ... add all environment variables
```

### Step 2: Deploy Frontend

Already on Vercel - just add environment variable:
```bash
vercel env add VITE_BACKEND_API_URL production
```

Enter your production backend URL.

### Step 3: Update CORS

In backend, update `ALLOWED_ORIGINS` to include your production domain.

---

## Monitoring & Maintenance

### Daily Checks

- [ ] Monitor error logs
- [ ] Check claim status
- [ ] Verify API rate limits not exceeded
- [ ] Review leaderboard for anomalies

### Weekly Tasks

- [ ] Backup database
- [ ] Review completed tasks
- [ ] Check token distribution
- [ ] Update leaderboard

### Security Monitoring

- [ ] Watch for suspicious patterns
- [ ] Check for duplicate claims
- [ ] Monitor API usage
- [ ] Review failed verifications

---

## Troubleshooting

### Common Issues

**"Database connection failed"**
- Check DATABASE_URL is correct
- Verify database is running
- Check network/firewall settings

**"Twitter API returns 401"**
- Bearer token is invalid/expired
- Regenerate token in Twitter Developer Portal

**"Telegram bot not responding"**
- Bot token is wrong
- Bot not added as admin to group
- Missing permissions

**"NFT verification fails"**
- Wrong contract address
- RPC endpoint down
- User doesn't own NFT

### Getting Help

- Check logs: `heroku logs --tail` or Railway logs
- Test API endpoints individually
- Verify environment variables are set
- Check database for data integrity

---

## Launch Checklist

Before going live:

- [ ] All environment variables set (production)
- [ ] Database schema created and tested
- [ ] Backend deployed and accessible
- [ ] Frontend pointing to production backend
- [ ] Twitter API verified working
- [ ] Telegram bot tested
- [ ] Smart contract deployed (if using)
- [ ] Merkle tree generated (if using)
- [ ] SSTL tokens funded in contract/MetaMask
- [ ] Rate limits configured
- [ ] CORS configured correctly
- [ ] Security audit completed
- [ ] Test claim flow end-to-end
- [ ] Backup plan for database
- [ ] Monitoring setup
- [ ] Documentation complete

---

## Support

For issues or questions:
- Backend guide: `BACKEND_VERIFICATION_GUIDE.md`
- Task verification: Check `src/utils/taskVerification.ts`
- Database schema: See Database Configuration section above

**Estimated Setup Time:** 4-8 hours (depending on experience level)

---

## Quick Start (TL;DR)

```bash
# 1. Setup backend
mkdir smartsentinels-backend && cd smartsentinels-backend
npm init -y
npm install express cors dotenv pg ethers@6 express-rate-limit

# 2. Copy backend files from guide
# 3. Setup database (Supabase recommended)
# 4. Get API keys (Twitter, Telegram)
# 5. Configure .env file
# 6. Run database schema
# 7. Test locally
npm run dev

# 8. Deploy backend (Railway/Heroku)
# 9. Update frontend env with backend URL
# 10. Deploy and test!
```

**Good luck with your airdrop campaign! 🚀**

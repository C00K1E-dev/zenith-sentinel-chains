# Telegram AI Agent Feature - Complete Implementation Prompt

## Project Overview
You are implementing a complete Telegram AI Agent creation and deployment system for the SmartSentinels platform. 

**CRITICAL: This is a PAYMENT-GATED system.**
- Users MUST connect their wallet before creating an agent
- Agents ONLY deploy after successful USDT payment
- Agents STOP working when subscription expires (payment-driven lifecycle)
- No refunds - payment is final

Users create custom AI agents trained on their project data, pay a monthly subscription in USDT (on BSC), deploy them to Telegram, and manage them through the sidebar.

## Critical Payment Flow (Non-Negotiable)

```
1. User clicks "Deploy Agent Now"
   ↓
2. Check: Is wallet connected?
   ├─ NO → Show "Connect Wallet" modal
   │         User connects via MetaMask/WalletConnect
   │         Store wallet_address in Supabase users table
   │
   └─ YES → Proceed to form
            ↓
3. User fills 4 steps:
   - Step 1: Project Info (website, whitepaper, etc.)
   - Step 2: Personality (fine-tune AI model)
   - Step 3: Pricing (select tier + PROCESS PAYMENT)
   - Step 4: Success/Deploy (only shown after payment confirmed)

4. Step 3 - Payment Processing:
   ├─ Show selected tier details
   ├─ Display: "99 USDT/month" for Starter (example)
   ├─ User clicks "Pay with [Connected Wallet]" (supports any EVM wallet)
   ├─ Wallet popup appears (MetaMask, Ledger, Coinbase, etc. - whatever user connected)
   ├─ User approves transaction
   ├─ Smart contract sends USDT from user wallet → YOUR_TREASURY_WALLET
   ├─ Listen for transaction confirmation on BSC
   ├─ If success: Create Supabase subscription record + move to Step 4
   ├─ If fail: Show error, stay on Step 3
   │
   └─ NO PAYMENT = NO AGENT DEPLOYMENT

5. Step 4 - Deploy Agent:
   ├─ Only reachable after payment confirmed
   ├─ Deploy to Vercel with subscription active
   ├─ Webhook checks subscription status before processing messages
   ├─ Show deployed bot handle + success message
   │
   └─ Agent is LIVE and EARNING

6. Subscription Lifecycle:
   ├─ Active (30 days from payment)
   │  └─ Agent webhook accepts & processes messages
   │
   ├─ Expiring soon (24 hours before renewal)
   │  └─ Show renewal reminder in sidebar
   │
   ├─ Expired
   │  └─ Webhook REJECTS all messages: "Subscription expired, please renew"
   │  └─ Show "Renew Subscription" button in My Agents
   │
   └─ Renewed (user pays again)
      └─ Agent continues running for another 30 days
```

## Current Status
✅ Completed:
- Frontend form component (createAITelegramAgent.tsx) - 4-step wizard
- Agent card with pricing tiers (sidebarCreateAgent.tsx)
- Basic API endpoint (/api/create-telegram-agent.ts)
- Bot personality and knowledge base system
- My Agents sidebar component (basic display)

❌ Needed:
1. **Wallet connection check** - Gate deployment behind wallet
2. **USDT payment processing** - BSC transaction integration
3. **Subscription status tracking** - Expiry dates, renewal logic
4. **Payment-gated webhook** - Agent only works if subscription active
5. **PDF extraction** - From uploaded whitepapers
6. **Website scraping** - Project info extraction
7. **Vercel deployment** - Only after payment
8. **Telegram webhook** - Message handler on Vercel
9. **Supabase database** - Agent + subscription persistence
10. **My Agents enhancement** - Show agent status, manage, renew subscription
11. **Admin dashboard** - Monitor all agents, payments, analytics
12. **User analytics** - Built into My Agents sidebar (not separate)

---

## Technical Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: Vercel Functions + Node.js + TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini 2.5 Flash-Lite
- **Deployment**: Vercel
- **Telegram**: Bot API
- **Blockchain**: BSC (USDT payments via Web3.js/ethers.js)
- **Wallet**: thirdweb (already installed - supports MetaMask, WalletConnect, Ledger, Trezor, Coinbase, Trust Wallet, etc.)
- **File Processing**: pdfjs-dist or pdf-parse
- **HTTP Client**: Fetch API / node-fetch

### Database Schema (Complete SQL - Will be Generated in SUPABASE_DATABASE_MIGRATIONS.md)

**⚠️ CRITICAL: Implementation AI will generate complete, copy-paste ready SQL at the end**

#### Table 1: users (Wallet Accounts)
```
- id: UUID (primary key)
- wallet_address: String (unique, indexed) ← REQUIRED BEFORE AGENT CREATION
- email: String (optional, unique)
- created_at: Timestamp (default: now)
- updated_at: Timestamp (default: now)
```

#### Table 2: telegram_agents (Agent Configuration)
```
- id: UUID (primary key)
- user_id: UUID (foreign key → users.id, indexed)
- project_name: String (indexed)
- bot_handle: String (unique, e.g., @BotName)
- bot_token: String (encrypted - stored in Vercel secrets)
- website_url: String
- whitepaper_url: String (IPFS or file path)
- personality: Enum (funny|professional|technical|casual|custom)
- custom_personality: Text
- trigger_keywords: JSONB Array
- custom_faqs: Text
- additional_info: Text
- pricing_tier: Enum (starter|pro|enterprise)
- knowledge_base: JSONB (extracted + processed content)
- deployment_status: Enum (draft|deploying|active|paused|failed)
- vercel_project_id: String (indexed)
- vercel_deployment_url: String
- telegram_webhook_url: String
- message_count: Integer (default: 0)
- created_at: Timestamp (default: now)
- updated_at: Timestamp (default: now)
```

#### Table 3: subscriptions ⭐ CRITICAL - PAYMENT-GATED ACCESS CONTROL
```
- id: UUID (primary key)
- user_id: UUID (foreign key → users.id, indexed)
- agent_id: UUID (foreign key → telegram_agents.id, indexed)
- subscription_tier: Enum (starter|pro|enterprise)
- subscription_cost_usd: Decimal (99, 249, or 599)
- payment_status: Enum (pending|confirmed|failed|refunded)
- transaction_hash: String (BSC transaction hash - PROOF OF PAYMENT, indexed)
- transaction_date: Timestamp (when payment was confirmed on BSC)
- expiry_date: Timestamp ⭐ THIS IS THE GATEKEEPER - If < NOW, agent blocked
- auto_renew: Boolean (default: true)
- renewal_date: Timestamp (optional, for auto-renewal logic)
- created_at: Timestamp (default: now)
- updated_at: Timestamp (default: now)
```

#### Table 4: agent_messages (Conversation History for Analytics)
```
- id: UUID (primary key)
- agent_id: UUID (foreign key → telegram_agents.id, indexed)
- telegram_user_id: BigInt (from Telegram update)
- user_message: Text
- bot_response: Text
- tokens_used: Integer
- response_time_ms: Integer
- created_at: Timestamp (default: now)
```

#### Table 5: agent_analytics (Daily Metrics Rollup)
```
- id: UUID (primary key)
- agent_id: UUID (foreign key → telegram_agents.id, indexed)
- date: Date (daily rollup, indexed)
- total_messages: Integer
- unique_users: Integer
- total_tokens_used: Integer
- avg_response_time_ms: Float
- error_count: Integer
- created_at: Timestamp (default: now)
```

#### RLS Policies (Row Level Security - Users see only their own data)
```sql
-- Users see only their own agents
CREATE POLICY "users_see_own_agents" ON telegram_agents
  FOR SELECT USING (auth.uid() = user_id);

-- Users see only their own subscriptions
CREATE POLICY "users_see_own_subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users see only messages from their own agents
CREATE POLICY "users_see_own_messages" ON agent_messages
  FOR SELECT USING (
    agent_id IN (SELECT id FROM telegram_agents WHERE user_id = auth.uid())
  );

-- Users see only analytics from their own agents
CREATE POLICY "users_see_own_analytics" ON agent_analytics
  FOR SELECT USING (
    agent_id IN (SELECT id FROM telegram_agents WHERE user_id = auth.uid())
  );
```

---

## 🚨 CRITICAL: At the End of Implementation

**Implementation AI MUST create**: `SUPABASE_DATABASE_MIGRATIONS.md`

This file will contain the complete, ready-to-run SQL migrations:
- All CREATE TABLE statements (with exact column types and constraints)
- All CREATE INDEX statements
- All CREATE POLICY statements (RLS)
- All ALTER TABLE statements (enable RLS)
- Step-by-step instructions for Supabase SQL editor

**User will then**:
1. Open Supabase SQL editor
2. Copy-paste the SQL from `SUPABASE_DATABASE_MIGRATIONS.md`
3. Run it (takes 5 seconds)
4. System is ready to go

---

## Implementation Tasks (Priority Order)

### Phase 0: Wallet Connection & Payment Gating (CRITICAL - DO FIRST)

#### Task 0.1: Wallet Connection Modal
**Location**: `src/components/WalletConnectModal.tsx` (new component)
**Requirements**:
- Modal shown when user clicks "Deploy Agent Now" without connected wallet
- Use thirdweb's ConnectWallet component (already installed)
- Supports: MetaMask, WalletConnect, Ledger, Trezor, Coinbase Wallet, Trust Wallet, etc. (thirdweb handles all)
- User connects with their preferred wallet provider
- Store `wallet_address` in Supabase users table after connection
- Close modal after connection successful
- Button: "Connect Wallet" → triggers thirdweb connection (wallet-agnostic)

#### Task 0.2: Wallet Guard on Deploy Button
**Location**: `src/components/sidebarComponents/sidebarCreateAgent.tsx` (enhance)
**Requirements**:
```typescript
// Pseudocode - Uses thirdweb ConnectWallet (already installed)
import { useContract, useAddress } from '@thirdweb-dev/react';

const handleDeployClick = () => {
  const address = useAddress(); // Get connected wallet from thirdweb
  if (!address) {
    // Show modal - thirdweb handles wallet selection
    showWalletConnectModal(); // User chooses MetaMask, Ledger, Coinbase, etc.
  } else {
    setSelectedAgent('telegram');
    // Opens createAITelegramAgent form with connected wallet ready for payment
  }
};
```

#### Task 0.3: Step 3 - Payment Processing (THE GATEKEEPER)
**Location**: `src/components/sidebarComponents/createAITelegramAgent.tsx` (enhance Step 3)
**Requirements**:
- Render current Step 3 (pricing selection)
- Add "Pay with [Connected Wallet]" button after tier selection (uses thirdweb)
- On click:
  1. Prepare transaction: Send USDT from user wallet to `VITE_SMARTSENTINELS_WALLET`
  2. Amount = tier price (99/249/599 USDT)
  3. Show wallet popup (whichever wallet user connected via thirdweb - MetaMask, Ledger, Coinbase, etc.)
  4. User approves transaction in their wallet
  5. Listen for transaction on BSC using thirdweb/ethers.js
  6. Once confirmed (1-3 blocks):
     - Create subscription record in Supabase with:
       - payment_tx_hash
       - expiry_date = NOW + 30 days
       - status = "active"
     - Move to Step 4 (Deploy button enabled)
  7. If failed:
     - Show error message
     - Allow retry (user can use same or different wallet)

#### Task 0.4: Webhook Payment Check (THE ENFORCER)
**Location**: `api/webhook/telegram.ts` (deployed to Vercel)
**Requirements**:
```typescript
// Pseudocode
async function handleTelegramMessage(update) {
  const agent = await getAgent(agentId);
  const subscription = await getLatestSubscription(agent.user_id, agent.id);
  
  // CHECK IF SUBSCRIPTION ACTIVE
  if (!subscription || subscription.expiry_date < NOW) {
    // AGENT BLOCKED - NO PAYMENT
    return sendTelegramMessage(
      chatId,
      "This agent's subscription has expired. Owner needs to renew payment."
    );
  }
  
  // PAYMENT IS VALID - PROCESS NORMALLY
  const response = await generateBotResponse(userMessage);
  return sendTelegramMessage(chatId, response);
}
```

#### Task 0.5: Subscription Status Tracking
**Location**: `lib/subscriptionManager.ts` (new file)
**Requirements**:
- Function: `isSubscriptionActive(agentId): Promise<boolean>`
- Check: Latest subscription for agent + is expiry_date in future?
- Used by: Webhook, My Agents display, Admin dashboard
- Scheduled job: Daily check for expiring subscriptions (send renewal reminder emails)

---

### Phase 1: Core Infrastructure

#### Task 1.1: PDF Extraction Utility
**Location**: `src/utils/extractPdfText.ts`
**Requirements**:
- Install: Check if `pdf-parse` or `pdfjs-dist` already installed
- Create: `async extractPdfText(file: File): Promise<string>`
- Extract text, max 5000 characters
- Handle errors gracefully
- Clean whitespace

#### Task 1.2: Website Content Scraping
**Location**: `api/create-telegram-agent.ts` → `extractProjectInfo()`
**Requirements**:
- Enhance current Gemini scraping
- Extract structured data (project name, features, team, links)
- Max 3000 characters
- Fallback handling

#### Task 1.3: Supabase Setup
**Location**: `lib/supabase.ts` (new file)
**Requirements**:
- Supabase client initialization
- Helper functions for CRUD operations
- RLS policies (users see own agents, admins see all)
- Export functions listed in schema section

#### Task 1.4: Vercel Deployment (Only after payment verified)
**Location**: `api/deployBotToVercel.ts` (new file)
**Requirements**:
- Called from Step 4 after payment confirmed
- Deploy bot with subscription check built-in
- Store vercel_project_id, webhook_url in Supabase

#### Task 1.5: Telegram Webhook Handler
**Location**: `api/webhook/telegram.ts` (on Vercel)
**Requirements**:
- FIRST: Check subscription is active (see Task 0.4)
- Then: Process message with Gemini
- Save message to agent_messages table for analytics
- Track tokens, response time

---

### Phase 2: My Agents Enhancement (Sidebar Integration)

#### Task 2.1: Enhanced My Agents Component
**Location**: `src/components/sidebarComponents/sidebarMyAgents.tsx` (enhance)
**Requirements**:
- Load agents from Supabase (not localStorage)
- Display agent cards with:
  - Agent name
  - Status badge: Active | Expired | Deploying
  - Subscription info: "Expires in 15 days" or "Expired"
  - Quick stats: Messages today, last message timestamp
- Action buttons:
  - Settings (edit personality, triggers, FAQs)
  - Analytics (view messages chart)
  - Renew (if expired - shows payment modal)
  - Delete (with confirmation)
- Color coding:
  - Green badge for Active
  - Red badge for Expired
  - Yellow badge for Deploying

#### Task 2.2: Agent Settings Panel
**Location**: `src/components/sidebarComponents/AgentSettingsPanel.tsx`
**Requirements**:
- User can modify (stored in telegram_agents table):
  - Personality (predefined 5 styles)
  - Trigger keywords
  - Custom FAQs
  - Additional context
- Cannot modify:
  - Project name, website, whitepaper (create new agent)
  - Pricing tier (start new subscription)
  - User (obviously)
- Changes apply immediately to webhook (no redeploy)
- Save to Supabase

#### Task 2.3: Agent Analytics Panel (In My Agents)
**Location**: `src/components/sidebarComponents/AgentAnalyticsPanel.tsx`
**Requirements**:
- Simple charts showing:
  - Messages per day (last 7 days)
  - Total messages all-time
  - Active users today
  - Last message timestamp
- Metrics:
  - Status: Active/Expired
  - Next renewal: "15 days" or "RENEW NOW"
  - Uptime: "100%"
- No separate dashboard - embedded in sidebar component

#### Task 2.4: Subscription Renewal Flow
**Location**: `src/components/sidebarComponents/RenewSubscriptionModal.tsx`
**Requirements**:
- Shown when user clicks "Renew" on expired agent
- Display same Step 3 UI (pricing, payment button)
- After payment: Update expiry_date to NOW + 30 days
- Agent restarts working immediately
- Show success message

---

### Phase 3: Admin Dashboard

#### Task 3.1: Admin Dashboard Layout
**Location**: `src/pages/AdminDashboard.tsx` (enhance)
**Requirements**:
- Tabs:
  - All Agents (table of all deployed agents)
  - Analytics (revenue, messages, active agents)
  - Subscriptions (payment history, renewals)
  - Users (manage user accounts)
- Only admins can access (check user role)

#### Task 3.2: All Agents Table
**Location**: `src/components/admin/AllAgentsTable.tsx`
**Requirements**:
- Columns: Project | Bot Handle | Owner Wallet | Status | Messages | Tier | Renewal | Actions
- Search/filter by owner, tier, status
- Actions: View analytics, pause, delete, view conversation
- Responsive table

#### Task 3.3: Revenue Analytics
**Location**: `src/components/admin/RevenueAnalytics.tsx`
**Requirements**:
- Total revenue (all-time)
- Revenue by tier (how many Starter, Pro, Enterprise active)
- Revenue this month
- Chart: Monthly revenue trend
- Chart: Subscription renewals (upcoming expirations)

#### Task 3.4: Admin Payment Records
**Location**: `src/components/admin/PaymentRecords.tsx`
**Requirements**:
- View all payments: User Wallet | Amount | Tier | Date | TX Hash | Status
- Filter by date range, tier, status
- Verify TX on BSC: Click tx hash → opens BSccan
- Manually refund (NOT RECOMMENDED per user spec, but technical capability)

---

### Phase 4: Payment System Implementation

#### Task 4.1: USDT Payment Integration
**Location**: `lib/blockchain.ts` (new file)
**Requirements**:
- Web3 utilities for BSC (using thirdweb - already installed)
- Function: `sendUsdtPayment(walletAddress, amount, recipientWallet)`
- Use thirdweb's contract utilities (already available)
- Handle approval flow for ANY connected wallet (thirdweb handles all wallet types)
- Listen for transaction confirmation on BSC
- Return tx hash
- Note: Thirdweb abstracts wallet differences - no wallet-specific logic needed

#### Task 4.2: Transaction Verification
**Location**: `api/verifyBscTransaction.ts` (new file)
**Requirements**:
- Called after user sends transaction
- Query BSC (via Alchemy, Infura, or RPC) for tx status
- Confirm: USDT transferred, amount correct, to our wallet
- Create subscription record in Supabase
- Return success/failure

#### Task 4.3: Subscription Expiry Checker
**Location**: `api/cron/checkSubscriptionExpiry.ts` (Vercel Cron)
**Requirements**:
- Run daily at midnight UTC
- Find all subscriptions expiring in 24 hours
- Send email: "Your agent will stop in 24 hours. Renew now: [link]"
- Find all expired subscriptions
- Update status to "expired"

---

### Where Agent Settings Are Held

**THE ANSWER:**

```
Agent configuration is stored in TWO places:

1. STATIC CONFIG (created once, rarely changes):
   Location: Supabase table `telegram_agents`
   Fields:
   - project_name
   - bot_handle
   - bot_token (encrypted)
   - website_url
   - whitepaper_url
   - knowledge_base (JSON)
   - personality
   - custom_personality
   - triggers (array)
   - custom_faqs
   - additional_info
   - pricing_tier
   
   Accessed by: Telegram webhook loads this on startup

2. DYNAMIC STATE (changes frequently):
   Location: Supabase table `subscriptions`
   Fields:
   - expiry_date ← THE KEY FIELD
   - status (active/expired)
   - payment_tx_hash
   - renewal_reminder_sent
   
   Accessed by: Telegram webhook checks EVERY MESSAGE

3. RUNTIME STATE (per conversation):
   Location: Conversation history stored in Supabase `agent_messages`
   Used by: Gemini context window for multi-turn conversations
   
   Accessed by: Telegram webhook loads last 10 messages for context

FLOW:
   User opens My Agents sidebar
   ↓
   Load from Supabase telegram_agents table (agent config)
   ↓
   Load from Supabase subscriptions table (payment status)
   ↓
   Display agent card with status
   ↓
   User can:
   - Edit agent config → update telegram_agents table
   - Renew subscription → update subscriptions table (add 30 days)
   - View analytics → query agent_messages table

WEBHOOK FLOW:
   Telegram sends message to webhook
   ↓
   Load agent config from telegram_agents (by agentId)
   ↓
   Check subscriptions table for agent_id
   ↓
   If expiry_date < NOW: Return "Subscription expired"
   ↓
   If expiry_date > NOW: 
      - Load knowledge_base + personality from telegram_agents
      - Load last 10 messages from agent_messages
      - Call Gemini
      - Save response to agent_messages
      - Increment message_count
      ↓
   Done
```

---

## Critical Database Relationships

```
users (1) ──→ (Many) telegram_agents
              ├─ user_id = agents belong to this user
              
users (1) ──→ (Many) subscriptions
              ├─ user_id = subscriptions belong to this user
              
telegram_agents (1) ──→ (Many) subscriptions
                  ├─ agent_id = multiple subscriptions (one per renewal)
                  
telegram_agents (1) ──→ (Many) agent_messages
                  ├─ agent_id = all messages for this agent
                  
telegram_agents (1) ──→ (Many) agent_analytics
                  ├─ agent_id = daily analytics for this agent
```

---

## File Structure (Summary)

```
src/
├── api/
│   ├── create-telegram-agent.ts [ENHANCE]
│   ├── deployBotToVercel.ts [NEW]
│   ├── webhook/
│   │   └── telegram.ts [NEW, deployed to Vercel] ← CHECKS SUBSCRIPTION FIRST
│   ├── verifyBscTransaction.ts [NEW]
│   └── cron/
│       └── checkSubscriptionExpiry.ts [NEW]
├── components/
│   ├── WalletConnectModal.tsx [NEW] ← GATES DEPLOYMENT
│   ├── admin/
│   │   ├── AllAgentsTable.tsx [NEW]
│   │   ├── RevenueAnalytics.tsx [NEW]
│   │   └── PaymentRecords.tsx [NEW]
│   └── sidebarComponents/
│       ├── sidebarMyAgents.tsx [ENHANCE]
│       ├── AgentSettingsPanel.tsx [NEW]
│       ├── AgentAnalyticsPanel.tsx [NEW]
│       └── RenewSubscriptionModal.tsx [NEW]
├── lib/
│   ├── supabase.ts [NEW]
│   ├── blockchain.ts [NEW] ← USDT TRANSACTIONS
│   └── subscriptionManager.ts [NEW] ← SUBSCRIPTION CHECKS
└── utils/
    └── extractPdfText.ts [NEW]
```

---

## Environment Variables (UPDATED)

```
# Vercel ✅ HAVE THIS
VITE_VERCEL_TOKEN=nDdgqVjqzKRjB6ficlJQ0zWP

# Supabase ✅ HAVE THESE
VITE_SUPABASE_URL=https://ygjvuqnkstosfjqwcijo.supabase.co
VITE_SUPABASE_KEY=sb_publishable_8B7S3veSB-8593PwWlcq1Q_oAaHkD0m

# Gemini ✅ HAVE THIS
VITE_GEMINI_API_KEY=AIzaSyAYIoD3_BG8x0OaSQXb0_5xVF0fPCoSbNA

# Telegram ✅ HAVE THIS
VITE_TELEGRAM_BOT_TOKEN=8454365461:AAH0rC243sdxWtBwa-vMv8c796vdtISZ6no

# Blockchain - CRITICAL FOR PAYMENTS ✅ HAVE THESE
VITE_SMARTSENTINELS_WALLET=0x4e21f74143660ee576f4d2ac26bd30729a849f55
VITE_USDT_CONTRACT=0x55d398326f99059fF775485246999027B3197955 [BSC USDT - constant]
VITE_BSC_RPC_URL=https://bsc-dataseed1.binance.org

# API (set after Vercel deployment)
VITE_API_URL=https://your-vercel-domain.com
```

---

## What Needs to Happen for Payment-Gated System to Work

```
ESSENTIAL COMPONENTS:

1. ✅ Wallet Connection (Phase 0.1-0.2)
   - User must connect wallet via thirdweb
   - Thirdweb supports all major wallets out-of-box
   - Wallet address stored in Supabase users table
   - Without this: Deploy button disabled

2. ✅ Step 3 Payment Modal (Phase 0.3)
   - User selects tier
   - Clicks "Pay with MetaMask"
   - MetaMask pops up
   - User approves USDT transfer
   - Payment processed on BSC

3. ✅ Transaction Verification (Phase 0.4 + 4.2)
   - Listen for transaction confirmation on BSC
   - Verify amount correct, sent to YOUR_WALLET
   - Create subscription record in Supabase
   - Enable Step 4 Deploy button

4. ✅ Webhook Subscription Check (Phase 0.4)
   - Every message to bot checks subscriptions table
   - If expiry_date < NOW: Agent blocks message
   - If expiry_date > NOW: Agent processes normally

5. ✅ Subscription Renewal (Phase 2.4)
   - When subscription expires, show "Renew" button
   - User clicks → Same payment flow
   - New subscription created for next 30 days
   - Agent auto-resumes

6. ✅ Cron Job (Phase 4.3)
   - Daily check for expiring subscriptions
   - Send renewal reminder emails 24 hours before
   - Auto-update status to "expired" when time passes

KEYS NEEDED:
- Vercel API Token (deploy bots)
- Supabase URL + Key (database)
- Gemini API Key (AI)
- BSC RPC Endpoint (verify transactions)
- Your Treasury Wallet Address (receive USDT - any EVM wallet address)
- Telegram Bot Token (send/receive messages)
```

---

## Success Criteria

✅ Users MUST connect wallet before creating agent
✅ Agents ONLY deploy after successful USDT payment
✅ Agents STOP processing messages after subscription expires
✅ Users can renew subscription to reactivate agent
✅ Admin can see all payments, agents, revenue
✅ All settings persist in Supabase (not localStorage)
✅ Payment verification via BSC blockchain
✅ No refunds (per spec)
✅ Payment-driven lifecycle (payment = alive, no payment = dead)

---

## Notes for Implementation AI Agent

1. **DO PHASE 0 FIRST** - Payment gating is critical, do it before anything else
2. **Test on BSC Testnet** - Use testnet USDT first, verify transactions
3. **Webhook must check subscription FIRST** - Before any Gemini call
4. **Never deploy without payment** - Authorization check in deployment code
5. **Subscription table is the source of truth** - expiry_date determines agent availability
6. **User can modify agent config anytime** - Stored in telegram_agents table
7. **Match SmartSentinels design** - Glass morphism, gradients, animations
8. **Secure payment flow** - Verify transactions before enabling agents


---

## Technical Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: Vercel Functions + Node.js + TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini 2.5 Flash-Lite
- **Deployment**: Vercel
- **Telegram**: Bot API
- **Blockchain**: BSC (USDT payments)
- **File Processing**: pdfjs-dist or pdf-parse
- **HTTP Client**: Fetch API / node-fetch

### Database Schema (Supabase)
```
Tables needed:
1. users
   - id (uuid, pk)
   - email (string, unique)
   - wallet_address (string)
   - created_at (timestamp)

2. telegram_agents
   - id (uuid, pk)
   - user_id (uuid, fk → users)
   - project_name (string)
   - bot_handle (string, unique)
   - bot_token (string, encrypted)
   - website_url (string)
   - whitepaper_url (string) [IPFS or file path]
   - personality (enum: funny|professional|technical|casual|custom)
   - custom_personality (text)
   - triggers (jsonb array)
   - custom_faqs (text)
   - additional_info (text)
   - pricing_tier (enum: starter|pro|enterprise)
   - knowledge_base (jsonb) [extracted + processed content]
   - deployment_status (enum: draft|deploying|deployed|failed)
   - vercel_project_id (string)
   - vercel_deployment_url (string)
   - telegram_webhook_url (string)
   - message_count (integer, default 0)
   - created_at (timestamp)
   - updated_at (timestamp)
   - is_active (boolean, default true)

3. subscriptions
   - id (uuid, pk)
   - user_id (uuid, fk → users)
   - agent_id (uuid, fk → telegram_agents)
   - tier (enum: starter|pro|enterprise)
   - payment_tx_hash (string) [BSC transaction hash]
   - payment_amount_usdt (decimal)
   - renewal_date (timestamp)
   - created_at (timestamp)

4. agent_messages (for analytics)
   - id (uuid, pk)
   - agent_id (uuid, fk → telegram_agents)
   - user_message (text)
   - bot_response (text)
   - tokens_used (integer)
   - created_at (timestamp)

5. agent_analytics
   - id (uuid, pk)
   - agent_id (uuid, fk → telegram_agents)
   - total_messages (integer)
   - total_users (integer)
   - avg_response_time (float)
   - error_count (integer)
   - date (date)
```

---

## Implementation Tasks (Priority Order)

### Phase 1: Core Infrastructure (Critical Path)

#### Task 1.1: PDF Extraction Utility
**Location**: `src/utils/extractPdfText.ts`
**Requirements**:
- Install: Check if `pdf-parse` or `pdfjs-dist` already installed
- Create utility function: `async extractPdfText(file: File): Promise<string>`
- Extract text from PDF with max 5000 characters
- Handle errors gracefully (corrupt PDFs, permissions, etc.)
- Remove headers, footers, page numbers
- Clean and normalize whitespace
- Used by: Form submission → API endpoint

#### Task 1.2: Website Content Scraping Optimization
**Location**: `api/create-telegram-agent.ts` → `extractProjectInfo()`
**Requirements**:
- Current Gemini scraping already works but enhance it
- Extract: project name, description, features, tokenomics, team, links, FAQ
- Handle different website structures (markdown, plain text, semi-structured)
- Max 3000 characters of content
- Fallback if website unreachable
- Combine with PDF content into knowledge_base
- Return structured JSON with all extracted fields

#### Task 1.3: Supabase Setup & Database Integration
**Location**: `lib/supabase.ts` (new file) + `api/` endpoints
**Requirements**:
- Create Supabase client: `createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY)`
- Create all tables listed in Database Schema above
- Create RLS policies:
  - Users can only see/edit their own agents
  - Admins can see all agents
  - Public read-only access to active agent metadata
- Export helper functions:
  - `createAgent(agentData): Promise<Agent>`
  - `getAgent(agentId): Promise<Agent>`
  - `updateAgent(agentId, updates): Promise<void>`
  - `deleteAgent(agentId): Promise<void>`
  - `getUserAgents(userId): Promise<Agent[]>`
  - `createSubscription(subscriptionData): Promise<void>`
  - `saveAgentMessage(agentId, message, response): Promise<void>`
  - `getAgentAnalytics(agentId): Promise<Analytics>`

#### Task 1.4: Vercel Deployment Automation
**Location**: `api/deployBotToVercel.ts` (new file)
**Requirements**:
- Use Vercel API: https://vercel.com/docs/rest-api
- Need VERCEL_TOKEN environment variable
- Function: `async deployBotToVercel(botConfig: BotConfig): Promise<{projectId, deploymentUrl}>`
- Steps:
  1. Create Vercel project named: `smartsentinels-bot-${botHandle}`
  2. Create `api/webhook/telegram.ts` handler with bot logic
  3. Set environment variables: TELEGRAM_BOT_TOKEN, GEMINI_API_KEY, AGENT_ID, SUPABASE_URL, SUPABASE_KEY
  4. Deploy code
  5. Wait for deployment to complete
  6. Return: projectId, deploymentUrl, webhookUrl
- Error handling: Rollback if deployment fails
- Store deployment info in Supabase

#### Task 1.5: Telegram Webhook Handler
**Location**: `api/webhook/telegram.ts` (deployed to Vercel)
**Requirements**:
- Receives POST requests from Telegram
- Extract agentId from environment variable
- Load agent config from Supabase
- Load conversation history from Supabase
- Call Gemini with: system instruction (personality), knowledge base, user message, history
- Generate response
- Send response back to Telegram
- Save message/response to Supabase for analytics
- Handle errors: Return 200 OK even if processing fails (Telegram retries)
- Rate limiting: Check usage against pricing tier limits
- Metrics: Record tokens used, response time

---

### Phase 2: Admin Dashboard

#### Task 2.1: Admin Dashboard Layout
**Location**: `src/pages/AdminDashboard.tsx` (already exists, needs enhancement)
**Requirements**:
- Navigation:
  - All Agents (list view)
  - Analytics (charts, graphs)
  - Subscriptions & Payments
  - User Management
  - System Health
- Responsive design (mobile-friendly)
- Real-time data updates (WebSocket optional, polling fine for MVP)

#### Task 2.2: All Agents Management View
**Location**: `src/components/admin/AllAgentsTable.tsx` (new component)
**Requirements**:
- Table with columns: Project Name | Bot Handle | Owner | Status | Messages | Tier | Actions
- Search & filter by status/tier/user
- Actions per agent:
  - View analytics
  - Edit personality
  - Update knowledge base
  - Pause/Resume
  - View conversation history
  - Delete
  - View deployment details
- Bulk actions: Pause multiple, resume multiple
- Sort: by creation date, messages, status

#### Task 2.3: Agent Edit Modal
**Location**: `src/components/admin/EditAgentModal.tsx` (new component)
**Requirements**:
- Allow admin to:
  - Change personality style or custom description
  - Update additional context/knowledge
  - Add/remove trigger keywords
  - Modify custom FAQs
  - Update website URL or whitepaper (re-extract content)
  - Change pricing tier
  - Pause/resume bot
- Changes applied immediately (no redeploy needed if only personality/triggers change)
- If knowledge base changed: flag for re-indexing
- Save changes to Supabase
- Audit log: Track who changed what and when

#### Task 2.4: Analytics Dashboard
**Location**: `src/components/admin/AnalyticsDashboard.tsx` (new component)
**Requirements**:
- Charts (use Recharts or similar):
  - Messages per day (last 30 days)
  - Active users by agent
  - Error rate by agent
  - Response time trends
  - Token usage by tier
- Key metrics:
  - Total agents deployed
  - Total messages processed
  - Active conversations
  - Revenue generated (USDT)
  - System uptime
- Drill-down: Click on agent → detailed metrics for that agent
- Export: CSV of analytics data

#### Task 2.5: Subscription & Payments Management
**Location**: `src/components/admin/SubscriptionsPage.tsx` (new component)
**Requirements**:
- View all subscriptions: Agent | User | Tier | Payment Date | Renewal Date | Status
- Payment history: Transaction hash | Amount | Status | Date
- Manual actions:
  - Extend subscription
  - Upgrade tier
  - Issue refund
- Alerts for expiring subscriptions
- Revenue report: Monthly/yearly totals by tier

---

### Phase 3: User-Level Agent Management (My Agents Enhancement)

#### Task 3.1: Enhanced My Agents Sidebar Component
**Location**: `src/components/sidebarComponents/sidebarMyAgents.tsx` (enhancement)
**Requirements**:
- Current: Displays list of user's agents
- Add to each agent card:
  - Status badge (active | deploying | paused | failed)
  - Quick stats: Message count today, active status
  - Action buttons:
    - Settings (opens edit panel)
    - View Analytics
    - Pause/Resume toggle
    - Delete
  - Click agent → opens Agent Control Panel (new)
- Sections:
  - Active Agents
  - Paused Agents
  - Deploying Agents
  - Failed Deployments
- Empty state: "No agents yet. Create one!" with link to create form

#### Task 3.2: User Agent Control Panel
**Location**: `src/components/sidebarComponents/AgentControlPanel.tsx` (new component)
**Requirements**:
- User can:
  - View agent status & deployment details
  - See real-time message count & active users
  - View last 10 messages (user questions + bot responses)
  - Update personality (predefined styles only, not custom)
  - Add/remove trigger keywords
  - Update custom FAQs
  - Pause/Resume bot
  - Download conversation history
  - View error logs (if any)
- Cannot:
  - Change pricing tier (admin only)
  - Delete agent (requires confirmation)
  - Access other users' agents
- Real-time updates: Refresh message count every 30 seconds
- Visual design: Match sidebar style with glass-morphism

#### Task 3.3: User Agent Settings Panel
**Location**: `src/components/sidebarComponents/AgentSettingsPanel.tsx` (new component)
**Requirements**:
- User can modify:
  - Personality: Choose from 5 predefined styles (not custom description)
  - Trigger keywords: Add/remove
  - Custom FAQs: Edit Q&A pairs
  - Bot name/description (cosmetic only)
  - Pause/Resume toggle
- Cannot modify:
  - Project name (create new agent if needed)
  - Website URL or whitepaper (create new agent)
  - Pricing tier
- Save changes: Update Supabase, apply immediately
- Visual feedback: Loading state, success toast, error handling
- Confirmation dialogs for destructive actions

#### Task 3.4: Real-time Agent Analytics (User View)
**Location**: `src/components/sidebarComponents/AgentAnalyticsPanel.tsx` (new component)
**Requirements**:
- Simple charts (Recharts):
  - Messages today / this week / all-time
  - Active users (today)
  - Error count (if any)
  - Response time average
- Key metrics:
  - Status: Active/Paused
  - Last message: "2 hours ago"
  - Uptime: "99.8%"
  - Next billing date
  - Current tier usage %
- Download options: Export chat history, export analytics CSV
- Alert: "Approaching message limit for Starter tier (850/1000 messages)"

---

### Phase 4: Billing & Authentication

#### Task 4.1: USDT Payment Integration (BSC)
**Location**: `api/payments/processBscPayment.ts` (new file)
**Requirements**:
- Detect wallet connection (MetaMask, WalletConnect, etc.)
- Frontend: Show USDT payment button per tier
- Pricing:
  - Starter: 99 USDT/month
  - Pro: 249 USDT/month
  - Enterprise: 599 USDT/month
- Create payment flow:
  1. User clicks "Subscribe to Pro"
  2. Modal shows: Price, tier benefits, wallet connect button
  3. User approves USDT transfer to SmartSentinels wallet (treasury address)
  4. Listen for transaction confirmation on BSC
  5. Once confirmed → Update Supabase subscription record
  6. Send success email + enable tier features
- Store transaction hash in Supabase
- Refund logic: User initiates refund → Admin approves → Send USDT back
- Webhook: Listen for BSC transactions (optional, can poll initially)

#### Task 4.2: User Authentication Integration
**Location**: Enhance existing auth system
**Requirements**:
- Sync user_id from auth system to Supabase users table
- Store wallet_address in user profile
- Check auth before allowing agent creation/modification
- Ensure users can only access their own agents
- Admin check: Users with admin role can access admin dashboard

---

### Phase 5: Monitoring & Maintenance

#### Task 5.1: Agent Health Monitoring
**Location**: `api/monitoring/checkAgentHealth.ts` (new file)
**Requirements**:
- Cron job (daily or hourly):
  - Check each deployed agent's webhook
  - Test Telegram connection
  - Monitor Vercel deployment status
  - Track error rates
  - Alert if agent down or slow
- Alerts: Email admin if agent fails
- Auto-recovery: Attempt to redeploy if failed

#### Task 5.2: Logging & Error Tracking
**Requirements**:
- Log all important events:
  - Bot deployment success/failure
  - Gemini API calls (count, tokens)
  - Message processing (success/error)
  - Webhook receives (latency)
  - Payment transactions
  - Configuration changes
- Store in: Supabase logs table or external service (e.g., Sentry)
- Admin access: View recent logs, filter by agent/user/type

---

## File Structure (Summary)

```
src/
├── api/
│   ├── create-telegram-agent.ts [ENHANCE]
│   ├── deployBotToVercel.ts [NEW]
│   ├── webhook/
│   │   └── telegram.ts [NEW, deployed to Vercel]
│   ├── payments/
│   │   └── processBscPayment.ts [NEW]
│   └── monitoring/
│       └── checkAgentHealth.ts [NEW]
├── components/
│   ├── admin/
│   │   ├── AllAgentsTable.tsx [NEW]
│   │   ├── EditAgentModal.tsx [NEW]
│   │   ├── AnalyticsDashboard.tsx [NEW]
│   │   └── SubscriptionsPage.tsx [NEW]
│   └── sidebarComponents/
│       ├── sidebarMyAgents.tsx [ENHANCE]
│       ├── AgentControlPanel.tsx [NEW]
│       ├── AgentSettingsPanel.tsx [NEW]
│       └── AgentAnalyticsPanel.tsx [NEW]
├── lib/
│   ├── supabase.ts [NEW]
│   └── blockchain.ts [NEW, USDT/payment utilities]
└── utils/
    └── extractPdfText.ts [NEW]
```

---

## Environment Variables

```
# Vercel
VITE_VERCEL_TOKEN=your_vercel_token

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_anon_key

# Gemini
VITE_GEMINI_API_KEY=your_gemini_key

# Telegram
VITE_TELEGRAM_BOT_TOKEN=your_bot_token [Per agent, stored encrypted in DB]

# Blockchain
VITE_SMARTSENTINELS_WALLET=0x... [Treasury address for payments]
VITE_USDT_CONTRACT=0x55d398326f99059fF775485246999027B3197955 [BSC USDT]

# API
VITE_API_URL=https://api.yourdomain.com
```

---

## Testing Checklist

- [ ] PDF extraction works with various PDF sizes/formats
- [ ] Website scraping handles different HTML structures
- [ ] Vercel deployment creates project and deploys code successfully
- [ ] Telegram webhook receives and processes messages
- [ ] Supabase CRUD operations work correctly
- [ ] Admin dashboard loads all agents and analytics
- [ ] User can modify agent settings without admin
- [ ] USDT payment flow works on BSC testnet
- [ ] Real-time analytics updates
- [ ] Rate limiting prevents abuse
- [ ] Error handling works (graceful degradation)
- [ ] Mobile responsive across all components

---

## Success Criteria

✅ Users can create, deploy, and manage custom Telegram AI agents
✅ Admins have full control dashboard with analytics
✅ Agents are powered by Gemini with custom knowledge bases
✅ Payments in USDT on BSC (no Stripe)
✅ Real-time monitoring and health checks
✅ Scalable architecture (Vercel + Supabase)
✅ Full audit trail and logging
✅ User and admin role separation

---

## Notes for Implementation AI Agent

**🎯 CRITICAL: This is a COMPLETE, AUTONOMOUS implementation task. Do everything in ONE pass with minimal user intervention.**

### What You Must Deliver:

1. **ALL Phase 0 code** - Wallet connection, payment processing, subscription checking
2. **ALL Phase 1 code** - PDF extraction, Supabase integration, Vercel deployment, Telegram webhook
3. **ALL Phase 2 code** - My Agents enhancement with settings, analytics, renewal flow
4. **SQL Migration File** - At the end, create `SUPABASE_DATABASE_MIGRATIONS.md` with:
   - Complete, ready-to-copy-paste SQL for all 5 tables
   - RLS policies
   - Indexes
   - Instructions for running in Supabase SQL editor

### Implementation Order (Do in this sequence):

1. **First**: Create `lib/supabase.ts` - Initialize Supabase client with helper functions
2. **Second**: Create all 5 database tables (run SQL migrations immediately after code)
3. **Third**: Create `lib/blockchain.ts` - USDT payment utilities using thirdweb
4. **Fourth**: Create `src/components/WalletConnectModal.tsx` - Wallet connection gate
5. **Fifth**: Enhance `src/components/sidebarComponents/sidebarCreateAgent.tsx` - Wallet guard
6. **Sixth**: Enhance `src/components/sidebarComponents/createAITelegramAgent.tsx` - Payment in Step 3
7. **Seventh**: Create `lib/subscriptionManager.ts` - Subscription status checker
8. **Eighth**: Create `api/webhook/telegram.ts` - Payment-gated webhook handler
9. **Ninth**: Create `api/deployBotToVercel.ts` - Vercel deployment automation
10. **Tenth**: Enhance `src/components/sidebarComponents/sidebarMyAgents.tsx` - Show agent status + renewal
11. **Eleventh**: Create `src/components/sidebarComponents/AgentSettingsPanel.tsx` - User settings UI
12. **Twelfth**: Create `src/components/sidebarComponents/AgentAnalyticsPanel.tsx` - Analytics UI
13. **Final**: Create `SUPABASE_DATABASE_MIGRATIONS.md` - Complete SQL migrations ready to run

### Code Quality Requirements:

- ✅ All TypeScript files must be type-safe (no `any` types)
- ✅ All async operations need error handling (try-catch)
- ✅ All Supabase queries must use RLS (Row Level Security)
- ✅ All environment variables from `.env` must be validated
- ✅ All functions must have JSDoc comments
- ✅ No console.logs - use proper logging only for errors
- ✅ All imports must be correct and files must compile without errors

### Critical Payment Flow Implementation:

The webhook MUST:
1. Check subscription.expiry_date FIRST (before any Gemini call)
2. Return "Subscription expired" if expiry_date < NOW
3. Only process messages if subscription is active
4. Never allow agent to function without active subscription

### Supabase Migration File Format:

At the very end, create a file named: `SUPABASE_DATABASE_MIGRATIONS.md`

Format:
```markdown
# Supabase Database Migrations

Copy and paste the SQL below into your Supabase SQL editor and run it.

## Step 1: Create Tables
\`\`\`sql
-- Paste all CREATE TABLE statements here
\`\`\`

## Step 2: Create Indexes
\`\`\`sql
-- Paste all CREATE INDEX statements here
\`\`\`

## Step 3: Create RLS Policies
\`\`\`sql
-- Paste all CREATE POLICY statements here
\`\`\`

## Step 4: Enable RLS
\`\`\`sql
-- Paste all ALTER TABLE statements here
\`\`\`
```

### User Intervention Points (Minimize These):

1. **ONLY**: Add the 8 environment variables to `.env` (already provided)
2. **ONLY**: Run the SQL migrations from `SUPABASE_DATABASE_MIGRATIONS.md` in Supabase SQL editor
3. **THEN**: Everything is live and working

### Success = Zero additional configuration needed

Once you (the implementation AI) are done:
- User adds env vars to `.env`
- User runs your SQL migrations
- User restarts dev server
- System is LIVE and fully functional

### Remember:

1. Every file you create must have NO errors when compiled
2. All imports must resolve correctly
3. All functions must be tested for logic errors
4. The SQL migrations must be 100% correct and runnable
5. The prompt is your complete spec - follow it precisely
6. When done, explicitly state: "✅ Implementation Complete"

---

## 🎯 FINAL DELIVERABLE: SUPABASE_DATABASE_MIGRATIONS.md

**This is THE most important file you will create.**

### What goes in SUPABASE_DATABASE_MIGRATIONS.md:

```markdown
# Supabase Database Migrations

**Instructions**: Copy and paste each SQL block below into your Supabase SQL editor and run it.

## Step 1: Create Tables

\`\`\`sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_users_wallet ON users(wallet_address);

-- Create telegram_agents table
CREATE TABLE telegram_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_name VARCHAR(255) NOT NULL,
  bot_handle VARCHAR(50) UNIQUE NOT NULL,
  bot_token VARCHAR(255) NOT NULL,
  website_url VARCHAR(255),
  whitepaper_url VARCHAR(255),
  personality VARCHAR(50),
  custom_personality TEXT,
  trigger_keywords JSONB,
  custom_faqs TEXT,
  additional_info TEXT,
  pricing_tier VARCHAR(20),
  knowledge_base JSONB,
  deployment_status VARCHAR(20),
  vercel_project_id VARCHAR(255),
  vercel_deployment_url VARCHAR(255),
  telegram_webhook_url VARCHAR(255),
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_telegram_agents_user ON telegram_agents(user_id);
CREATE INDEX idx_telegram_agents_status ON telegram_agents(deployment_status);

-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES telegram_agents(id) ON DELETE CASCADE,
  subscription_tier VARCHAR(20) NOT NULL,
  subscription_cost_usd DECIMAL(10, 2),
  payment_status VARCHAR(20) DEFAULT 'pending',
  transaction_hash VARCHAR(255),
  transaction_date TIMESTAMP,
  expiry_date TIMESTAMP NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  renewal_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_expiry ON subscriptions(expiry_date);

-- Create agent_messages table
CREATE TABLE agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES telegram_agents(id) ON DELETE CASCADE,
  telegram_user_id BIGINT,
  user_message TEXT,
  bot_response TEXT,
  tokens_used INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_agent_messages_agent ON agent_messages(agent_id);
CREATE INDEX idx_agent_messages_created ON agent_messages(created_at);

-- Create agent_analytics table
CREATE TABLE agent_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES telegram_agents(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_messages INTEGER,
  unique_users INTEGER,
  total_tokens_used INTEGER,
  avg_response_time_ms FLOAT,
  error_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_agent_analytics_agent ON agent_analytics(agent_id);
CREATE INDEX idx_agent_analytics_date ON agent_analytics(date);
\`\`\`

## Step 2: Enable Row Level Security (RLS)

\`\`\`sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_analytics ENABLE ROW LEVEL SECURITY;
\`\`\`

## Step 3: Create RLS Policies

\`\`\`sql
-- Users can see only their own agents
CREATE POLICY "users_see_own_agents" ON telegram_agents
  FOR SELECT USING (auth.uid() = user_id);

-- Users can see only their own subscriptions
CREATE POLICY "users_see_own_subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can see only messages from their own agents
CREATE POLICY "users_see_own_messages" ON agent_messages
  FOR SELECT USING (
    agent_id IN (SELECT id FROM telegram_agents WHERE user_id = auth.uid())
  );

-- Users can see only analytics from their own agents
CREATE POLICY "users_see_own_analytics" ON agent_analytics
  FOR SELECT USING (
    agent_id IN (SELECT id FROM telegram_agents WHERE user_id = auth.uid())
  );
\`\`\`

## Done! Your database is ready to go.
```

### Critical Success Criteria for SQL File:

✅ All 5 tables created with correct column types
✅ All foreign keys set with ON DELETE CASCADE
✅ All indexes created for frequently queried columns (user_id, agent_id, expiry_date)
✅ RLS policies prevent users from seeing other users' data
✅ expiry_date column exists on subscriptions (THE GATEKEEPER)
✅ All SQL is syntactically correct and runnable in Supabase
✅ No syntax errors - user can copy-paste and run without modification

---

## 📋 User's Checklist After Implementation:

1. ✅ All 12+ TypeScript/TSX files created and compile without errors
2. ✅ All imports resolve correctly
3. ✅ `SUPABASE_DATABASE_MIGRATIONS.md` created with copy-paste ready SQL
4. ✅ User action: Add 8 environment variables to `.env`
5. ✅ User action: Copy SQL from `SUPABASE_DATABASE_MIGRATIONS.md`
6. ✅ User action: Run SQL in Supabase SQL editor (5 seconds)
7. ✅ User action: Restart dev server (`npm run dev`)
8. ✅ System LIVE: Users can now deploy Telegram AI agents with payment-gating

---

## 🚀 When Implementation is Complete, Output This:

```
✅ IMPLEMENTATION COMPLETE

Phase 0, 1, and 2 code fully implemented.
All 12+ files created and tested.

NEXT STEPS FOR USER:
1. Add these 8 environment variables to .env:
   - VITE_VERCEL_TOKEN
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_KEY
   - VITE_GEMINI_API_KEY
   - VITE_TELEGRAM_BOT_TOKEN
   - VITE_SMARTSENTINELS_WALLET
   - VITE_USDT_CONTRACT
   - VITE_BSC_RPC_URL

2. Copy ALL SQL from SUPABASE_DATABASE_MIGRATIONS.md
3. Run SQL in Supabase SQL editor (Settings → SQL Editor → paste → run)
4. Restart dev server: npm run dev
5. System is LIVE and ready

The system is now fully payment-gated:
- Users connect wallet
- Users create agent + select pricing
- Users pay in USDT on BSC
- Agent deploys to Vercel webhook
- Telegram AI agent runs with subscription check
- Agent stops working when subscription expires
```

---

## Start with Phase 1: Core Infrastructure (Critical Path)

1. **Start with Phase 1**: Focus on core infrastructure first (Supabase → PDF → Vercel → Telegram webhook)
2. **Test incrementally**: Each file created should compile without errors
3. **Database first**: Set up Supabase tables before any code that queries them
4. **Error handling**: Every async operation needs try-catch + proper error responses
5. **Security**: Never log API keys, validate all inputs, use RLS policies
6. **Performance**: Index Supabase tables on frequently queried columns (user_id, agent_id, created_at)
7. **UI/UX**: Match existing SmartSentinels design system (glass-morphism, gradients, animations)
8. **Backward compatibility**: Existing agents (stored in localStorage) should migrate to Supabase

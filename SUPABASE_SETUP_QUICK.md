## 🚀 Quick Setup: Run This in Supabase SQL Editor NOW

**Location**: Supabase Dashboard → SQL Editor → New Query

**Copy and paste everything below, then click RUN:**

```sql
-- Airdrop Users Table
CREATE TABLE IF NOT EXISTS airdrop_users (
  id BIGSERIAL PRIMARY KEY,
  wallet_address VARCHAR(255) NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  completed_tasks TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Airdrop Task Completions Log
CREATE TABLE IF NOT EXISTS airdrop_task_completions (
  id BIGSERIAL PRIMARY KEY,
  wallet_address VARCHAR(255) NOT NULL,
  task_id VARCHAR(255) NOT NULL,
  points_earned INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (wallet_address) REFERENCES airdrop_users(wallet_address) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_airdrop_users_wallet ON airdrop_users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_airdrop_task_completions_wallet ON airdrop_task_completions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_airdrop_task_completions_task ON airdrop_task_completions(task_id);

-- Enable Row Level Security (RLS)
ALTER TABLE airdrop_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE airdrop_task_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for airdrop_users
CREATE POLICY IF NOT EXISTS airdrop_users_read ON airdrop_users
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS airdrop_users_insert ON airdrop_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS airdrop_users_update ON airdrop_users
  FOR UPDATE USING (true) WITH CHECK (true);

-- RLS Policies for airdrop_task_completions
CREATE POLICY IF NOT EXISTS airdrop_task_completions_read ON airdrop_task_completions
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS airdrop_task_completions_insert ON airdrop_task_completions
  FOR INSERT WITH CHECK (true);

-- Verifications table for manual approval tasks
CREATE TABLE IF NOT EXISTS airdrop_verifications (
  id BIGSERIAL PRIMARY KEY,
  wallet_address VARCHAR(255) NOT NULL,
  task_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  verification_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (wallet_address) REFERENCES airdrop_users(wallet_address) ON DELETE CASCADE
);

-- Create index for verifications
CREATE INDEX IF NOT EXISTS idx_airdrop_verifications_wallet ON airdrop_verifications(wallet_address);
CREATE INDEX IF NOT EXISTS idx_airdrop_verifications_status ON airdrop_verifications(status);

-- Enable RLS for verifications
ALTER TABLE airdrop_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for verifications
CREATE POLICY IF NOT EXISTS airdrop_verifications_read ON airdrop_verifications
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS airdrop_verifications_insert ON airdrop_verifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS airdrop_verifications_update ON airdrop_verifications
  FOR UPDATE USING (true) WITH CHECK (true);
```

**What this does:**
- Creates `airdrop_users` table to store wallet points
- Creates `airdrop_task_completions` table to log each task
- Creates `airdrop_verifications` table for manual tasks
- Sets up security policies so frontend can read/write
- Creates indexes for fast queries

**After running:**
1. You should see ✅ "Success" message
2. Go to "Table Editor" (left sidebar)
3. You should see 3 new tables:
   - `airdrop_users`
   - `airdrop_task_completions`
   - `airdrop_verifications`

**Then test in frontend:**
1. Connect MetaMask wallet
2. Should show "+10 pts" badge with 🦊 emoji
3. Points should appear in database table

That's it! The backend endpoint is already deployed to Vercel.

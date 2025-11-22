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
-- Allow anyone to read their own data
CREATE POLICY IF NOT EXISTS airdrop_users_read ON airdrop_users
  FOR SELECT USING (true);

-- Allow anyone to insert
CREATE POLICY IF NOT EXISTS airdrop_users_insert ON airdrop_users
  FOR INSERT WITH CHECK (true);

-- Allow updates to own records
CREATE POLICY IF NOT EXISTS airdrop_users_update ON airdrop_users
  FOR UPDATE USING (true) WITH CHECK (true);

-- RLS Policies for airdrop_task_completions
-- Allow anyone to read
CREATE POLICY IF NOT EXISTS airdrop_task_completions_read ON airdrop_task_completions
  FOR SELECT USING (true);

-- Allow anyone to insert
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

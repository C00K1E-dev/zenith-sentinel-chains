# Airdrop Backend Setup Instructions

This guide will help you set up the airdrop system backend and database.

## What Was Created

### 1. Backend Endpoint
- **File**: `api/task-complete.js`
- **Endpoint**: `POST /api/task/complete`
- **Purpose**: Handles task completion requests from the frontend
- **Auto-deployed**: This is a Vercel serverless function, so it will be deployed automatically when you push to GitHub

### 2. Database Schema
- **File**: `api/schema.sql`
- **Purpose**: Creates all required database tables and sets up security policies
- **Tables Created**:
  - `airdrop_users` - Stores user points and completed tasks
  - `airdrop_task_completions` - Logs each task completion
  - `airdrop_verifications` - Tracks verification status for manual approval tasks

### 3. Migration Script
- **File**: `api/migrate-airdrop.js`
- **Purpose**: Helps apply the schema to Supabase

## Setup Steps

### Step 1: Deploy Backend Endpoint
The backend endpoint (`api/task-complete.js`) is a Vercel serverless function. It will be automatically deployed when you:

```bash
git add .
git commit -m "Add airdrop task completion endpoint"
git push
```

### Step 2: Create Database Tables in Supabase

You have two options:

#### Option A: Manual Setup (Recommended if migration script doesn't work)

1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Open **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of `api/schema.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)

#### Option B: Automatic Migration Script

If you have Node.js installed:

1. Make sure your environment variables are set:
   ```bash
   set SUPABASE_URL=your_supabase_url
   set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Run the migration:
   ```bash
   node api/migrate-airdrop.js
   ```

### Step 3: Verify Setup

After tables are created, verify they exist:

1. In Supabase dashboard
2. Go to **Table Editor** (left sidebar)
3. Look for these tables:
   - `airdrop_users`
   - `airdrop_task_completions`
   - `airdrop_verifications`

All three should appear in the table list.

## Environment Variables

Make sure these are set in your `.env.local` or Vercel environment:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## How It Works

### Flow: MetaMask Connection → Task Completion → Backend Save

1. **User connects MetaMask** in frontend
2. **Frontend detects** MetaMask is connected (in `sidebarAirdrop.tsx`)
3. **Frontend calls** `completeTask('connect-metamask', 10)`
4. **completeTask function** calls backend API: `POST /api/task/complete`
5. **Backend endpoint** (`api/task-complete.js`):
   - Receives wallet address and task info
   - Checks if user exists in `airdrop_users` table
   - If new: Creates user with 10 points
   - If existing: Adds 10 points to total
   - Logs the task completion in `airdrop_task_completions` table
   - Returns success response
6. **Frontend receives response** and updates UI with new points
7. **Points are now saved** in Supabase database

## Testing

### Local Testing (Development)

1. Make sure frontend API_BASE_URL is set to your backend URL
2. In `sidebarAirdrop.tsx`, it's currently set to: `http://localhost:3000/api`
3. For local testing, you may need to update this to your local backend URL

### Production Testing

1. After deploying to GitHub, Vercel will automatically deploy the backend
2. Connect your wallet using MetaMask
3. Check if points are added to Supabase

## Troubleshooting

### Issue: Points not being saved

**Cause**: Backend endpoint not running or API call not being made

**Solution**:
1. Check Vercel deployment status
2. Check browser DevTools → Network tab for POST requests to `/api/task/complete`
3. Look for error responses

### Issue: Database tables don't exist

**Cause**: Schema wasn't applied to Supabase

**Solution**:
1. Go to Supabase SQL Editor
2. Copy contents of `api/schema.sql`
3. Paste and run manually

### Issue: Permission denied errors

**Cause**: RLS policies not set up correctly

**Solution**:
1. Verify RLS policies exist in Supabase
2. Make sure you used SERVICE_ROLE_KEY for migrations
3. Check that RLS policies allow public read/write

## Database Schema Details

### airdrop_users Table
```
- id (BIGSERIAL PRIMARY KEY)
- wallet_address (VARCHAR UNIQUE) - User's wallet address
- total_points (INTEGER) - Total points earned
- completed_tasks (TEXT[]) - Array of completed task IDs
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### airdrop_task_completions Table
```
- id (BIGSERIAL PRIMARY KEY)
- wallet_address (VARCHAR) - User's wallet
- task_id (VARCHAR) - Which task was completed
- points_earned (INTEGER) - Points awarded for this task
- completed_at (TIMESTAMP)
```

### airdrop_verifications Table
```
- id (BIGSERIAL PRIMARY KEY)
- wallet_address (VARCHAR)
- task_id (VARCHAR)
- status (VARCHAR) - 'pending', 'approved', 'rejected'
- verification_data (JSONB) - Additional verification data
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Next Steps

1. ✅ Backend endpoint created
2. ✅ Database schema file created
3. Deploy to GitHub (and Vercel will auto-deploy backend)
4. Create database tables in Supabase
5. Test MetaMask connection and task completion
6. Points should now appear in `airdrop_users` table

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Open browser DevTools (F12) → Network tab to see API requests
4. Check browser Console for error messages

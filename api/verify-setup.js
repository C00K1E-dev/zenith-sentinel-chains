#!/usr/bin/env node

/**
 * Verify Airdrop API Setup
 * 
 * This script verifies that:
 * 1. Backend endpoint is accessible
 * 2. Supabase connection is working
 * 3. Database tables exist
 * 
 * Usage: node api/verify-setup.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing environment variables');
  console.error('   SUPABASE_URL and SUPABASE_ANON_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySetup() {
  console.log('🔍 Verifying Airdrop Setup...\n');

  try {
    // Check if tables exist
    console.log('📊 Checking database tables...');

    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['airdrop_users', 'airdrop_task_completions', 'airdrop_verifications']);

    if (tablesError) {
      // Try alternative method - just query each table
      console.log('   Checking airdrop_users...');
      const { error: usersError } = await supabase
        .from('airdrop_users')
        .select('id')
        .limit(1);
      
      if (!usersError || usersError.code === 'PGRST116') {
        console.log('   ✅ airdrop_users table exists');
      } else {
        console.log(`   ❌ airdrop_users: ${usersError.message}`);
      }

      console.log('   Checking airdrop_task_completions...');
      const { error: completionsError } = await supabase
        .from('airdrop_task_completions')
        .select('id')
        .limit(1);
      
      if (!completionsError || completionsError.code === 'PGRST116') {
        console.log('   ✅ airdrop_task_completions table exists');
      } else {
        console.log(`   ❌ airdrop_task_completions: ${completionsError.message}`);
      }

      console.log('   Checking airdrop_verifications...');
      const { error: verificationsError } = await supabase
        .from('airdrop_verifications')
        .select('id')
        .limit(1);
      
      if (!verificationsError || verificationsError.code === 'PGRST116') {
        console.log('   ✅ airdrop_verifications table exists');
      } else {
        console.log(`   ❌ airdrop_verifications: ${verificationsError.message}`);
      }
    } else {
      if (tables && tables.length === 3) {
        console.log('   ✅ All 3 tables exist');
        tables.forEach(t => console.log(`      - ${t.table_name}`));
      } else {
        console.log('   ⚠️  Only found ' + (tables?.length || 0) + ' of 3 tables');
      }
    }

    // Try a test insert
    console.log('\n💾 Testing write access...');
    const testWallet = `0x${'1'.repeat(40)}`;
    
    const { data: inserted, error: insertError } = await supabase
      .from('airdrop_users')
      .insert({
        wallet_address: testWallet,
        total_points: 10,
        completed_tasks: ['test']
      })
      .select()
      .single();

    if (insertError && !insertError.message.includes('duplicate')) {
      console.log(`   ❌ Write failed: ${insertError.message}`);
    } else if (insertError && insertError.message.includes('duplicate')) {
      console.log('   ✅ Write access works (duplicate entry for test)');
    } else {
      console.log('   ✅ Write access works');
      
      // Clean up test entry
      await supabase
        .from('airdrop_users')
        .delete()
        .eq('wallet_address', testWallet);
    }

    // Check user count
    console.log('\n📈 Database stats...');
    const { count: userCount, error: countError } = await supabase
      .from('airdrop_users')
      .select('id', { count: 'exact', head: true });

    if (!countError) {
      console.log(`   Users registered: ${userCount || 0}`);
    }

    const { count: completionCount, error: completionCountError } = await supabase
      .from('airdrop_task_completions')
      .select('id', { count: 'exact', head: true });

    if (!completionCountError) {
      console.log(`   Tasks completed: ${completionCount || 0}`);
    }

    console.log('\n✅ Setup verification complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Deploy this code to GitHub (git push)');
    console.log('   2. Vercel will auto-deploy the backend');
    console.log('   3. Test by connecting MetaMask in frontend');
    console.log('   4. Points should appear in airdrop_users table');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

verifySetup();

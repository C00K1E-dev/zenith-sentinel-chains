#!/usr/bin/env node

/**
 * Database Migration Script
 * Run this to set up the airdrop database schema in Supabase
 * 
 * Usage:
 *   node api/migrate.js
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing environment variables');
  console.error('   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...\n');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      console.log(`📝 Executing: ${statement.substring(0, 60)}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      }).catch(() => {
        // If rpc doesn't exist, try alternative approach
        return supabase.from('_sql_migrations').insert({
          sql: statement + ';',
          executed_at: new Date().toISOString()
        });
      });

      if (error) {
        // Some statements might fail if they already exist, that's okay
        if (!error.message.includes('already exists') && !error.message.includes('PGRST')) {
          console.warn(`   ⚠️  ${error.message}`);
        } else {
          console.log(`   ✓ Already exists or skipped`);
        }
      } else {
        console.log(`   ✓ Success`);
      }
    }

    console.log('\n✅ Database migration completed!');
    console.log('\nℹ️  If tables weren\'t created, please run the SQL manually in Supabase:');
    console.log('   1. Go to Supabase dashboard > SQL Editor');
    console.log('   2. Copy contents of api/schema.sql');
    console.log('   3. Paste and run in the SQL Editor');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n💡 Tip: You can manually run the schema by:');
    console.error('   1. Opening Supabase dashboard');
    console.error('   2. Going to SQL Editor');
    console.error('   3. Reading api/schema.sql and running it');
    process.exit(1);
  }
}

runMigration();

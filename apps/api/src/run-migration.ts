/**
 * Run Database Migration for Spaced Repetition
 * 
 * This script applies the spaced repetition migration to the Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Running Spaced Repetition migration...\n');

    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '../prisma/add-spaced-repetition.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Note: Supabase client doesn't support running raw SQL with DDL statements
    // You need to run this SQL manually in the Supabase SQL Editor or using a PostgreSQL client

    console.log('📋 Migration SQL:');
    console.log('================================================================================');
    console.log(migrationSQL);
    console.log('================================================================================\n');

    console.log('⚠️  Please run this SQL in one of the following ways:\n');
    console.log('Option 1: Supabase Dashboard');
    console.log('  1. Go to https://app.supabase.com/project/YOUR_PROJECT/sql');
    console.log('  2. Paste the SQL above');
    console.log('  3. Click "Run"\n');

    console.log('Option 2: PostgreSQL Client (if you have psql installed)');
    console.log('  psql "YOUR_DATABASE_URL" -f apps/api/prisma/add-spaced-repetition.sql\n');

    console.log('✅ After running the migration, restart your API server.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

runMigration();

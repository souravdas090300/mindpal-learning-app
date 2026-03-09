/**
 * Quick Database Diagnostic Script
 * Run this to check if your database is properly set up
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🔍 Database Diagnostic Check\n');
console.log('================================\n');

// Check 1: Environment Variables
console.log('1️⃣  Checking environment variables...');
console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`   SUPABASE_ANON_KEY: ${supabaseKey ? '✅ Set' : '❌ Missing'}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDiagnostics() {
  // Check 2: Database Connection
  console.log('2️⃣  Testing database connection...');
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === '42P01') {
        console.log('   ❌ Table "users" does not exist!');
        console.log('   👉 Run: cd apps/api && npm run db:push');
      } else {
        console.log(`   ❌ Database error: ${error.message}`);
        console.log(`   Code: ${error.code}`);
      }
    } else {
      console.log('   ✅ Connection successful!');
    }
  } catch (err) {
    console.log(`   ❌ Connection failed: ${err.message}`);
  }
  console.log('');

  // Check 3: Tables Exist
  console.log('3️⃣  Checking required tables...');
  const tables = ['users', 'documents', 'flashcards', 'reviews', 'studyRooms'];
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === '42P01') {
          console.log(`   ❌ Table "${table}" - Missing`);
        } else {
          console.log(`   ⚠️  Table "${table}" - Error: ${error.message}`);
        }
      } else {
        console.log(`   ✅ Table "${table}" - Exists`);
      }
    } catch (err) {
      console.log(`   ❌ Table "${table}" - Error: ${err.message}`);
    }
  }
  console.log('');

  // Check 4: Test User Creation (dry run)
  console.log('4️⃣  Testing user schema...');
  try {
    // Try to get table structure
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ Schema check failed: ${error.message}`);
    } else {
      console.log('   ✅ User table schema accessible');
      if (data && data.length > 0) {
        console.log(`   📊 Found ${data.length} existing user(s)`);
      }
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
  }
  console.log('');

  // Summary
  console.log('================================');
  console.log('📋 SUMMARY\n');
  console.log('If you see missing tables:');
  console.log('  → Run: cd apps/api');
  console.log('  → Run: npm run db:push');
  console.log('  → Run: npm run db:generate');
  console.log('');
  console.log('If connection fails:');
  console.log('  → Check your Supabase project is active');
  console.log('  → Verify credentials in .env file');
  console.log('  → Check internet connection');
  console.log('');
}

runDiagnostics().catch(console.error);

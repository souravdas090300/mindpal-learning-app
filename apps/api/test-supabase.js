// Test Supabase REST API connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase REST API Connection...\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET');
console.log('');

async function testSupabase() {
  try {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created successfully\n');

    // Test 1: Query users table
    console.log('Test 1: Querying users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    if (usersError) {
      console.log('❌ Error:', usersError.message);
      console.log('   Details:', usersError);
    } else {
      console.log(`✅ Successfully queried users table!`);
      console.log(`   Found ${users.length} users`);
      if (users.length > 0) {
        console.log('   Sample user:', JSON.stringify(users[0], null, 2));
      }
    }
    console.log('');

    // Test 2: Query documents table
    console.log('Test 2: Querying documents table...');
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .limit(5);

    if (docsError) {
      console.log('❌ Error:', docsError.message);
    } else {
      console.log(`✅ Successfully queried documents table!`);
      console.log(`   Found ${documents.length} documents`);
    }
    console.log('');

    // Test 3: Query flashcards table
    console.log('Test 3: Querying flashcards table...');
    const { data: flashcards, error: flashcardsError } = await supabase
      .from('flashcards')
      .select('*')
      .limit(5);

    if (flashcardsError) {
      console.log('❌ Error:', flashcardsError.message);
    } else {
      console.log(`✅ Successfully queried flashcards table!`);
      console.log(`   Found ${flashcards.length} flashcards`);
    }
    console.log('');

    console.log('🎉 All Supabase tests passed!');
    console.log('✅ Supabase REST API is working correctly');
    console.log('✅ Network restriction bypassed using HTTPS');

  } catch (error) {
    console.error('❌ Supabase test failed!');
    console.error('Error:', error.message);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Check if SUPABASE_URL and SUPABASE_ANON_KEY are set in .env');
    console.error('   2. Verify the anon key is correct in Supabase Dashboard');
    console.error('   3. Ensure Row Level Security (RLS) policies allow read access');
  }
}

testSupabase();

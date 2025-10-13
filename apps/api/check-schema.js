// Check actual column names in Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkSchema() {
  console.log('🔍 Checking database schema...\n');
  
  // Try to insert with different column name formats
  console.log('Test 1: Insert with created_at (snake_case)...');
  const { data: test1, error: error1 } = await supabase
    .from('users')
    .insert({
      email: 'test-schema@example.com',
      password: 'test',
      name: 'Test',
    })
    .select('*')
    .single();

  if (error1) {
    console.log('❌ Error with snake_case:', error1.message);
    console.log('   Hint:', error1.hint);
  } else {
    console.log('✅ Success! Columns:', Object.keys(test1));
    // Clean up
    await supabase.from('users').delete().eq('email', 'test-schema@example.com');
  }
}

checkSchema();

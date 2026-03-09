/**
 * Test Supabase Network Connectivity
 */

const https = require('https');
const url = require('url');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://qnzntcgtnivgxwijcevv.supabase.co';
const parsedUrl = new url.URL(supabaseUrl);

console.log('🌐 Testing Supabase Connectivity\n');
console.log(`Target: ${supabaseUrl}\n`);

// Test 1: DNS Resolution
console.log('1️⃣  DNS Resolution...');
const dns = require('dns');
dns.lookup(parsedUrl.hostname, (err, address) => {
  if (err) {
    console.log(`   ❌ DNS lookup failed: ${err.message}`);
    console.log('   → Check your internet connection');
    console.log('   → Try: ping qnzntcgtnivgxwijcevv.supabase.co');
  } else {
    console.log(`   ✅ Resolved to: ${address}\n`);
    
    // Test 2: HTTPS Connection
    console.log('2️⃣  Testing HTTPS connection...');
    
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: '/rest/v1/',
      method: 'GET',
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY || '',
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      console.log(`   ✅ Connected! Status: ${res.statusCode}`);
      
      if (res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 404) {
        console.log('   ✅ Supabase is reachable!\n');
        
        // Test 3: Try Supabase Client
        console.log('3️⃣  Testing Supabase Client...');
        testSupabaseClient();
      } else {
        console.log(`   ⚠️  Unexpected status: ${res.statusCode}\n`);
      }
    });

    req.on('error', (err) => {
      console.log(`   ❌ Connection failed: ${err.message}\n`);
      
      if (err.code === 'ENOTFOUND') {
        console.log('   💡 Possible causes:');
        console.log('      - No internet connection');
        console.log('      - DNS server issues');
        console.log('      - Firewall blocking connection\n');
      } else if (err.code === 'ECONNREFUSED') {
        console.log('   💡 Connection refused - check if Supabase project is active\n');
      } else if (err.code === 'ETIMEDOUT') {
        console.log('   💡 Connection timed out - slow network or firewall\n');
      } else if (err.code === 'CERT_HAS_EXPIRED' || err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        console.log('   💡 SSL certificate issue\n');
        console.log('   Try setting: NODE_TLS_REJECT_UNAUTHORIZED=0 (NOT recommended for production)\n');
      }
      
      console.log('   🔧 Quick fixes:');
      console.log('      1. Check internet connection');
      console.log('      2. Try different network (mobile hotspot)');
      console.log('      3. Disable VPN/proxy temporarily');
      console.log('      4. Check Windows Firewall settings');
      console.log('      5. Verify Supabase project is active at https://app.supabase.com\n');
    });

    req.on('timeout', () => {
      console.log('   ❌ Request timed out\n');
      req.destroy();
    });

    req.end();
  }
});

async function testSupabaseClient() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Try a simple query
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(0);

    if (error) {
      if (error.code === '42P01') {
        console.log('   ⚠️  Connection works but tables not created');
        console.log('   → Run: npm run db:push\n');
      } else {
        console.log(`   ❌ Supabase client error: ${error.message}`);
        console.log(`   Code: ${error.code}\n`);
      }
    } else {
      console.log('   ✅ Supabase client working!\n');
      console.log('✅ All connectivity tests passed!\n');
      console.log('Next steps:');
      console.log('  1. Run: npm run db:push (to create tables)');
      console.log('  2. Start API: npm run dev');
      console.log('  3. Test signup at: http://localhost:3001/api/auth/signup\n');
    }
  } catch (err) {
    console.log(`   ❌ Supabase client failed: ${err.message}\n`);
    
    if (err.message.includes('fetch')) {
      console.log('   💡 This is a Node.js fetch issue');
      console.log('   Try: npm install node-fetch@2\n');
    }
  }
}

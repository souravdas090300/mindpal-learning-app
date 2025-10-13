// Simple connection test for Supabase
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
  
  try {
    // Test 1: Simple query
    console.log('\n📊 Test 1: Running simple query...');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Simple query successful!');

    // Test 2: Check if tables exist
    console.log('\n📊 Test 2: Checking for tables...');
    const tables: any = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('users', 'documents')
    `;
    
    if (tables.length === 0) {
      console.log('⚠️  No tables found. You need to create them manually.');
      console.log('   Run the SQL from: apps/api/prisma/create-tables.sql');
      console.log('   In Supabase SQL Editor: https://supabase.com/dashboard/project/qnzntcgtnivgxwijcevv/editor');
    } else {
      console.log('✅ Tables found:', tables.map((t: any) => t.table_name).join(', '));
      
      // Test 3: Count records
      console.log('\n📊 Test 3: Counting records...');
      const userCount = await prisma.user.count();
      const docCount = await prisma.document.count();
      console.log(`✅ Users: ${userCount}, Documents: ${docCount}`);
    }

    console.log('\n🎉 Database connection successful!');
    
  } catch (error) {
    console.log('\n❌ Connection failed:');
    console.log('Error:', error instanceof Error ? error.message : error);
    console.log('\n💡 Solutions:');
    console.log('1. Port 5432 is blocked - use manual SQL method');
    console.log('2. Try uncommenting the pooler URL in .env');
    console.log('3. Run SQL manually in Supabase SQL Editor');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

#!/usr/bin/env node

/**
 * Quick test to verify database tables exist
 * Run this AFTER you create tables in Supabase SQL Editor
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabase() {
  console.log('\n🔍 Testing MindPal Database Connection...\n')

  try {
    // Test 1: Database connection
    await prisma.$connect()
    console.log('✅ Database connected successfully!')

    // Test 2: Check if users table exists
    const userCount = await prisma.user.count()
    console.log(`✅ Users table exists (${userCount} users)`)

    // Test 3: Check if documents table exists
    const docCount = await prisma.document.count()
    console.log(`✅ Documents table exists (${docCount} documents)`)

    console.log('\n🎉 SUCCESS! All tables created correctly!\n')
    console.log('Next steps:')
    console.log('1. Start API: npx nodemon src/index.ts')
    console.log('2. Start Web: cd ../web && npm run dev')
    console.log('3. Open: http://localhost:3000\n')

  } catch (error: any) {
    console.error('\n❌ Database test failed!\n')
    
    if (error.code === 'P1001') {
      console.error('🚨 Still can\'t reach database server (port 5432 blocked)')
      console.error('📝 You MUST run the SQL in Supabase SQL Editor:')
      console.error('   https://supabase.com/dashboard/project/qnzntcgtnivgxwijcevv/editor\n')
    } else if (error.code === 'P2021') {
      console.error('🚨 Table doesn\'t exist!')
      console.error('📝 You need to run the SQL script in Supabase SQL Editor')
      console.error('   See: CRITICAL-NEXT-STEP.md\n')
    } else {
      console.error('Error:', error.message)
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()

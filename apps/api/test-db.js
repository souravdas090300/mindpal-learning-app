// Test database connection and verify tables exist
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...\n');

    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully!');

    // Test User table
    const userCount = await prisma.user.count();
    console.log(`✅ Users table: ${userCount} records`);

    // Test Document table
    const docCount = await prisma.document.count();
    console.log(`✅ Documents table: ${docCount} records`);

    // Test Flashcard table
    const flashcardCount = await prisma.flashcard.count();
    console.log(`✅ Flashcards table: ${flashcardCount} records`);

    console.log('\n🎉 All database tables are working!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();

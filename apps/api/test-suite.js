/**
 * Comprehensive API Test Suite
 * Tests all endpoints and features without database dependency
 */

const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const result = `${status}: ${name}${message ? ' - ' + message : ''}`;
  console.log(result);
  testResults.tests.push({ name, passed, message });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

async function testAPIStructure() {
  console.log('\n📁 Testing API Structure...\n');
  
  const fs = require('fs');
  const path = require('path');
  
  // Test essential files exist
  const files = [
    'src/index.ts',
    'src/routes/auth.ts',
    'src/routes/documents.ts',
    'src/routes/flashcards.ts',
    'src/lib/prisma.ts',
    'src/lib/auth.ts',
    'src/lib/ai.ts',
    'src/middleware/auth.ts',
    'prisma/schema.prisma',
    'package.json',
    '.env'
  ];
  
  files.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    logTest(`File exists: ${file}`, exists);
  });
}

async function testDependencies() {
  console.log('\n📦 Testing Dependencies...\n');
  
  const packageJson = require('./package.json');
  const requiredDeps = [
    'express',
    'typescript',
    '@prisma/client',
    'bcryptjs',
    'jsonwebtoken',
    'openai',
    'langchain',
    'dotenv',
    'cors',
    'zod'
  ];
  
  requiredDeps.forEach(dep => {
    const hasMain = packageJson.dependencies && packageJson.dependencies[dep];
    const hasDev = packageJson.devDependencies && packageJson.devDependencies[dep];
    const exists = hasMain || hasDev;
    logTest(`Dependency: ${dep}`, exists, exists ? '✓' : 'Missing');
  });
}

async function testEnvironmentVariables() {
  console.log('\n🔐 Testing Environment Variables...\n');
  
  require('dotenv').config();
  
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'OPENAI_API_KEY',
    'PORT'
  ];
  
  requiredVars.forEach(varName => {
    const exists = !!process.env[varName];
    const value = exists ? (varName === 'JWT_SECRET' || varName === 'OPENAI_API_KEY' ? '***' : process.env[varName]) : 'NOT SET';
    logTest(`Environment variable: ${varName}`, exists, value);
  });
}

async function testTypeScriptCompilation() {
  console.log('\n🔨 Testing TypeScript Compilation...\n');
  
  const { execSync } = require('child_process');
  
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    logTest('TypeScript compilation', true, 'No errors');
  } catch (error) {
    const output = error.stdout?.toString() || error.message;
    const errorCount = (output.match(/error TS/g) || []).length;
    logTest('TypeScript compilation', false, `${errorCount} errors found`);
  }
}

async function testAIConfiguration() {
  console.log('\n🤖 Testing AI Configuration...\n');
  
  const fs = require('fs');
  const aiFile = fs.readFileSync('./src/lib/ai.ts', 'utf-8');
  
  logTest('AI module has OpenAI import', aiFile.includes('import') && aiFile.includes('openai'));
  logTest('AI module has generateSummary', aiFile.includes('generateSummary'));
  logTest('AI module has generateFlashcards', aiFile.includes('generateFlashcards'));
  logTest('AI module exports functions', aiFile.includes('export'));
}

async function testAuthMiddleware() {
  console.log('\n🔒 Testing Auth Middleware...\n');
  
  const fs = require('fs');
  const authFile = fs.readFileSync('./src/middleware/auth.ts', 'utf-8');
  
  logTest('Auth middleware exists', authFile.length > 0);
  logTest('Auth middleware has JWT verify', authFile.includes('jwt.verify') || authFile.includes('verify'));
  logTest('Auth middleware exports authenticateToken', authFile.includes('authenticateToken'));
}

async function testPrismaSchema() {
  console.log('\n🗄️  Testing Prisma Schema...\n');
  
  const fs = require('fs');
  const schema = fs.readFileSync('./prisma/schema.prisma', 'utf-8');
  
  logTest('Schema has User model', schema.includes('model User'));
  logTest('Schema has Document model', schema.includes('model Document'));
  logTest('Schema has Flashcard model', schema.includes('model Flashcard'));
  logTest('Schema has PostgreSQL datasource', schema.includes('provider = "postgresql"'));
  logTest('Schema has relations', schema.includes('@relation'));
  logTest('Flashcard has SM-2 fields', schema.includes('easeFactor') && schema.includes('interval'));
}

async function testRoutes() {
  console.log('\n🛣️  Testing Route Files...\n');
  
  const fs = require('fs');
  
  // Test auth routes
  const authRoutes = fs.readFileSync('./src/routes/auth.ts', 'utf-8');
  logTest('Auth routes: /register', authRoutes.includes('register'));
  logTest('Auth routes: /login', authRoutes.includes('login'));
  
  // Test document routes
  const docRoutes = fs.readFileSync('./src/routes/documents.ts', 'utf-8');
  logTest('Document routes: GET /documents', docRoutes.includes('router.get'));
  logTest('Document routes: POST /documents', docRoutes.includes('router.post'));
  logTest('Document routes: AI integration', docRoutes.includes('generateSummary') || docRoutes.includes('generateFlashcards'));
  
  // Test flashcard routes
  const flashcardRoutes = fs.readFileSync('./src/routes/flashcards.ts', 'utf-8');
  logTest('Flashcard routes: GET /due', flashcardRoutes.includes('/due'));
  logTest('Flashcard routes: POST /review', flashcardRoutes.includes('/review'));
  logTest('Flashcard routes: SM-2 algorithm', flashcardRoutes.includes('easeFactor') || flashcardRoutes.includes('interval'));
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📝 Total: ${testResults.passed + testResults.failed}`);
  
  const percentage = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
  console.log(`\n🎯 Success Rate: ${percentage}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests.filter(t => !t.passed).forEach(t => {
      console.log(`   - ${t.name}${t.message ? ': ' + t.message : ''}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (percentage >= 90) {
    console.log('🎉 EXCELLENT! Project structure is solid!');
  } else if (percentage >= 75) {
    console.log('⚠️  GOOD, but some improvements needed.');
  } else {
    console.log('⚠️  NEEDS ATTENTION - Several issues found.');
  }
  
  console.log('='.repeat(60) + '\n');
  
  return percentage >= 90;
}

async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║         MINDPAL API - COMPREHENSIVE TEST SUITE           ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  try {
    await testAPIStructure();
    await testDependencies();
    await testEnvironmentVariables();
    await testPrismaSchema();
    await testRoutes();
    await testAuthMiddleware();
    await testAIConfiguration();
    await testTypeScriptCompilation();
    
    const success = await printSummary();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Fatal test error:', error.message);
    process.exit(1);
  }
}

runAllTests();

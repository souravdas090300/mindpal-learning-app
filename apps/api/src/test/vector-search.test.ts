/**
 * Vector Search Test Script
 * 
 * Tests Pinecone integration and semantic search functionality
 */

import dotenv from 'dotenv';
import { createEmbedding, storeDocumentVector, searchSimilarDocuments } from '../lib/pinecone';

// Load environment variables
dotenv.config();

async function testVectorSearch() {
  console.log('🧪 Testing Pinecone Vector Search Integration\n');

  try {
    // Test 1: Create embedding
    console.log('1️⃣  Testing embedding creation...');
    const testText = 'Machine learning is a subset of artificial intelligence';
    const embedding = await createEmbedding(testText);
    console.log(`✅ Embedding created successfully (dimension: ${embedding.length})\n`);

    // Test 2: Store document vector
    console.log('2️⃣  Testing vector storage...');
    const testDocId = 'test-doc-' + Date.now();
    const testUserId = 'test-user-id';
    await storeDocumentVector(
      testDocId,
      testUserId,
      'Machine learning algorithms can learn from data and make predictions without being explicitly programmed.',
      'Introduction to Machine Learning'
    );
    console.log(`✅ Document vector stored successfully (ID: ${testDocId})\n`);

    // Wait a moment for Pinecone to index
    console.log('⏳ Waiting 2 seconds for indexing...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 3: Search for similar documents
    console.log('\n3️⃣  Testing semantic search...');
    const searchQuery = 'artificial intelligence and ML';
    const results = await searchSimilarDocuments(searchQuery, testUserId, 5);
    console.log(`✅ Search completed: Found ${results.length} results\n`);

    if (results.length > 0) {
      console.log('📊 Search Results:');
      results.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.title}`);
        console.log(`   Score: ${(result.score * 100).toFixed(2)}%`);
        console.log(`   Preview: ${result.content.substring(0, 100)}...`);
      });
    }

    console.log('\n✅ All tests passed! Pinecone integration is working correctly.');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Check that PINECONE_API_KEY is set in your .env file');
    console.error('2. Check that OPENAI_API_KEY is set in your .env file');
    console.error('3. Verify your Pinecone index "mindpal-documents" exists');
    console.error('4. Ensure your index has the correct dimension (1536 for text-embedding-3-small)');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testVectorSearch()
    .then(() => {
      console.log('\n🎉 Test suite completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

export { testVectorSearch };

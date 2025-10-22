# Pinecone Vector Search Setup Guide

## Overview

This guide helps you set up Pinecone for semantic document search in the MindPal Learning App.

## Prerequisites

- Pinecone account (free tier available)
- OpenAI API key
- Node.js and npm installed

## Step 1: Create Pinecone Account

1. Go to [https://www.pinecone.io/](https://www.pinecone.io/)
2. Sign up for a free account
3. Create a new project

## Step 2: Create Pinecone Index

### Via Pinecone Console (Recommended)

1. Go to the Pinecone console: [https://app.pinecone.io/](https://app.pinecone.io/)
2. Click **"Create Index"**
3. Configure the index:
   - **Name**: `mindpal-documents`
   - **Dimensions**: `1536` (for OpenAI text-embedding-3-small)
   - **Metric**: `cosine` (default)
   - **Cloud**: `AWS` or `GCP` (choose based on your region)
   - **Region**: Select closest to your users
4. Click **"Create Index"**

### Via Code (Alternative)

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

await pc.createIndex({
  name: 'mindpal-documents',
  dimension: 1536,
  metric: 'cosine',
  spec: {
    serverless: {
      cloud: 'aws',
      region: 'us-east-1'
    }
  }
});
```

## Step 3: Get Pinecone API Key

1. In the Pinecone console, go to **API Keys**
2. Copy your API key
3. Note your index host URL (e.g., `https://mindpal-documents-xxxxx.svc.aped-xxxx-xxxx.pinecone.io`)

## Step 4: Configure Environment Variables

Add to `apps/api/.env`:

```env
# Pinecone Vector Database
PINECONE_API_KEY="pcsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# OpenAI (required for embeddings)
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## Step 5: Test the Integration

Run the test script:

```bash
cd apps/api
npm run build
npx ts-node src/test/vector-search.test.ts
```

Expected output:
```
🧪 Testing Pinecone Vector Search Integration

1️⃣  Testing embedding creation...
✅ Embedding created successfully (dimension: 1536)

2️⃣  Testing vector storage...
✅ Document vector stored successfully (ID: test-doc-xxxxx)

3️⃣  Testing semantic search...
✅ Search completed: Found 1 results

📊 Search Results:
1. Introduction to Machine Learning
   Score: 95.23%
   Preview: Machine learning algorithms can learn from data...

✅ All tests passed! Pinecone integration is working correctly.
```

## Step 6: Verify in Pinecone Console

1. Go to your index in the Pinecone console
2. Check the **Metrics** tab:
   - You should see 1+ vectors indexed
   - Index size should be > 0 KB

## Architecture

### How It Works

1. **Document Creation**:
   - User creates a document with text content
   - API generates AI summary and flashcards
   - Content is converted to a vector embedding using OpenAI
   - Vector is stored in Pinecone with metadata (documentId, userId, title, preview)

2. **Semantic Search**:
   - User enters a search query
   - Query is converted to a vector embedding
   - Pinecone finds similar vectors using cosine similarity
   - API fetches full document details from database
   - Results are ranked by similarity score

3. **Document Updates/Deletes**:
   - When a document is updated, its vector is re-computed and updated in Pinecone
   - When deleted, the vector is removed from Pinecone

### Data Flow

```
┌─────────────┐
│   Client    │
│  (Web/App)  │
└──────┬──────┘
       │
       │ Create Document
       ▼
┌─────────────┐
│   Express   │
│   API       │
└──┬────┬─────┘
   │    │
   │    │ Store Text
   │    ▼
   │  ┌─────────────┐
   │  │  Supabase   │
   │  │  Database   │
   │  └─────────────┘
   │
   │ Generate Embedding
   ▼
┌─────────────┐
│   OpenAI    │
│  Embeddings │
└──────┬──────┘
       │
       │ Store Vector
       ▼
┌─────────────┐
│  Pinecone   │
│   Index     │
└─────────────┘
```

## API Endpoints

### Search Documents

```http
GET /api/documents/search?query=machine+learning
Authorization: Bearer <token>

Response:
{
  "results": [
    {
      "documentId": "clxx...",
      "title": "Introduction to ML",
      "content": "Machine learning is...",
      "score": 0.9234,
      "document": {
        "id": "clxx...",
        "title": "Introduction to ML",
        "content": "...",
        "summary": "...",
        "flashcards": [...]
      }
    }
  ]
}
```

## Troubleshooting

### Error: "Index not found"

- Verify index name is exactly `mindpal-documents`
- Check index exists in Pinecone console
- Ensure you're using the correct API key

### Error: "Dimension mismatch"

- OpenAI `text-embedding-3-small` creates 1536-dimensional vectors
- Your Pinecone index must be configured for 1536 dimensions
- Recreate the index with correct dimensions if needed

### Error: "Rate limit exceeded"

- Free tier has limits (100 requests/minute)
- Consider upgrading to paid tier for production
- Implement request throttling in your API

### No search results found

- Wait a few seconds after creating documents for indexing
- Verify vectors are stored (check Pinecone console metrics)
- Try broader search queries
- Check userId filter is correct

## Cost Considerations

### Free Tier

- **Pinecone**: 1 index, 100K vectors, 5M queries/month
- **OpenAI**: $0.0001 per 1K tokens (~$0.02 per 1K embeddings)

### Scaling

For production with thousands of users:
- Consider Pinecone paid tiers for more indexes
- Monitor OpenAI embedding costs
- Implement caching for frequently embedded content
- Consider batch processing for bulk uploads

## Best Practices

1. **Chunking**: For large documents (>8K tokens), split into chunks before embedding
2. **Metadata**: Store essential metadata (userId, title, createdAt) for filtering
3. **Batch Operations**: Use batch upsert for multiple documents
4. **Error Handling**: Don't block document creation if vector storage fails
5. **Monitoring**: Track embedding costs and Pinecone usage

## Next Steps

1. ✅ Test vector search locally
2. ✅ Create a few test documents
3. ✅ Try different search queries
4. 🔄 Deploy to production (Railway)
5. 🔄 Update mobile app to use search endpoint
6. 🔄 Add search UI to web app

## Resources

- [Pinecone Documentation](https://docs.pinecone.io/)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [LangChain Pinecone Integration](https://js.langchain.com/docs/integrations/vectorstores/pinecone)

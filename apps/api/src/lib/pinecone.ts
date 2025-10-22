/**
 * Pinecone Vector Database Integration
 * 
 * Provides semantic search capabilities for documents using:
 * - OpenAI embeddings for text vectorization
 * - Pinecone for vector storage and similarity search
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Initialize OpenAI embeddings
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY!,
  modelName: 'text-embedding-3-small', // Cost-effective model
});

// Get reference to the Pinecone index
export const pineconeIndex = pinecone.Index('mindpal-documents');

/**
 * Create embeddings for a text string
 * @param text - Text to convert to vector embedding
 * @returns Vector embedding as array of numbers
 */
export const createEmbedding = async (text: string): Promise<number[]> => {
  try {
    const embedding = await embeddings.embedQuery(text);
    return embedding;
  } catch (error) {
    console.error('Error creating embedding:', error);
    throw new Error('Failed to create text embedding');
  }
};

/**
 * Store a document vector in Pinecone
 * @param documentId - Unique document ID
 * @param userId - User who owns the document
 * @param content - Full document content
 * @param title - Document title
 */
export const storeDocumentVector = async (
  documentId: string,
  userId: string,
  content: string,
  title: string
): Promise<void> => {
  try {
    // Create embedding for the full content
    const embedding = await createEmbedding(content);

    // Upsert vector to Pinecone
    await pineconeIndex.upsert([
      {
        id: `doc-${documentId}`,
        values: embedding,
        metadata: {
          documentId,
          userId,
          title,
          content: content.substring(0, 1000), // Store first 1000 chars for preview
          type: 'document',
          createdAt: new Date().toISOString(),
        },
      },
    ]);

    console.log(`Vector stored for document ${documentId}`);
  } catch (error) {
    console.error('Error storing document vector:', error);
    throw error;
  }
};

/**
 * Search for similar documents using semantic similarity
 * @param query - Search query text
 * @param userId - User ID to filter results
 * @param topK - Number of results to return (default: 5)
 * @returns Array of matching documents with scores
 */
export const searchSimilarDocuments = async (
  query: string,
  userId: string,
  topK: number = 5
) => {
  try {
    // Create embedding for the search query
    const queryEmbedding = await createEmbedding(query);

    // Query Pinecone for similar vectors
    const results = await pineconeIndex.query({
      vector: queryEmbedding,
      topK,
      filter: { userId, type: 'document' },
      includeMetadata: true,
    });

    // Format and return results
    return results.matches.map((match) => ({
      documentId: match.metadata?.documentId as string,
      title: match.metadata?.title as string,
      content: match.metadata?.content as string,
      score: match.score || 0,
      createdAt: match.metadata?.createdAt as string,
    }));
  } catch (error) {
    console.error('Error searching documents:', error);
    throw new Error('Failed to search documents');
  }
};

/**
 * Delete a document vector from Pinecone
 * @param documentId - Document ID to delete
 */
export const deleteDocumentVector = async (documentId: string): Promise<void> => {
  try {
    await pineconeIndex.deleteOne(`doc-${documentId}`);
    console.log(`Vector deleted for document ${documentId}`);
  } catch (error) {
    console.error('Error deleting document vector:', error);
    throw error;
  }
};

/**
 * Update a document vector in Pinecone
 * @param documentId - Document ID to update
 * @param userId - User ID
 * @param content - Updated content
 * @param title - Updated title
 */
export const updateDocumentVector = async (
  documentId: string,
  userId: string,
  content: string,
  title: string
): Promise<void> => {
  // For Pinecone, upsert replaces existing vectors
  await storeDocumentVector(documentId, userId, content, title);
};

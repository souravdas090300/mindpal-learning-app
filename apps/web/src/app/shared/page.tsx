/**
 * Shared Documents Page
 * 
 * Displays all documents that have been shared with the current user.
 * Shows who shared each document, permission level, and allows opening them.
 * 
 * @page /shared
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../lib/api';

interface ShareUser {
  id: string;
  name: string;
  email: string;
}

interface SharedDocument {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  userId: string;
  createdAt: string;
  sharedBy: ShareUser;
  permission: 'view' | 'edit';
  sharedAt: string;
  flashcards?: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
}

export default function SharedDocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'view' | 'edit'>('all');

  useEffect(() => {
    loadSharedDocuments();
  }, []);

  const loadSharedDocuments = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getSharedWithMe();
      setDocuments(data as SharedDocument[]);
    } catch (error) {
      console.error('Failed to load shared documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (filter === 'all') return true;
    return doc.permission === filter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleOpenDocument = (docId: string) => {
    router.push(`/document/${docId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                👥 Shared With Me
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Documents that others have shared with you
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-medium hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg"
            >
              ← Back to Dashboard
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              All ({documents.length})
            </button>
            <button
              onClick={() => setFilter('view')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'view'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              👁️ View Only ({documents.filter(d => d.permission === 'view').length})
            </button>
            <button
              onClick={() => setFilter('edit')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'edit'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              ✏️ Can Edit ({documents.filter(d => d.permission === 'edit').length})
            </button>
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading shared documents...</p>
            </div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              No Shared Documents
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all'
                ? "When someone shares a document with you, it will appear here."
                : `No documents with ${filter} permission.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-slate-700 overflow-hidden group"
              >
                {/* Card Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex-1 line-clamp-2">
                      {doc.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${
                        doc.permission === 'view'
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      }`}
                    >
                      {doc.permission === 'view' ? '👁️ View' : '✏️ Edit'}
                    </span>
                  </div>

                  {/* Shared By */}
                  <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700/30">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Shared by</p>
                    <p className="font-semibold text-purple-700 dark:text-purple-400">
                      {doc.sharedBy.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{doc.sharedBy.email}</p>
                  </div>

                  {/* Summary */}
                  {doc.summary && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                      {doc.summary}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {doc.flashcards && doc.flashcards.length > 0 && (
                      <span className="flex items-center gap-1">
                        🎴 {doc.flashcards.length} cards
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      📅 {formatDate(doc.sharedAt)}
                    </span>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleOpenDocument(doc.id)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform group-hover:scale-105"
                  >
                    📖 Open Document
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

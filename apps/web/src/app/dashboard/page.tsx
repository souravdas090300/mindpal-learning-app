'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import ReactMarkdown from 'react-markdown'
import { formatDistanceToNow } from 'date-fns'

interface Document {
  id: string
  title: string
  content: string
  summary: string | null
  createdAt: string
  flashcards?: Array<{ id: string; question: string; answer: string }>
}

interface User {
  id: string
  name: string
  email: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewDoc, setShowNewDoc] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [editForm, setEditForm] = useState({ title: '', content: '' })
  const [newDoc, setNewDoc] = useState({ title: '', content: '' })
  const [user, setUser] = useState<User | null>(null)
  
  // AI Streaming states
  const [isCreatingWithAI, setIsCreatingWithAI] = useState(false)
  const [aiStatus, setAiStatus] = useState('')
  const [streamingSummary, setStreamingSummary] = useState('')
  const [streamingFlashcards, setStreamingFlashcards] = useState<Array<{question: string; answer: string}>>([])
  const [currentDocId, setCurrentDocId] = useState<string | null>(null)
  
  // Flashcard study mode states
  const [studyingDoc, setStudyingDoc] = useState<Document | null>(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token) {
      router.push('/login')
      return
    }

    if (userData) {
      setUser(JSON.parse(userData))
    }

    fetchDocuments()
  }, [router])

  const fetchDocuments = async () => {
    try {
      const docs = await apiClient.getDocuments()
      setDocuments(docs || [])
    } catch (error) {
      console.error('Failed to fetch documents:', error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const createDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiClient.createDocument(newDoc.title, newDoc.content)
      setNewDoc({ title: '', content: '' })
      setShowNewDoc(false)
      fetchDocuments()
    } catch (error) {
      console.error('Failed to create document:', error)
    }
  }

  const createDocumentWithStreaming = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingWithAI(true)
    setAiStatus('Creating document...')
    setStreamingSummary('')
    setStreamingFlashcards([])

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('http://localhost:3001/api/documents-stream/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newDoc.title,
          content: newDoc.content
        })
      })

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          const [eventLine, dataLine] = line.split('\n')
          if (!eventLine || !dataLine) continue

          const event = eventLine.replace('event: ', '')
          const dataStr = dataLine.replace('data: ', '')

          try {
            const data = JSON.parse(dataStr)

            switch (event) {
              case 'document-created':
                setCurrentDocId(data.documentId)
                setAiStatus('✅ Document created! Generating AI summary...')
                break

              case 'summary-start':
                setAiStatus('🤖 AI is thinking...')
                setStreamingSummary('')
                break

              case 'summary-chunk':
                setStreamingSummary(prev => prev + data.text)
                setAiStatus('✍️ AI is writing summary...')
                break

              case 'summary-complete':
                setStreamingSummary(data.summary)
                setAiStatus('✅ Summary complete! Generating flashcards...')
                break

              case 'summary-error':
                setAiStatus(`⚠️ Summary generation failed: ${data.error}`)
                break

              case 'flashcards-start':
                setAiStatus('🎴 Creating flashcards...')
                break

              case 'flashcards-complete':
                setStreamingFlashcards(data.flashcards)
                setAiStatus('✅ Flashcards ready!')
                break

              case 'flashcards-error':
                setAiStatus(`⚠️ Flashcard generation failed: ${data.error}`)
                break

              case 'complete':
                setAiStatus('🎉 All done!')
                setTimeout(() => {
                  setIsCreatingWithAI(false)
                  setShowNewDoc(false)
                  setNewDoc({ title: '', content: '' })
                  setStreamingSummary('')
                  setStreamingFlashcards([])
                  setCurrentDocId(null)
                  fetchDocuments()
                }, 2000)
                break

              case 'error':
                setAiStatus(`❌ Error: ${data.error}`)
                setIsCreatingWithAI(false)
                break
            }
          } catch (parseError) {
            console.error('Error parsing SSE data:', parseError)
          }
        }
      }

    } catch (error) {
      console.error('Failed to create document with streaming:', error)
      setAiStatus('❌ Connection failed')
      setIsCreatingWithAI(false)
    }
  }

  const deleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    
    try {
      await apiClient.deleteDocument(id)
      fetchDocuments()
    } catch (error) {
      console.error('Failed to delete document:', error)
      alert('Failed to delete document')
    }
  }

  const startEdit = (doc: Document) => {
    setEditingDoc(doc)
    setEditForm({ title: doc.title, content: doc.content })
    setSelectedDoc(null)
  }

  const updateDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDoc) return

    try {
      await apiClient.updateDocument(editingDoc.id, editForm.title, editForm.content)
      setEditingDoc(null)
      setEditForm({ title: '', content: '' })
      fetchDocuments()
    } catch (error) {
      console.error('Failed to update document:', error)
      alert('Failed to update document')
    }
  }

  const cancelEdit = () => {
    setEditingDoc(null)
    setEditForm({ title: '', content: '' })
  }

  const startStudyMode = (doc: Document) => {
    if (!doc.flashcards || doc.flashcards.length === 0) {
      alert('No flashcards available for this document')
      return
    }
    setStudyingDoc(doc)
    setCurrentCardIndex(0)
    setShowAnswer(false)
  }

  const nextCard = () => {
    if (!studyingDoc?.flashcards) return
    if (currentCardIndex < studyingDoc.flashcards.length - 1) {
      setCurrentCardIndex(prev => prev + 1)
      setShowAnswer(false)
    }
  }

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1)
      setShowAnswer(false)
    }
  }

  const closeStudyMode = () => {
    setStudyingDoc(null)
    setCurrentCardIndex(0)
    setShowAnswer(false)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            MindPal Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">👋 {user?.name || user?.email}</span>
            <button
              onClick={logout}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Your Documents</h2>
          <button
            onClick={() => setShowNewDoc(true)}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
          >
            + New Document
          </button>
        </div>

        {/* New Document Form */}
        {showNewDoc && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-8">
              <h3 className="text-2xl font-bold mb-6">🤖 Create New Document with Live AI</h3>
              
              {!isCreatingWithAI ? (
                <form onSubmit={createDocumentWithStreaming} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      required
                      value={newDoc.title}
                      onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Document title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content
                    </label>
                    <textarea
                      required
                      value={newDoc.content}
                      onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-64"
                      placeholder="Write your content here... AI will generate summary and flashcards in real-time!"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
                    >
                      <span>🤖</span>
                      <span>Create with Live AI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewDoc(false)}
                      className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Status */}
                  <div className="text-center">
                    <div className="inline-block animate-pulse text-4xl mb-2">🤖</div>
                    <p className="text-lg font-semibold text-gray-700">{aiStatus}</p>
                  </div>

                  {/* Live Summary */}
                  {streamingSummary && (
                    <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                      <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <span>📝</span>
                        <span>AI Summary (Live):</span>
                      </h4>
                      <p className="text-blue-800 leading-relaxed">
                        {streamingSummary}
                        <span className="inline-block w-2 h-5 bg-blue-600 ml-1 animate-pulse"></span>
                      </p>
                    </div>
                  )}

                  {/* Live Flashcards */}
                  {streamingFlashcards.length > 0 && (
                    <div className="p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
                      <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                        <span>🎴</span>
                        <span>AI Flashcards:</span>
                      </h4>
                      <div className="space-y-3">
                        {streamingFlashcards.map((card, index) => (
                          <div key={index} className="p-4 bg-white rounded-lg shadow">
                            <p className="font-semibold text-purple-900 mb-2">Q: {card.question}</p>
                            <p className="text-purple-700">A: {card.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents Grid */}
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No documents yet. Create your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-gray-800 flex-1">{doc.title}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="text-blue-500 hover:text-blue-700 text-xl"
                      title="View details"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => startEdit(doc)}
                      className="text-green-500 hover:text-green-700 text-xl"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="text-red-500 hover:text-red-700 text-xl"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                {doc.summary && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900 font-semibold mb-1">AI Summary:</p>
                    <p className="text-sm text-blue-800">{doc.summary}</p>
                  </div>
                )}
                
                <div className="prose prose-sm max-w-none text-gray-600 line-clamp-3 mb-3">
                  <ReactMarkdown>{doc.content}</ReactMarkdown>
                </div>
                
                {/* Study Flashcards Button */}
                {doc.flashcards && doc.flashcards.length > 0 && (
                  <button
                    onClick={() => startStudyMode(doc)}
                    className="w-full mb-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
                  >
                    <span>🎴</span>
                    <span>Study {doc.flashcards.length} Flashcards</span>
                  </button>
                )}
                
                <p className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Document Details Modal */}
        {selectedDoc && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">{selectedDoc.title}</h2>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Summary */}
                {selectedDoc.summary && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-bold text-blue-900 mb-2">📝 AI Summary</h3>
                    <p className="text-blue-800">{selectedDoc.summary}</p>
                  </div>
                )}
                
                {/* Content */}
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">📄 Content</h3>
                  <div className="prose max-w-none">
                    <ReactMarkdown>{selectedDoc.content}</ReactMarkdown>
                  </div>
                </div>
                
                {/* Flashcards */}
                {selectedDoc.flashcards && selectedDoc.flashcards.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-800 mb-3">🎴 Flashcards ({selectedDoc.flashcards.length})</h3>
                    <div className="space-y-3">
                      {selectedDoc.flashcards.map((card, index: number) => (
                        <div key={card.id} className="p-4 bg-purple-50 rounded-lg">
                          <p className="font-semibold text-purple-900 mb-2">Q{index + 1}: {card.question}</p>
                          <p className="text-purple-800">A: {card.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-sm text-gray-500">
                  Created {formatDistanceToNow(new Date(selectedDoc.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Edit Document Modal */}
        {editingDoc && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">✏️ Edit Document</h2>
                <button
                  onClick={cancelEdit}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={updateDocument} className="p-6">
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Content</label>
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-64 resize-none"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Note: AI summary and flashcards will be regenerated after update
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
                  >
                    Update Document
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Flashcard Study Mode Modal */}
        {studyingDoc && studyingDoc.flashcards && studyingDoc.flashcards.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl shadow-2xl max-w-2xl w-full p-8">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">🎴 Flashcard Study</h2>
                  <p className="text-sm text-gray-600">{studyingDoc.title}</p>
                </div>
                <button
                  onClick={closeStudyMode}
                  className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Card {currentCardIndex + 1} of {studyingDoc.flashcards.length}</span>
                  <span>{Math.round(((currentCardIndex + 1) / studyingDoc.flashcards.length) * 100)}% Complete</span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${((currentCardIndex + 1) / studyingDoc.flashcards.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Flashcard */}
              <div 
                className="bg-white rounded-2xl shadow-xl p-8 mb-6 min-h-[300px] flex flex-col justify-center cursor-pointer transform transition-transform hover:scale-[1.02]"
                onClick={() => setShowAnswer(!showAnswer)}
              >
                <div className="text-center">
                  {!showAnswer ? (
                    <>
                      <div className="text-6xl mb-4">❓</div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-4">
                        {studyingDoc.flashcards[currentCardIndex].question}
                      </h3>
                      <p className="text-gray-500 text-sm">Click to reveal answer</p>
                    </>
                  ) : (
                    <>
                      <div className="text-6xl mb-4">💡</div>
                      <h3 className="text-xl font-semibold text-gray-600 mb-4">
                        {studyingDoc.flashcards[currentCardIndex].question}
                      </h3>
                      <div className="border-t-2 border-purple-200 my-4" />
                      <p className="text-2xl font-bold text-purple-700">
                        {studyingDoc.flashcards[currentCardIndex].answer}
                      </p>
                      <p className="text-gray-500 text-sm mt-4">Click to hide answer</p>
                    </>
                  )}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={prevCard}
                  disabled={currentCardIndex === 0}
                  className="flex-1 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  <span>←</span>
                  <span>Previous</span>
                </button>
                
                <button
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="flex-1 py-3 rounded-lg font-semibold bg-purple-500 text-white hover:bg-purple-600 transition"
                >
                  {showAnswer ? 'Hide Answer' : 'Show Answer'}
                </button>
                
                <button
                  onClick={nextCard}
                  disabled={currentCardIndex === studyingDoc.flashcards.length - 1}
                  className="flex-1 py-3 rounded-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  <span>Next</span>
                  <span>→</span>
                </button>
              </div>

              {/* Completion Message */}
              {currentCardIndex === studyingDoc.flashcards.length - 1 && showAnswer && (
                <div className="mt-6 p-4 bg-green-100 border-2 border-green-300 rounded-lg text-center">
                  <p className="text-green-800 font-semibold">🎉 You&apos;ve reviewed all flashcards!</p>
                  <button
                    onClick={() => {
                      setCurrentCardIndex(0)
                      setShowAnswer(false)
                    }}
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Start Over
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

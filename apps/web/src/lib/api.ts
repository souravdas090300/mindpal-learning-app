const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface User {
  id: string;
  email: string;
  name: string;
}

interface Document {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  userId: string;
  createdAt: string;
}

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  documentId: string;
}

interface ShareUser {
  id: string;
  name: string;
  email: string;
}

interface DocumentShare {
  id: string;
  document_id: string;
  owner_id: string;
  shared_with_user_id: string;
  permission: 'view' | 'edit';
  shared_at: string;
  updated_at: string;
  user: ShareUser;
}

interface ShareLink {
  id: string;
  document_id: string;
  owner_id: string;
  share_token: string;
  permission: 'view' | 'edit';
  expires_at: string | null;
  created_at: string;
  last_accessed_at: string | null;
  access_count: number;
  is_active: boolean;
  url: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  setUser(user: User) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  }

  async signup(email: string, password: string, name: string): Promise<{ user: User; token: string }> {
    const data = await this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  }

  async logout() {
    this.clearToken();
  }

  async createDocument(title: string, content: string): Promise<Document> {
    const data = await this.request('/api/documents', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    });
    return data.document;
  }

  async getDocuments(): Promise<Document[]> {
    const data = await this.request('/api/documents');
    return data.documents;
  }

  async getDocument(id: string): Promise<Document> {
    const data = await this.request(`/api/documents/${id}`);
    return data.document;
  }

  async deleteDocument(id: string): Promise<void> {
    await this.request(`/api/documents/${id}`, {
      method: 'DELETE',
    });
  }

  async updateDocument(id: string, title: string, content: string): Promise<Document> {
    const data = await this.request(`/api/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, content }),
    });
    return data.document;
  }

  async generateFlashcards(documentId: string): Promise<Flashcard[]> {
    const data = await this.request(`/api/flashcards/generate/${documentId}`, {
      method: 'POST',
    });
    return data.flashcards;
  }

  async getFlashcards(documentId: string): Promise<Flashcard[]> {
    const data = await this.request(`/api/flashcards/${documentId}`);
    return data.flashcards;
  }

  async getAIProviders(): Promise<Array<{ id: string; name: string; models: string[]; requiresKey: boolean }>> {
    const data = await this.request('/api/ai-providers');
    return data;
  }

  async testAIProvider(provider: string, model?: string): Promise<{ success: boolean; provider: string; model: string; responseTime: number; testOutput: string }> {
    const url = model ? `/api/ai-providers/test/${provider}?model=${model}` : `/api/ai-providers/test/${provider}`;
    return await this.request(url);
  }

  // ============================================================================
  // SHARING API
  // ============================================================================

  async shareDocument(documentId: string, userEmail: string, permission: 'view' | 'edit'): Promise<{ success: boolean; share: DocumentShare }> {
    const data = await this.request('/api/sharing/share', {
      method: 'POST',
      body: JSON.stringify({ documentId, userEmail, permission }),
    });
    return data;
  }

  async getSharedWith(documentId: string): Promise<DocumentShare[]> {
    return await this.request(`/api/sharing/document/${documentId}`);
  }

  async updateSharePermission(shareId: string, permission: 'view' | 'edit'): Promise<DocumentShare> {
    const data = await this.request(`/api/sharing/${shareId}/permission`, {
      method: 'PUT',
      body: JSON.stringify({ permission }),
    });
    return data;
  }

  async revokeShare(shareId: string): Promise<void> {
    await this.request(`/api/sharing/${shareId}`, {
      method: 'DELETE',
    });
  }

  async getSharedWithMe(): Promise<Array<Document & { sharedBy: ShareUser; permission: string; sharedAt: string }>> {
    return await this.request('/api/sharing/shared-with-me');
  }

  async generateShareLink(documentId: string, permission: 'view' | 'edit', expiresInDays?: number): Promise<{ success: boolean; link: ShareLink; url: string }> {
    const data = await this.request('/api/sharing/link', {
      method: 'POST',
      body: JSON.stringify({ documentId, permission, expiresInDays }),
    });
    return data;
  }

  async getShareLinks(documentId: string): Promise<ShareLink[]> {
    return await this.request(`/api/sharing/links/${documentId}`);
  }

  async deactivateShareLink(linkId: string): Promise<void> {
    await this.request(`/api/sharing/link/${linkId}`, {
      method: 'DELETE',
    });
  }

  async accessDocumentByToken(token: string): Promise<{ document: Document; permission: string; sharedAt: string }> {
    return await this.request(`/api/sharing/public/${token}`);
  }
}

export const apiClient = new ApiClient();

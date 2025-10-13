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
}

export const apiClient = new ApiClient();

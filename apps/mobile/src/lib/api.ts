// API Client for MindPal Backend
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { AuthResponse, User, Document, Flashcard, ApiError } from '../types';

// Get API URL from multiple sources with priority:
// 1. EAS Build config (production/preview)
// 2. Environment variable (development)
// 3. Localhost fallback
const API_URL = 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 
  process.env.EXPO_PUBLIC_API_URL || 
  'http://localhost:3001';

// Debug log in development
if (__DEV__) {
  console.log('📱 API Base URL:', API_URL);
}

class ApiClient {
  private token: string | null = null;

  async initialize() {
    this.token = await AsyncStorage.getItem('mindpal_token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getBaseUrl(): string {
    return API_URL;
  }

  async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('mindpal_token', token);
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('mindpal_token');
    }
    return this.token;
  }

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('mindpal_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error((data as ApiError).error || 'Something went wrong');
    }

    return data as T;
  }

  // Auth endpoints
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    await this.setToken(response.token);
    return response;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await this.setToken(response.token);
    return response;
  }

  async signup(email: string, password: string, name: string): Promise<AuthResponse> {
    return this.register(email, password, name);
  }

  async logout() {
    await this.clearToken();
  }

  // Document endpoints
  async getDocuments(): Promise<Document[]> {
    return this.request<Document[]>('/documents');
  }

  async getDocument(id: string): Promise<Document> {
    return this.request<Document>(`/documents/${id}`);
  }

  async createDocument(title: string, content: string): Promise<Document> {
    return this.request<Document>('/documents', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    });
  }

  async updateDocument(id: string, title?: string, content?: string): Promise<Document> {
    return this.request<Document>(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, content }),
    });
  }

  async deleteDocument(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  // Flashcard endpoints
  async getDueFlashcards(): Promise<Flashcard[]> {
    return this.request<Flashcard[]>('/flashcards/due');
  }

  async getDocumentFlashcards(documentId: string): Promise<Flashcard[]> {
    return this.request<Flashcard[]>(`/flashcards/document/${documentId}`);
  }

  async reviewFlashcard(id: string, quality: number): Promise<Flashcard> {
    return this.request<Flashcard>(`/flashcards/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ quality }),
    });
  }

  // Analytics endpoints
  async getAnalyticsOverview(): Promise<{
    totalDocuments: number;
    totalFlashcards: number;
    totalReviews: number;
    studyTimeMinutes: number;
    currentStreak: number;
    longestStreak: number;
    masteredCards: number;
    averageQuality: number;
  }> {
    return this.request('/analytics/overview');
  }

  async getStudyStreak(): Promise<{
    currentStreak: number;
    longestStreak: number;
  }> {
    return this.request('/analytics/streak');
  }
}

export const api = new ApiClient();
export const apiClient = api; // Alias for compatibility

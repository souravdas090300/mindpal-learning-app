// Type definitions for MindPal mobile app

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  userId: string;
  createdAt: string;
  flashcards?: Flashcard[];
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  documentId: string;
  nextReview: string;
  interval: number;
  easeFactor: number;
  reviewCount: number;
  createdAt: string;
  document?: {
    id: string;
    title: string;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  error: string;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  CreateDocument: undefined;
  DocumentDetail: { documentId: string };
  Review: undefined;
};

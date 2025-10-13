# 📡 API Documentation

Complete API reference for the MindPal Learning App backend.

## Base URL

```
Development: http://localhost:3001/api
Production: https://your-api-domain.com/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication Endpoints

### Register New User

Create a new user account.

**Endpoint:** `POST /auth/signup`  
**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe" // optional
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "ckxyz123abc",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Missing email or password
- `409` - User with email already exists
- `500` - Server error

---

### Login

Authenticate an existing user.

**Endpoint:** `POST /auth/login`  
**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "ckxyz123abc",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Missing email or password
- `401` - Invalid credentials
- `500` - Server error

---

## 📄 Document Endpoints

### Get All Documents

Retrieve all documents for the authenticated user.

**Endpoint:** `GET /documents`  
**Authentication:** Required

**Query Parameters:**
- None

**Response (200 OK):**
```json
[
  {
    "id": "ckdoc123abc",
    "userId": "ckxyz123abc",
    "title": "Introduction to AI",
    "content": "Artificial Intelligence is...",
    "summary": "This document covers the basics of AI...",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z",
    "flashcards": [
      {
        "id": "ckflash1",
        "question": "What is AI?",
        "answer": "Artificial Intelligence..."
      }
    ]
  }
]
```

---

### Create Document (Standard)

Create a new document with AI generation (non-streaming).

**Endpoint:** `POST /documents`  
**Authentication:** Required

**Request Body:**
```json
{
  "title": "Machine Learning Basics",
  "content": "Machine learning is a subset of AI..."
}
```

**Response (201 Created):**
```json
{
  "id": "ckdoc456def",
  "userId": "ckxyz123abc",
  "title": "Machine Learning Basics",
  "content": "Machine learning is a subset of AI...",
  "summary": "This document explains machine learning fundamentals...",
  "createdAt": "2025-01-15T11:00:00.000Z",
  "updatedAt": "2025-01-15T11:00:00.000Z",
  "flashcards": [
    {
      "id": "ckflash2",
      "question": "What is machine learning?",
      "answer": "A subset of AI that..."
    }
  ]
}
```

---

### Create Document (Streaming)

Create a document with real-time AI streaming using Server-Sent Events (SSE).

**Endpoint:** `POST /documents-stream/stream`  
**Authentication:** Required  
**Content-Type:** `text/event-stream`

**Request Body:**
```json
{
  "title": "Neural Networks",
  "content": "Neural networks are computing systems..."
}
```

**Response:** Server-Sent Events (SSE)

**Event Types:**

1. **document-created**
```
event: document-created
data: {"documentId":"ckdoc789","title":"Neural Networks"}
```

2. **summary-start**
```
event: summary-start
data: {}
```

3. **summary-chunk** (multiple events)
```
event: summary-chunk
data: {"text":"This"}

event: summary-chunk
data: {"text":" document"}

event: summary-chunk
data: {"text":" explains..."}
```

4. **summary-complete**
```
event: summary-complete
data: {"summary":"This document explains neural networks..."}
```

5. **flashcards-start**
```
event: flashcards-start
data: {}
```

6. **flashcards-complete**
```
event: flashcards-complete
data: {"flashcards":[{"question":"What are neural networks?","answer":"Computing systems..."}]}
```

7. **complete**
```
event: complete
data: {"documentId":"ckdoc789"}
```

8. **error** (if something fails)
```
event: error
data: {"error":"AI generation failed"}
```

---

### Get Single Document

Retrieve a specific document by ID.

**Endpoint:** `GET /documents/:id`  
**Authentication:** Required

**Response (200 OK):**
```json
{
  "id": "ckdoc123abc",
  "userId": "ckxyz123abc",
  "title": "Introduction to AI",
  "content": "Artificial Intelligence is...",
  "summary": "This document covers the basics of AI...",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z",
  "flashcards": [
    {
      "id": "ckflash1",
      "documentId": "ckdoc123abc",
      "question": "What is AI?",
      "answer": "Artificial Intelligence...",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `404` - Document not found
- `403` - Not authorized to access this document

---

### Update Document

Update an existing document. AI summary and flashcards are regenerated if content changes.

**Endpoint:** `PUT /documents/:id`  
**Authentication:** Required

**Request Body:**
```json
{
  "title": "Introduction to AI (Updated)",
  "content": "Artificial Intelligence is the simulation..."
}
```

**Response (200 OK):**
```json
{
  "id": "ckdoc123abc",
  "userId": "ckxyz123abc",
  "title": "Introduction to AI (Updated)",
  "content": "Artificial Intelligence is the simulation...",
  "summary": "Updated summary based on new content...",
  "updatedAt": "2025-01-15T12:00:00.000Z",
  "flashcards": [
    {
      "id": "ckflash3",
      "question": "How does AI work?",
      "answer": "AI uses algorithms..."
    }
  ]
}
```

---

### Delete Document

Delete a document and all its associated flashcards.

**Endpoint:** `DELETE /documents/:id`  
**Authentication:** Required

**Response (200 OK):**
```json
{
  "message": "Document deleted successfully"
}
```

**Error Responses:**
- `404` - Document not found
- `403` - Not authorized to delete this document

---

## 🎴 Flashcard Endpoints

### Get Flashcards for Document

Retrieve all flashcards for a specific document.

**Endpoint:** `GET /flashcards/document/:documentId`  
**Authentication:** Required

**Response (200 OK):**
```json
[
  {
    "id": "ckflash1",
    "documentId": "ckdoc123abc",
    "question": "What is AI?",
    "answer": "Artificial Intelligence is...",
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  {
    "id": "ckflash2",
    "documentId": "ckdoc123abc",
    "question": "What are the types of AI?",
    "answer": "Narrow AI, General AI, and Super AI",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
]
```

---

## 🏥 Health & Utility Endpoints

### Health Check

Check if the API server and database are operational.

**Endpoint:** `GET /health`  
**Authentication:** Not required

**Response (200 OK):**
```json
{
  "status": "OK",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "database": "Connected"
}
```

**Response (500 Error):**
```json
{
  "status": "ERROR",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "database": "Disconnected",
  "error": "Connection timeout"
}
```

---

### Test Endpoint

Simple test to verify API is running.

**Endpoint:** `GET /test`  
**Authentication:** Not required

**Response (200 OK):**
```json
{
  "message": "MindPal API is running!"
}
```

---

## 🔒 Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "An unexpected error occurred"
}
```

---

## 📋 Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production use.

---

## 🌐 CORS

The API accepts requests from:
- `http://localhost:3000` (Next.js dev)
- `http://localhost:3002` (Next.js alternate port)
- `http://localhost:19000` (Expo dev)
- `https://*.vercel.app` (Production deployments)
- Mobile apps (requests with no origin)

---

## 📝 Notes

1. **IDs:** All IDs use CUID format (e.g., `ckxyz123abc`)
2. **Timestamps:** All timestamps are in ISO 8601 format
3. **Pagination:** Not currently implemented for list endpoints
4. **Streaming:** The `/documents-stream/stream` endpoint uses Server-Sent Events (SSE)
5. **AI Generation:** Uses Google Gemini 2.5 Flash model

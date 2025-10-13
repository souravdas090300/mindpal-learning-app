#!/bin/bash
# MindPal API Test Script - Simple version
# Run with: bash test-api.sh

API_URL="http://localhost:3001/api"
TOKEN=""
DOC_ID=""

echo ""
echo "======================================"
echo "  MINDPAL API - ENDPOINT TESTS"
echo "======================================"
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
curl -s "$API_URL/health" | json_pp
echo ""

# Test 2: Test Endpoint
echo "Test 2: Test Endpoint"
curl -s "$API_URL/test" | json_pp
echo ""

# Test 3: Register User
echo "Test 3: Register User"
TIMESTAMP=$(date +%s)
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User $TIMESTAMP\",\"email\":\"test$TIMESTAMP@mindpal.com\",\"password\":\"Test123!@#\"}")

echo "$REGISTER_RESPONSE" | json_pp
TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
echo "Token: ${TOKEN:0:30}..."
echo ""

# Test 4: Login
echo "Test 4: Login"
curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test$TIMESTAMP@mindpal.com\",\"password\":\"Test123!@#\"}" | json_pp
echo ""

# Test 5: Create Document
echo "Test 5: Create Document with AI"
echo "(This may take 10-30 seconds...)"
DOC_RESPONSE=$(curl -s -X POST "$API_URL/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Machine Learning Basics","content":"Machine learning is a subset of AI. It uses algorithms to learn patterns from data. There are three main types: supervised, unsupervised, and reinforcement learning."}')

echo "$DOC_RESPONSE" | json_pp
DOC_ID=$(echo "$DOC_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
echo "Document ID: $DOC_ID"
echo ""

# Test 6: Get Documents
echo "Test 6: Get All Documents"
curl -s "$API_URL/documents" \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Test 7: Get Flashcards
if [ ! -z "$DOC_ID" ]; then
  echo "Test 7: Get Document Flashcards"
  FLASHCARDS=$(curl -s "$API_URL/flashcards/document/$DOC_ID" \
    -H "Authorization: Bearer $TOKEN")
  echo "$FLASHCARDS" | json_pp
  
  FLASHCARD_ID=$(echo "$FLASHCARDS" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
  echo "First Flashcard ID: $FLASHCARD_ID"
  echo ""
  
  # Test 8: Review Flashcard
  if [ ! -z "$FLASHCARD_ID" ]; then
    echo "Test 8: Review Flashcard"
    curl -s -X POST "$API_URL/flashcards/$FLASHCARD_ID/review" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"quality":4}' | json_pp
    echo ""
  fi
fi

echo "======================================"
echo "  TESTS COMPLETE!"
echo "======================================"

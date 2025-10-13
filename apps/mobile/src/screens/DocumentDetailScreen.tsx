import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Document, Flashcard } from '../types';
import { api } from '../lib/api';

type DocumentDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'DocumentDetail'
>;
type DocumentDetailScreenRouteProp = RouteProp<RootStackParamList, 'DocumentDetail'>;

interface Props {
  navigation: DocumentDetailScreenNavigationProp;
  route: DocumentDetailScreenRouteProp;
}

export default function DocumentDetailScreen({ navigation, route }: Props) {
  const { documentId } = route.params;
  const [document, setDocument] = useState<Document | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocument();
    loadFlashcards();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      const doc = await api.getDocument(documentId);
      setDocument(doc);
    } catch (error) {
      Alert.alert('Error', 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const loadFlashcards = async () => {
    try {
      const cards = await api.getDocumentFlashcards(documentId);
      setFlashcards(cards);
    } catch (error) {
      console.error('Failed to load flashcards:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Document',
      'Are you sure? This will also delete all flashcards.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteDocument(documentId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!document) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Document not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={styles.deleteButton}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>{document.title}</Text>
        <Text style={styles.date}>
          Created: {new Date(document.createdAt).toLocaleDateString()}
        </Text>

        {document.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🤖 AI Summary</Text>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>{document.summary}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 Content</Text>
          <Text style={styles.contentText}>{document.content}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.flashcardHeader}>
            <Text style={styles.sectionTitle}>
              🎴 Flashcards ({flashcards.length})
            </Text>
            {flashcards.length > 0 && (
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() => navigation.navigate('Review')}
              >
                <Text style={styles.reviewButtonText}>Review All</Text>
              </TouchableOpacity>
            )}
          </View>

          {flashcards.length === 0 ? (
            <Text style={styles.emptyText}>No flashcards generated</Text>
          ) : (
            flashcards.map((card, index) => (
              <View key={card.id} style={styles.flashcard}>
                <Text style={styles.flashcardNumber}>Card {index + 1}</Text>
                <Text style={styles.flashcardQuestion}>Q: {card.question}</Text>
                <Text style={styles.flashcardAnswer}>A: {card.answer}</Text>
                <View style={styles.flashcardStats}>
                  <Text style={styles.statText}>
                    📊 Reviews: {card.reviewCount}
                  </Text>
                  <Text style={styles.statText}>
                    📅 Next: {new Date(card.nextReview).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  deleteButton: {
    fontSize: 16,
    color: '#FF3B30',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  summaryText: {
    fontSize: 16,
    color: '#1565C0',
    lineHeight: 24,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  flashcardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reviewButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  flashcard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  flashcardNumber: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  flashcardQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#007AFF',
  },
  flashcardAnswer: {
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
  },
  flashcardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
  },
});

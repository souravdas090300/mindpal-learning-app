import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Flashcard } from '../types';
import { api } from '../lib/api';

type ReviewScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Review'>;

interface Props {
  navigation: ReviewScreenNavigationProp;
}

export default function ReviewScreen({ navigation }: Props) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [flipAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    loadDueFlashcards();
  }, []);

  const loadDueFlashcards = async () => {
    try {
      const cards = await api.getDueFlashcards();
      setFlashcards(cards);
      if (cards.length === 0) {
        Alert.alert(
          'No Cards Due',
          'Great job! No flashcards are due for review right now.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  };

  const flipCard = () => {
    if (isFlipped) {
      Animated.spring(flipAnimation, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(flipAnimation, {
        toValue: 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    }
    setIsFlipped(!isFlipped);
  };

  const handleReview = async (quality: number) => {
    if (!flashcards[currentIndex]) return;

    setReviewing(true);
    try {
      await api.reviewFlashcard(flashcards[currentIndex].id, quality);
      
      // Move to next card
      if (currentIndex + 1 < flashcards.length) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
        flipAnimation.setValue(0);
      } else {
        // All cards reviewed
        Alert.alert(
          'Review Complete!',
          `You reviewed ${flashcards.length} flashcard${flashcards.length > 1 ? 's' : ''}!`,
          [{ text: 'Done', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review');
    } finally {
      setReviewing(false);
    }
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnimation.interpolate({
    inputRange: [0, 90, 90, 180],
    outputRange: [1, 1, 0, 0],
  });

  const backOpacity = flipAnimation.interpolate({
    inputRange: [0, 90, 90, 180],
    outputRange: [0, 0, 1, 1],
  });

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (flashcards.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No flashcards due for review</Text>
      </View>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentIndex + 1} / {flashcards.length}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.documentTitle}>{currentCard.document?.title}</Text>

        <TouchableOpacity
          style={styles.cardContainer}
          onPress={flipCard}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.card,
              styles.cardFront,
              {
                transform: [{ rotateY: frontInterpolate }],
                opacity: frontOpacity,
              },
            ]}
          >
            <Text style={styles.cardLabel}>Question</Text>
            <Text style={styles.cardText}>{currentCard.question}</Text>
            <Text style={styles.tapHint}>👆 Tap to reveal answer</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.card,
              styles.cardBack,
              {
                transform: [{ rotateY: backInterpolate }],
                opacity: backOpacity,
              },
            ]}
          >
            <Text style={styles.cardLabel}>Answer</Text>
            <Text style={styles.cardText}>{currentCard.answer}</Text>
          </Animated.View>
        </TouchableOpacity>

        {isFlipped && !reviewing && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingTitle}>How well did you know this?</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.ratingButton, styles.rating0]}
                onPress={() => handleReview(0)}
              >
                <Text style={styles.ratingEmoji}>😰</Text>
                <Text style={styles.ratingText}>Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.ratingButton, styles.rating2]}
                onPress={() => handleReview(2)}
              >
                <Text style={styles.ratingEmoji}>😐</Text>
                <Text style={styles.ratingText}>Hard</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.ratingButton, styles.rating4]}
                onPress={() => handleReview(4)}
              >
                <Text style={styles.ratingEmoji}>😊</Text>
                <Text style={styles.ratingText}>Good</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.ratingButton, styles.rating5]}
                onPress={() => handleReview(5)}
              >
                <Text style={styles.ratingEmoji}>🎉</Text>
                <Text style={styles.ratingText}>Easy</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {reviewing && (
          <View style={styles.reviewingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.reviewingText}>Updating schedule...</Text>
          </View>
        )}
      </View>
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
    width: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  documentTitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  cardContainer: {
    height: 300,
    marginBottom: 30,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    backgroundColor: '#007AFF',
  },
  cardBack: {
    backgroundColor: '#34C759',
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  cardText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
  },
  tapHint: {
    position: 'absolute',
    bottom: 20,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  ratingContainer: {
    marginTop: 20,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  ratingButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  rating0: {
    backgroundColor: '#FF3B30',
  },
  rating2: {
    backgroundColor: '#FF9500',
  },
  rating4: {
    backgroundColor: '#34C759',
  },
  rating5: {
    backgroundColor: '#007AFF',
  },
  ratingEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  ratingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewingContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  reviewingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
  },
});

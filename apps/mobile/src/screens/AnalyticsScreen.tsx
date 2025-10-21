/**
 * Analytics Screen
 * 
 * Displays user learning analytics and statistics.
 * Features:
 * - Overview statistics
 * - Study streak
 * - Performance metrics
 * - Study time charts
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { api } from '../lib/api';

interface AnalyticsData {
  totalDocuments: number;
  totalFlashcards: number;
  totalReviews: number;
  studyTimeMinutes: number;
  currentStreak: number;
  longestStreak: number;
  masteredCards: number;
  averageQuality: number;
}

export default function AnalyticsScreen() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await api.getAnalyticsOverview();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Analytics</Text>
        <Text style={styles.headerSubtitle}>Your learning progress</Text>
      </View>

      {/* Overview Stats */}
      <View style={styles.section}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#dbeafe' }]}>
            <Text style={styles.statValue}>{analytics?.totalDocuments || 0}</Text>
            <Text style={styles.statLabel}>Documents</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fce7f3' }]}>
            <Text style={styles.statValue}>{analytics?.totalFlashcards || 0}</Text>
            <Text style={styles.statLabel}>Flashcards</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
            <Text style={styles.statValue}>{analytics?.totalReviews || 0}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
            <Text style={styles.statValue}>
              {analytics?.studyTimeMinutes || 0}m
            </Text>
            <Text style={styles.statLabel}>Study Time</Text>
          </View>
        </View>
      </View>

      {/* Streak Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔥 Study Streak</Text>
        <View style={styles.streakCard}>
          <View style={styles.streakItem}>
            <Text style={styles.streakValue}>{analytics?.currentStreak || 0}</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakItem}>
            <Text style={styles.streakValue}>{analytics?.longestStreak || 0}</Text>
            <Text style={styles.streakLabel}>Longest Streak</Text>
          </View>
        </View>
      </View>

      {/* Performance Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Performance</Text>
        <View style={styles.performanceCard}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Mastered Cards</Text>
            <Text style={styles.performanceValue}>
              {analytics?.masteredCards || 0}
            </Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Average Quality</Text>
            <Text style={styles.performanceValue}>
              {analytics?.averageQuality?.toFixed(1) || '0.0'}/5
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Keep up the great work! 🎉</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    backgroundColor: '#6366f1',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0e7ff',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  streakCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 8,
  },
  streakLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  streakDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#e5e7eb',
  },
  performanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  performanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  performanceLabel: {
    fontSize: 16,
    color: '#374151',
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#9ca3af',
  },
});

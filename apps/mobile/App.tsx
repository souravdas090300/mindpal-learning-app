/**
 * MindPal Mobile App
 * 
 * Cross-platform mobile application built with React Native and Expo.
 * Features:
 * - Offline-first architecture
 * - Bottom tab navigation
 * - Native performance
 * - Push notifications
 * - Biometric authentication support
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, StyleSheet, Platform, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { RootStackParamList, TabParamList } from './src/types';
import { api } from './src/lib/api';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CreateDocumentScreen from './src/screens/CreateDocumentScreen';
import DocumentDetailScreen from './src/screens/DocumentDetailScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import SharedScreen from './src/screens/SharedScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Placeholder screens - will be created
const SignupScreen = LoginScreen; // Reuse LoginScreen for now

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Tab Navigator Component
function TabNavigator() {
  return (
    // @ts-ignore - React Navigation type compatibility with React 19
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Documents',
          tabBarIcon: () => '📚',
        }}
      />
      <Tab.Screen 
        name="ReviewTab" 
        component={ReviewScreen}
        options={{
          tabBarLabel: 'Study',
          tabBarIcon: () => '🎴',
        }}
      />
      <Tab.Screen 
        name="AnalyticsTab" 
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: () => '📊',
        }}
      />
      <Tab.Screen 
        name="SharedTab" 
        component={SharedScreen}
        options={{
          tabBarLabel: 'Shared',
          tabBarIcon: () => '👥',
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: () => '👤',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    initializeApp();
    
    // Monitor network status
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected ?? false);
      console.log('Network status:', state.isConnected ? 'Online' : 'Offline');
    });

    return () => unsubscribe();
  }, []);

  const initializeApp = async () => {
    try {
      await api.initialize();
      setIsAuthenticated(api.isAuthenticated());
    } catch (error) {
      console.error('App initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        {/* @ts-ignore - React Navigation type compatibility with React 19 */}
        <Stack.Navigator
          initialRouteName={isAuthenticated ? 'Main' : 'Login'}
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* Auth Stack */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          
          {/* Main App Stack */}
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen 
            name="CreateDocument" 
            component={CreateDocumentScreen}
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'New Document',
              headerBackTitle: 'Cancel',
            }}
          />
          <Stack.Screen 
            name="DocumentDetail" 
            component={DocumentDetailScreen}
            options={{
              headerShown: true,
              headerTitle: 'Document',
              headerBackTitle: 'Back',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      
      {/* Offline Indicator */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <View style={styles.offlineText}>
            <Text style={styles.offlineTextContent}>
              📡 Offline - Changes will sync when online
            </Text>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  offlineBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f59e0b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
  },
  offlineText: {
    alignItems: 'center',
  },
  offlineTextContent: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

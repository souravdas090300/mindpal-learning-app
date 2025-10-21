/**
 * Google Sign-In Button for Mobile
 * 
 * Provides Google OAuth authentication for React Native mobile users using expo-auth-session
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator, View, Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Required for expo-auth-session to work properly
WebBrowser.maybeCompleteAuthSession();

interface GoogleSignInButtonProps {
  onSuccess?: (user: { token: string; user: { id: string; email: string; name?: string; avatar?: string } }) => void;
  onError?: (error: string) => void;
}

export default function GoogleSignInButton({ onSuccess, onError }: GoogleSignInButtonProps) {
  const [loading, setLoading] = React.useState(false);

  // Configure Google OAuth with expo-auth-session
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  // Handle OAuth response
  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.idToken) {
        handleGoogleResponse(authentication.idToken);
      }
    } else if (response?.type === 'error') {
      const errorMsg = 'Google authentication failed';
      onError?.(errorMsg);
      Alert.alert('Sign In Failed', errorMsg);
      setLoading(false);
    } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
      setLoading(false);
    }
  }, [response]);

  const handleGoogleResponse = async (idToken: string) => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      
      // Send ID token to backend for verification
      const backendResponse = await fetch(`${apiUrl}/api/auth/google/mobile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!backendResponse.ok) {
        throw new Error('Backend authentication failed');
      }

      const data = await backendResponse.json();
      
      if (data.success && data.token) {
        onSuccess?.({
          token: data.token,
          user: data.user
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign-in failed';
      onError?.(errorMessage);
      Alert.alert('Sign In Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start Google sign-in';
      onError?.(errorMessage);
      Alert.alert('Sign In Failed', errorMessage);
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleGoogleSignIn}
      disabled={!request || loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View style={styles.buttonContent}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.buttonText}>Continue with Google</Text>
          <Text style={styles.platformText}>
            ({Platform.OS === 'ios' ? 'iOS' : 'Android'})
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  googleIcon: {
    fontWeight: 'bold',
    fontSize: 20,
    backgroundColor: '#fff',
    color: '#4285F4',
    width: 30,
    height: 30,
    borderRadius: 15,
    textAlign: 'center',
    lineHeight: 30,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  platformText: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
  },
});

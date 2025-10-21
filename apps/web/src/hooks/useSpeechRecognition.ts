/**
 * Custom Hook: useSpeechRecognition
 * 
 * Provides Web Speech API integration for voice-to-text transcription.
 * Supports real-time speech recognition with start/stop controls.
 * 
 * Browser Support:
 * - Chrome/Edge: Full support
 * - Safari: Partial support
 * - Firefox: Limited support
 * 
 * @example
 * ```tsx
 * const { transcript, isListening, startListening, stopListening, browserSupported } = useSpeechRecognition();
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface UseSpeechRecognitionReturn {
  /** Current transcribed text */
  transcript: string;
  /** Whether speech recognition is currently active */
  isListening: boolean;
  /** Whether the browser supports speech recognition */
  browserSupported: boolean;
  /** Error message if recognition fails */
  error: string | null;
  /** Start speech recognition */
  startListening: () => void;
  /** Stop speech recognition */
  stopListening: () => void;
  /** Reset transcript to empty */
  resetTranscript: () => void;
  /** Confidence score of the last recognition (0-1) */
  confidence: number;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(1);
  const [browserSupported, setBrowserSupported] = useState(false);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setBrowserSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    setBrowserSupported(true);

    // Initialize Speech Recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening until stopped
    recognition.interimResults = true; // Get intermediate results
    recognition.lang = 'en-US'; // Set language (can be made configurable)
    recognition.maxAlternatives = 1;

    /**
     * Handle speech recognition results
     * Updates transcript with both interim and final results
     */
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptPiece = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcriptPiece + ' ';
          setConfidence(result[0].confidence);
        } else {
          interimTranscript += transcriptPiece; // Interim results for real-time display
        }
      }
      
      // Log interim for debugging (can be used for real-time display)
      if (interimTranscript && process.env.NODE_ENV === 'development') {
        console.log('Interim:', interimTranscript);
      }

      // Update transcript (append final results, show interim results)
      setTranscript(prev => {
        const newTranscript = prev + finalTranscript;
        return newTranscript;
      });
    };

    /**
     * Handle speech recognition errors
     */
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      
      switch (event.error) {
        case 'no-speech':
          setError('No speech detected. Please try again.');
          break;
        case 'audio-capture':
          setError('No microphone found. Please ensure a microphone is connected.');
          break;
        case 'not-allowed':
          setError('Microphone permission denied. Please allow microphone access.');
          break;
        case 'network':
          setError('Network error. Please check your internet connection.');
          break;
        default:
          setError(`Speech recognition error: ${event.error}`);
      }
      
      setIsListening(false);
    };

    /**
     * Handle recognition end
     * Auto-restart if still in listening mode (for continuous recording)
     */
    recognition.onend = () => {
      if (isListening) {
        try {
          recognition.start();
        } catch (err) {
          console.error('Error restarting recognition:', err);
          setIsListening(false);
        }
      }
    };

    /**
     * Handle recognition start
     */
    recognition.onstart = () => {
      setError(null);
      setIsListening(true);
    };

    recognitionRef.current = recognition;

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  /**
   * Start listening for speech
   */
  const startListening = useCallback(() => {
    if (!browserSupported) {
      setError('Speech recognition not supported');
      return;
    }

    if (!isListening && recognitionRef.current) {
      try {
        setError(null);
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        const error = err as Error;
        if (error.name === 'InvalidStateError') {
          // Already started, just update state
          setIsListening(true);
        } else {
          console.error('Error starting recognition:', err);
          setError('Failed to start speech recognition');
        }
      }
    }
  }, [browserSupported, isListening]);

  /**
   * Stop listening for speech
   */
  const stopListening = useCallback(() => {
    if (isListening && recognitionRef.current) {
      setIsListening(false);
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
    }
  }, [isListening]);

  /**
   * Reset transcript to empty
   */
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(1);
    setError(null);
  }, []);

  return {
    transcript,
    isListening,
    browserSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
    confidence,
  };
}

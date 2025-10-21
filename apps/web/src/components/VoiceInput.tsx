/**
 * VoiceInput Component
 * 
 * Provides voice-to-text input functionality using Web Speech API.
 * Features:
 * - Real-time speech recognition
 * - Visual feedback during recording
 * - Browser support detection
 * - Error handling with user-friendly messages
 * - Insert transcribed text into any text field
 * 
 * @example
 * ```tsx
 * <VoiceInput onTranscriptChange={(text) => setContent(text)} />
 * ```
 */

'use client';

import { useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface VoiceInputProps {
  /** Callback when transcript changes */
  onTranscriptChange: (transcript: string) => void;
  /** Current text value (to append to) */
  currentValue?: string;
  /** Whether to append or replace text */
  mode?: 'append' | 'replace';
  /** Custom button className */
  className?: string;
  /** Show/hide the component */
  disabled?: boolean;
}

export default function VoiceInput({
  onTranscriptChange,
  currentValue = '',
  mode = 'append',
  className = '',
  disabled = false,
}: VoiceInputProps) {
  const {
    transcript,
    isListening,
    browserSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
    confidence,
  } = useSpeechRecognition();

  // Update parent component when transcript changes
  useEffect(() => {
    if (transcript) {
      if (mode === 'append') {
        onTranscriptChange(currentValue + ' ' + transcript);
      } else {
        onTranscriptChange(transcript);
      }
    }
  }, [transcript, mode, currentValue, onTranscriptChange]);

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  if (!browserSupported) {
    return (
      <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-sm text-yellow-800">
          Voice input not supported in this browser. Use Chrome, Edge, or Safari.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Voice Input Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
          ${isListening
            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {/* Microphone Icon */}
        <svg 
          className={`w-5 h-5 ${isListening ? 'animate-bounce' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          {isListening ? (
            // Stop icon when listening
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          ) : (
            // Microphone icon when not listening
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          )}
        </svg>
        
        <span>
          {isListening ? 'Stop Recording' : 'Start Voice Input'}
        </span>
      </button>

      {/* Recording Indicator */}
      {isListening && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg animate-pulse">
          <div className="flex gap-1">
            <div className="w-1 h-4 bg-red-600 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-6 bg-red-600 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1 h-5 bg-red-600 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
            <div className="w-1 h-7 bg-red-600 rounded-full animate-pulse" style={{ animationDelay: '450ms' }}></div>
          </div>
          <div>
            <p className="text-sm font-medium text-red-900">Recording in progress...</p>
            <p className="text-xs text-red-700">Speak clearly into your microphone</p>
          </div>
        </div>
      )}

      {/* Transcript Preview */}
      {transcript && !isListening && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm font-medium text-green-900">Transcribed Text:</p>
            {confidence < 0.8 && (
              <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                Low confidence ({Math.round(confidence * 100)}%)
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700">{transcript}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-red-900">Error</p>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!isListening && !transcript && !error && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 font-medium mb-1">💡 Voice Input Tips:</p>
          <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
            <li>Click &quot;Start Voice Input&quot; and speak clearly</li>
            <li>Works best in a quiet environment</li>
            <li>You can pause and resume by clicking the button</li>
            <li>Text will be automatically added when you stop</li>
          </ul>
        </div>
      )}
    </div>
  );
}

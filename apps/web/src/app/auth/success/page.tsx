/**
 * Authentication Success Page
 * 
 * Handles the OAuth callback and redirects to dashboard
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function AuthSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('Processing your login...');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Store token in localStorage
      localStorage.setItem('token', token);
      setMessage('Login successful! Redirecting...');
      
      // Redirect to dashboard after 1 second
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } else {
      setMessage('Authentication failed. No token received.');
      setTimeout(() => {
        router.push('/');
      }, 3000);
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <svg 
              className="w-8 h-8 text-blue-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication</h1>
          <p className="text-gray-600">{message}</p>
        </div>
        
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * ExportButton Component
 * 
 * Provides export functionality for documents in multiple formats.
 * Features dropdown menu with export options:
 * - Export as PDF
 * - Export as Markdown
 * - Export as JSON
 * - Export Flashcards Only
 * 
 * @example
 * ```tsx
 * <ExportButton document={document} />
 * ```
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { exportAsPDF, exportAsMarkdown, exportAsJSON, exportFlashcardsAsText } from '@/lib/export';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface Document {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  createdAt: string;
  flashcards?: Flashcard[];
}

interface ExportButtonProps {
  document: Document;
  showFlashcards?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ExportButton({ document, showFlashcards = true, className = '', size = 'md' }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (typeof window !== 'undefined') {
      window.document.addEventListener('mousedown', handleClickOutside);
      return () => window.document.removeEventListener('mousedown', handleClickOutside);
    }
  }, []);

  const handleExport = async (format: 'pdf' | 'markdown' | 'json' | 'flashcards') => {
    setExporting(true);
    setExportSuccess(null);

    try {
      switch (format) {
        case 'pdf':
          exportAsPDF(document, true);
          setExportSuccess('PDF downloaded successfully!');
          break;
        case 'markdown':
          exportAsMarkdown(document, true);
          setExportSuccess('Markdown downloaded successfully!');
          break;
        case 'json':
          exportAsJSON(document);
          setExportSuccess('JSON downloaded successfully!');
          break;
        case 'flashcards':
          exportFlashcardsAsText(document);
          setExportSuccess('Flashcards downloaded successfully!');
          break;
      }

      setTimeout(() => {
        setIsOpen(false);
        setExportSuccess(null);
      }, 2000);
    } catch (error) {
      console.error('Export error:', error);
      alert(error instanceof Error ? error.message : 'Failed to export document');
    } finally {
      setExporting(false);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const hasFlashcards = document.flashcards && document.flashcards.length > 0;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Export Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={exporting}
        className={`
          flex items-center gap-2 bg-green-600 text-white rounded-lg font-medium
          hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]}
          ${className}
        `}
      >
        {/* Download Icon */}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>{exporting ? 'Exporting...' : 'Export'}</span>
        
        {/* Dropdown Arrow */}
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          {exportSuccess && (
            <div className="bg-green-50 border-b border-green-200 px-4 py-3">
              <div className="flex items-center gap-2 text-green-800 text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{exportSuccess}</span>
              </div>
            </div>
          )}

          {/* Export Options */}
          <div className="py-2">
            {/* PDF Option */}
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 disabled:opacity-50"
            >
              <div className="text-2xl">📄</div>
              <div>
                <div className="font-medium text-gray-900">Export as PDF</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Professional format with formatting
                </div>
              </div>
            </button>

            {/* Markdown Option */}
            <button
              onClick={() => handleExport('markdown')}
              disabled={exporting}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 disabled:opacity-50"
            >
              <div className="text-2xl">📝</div>
              <div>
                <div className="font-medium text-gray-900">Export as Markdown</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Plain text with markdown formatting
                </div>
              </div>
            </button>

            {/* JSON Option */}
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 disabled:opacity-50"
            >
              <div className="text-2xl">💾</div>
              <div>
                <div className="font-medium text-gray-900">Export as JSON</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Raw data format (for backup)
                </div>
              </div>
            </button>

            {/* Flashcards Only Option */}
            {showFlashcards && hasFlashcards && (
              <>
                <div className="border-t border-gray-100 my-2"></div>
                <button
                  onClick={() => handleExport('flashcards')}
                  disabled={exporting}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 disabled:opacity-50"
                >
                  <div className="text-2xl">🎴</div>
                  <div>
                    <div className="font-medium text-gray-900">Export Flashcards Only</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Q&A format ({document.flashcards?.length} cards)
                    </div>
                  </div>
                </button>
              </>
            )}
          </div>

          {/* Info Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-2">
            <p className="text-xs text-gray-600">
              💡 Files will download automatically
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

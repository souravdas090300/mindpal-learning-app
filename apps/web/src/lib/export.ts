/**
 * Export Utilities
 * 
 * Provides functions to export documents and flashcards in various formats:
 * - PDF: Professional document export with formatting
 * - Markdown: Plain text markdown format
 * - JSON: Raw data export
 * 
 * Uses jsPDF for PDF generation and native browser APIs for downloads.
 */

import jsPDF from 'jspdf';

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

/**
 * Export document as PDF
 * 
 * Creates a professionally formatted PDF with:
 * - Title and metadata
 * - Content section
 * - AI-generated summary
 * - Flashcards (if any)
 * 
 * @param document - Document to export
 * @param includeFlashcards - Whether to include flashcards in PDF
 * 
 * @example
 * ```typescript
 * exportAsPDF(document, true);
 * ```
 */
export function exportAsPDF(document: Document, includeFlashcards: boolean = true): void {
  try {
    const doc = new jsPDF();
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);

    /**
     * Helper function to add text with word wrapping
     */
    const addText = (text: string, fontSize: number, fontStyle: 'normal' | 'bold' = 'normal', color: [number, number, number] = [0, 0, 0]) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      doc.setTextColor(color[0], color[1], color[2]);
      
      const lines = doc.splitTextToSize(text, maxWidth);
      
      // Check if we need a new page
      if (yPosition + (lines.length * fontSize * 0.5) > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * fontSize * 0.5 + 5;
    };

    /**
     * Add a horizontal line separator
     */
    const addLine = () => {
      if (yPosition + 5 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
    };

    // Title
    addText(document.title, 24, 'bold', [41, 98, 255]);
    
    // Metadata
    const date = new Date(document.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    addText(`Created: ${date}`, 10, 'normal', [100, 100, 100]);
    
    yPosition += 5;
    addLine();

    // Content Section
    addText('📄 Content', 16, 'bold', [0, 0, 0]);
    yPosition += 3;
    addText(document.content, 11, 'normal');
    
    yPosition += 5;
    addLine();

    // Summary Section (if available)
    if (document.summary) {
      addText('🤖 AI-Generated Summary', 16, 'bold', [0, 0, 0]);
      yPosition += 3;
      addText(document.summary, 11, 'normal', [60, 60, 60]);
      
      yPosition += 5;
      addLine();
    }

    // Flashcards Section (if available and requested)
    if (includeFlashcards && document.flashcards && document.flashcards.length > 0) {
      addText(`🎴 Flashcards (${document.flashcards.length})`, 16, 'bold', [0, 0, 0]);
      yPosition += 5;

      document.flashcards.forEach((card, index) => {
        // Check if we need a new page
        if (yPosition + 50 > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        // Card number
        addText(`Card ${index + 1}`, 12, 'bold', [41, 98, 255]);
        
        // Question
        addText(`Q: ${card.question}`, 11, 'bold');
        
        // Answer
        addText(`A: ${card.answer}`, 11, 'normal', [60, 60, 60]);
        
        yPosition += 5;
      });
    }

    // Footer on last page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${totalPages} | MindPal Learning App`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    const filename = `${document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    doc.save(filename);
    
    console.log(`✅ PDF exported: ${filename}`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw new Error('Failed to export PDF');
  }
}

/**
 * Export document as Markdown
 * 
 * Creates a markdown file with:
 * - Title as H1
 * - Metadata
 * - Content
 * - Summary (if available)
 * - Flashcards as formatted list
 * 
 * @param document - Document to export
 * @param includeFlashcards - Whether to include flashcards
 * 
 * @example
 * ```typescript
 * exportAsMarkdown(document, true);
 * ```
 */
export function exportAsMarkdown(document: Document, includeFlashcards: boolean = true): void {
  try {
    let markdown = '';

    // Title
    markdown += `# ${document.title}\n\n`;

    // Metadata
    const date = new Date(document.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    markdown += `**Created:** ${date}\n`;
    markdown += `**Document ID:** ${document.id}\n\n`;
    markdown += `---\n\n`;

    // Content Section
    markdown += `## 📄 Content\n\n`;
    markdown += `${document.content}\n\n`;
    markdown += `---\n\n`;

    // Summary Section
    if (document.summary) {
      markdown += `## 🤖 AI-Generated Summary\n\n`;
      markdown += `${document.summary}\n\n`;
      markdown += `---\n\n`;
    }

    // Flashcards Section
    if (includeFlashcards && document.flashcards && document.flashcards.length > 0) {
      markdown += `## 🎴 Flashcards (${document.flashcards.length})\n\n`;
      
      document.flashcards.forEach((card, index) => {
        markdown += `### Card ${index + 1}\n\n`;
        markdown += `**Question:** ${card.question}\n\n`;
        markdown += `**Answer:** ${card.answer}\n\n`;
        markdown += `---\n\n`;
      });
    }

    // Footer
    markdown += `*Exported from MindPal Learning App*\n`;

    // Create blob and download
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    const filename = `${document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    link.download = filename;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`✅ Markdown exported: ${filename}`);
  } catch (error) {
    console.error('Error exporting Markdown:', error);
    throw new Error('Failed to export Markdown');
  }
}

/**
 * Export document as JSON
 * 
 * Creates a JSON file with complete document data
 * Useful for backup or data migration
 * 
 * @param document - Document to export
 * 
 * @example
 * ```typescript
 * exportAsJSON(document);
 * ```
 */
export function exportAsJSON(document: Document): void {
  try {
    const jsonData = JSON.stringify(document, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    const filename = `${document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    link.download = filename;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`✅ JSON exported: ${filename}`);
  } catch (error) {
    console.error('Error exporting JSON:', error);
    throw new Error('Failed to export JSON');
  }
}

/**
 * Export flashcards only as text file
 * 
 * Creates a simple text file with Q&A format
 * Useful for printing or importing to other apps
 * 
 * @param document - Document containing flashcards
 * 
 * @example
 * ```typescript
 * exportFlashcardsAsText(document);
 * ```
 */
export function exportFlashcardsAsText(document: Document): void {
  try {
    if (!document.flashcards || document.flashcards.length === 0) {
      throw new Error('No flashcards to export');
    }

    let text = `FLASHCARDS: ${document.title}\n`;
    text += `Created: ${new Date(document.createdAt).toLocaleDateString()}\n`;
    text += `Total Cards: ${document.flashcards.length}\n`;
    text += `${'='.repeat(60)}\n\n`;

    document.flashcards.forEach((card, index) => {
      text += `CARD ${index + 1}\n`;
      text += `${'-'.repeat(60)}\n`;
      text += `Q: ${card.question}\n\n`;
      text += `A: ${card.answer}\n`;
      text += `${'='.repeat(60)}\n\n`;
    });

    text += `\nExported from MindPal Learning App\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    const filename = `${document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_flashcards.txt`;
    link.download = filename;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`✅ Flashcards exported: ${filename}`);
  } catch (error) {
    console.error('Error exporting flashcards:', error);
    throw error;
  }
}

/**
 * Export multiple documents as a single archive
 * (Future enhancement - would require JSZip library)
 */
export function exportMultipleDocuments(documents: Document[], format: 'pdf' | 'markdown' | 'json'): void {
  console.log('Exporting multiple documents...');
  documents.forEach(doc => {
    if (format === 'pdf') exportAsPDF(doc);
    else if (format === 'markdown') exportAsMarkdown(doc);
    else if (format === 'json') exportAsJSON(doc);
  });
  console.log(`✅ Exported ${documents.length} documents as ${format.toUpperCase()}`);
}

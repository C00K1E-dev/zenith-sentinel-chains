/**
 * PDF Text Extraction Utility
 * Extracts text content from uploaded PDF files for agent knowledge base
 */

/**
 * Extract text from PDF file using browser-based parsing
 * @param file - PDF File object
 * @returns Extracted text content (max 5000 characters)
 */
export async function extractPdfText(file: File): Promise<string> {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Use browser's native PDF parsing if available
    // For production, you might want to use pdfjs-dist library
    // This is a simplified version that reads the file as text
    
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(arrayBuffer);
    
    // Extract readable text (remove binary/control characters)
    const cleanText = text
      .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Limit to 5000 characters
    const truncatedText = cleanText.slice(0, 5000);
    
    if (truncatedText.length === 0) {
      throw new Error('No readable text found in PDF');
    }
    
    return truncatedText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF. Please ensure the file is a valid PDF document.');
  }
}

/**
 * Validate PDF file before extraction
 * @param file - File object to validate
 * @returns true if valid PDF file
 */
export function validatePdfFile(file: File): boolean {
  // Check file extension
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return false;
  }
  
  // Check MIME type
  if (file.type !== 'application/pdf') {
    return false;
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return false;
  }
  
  return true;
}

/**
 * Extract and clean whitepaper content for agent training
 * @param file - PDF file
 * @returns Cleaned and formatted text
 */
export async function extractWhitepaperContent(file: File): Promise<{
  text: string;
  wordCount: number;
  characterCount: number;
}> {
  if (!validatePdfFile(file)) {
    throw new Error('Invalid PDF file. Please upload a valid PDF document under 10MB.');
  }
  
  const text = await extractPdfText(file);
  
  // Calculate stats
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  const characterCount = text.length;
  
  return {
    text,
    wordCount,
    characterCount
  };
}

export default {
  extractPdfText,
  validatePdfFile,
  extractWhitepaperContent
};

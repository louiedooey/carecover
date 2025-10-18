import { useCallback } from 'react';
import { reductoApi, ReductoApiError } from '../utils/reductoApi';
import { analyzeInsuranceDocument } from '../utils/interfazeApi';
import { useDocumentContext } from '../contexts/DocumentContext';
import { FileUpload, ExtractedDocument } from '../types';

interface ExtractDocumentParams {
  file: FileUpload;
  category: 'insurance' | 'medical';
  parentId: string;
  parentTitle: string;
  onDocumentExtracted?: (document: ExtractedDocument) => void;
  onAnalysis?: (analysis: any) => void;
}

export const useDocumentExtraction = () => {
  const { dispatch } = useDocumentContext();

  const extractDocument = useCallback(async ({
    file,
    category,
    parentId,
    parentTitle,
    onDocumentExtracted,
    onAnalysis,
  }: ExtractDocumentParams) => {
    try {
      // Create a File object from the URL for API call
      const response = await fetch(file.url);
      const blob = await response.blob();
      const fileObj = new File([blob], file.name, { type: file.type });

      // Extract text using Reducto API
      const extractedText = await reductoApi.extractTextFromFile(fileObj);

      // Update document context with extracted text
      dispatch({
        type: 'UPDATE_DOCUMENT_EXTRACTION',
        payload: {
          fileId: file.id,
          extractedText,
          category,
          parentId,
          parentTitle,
        }
      });

      // If it's an insurance document, analyze it
      if (category === 'insurance') {
        try {
          const analysis = await analyzeInsuranceDocument(extractedText, file.name);
          
          if (onAnalysis) {
            onAnalysis(analysis);
          }

          // Store in session cache for LLM context
          if (onDocumentExtracted) {
            const extractedDocument: ExtractedDocument = {
              id: file.id,
              fileName: file.name,
              extractedText,
              category: 'insurance',
              parentTitle: `${analysis.provider} - ${analysis.policyNumber}`,
              extractedAt: new Date(),
              summary: analysis.summary,
              keyPoints: analysis.keyCoveragePoints,
            };
            onDocumentExtracted(extractedDocument);
          }

          return { extractedText, analysis };
        } catch (analysisError) {
          console.error('Failed to analyze insurance document:', analysisError);
          // Continue even if analysis fails, just with extracted text
          
          if (onDocumentExtracted) {
            const extractedDocument: ExtractedDocument = {
              id: file.id,
              fileName: file.name,
              extractedText,
              category: 'insurance',
              parentTitle: parentTitle,
              extractedAt: new Date(),
            };
            onDocumentExtracted(extractedDocument);
          }

          return { extractedText, analysis: null };
        }
      } else {
        // For medical documents, just store the extracted text
        if (onDocumentExtracted) {
          const extractedDocument: ExtractedDocument = {
            id: file.id,
            fileName: file.name,
            extractedText,
            category: 'medical',
            parentTitle: parentTitle,
            extractedAt: new Date()
          };
          onDocumentExtracted(extractedDocument);
        }

        return { extractedText, analysis: null };
      }
    } catch (error) {
      const errorMessage = error instanceof ReductoApiError 
        ? error.message 
        : 'Failed to extract text from file';
      
      throw new Error(errorMessage);
    }
  }, [dispatch]);

  return { extractDocument };
};


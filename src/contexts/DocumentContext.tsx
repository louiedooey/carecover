import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { FileUpload, InsurancePolicy, MedicalRecord } from '../types';

// Enhanced document types for better organization
export interface StoredDocument extends FileUpload {
  category: 'insurance' | 'medical';
  parentId: string; // ID of the policy or record it belongs to
  parentTitle: string; // Title of the parent policy/record
  tags: string[];
  extractedAt?: Date;
  searchableText: string; // Lowercase text for searching
}

export interface DocumentState {
  documents: StoredDocument[];
  insurancePolicies: InsurancePolicy[];
  medicalRecords: MedicalRecord[];
  searchQuery: string;
  selectedCategory: 'all' | 'insurance' | 'medical';
  selectedDocument: StoredDocument | null;
}

type DocumentAction =
  | { type: 'ADD_INSURANCE_POLICY'; payload: InsurancePolicy }
  | { type: 'UPDATE_INSURANCE_POLICY'; payload: InsurancePolicy }
  | { type: 'DELETE_INSURANCE_POLICY'; payload: string }
  | { type: 'ADD_MEDICAL_RECORD'; payload: MedicalRecord }
  | { type: 'UPDATE_MEDICAL_RECORD'; payload: MedicalRecord }
  | { type: 'DELETE_MEDICAL_RECORD'; payload: string }
  | { type: 'ADD_DOCUMENT'; payload: { fileId: string; fileName: string; fileSize: number; fileType: string; fileUrl: string; category: 'insurance' | 'medical'; parentId: string; parentTitle: string } }
  | { type: 'DELETE_DOCUMENT'; payload: string }
  | { type: 'UPDATE_DOCUMENT_EXTRACTION'; payload: { fileId: string; extractedText: string; category: 'insurance' | 'medical'; parentId: string; parentTitle: string } }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_CATEGORY'; payload: 'all' | 'insurance' | 'medical' }
  | { type: 'SET_SELECTED_DOCUMENT'; payload: StoredDocument | null }
  | { type: 'ADD_DOCUMENT_TAGS'; payload: { fileId: string; tags: string[] } };

const initialState: DocumentState = {
  documents: [],
  insurancePolicies: [],
  medicalRecords: [
    {
      id: '1',
      title: 'Annual Health Checkup 2024',
      date: new Date('2024-01-15'),
      type: 'General Checkup',
      files: [],
    },
    {
      id: '2',
      title: 'Blood Test Results',
      date: new Date('2024-02-20'),
      type: 'Laboratory',
      files: [],
    }
  ],
  searchQuery: '',
  selectedCategory: 'all',
  selectedDocument: null,
};

function documentReducer(state: DocumentState, action: DocumentAction): DocumentState {
  switch (action.type) {
    case 'ADD_INSURANCE_POLICY':
      return {
        ...state,
        insurancePolicies: [...state.insurancePolicies, action.payload],
      };

    case 'UPDATE_INSURANCE_POLICY':
      return {
        ...state,
        insurancePolicies: state.insurancePolicies.map(policy =>
          policy.id === action.payload.id ? action.payload : policy
        ),
      };

    case 'DELETE_INSURANCE_POLICY':
      return {
        ...state,
        insurancePolicies: state.insurancePolicies.filter(policy => policy.id !== action.payload),
        documents: state.documents.filter(doc => doc.parentId !== action.payload),
      };

    case 'ADD_MEDICAL_RECORD':
      return {
        ...state,
        medicalRecords: [...state.medicalRecords, action.payload],
      };

    case 'UPDATE_MEDICAL_RECORD':
      return {
        ...state,
        medicalRecords: state.medicalRecords.map(record =>
          record.id === action.payload.id ? action.payload : record
        ),
      };

    case 'DELETE_MEDICAL_RECORD':
      return {
        ...state,
        medicalRecords: state.medicalRecords.filter(record => record.id !== action.payload),
        documents: state.documents.filter(doc => doc.parentId !== action.payload),
      };

    case 'UPDATE_DOCUMENT_EXTRACTION':
      const { fileId, extractedText, category, parentId, parentTitle } = action.payload;
      const existingDocIndex = state.documents.findIndex(doc => doc.id === fileId);
      
      if (existingDocIndex >= 0) {
        // Update existing document
        const updatedDocuments = [...state.documents];
        updatedDocuments[existingDocIndex] = {
          ...updatedDocuments[existingDocIndex],
          extractedText,
          extractionStatus: 'completed',
          extractedAt: new Date(),
          searchableText: extractedText.toLowerCase(),
        };
        return {
          ...state,
          documents: updatedDocuments,
        };
      } else {
        // This should not happen as documents should be created when files are uploaded
        // But if it does, we'll create a minimal document entry
        const newDocument: StoredDocument = {
          id: fileId,
          name: `Document ${fileId}`,
          size: 0,
          type: 'unknown',
          url: '',
          uploadedAt: new Date(),
          extractedText,
          extractionStatus: 'completed',
          category,
          parentId,
          parentTitle,
          tags: [],
          extractedAt: new Date(),
          searchableText: extractedText.toLowerCase(),
        };
        return {
          ...state,
          documents: [...state.documents, newDocument],
        };
      }

    case 'ADD_DOCUMENT':
      const { fileId: newFileId, fileName, fileSize, fileType, fileUrl, category: newCategory, parentId: newParentId, parentTitle: newParentTitle } = action.payload;
      const newDocument: StoredDocument = {
        id: newFileId,
        name: fileName,
        size: fileSize,
        type: fileType,
        url: fileUrl,
        uploadedAt: new Date(),
        extractionStatus: 'pending',
        category: newCategory,
        parentId: newParentId,
        parentTitle: newParentTitle,
        tags: [],
        searchableText: fileName.toLowerCase(),
      };
      return {
        ...state,
        documents: [...state.documents, newDocument],
      };

    case 'DELETE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.filter(doc => doc.id !== action.payload),
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
      };

    case 'SET_SELECTED_CATEGORY':
      return {
        ...state,
        selectedCategory: action.payload,
      };

    case 'SET_SELECTED_DOCUMENT':
      return {
        ...state,
        selectedDocument: action.payload,
      };

    case 'ADD_DOCUMENT_TAGS':
      return {
        ...state,
        documents: state.documents.map(doc =>
          doc.id === action.payload.fileId
            ? { ...doc, tags: [...doc.tags, ...action.payload.tags] }
            : doc
        ),
      };

    default:
      return state;
  }
}

interface DocumentContextType {
  state: DocumentState;
  dispatch: React.Dispatch<DocumentAction>;
  // Helper functions
  getFilteredDocuments: () => StoredDocument[];
  getDocumentsByCategory: (category: 'insurance' | 'medical') => StoredDocument[];
  searchDocuments: (query: string) => StoredDocument[];
  getDocumentById: (id: string) => StoredDocument | undefined;
  getDocumentsByParent: (parentId: string) => StoredDocument[];
  // Debug functions
  getDocumentCacheStats: () => { total: number; insurance: number; medical: number; extracted: number; pending: number };
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const useDocumentContext = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocumentContext must be used within a DocumentProvider');
  }
  return context;
};

interface DocumentProviderProps {
  children: ReactNode;
}

export const DocumentProvider: React.FC<DocumentProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(documentReducer, initialState);

  const getFilteredDocuments = (): StoredDocument[] => {
    let filtered = state.documents;

    // Filter by category
    if (state.selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === state.selectedCategory);
    }

    // Filter by search query
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.searchableText.includes(query) ||
        doc.name.toLowerCase().includes(query) ||
        doc.parentTitle.toLowerCase().includes(query) ||
        doc.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const getDocumentsByCategory = (category: 'insurance' | 'medical'): StoredDocument[] => {
    return state.documents.filter(doc => doc.category === category);
  };

  const searchDocuments = (query: string): StoredDocument[] => {
    if (!query.trim()) return state.documents;
    
    const lowercaseQuery = query.toLowerCase();
    return state.documents.filter(doc =>
      doc.searchableText.includes(lowercaseQuery) ||
      doc.name.toLowerCase().includes(lowercaseQuery) ||
      doc.parentTitle.toLowerCase().includes(lowercaseQuery) ||
      doc.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  };

  const getDocumentById = (id: string): StoredDocument | undefined => {
    return state.documents.find(doc => doc.id === id);
  };

  const getDocumentsByParent = (parentId: string): StoredDocument[] => {
    return state.documents.filter(doc => doc.parentId === parentId);
  };

  const getDocumentCacheStats = () => {
    const total = state.documents.length;
    const insurance = state.documents.filter(doc => doc.category === 'insurance').length;
    const medical = state.documents.filter(doc => doc.category === 'medical').length;
    const extracted = state.documents.filter(doc => doc.extractionStatus === 'completed').length;
    const pending = state.documents.filter(doc => doc.extractionStatus === 'pending' || doc.extractionStatus === 'processing').length;
    
    return { total, insurance, medical, extracted, pending };
  };

  const value: DocumentContextType = {
    state,
    dispatch,
    getFilteredDocuments,
    getDocumentsByCategory,
    searchDocuments,
    getDocumentById,
    getDocumentsByParent,
    getDocumentCacheStats,
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};

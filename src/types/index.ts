export interface CarouselOption {
  title: string;
  points: string[];
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'file';
  fileUrl?: string;
  fileName?: string;
  carouselOptions?: CarouselOption[];
}

export interface ExtractedDocument {
  id: string;
  fileName: string;
  extractedText: string;
  category: 'insurance' | 'medical';
  parentTitle: string; // e.g., "AIA - AIA-123456789"
  extractedAt: Date;
  // For LLM context
  summary?: string;
  keyPoints?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  // Add document cache for LLM context
  documentCache: {
    insurance: ExtractedDocument[];
    medical: ExtractedDocument[];
  };
}

export interface UserProfile {
  name: string;
  initials: string;
  nric: string;
}

export interface ModalState {
  isOpen: boolean;
  type: 'insurance' | 'medical' | 'demographic' | null;
}

export interface FileUpload {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
  extractedText?: string;
  extractionStatus?: 'pending' | 'processing' | 'completed' | 'error';
  extractionError?: string;
}

export interface InsurancePolicy {
  id: string;
  provider: string;
  policyNumber: string;
  coverageType: string;
  files: FileUpload[];
  // LLM-generated fields
  documentName?: string;
  summary?: string;
  keyCoveragePoints?: string[];
  isEditing?: boolean;
}

export interface MedicalRecord {
  id: string;
  title: string;
  date: Date;
  type: string;
  files: FileUpload[];
}

export interface DemographicInfo {
  id: string;
  fullName: string;
  dateOfBirth: Date;
  gender: string;
  address: string;
  phoneNumber: string;
  emergencyContact: string;
}

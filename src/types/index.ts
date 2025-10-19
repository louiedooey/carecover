export interface CarouselOption {
  title: string;
  points: string[];
}

export interface FileAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  extractedText?: string;
  extractionStatus: 'pending' | 'processing' | 'completed' | 'error';
  extractionError?: string;
  uploadedAt: Date;
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
  attachments?: FileAttachment[];
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
  // Emergency context for medical assistance flow
  emergencyContext?: EmergencyContext;
  // Claims history for coverage calculations
  claimHistory: ClaimHistory[];
}

export interface UserProfile {
  name: string;
  initials: string;
  nric: string;
  hasCustomName?: boolean;
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
  residencyStatus: string;
}

export interface EmergencyContext {
  currentStep: 1 | 2 | 3 | 4;
  severityLevel: 'minor' | 'moderate' | 'severe' | 'critical';
  selectedCareOption?: string;
  treatmentStartTime?: Date;
  followUpScheduled?: Date;
  symptoms: string[];
  location?: string;
  painLevel?: number;
}

export interface ClaimHistory {
  id: string;
  date: Date;
  amount: number;
  provider: string;
  type: 'emergency' | 'outpatient' | 'inpatient' | 'specialist';
  status: 'submitted' | 'approved' | 'rejected' | 'pending';
  description: string;
}

export interface HealthcareOption {
  facilityId: string;
  facilityName: string;
  type: 'hospital' | 'polyclinic' | 'gp' | 'specialist';
  address: string;
  phone: string;
  costEstimate: {
    min: number;
    max: number;
    currency: string;
  };
  waitTime: string;
  coverage: {
    percentage: number;
    deductible: number;
    coPay: number;
    isPanelProvider: boolean;
  };
  distance?: string;
  hasEmergency: boolean;
}

import { Message, ExtractedDocument } from '../types';

export interface TreatmentSummary {
  symptoms: string[];
  painLevel?: number;
  duration: string;
  location: string;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  relevantHistory: string[];
  summary: string;
}

export interface DocumentChecklist {
  required: string[];
  recommended: string[];
  notes: string[];
}

export interface TreatmentPreparation {
  summary: TreatmentSummary;
  documents: DocumentChecklist;
  questions: string[];
  instructions: string[];
}

export function generateTreatmentSummary(
  messages: Message[],
  medicalDocuments: ExtractedDocument[]
): TreatmentSummary {
  const symptoms: string[] = [];
  let painLevel: number | undefined;
  let duration = 'Unknown';
  let location = 'Unknown';
  let severity: 'minor' | 'moderate' | 'severe' | 'critical' = 'moderate';
  const relevantHistory: string[] = [];

  // Extract information from conversation
  for (const message of messages) {
    if (message.sender === 'user') {
      const content = message.content.toLowerCase();
      
      // Extract symptoms
      const symptomKeywords = [
        'pain', 'hurt', 'ache', 'swelling', 'bleeding', 'bruise', 'cut', 'wound',
        'fall', 'trip', 'injury', 'sprain', 'strain', 'fracture', 'break',
        'nausea', 'dizziness', 'fever', 'headache', 'cough', 'shortness of breath'
      ];
      
      for (const keyword of symptomKeywords) {
        if (content.includes(keyword) && !symptoms.includes(keyword)) {
          symptoms.push(keyword);
        }
      }
      
      // Extract pain level
      const painMatch = content.match(/pain\s*level?\s*(\d+)/i);
      if (painMatch) {
        painLevel = parseInt(painMatch[1]);
      }
      
      // Extract duration
      const durationKeywords = [
        'minutes ago', 'hours ago', 'days ago', 'weeks ago',
        'just happened', 'recently', 'yesterday', 'today'
      ];
      
      for (const keyword of durationKeywords) {
        if (content.includes(keyword)) {
          duration = keyword;
          break;
        }
      }
      
      // Extract location
      const locationKeywords = [
        'east coast park', 'bedok', 'tampines', 'jurong', 'woodlands',
        'orchard', 'marina bay', 'sentosa', 'home', 'work', 'school'
      ];
      
      for (const keyword of locationKeywords) {
        if (content.includes(keyword)) {
          location = keyword;
          break;
        }
      }
    }
  }

  // Determine severity based on symptoms and pain level
  if (painLevel !== undefined) {
    if (painLevel >= 8) {
      severity = 'critical';
    } else if (painLevel >= 6) {
      severity = 'severe';
    } else if (painLevel >= 4) {
      severity = 'moderate';
    } else {
      severity = 'minor';
    }
  }

  // Check for critical symptoms
  const criticalSymptoms = ['bleeding', 'fracture', 'break', 'unconscious', 'difficulty breathing'];
  if (criticalSymptoms.some(symptom => symptoms.includes(symptom))) {
    severity = 'critical';
  }

  // Extract relevant medical history
  for (const doc of medicalDocuments) {
    if (doc.category === 'medical') {
      const text = doc.extractedText.toLowerCase();
      
      // Look for relevant conditions
      const relevantConditions = [
        'diabetes', 'hypertension', 'heart condition', 'asthma', 'allergy',
        'medication', 'surgery', 'fracture', 'injury'
      ];
      
      for (const condition of relevantConditions) {
        if (text.includes(condition) && !relevantHistory.includes(condition)) {
          relevantHistory.push(condition);
        }
      }
    }
  }

  // Generate summary
  const summary = generateSummaryText(symptoms, painLevel, duration, location, severity, relevantHistory);

  return {
    symptoms,
    painLevel,
    duration,
    location,
    severity,
    relevantHistory,
    summary
  };
}

function generateSummaryText(
  symptoms: string[],
  painLevel: number | undefined,
  duration: string,
  location: string,
  severity: string,
  relevantHistory: string[]
): string {
  const parts: string[] = [];
  
  // Main incident
  parts.push(`Patient experienced ${symptoms.join(', ')} ${duration} at ${location}.`);
  
  // Pain level
  if (painLevel !== undefined) {
    parts.push(`Pain level reported as ${painLevel}/10.`);
  }
  
  // Severity assessment
  parts.push(`Severity assessed as ${severity}.`);
  
  // Relevant history
  if (relevantHistory.length > 0) {
    parts.push(`Relevant medical history includes: ${relevantHistory.join(', ')}.`);
  }
  
  return parts.join(' ');
}

export function generateDocumentChecklist(
  treatmentType: 'emergency' | 'consultation' | 'specialist',
  hasInsurance: boolean = false
): DocumentChecklist {
  const required: string[] = [];
  const recommended: string[] = [];
  const notes: string[] = [];

  // Always required
  required.push('NRIC/Identity Card');
  required.push('Insurance card (if applicable)');

  if (treatmentType === 'emergency') {
    required.push('Emergency contact information');
    recommended.push('List of current medications');
    recommended.push('Allergy information');
    notes.push('Emergency treatment can proceed without all documents');
  } else if (treatmentType === 'consultation') {
    required.push('Referral letter (if from polyclinic)');
    recommended.push('Previous medical records');
    recommended.push('List of current medications');
    recommended.push('Allergy information');
  } else if (treatmentType === 'specialist') {
    required.push('Referral letter from GP');
    required.push('Previous medical records');
    recommended.push('Recent test results');
    recommended.push('List of current medications');
    recommended.push('Allergy information');
  }

  if (hasInsurance) {
    recommended.push('Insurance policy documents');
    recommended.push('Pre-authorization letter (if required)');
    notes.push('Check with your insurance provider for specific requirements');
  }

  return {
    required,
    recommended,
    notes
  };
}

export function generateQuestionsForDoctor(
  symptoms: string[],
  severity: string
): string[] {
  const questions: string[] = [];

  // General questions
  questions.push('What is the diagnosis?');
  questions.push('What treatment options are available?');
  questions.push('What is the expected recovery time?');
  questions.push('Are there any restrictions or precautions?');

  // Pain management
  if (symptoms.includes('pain')) {
    questions.push('What pain management options are available?');
    questions.push('Are there any side effects to the pain medication?');
  }

  // Follow-up care
  questions.push('Do I need a follow-up appointment?');
  questions.push('When should I seek immediate medical attention?');

  // Insurance and costs
  questions.push('What are the estimated costs?');
  questions.push('Will this be covered by my insurance?');

  // Severity-specific questions
  if (severity === 'severe' || severity === 'critical') {
    questions.push('Do I need to be admitted to the hospital?');
    questions.push('Are there any immediate risks or complications?');
  }

  return questions;
}

export function generateTreatmentInstructions(
  severity: string,
  symptoms: string[]
): string[] {
  const instructions: string[] = [];

  // General instructions
  instructions.push('Bring all required documents');
  instructions.push('Arrive 15 minutes early for registration');
  instructions.push('Inform staff of any allergies or medical conditions');

  // Severity-specific instructions
  if (severity === 'critical') {
    instructions.push('Go to emergency department immediately');
    instructions.push('Call ambulance if unable to travel safely');
    instructions.push('Do not delay seeking treatment');
  } else if (severity === 'severe') {
    instructions.push('Seek medical attention as soon as possible');
    instructions.push('Avoid putting weight on injured area');
    instructions.push('Apply ice if safe to do so');
  } else if (severity === 'moderate') {
    instructions.push('Seek medical attention within 24 hours');
    instructions.push('Rest the affected area');
    instructions.push('Monitor for worsening symptoms');
  } else {
    instructions.push('Monitor symptoms closely');
    instructions.push('Seek medical attention if symptoms worsen');
    instructions.push('Consider self-care measures');
  }

  // Symptom-specific instructions
  if (symptoms.includes('bleeding')) {
    instructions.push('Apply direct pressure to stop bleeding');
    instructions.push('Elevate the injured area if possible');
  }

  if (symptoms.includes('swelling')) {
    instructions.push('Apply ice for 15-20 minutes every hour');
    instructions.push('Elevate the affected area');
  }

  if (symptoms.includes('pain')) {
    instructions.push('Avoid activities that worsen pain');
    instructions.push('Consider over-the-counter pain relief if appropriate');
  }

  return instructions;
}

export function createTreatmentPreparation(
  messages: Message[],
  medicalDocuments: ExtractedDocument[],
  treatmentType: 'emergency' | 'consultation' | 'specialist' = 'emergency',
  hasInsurance: boolean = false
): TreatmentPreparation {
  const summary = generateTreatmentSummary(messages, medicalDocuments);
  const documents = generateDocumentChecklist(treatmentType, hasInsurance);
  const questions = generateQuestionsForDoctor(summary.symptoms, summary.severity);
  const instructions = generateTreatmentInstructions(summary.severity, summary.symptoms);

  return {
    summary,
    documents,
    questions,
    instructions
  };
}

export function formatTreatmentPreparation(preparation: TreatmentPreparation): string {
  const sections: string[] = [];

  // Summary
  sections.push('## Treatment Summary');
  sections.push(preparation.summary.summary);
  sections.push('');

  // Documents
  sections.push('## Required Documents');
  sections.push('**Required:**');
  preparation.documents.required.forEach(doc => {
    sections.push(`- ${doc}`);
  });
  
  if (preparation.documents.recommended.length > 0) {
    sections.push('');
    sections.push('**Recommended:**');
    preparation.documents.recommended.forEach(doc => {
      sections.push(`- ${doc}`);
    });
  }

  if (preparation.documents.notes.length > 0) {
    sections.push('');
    sections.push('**Notes:**');
    preparation.documents.notes.forEach(note => {
      sections.push(`- ${note}`);
    });
  }

  sections.push('');

  // Questions
  sections.push('## Questions to Ask Your Doctor');
  preparation.questions.forEach(question => {
    sections.push(`- ${question}`);
  });

  sections.push('');

  // Instructions
  sections.push('## Important Instructions');
  preparation.instructions.forEach(instruction => {
    sections.push(`- ${instruction}`);
  });

  return sections.join('\n');
}

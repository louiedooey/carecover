import { useState, useCallback, useEffect } from 'react';
import { EmergencyContext, ChatSession, Message } from '../types';
import { useFollowUp, calculateFollowUpDelay, generateFollowUpMessage, shouldScheduleFollowUp } from './useFollowUp';

export interface UseEmergencyFlowReturn {
  emergencyContext: EmergencyContext | undefined;
  initializeEmergency: (symptoms: string[], location?: string, painLevel?: number) => void;
  updateSeverity: (severity: EmergencyContext['severityLevel']) => void;
  selectCareOption: (optionId: string) => void;
  startTreatment: () => void;
  completeTreatment: () => void;
  moveToStep: (step: 1 | 2 | 3 | 4) => void;
  addSymptom: (symptom: string) => void;
  updateLocation: (location: string) => void;
  updatePainLevel: (level: number) => void;
  isEmergencyActive: boolean;
  canProceedToStep: (step: number) => boolean;
  getStepProgress: () => { current: number; total: number; percentage: number };
}

export function useEmergencyFlow(session: ChatSession | undefined): UseEmergencyFlowReturn {
  const [emergencyContext, setEmergencyContext] = useState<EmergencyContext | undefined>(
    session?.emergencyContext
  );
  
  const { scheduleFollowUp } = useFollowUp();

  // Sync with session emergency context
  useEffect(() => {
    if (session?.emergencyContext) {
      setEmergencyContext(session.emergencyContext);
    }
  }, [session?.emergencyContext]);

  // Update session when emergency context changes
  useEffect(() => {
    if (session && emergencyContext) {
      session.emergencyContext = emergencyContext;
    }
  }, [session, emergencyContext]);

  const initializeEmergency = useCallback((
    symptoms: string[],
    location?: string,
    painLevel?: number
  ) => {
    const newContext: EmergencyContext = {
      currentStep: 1,
      severityLevel: 'moderate',
      symptoms,
      location,
      painLevel
    };

    setEmergencyContext(newContext);
  }, []);

  const updateSeverity = useCallback((severity: EmergencyContext['severityLevel']) => {
    setEmergencyContext(prev => prev ? { ...prev, severityLevel: severity } : undefined);
  }, []);

  const selectCareOption = useCallback((optionId: string) => {
    setEmergencyContext(prev => prev ? { ...prev, selectedCareOption: optionId } : undefined);
  }, []);

  const startTreatment = useCallback(() => {
    setEmergencyContext(prev => {
      if (!prev) return undefined;
      
      const updated = { ...prev, treatmentStartTime: new Date() };
      
      // Schedule follow-up if appropriate
      if (shouldScheduleFollowUp(updated)) {
        const delayMinutes = calculateFollowUpDelay(updated.severityLevel, 'emergency');
        const message = generateFollowUpMessage(updated.severityLevel);
        
        if (session) {
          const followUpId = scheduleFollowUp(session.id, delayMinutes, message);
          updated.followUpScheduled = new Date(Date.now() + delayMinutes * 60 * 1000);
        }
      }
      
      return updated;
    });
  }, [session, scheduleFollowUp]);

  const completeTreatment = useCallback(() => {
    setEmergencyContext(prev => prev ? { ...prev, currentStep: 4 } : undefined);
  }, []);

  const moveToStep = useCallback((step: 1 | 2 | 3 | 4) => {
    setEmergencyContext(prev => prev ? { ...prev, currentStep: step } : undefined);
  }, []);

  const addSymptom = useCallback((symptom: string) => {
    setEmergencyContext(prev => {
      if (!prev) return undefined;
      
      const updatedSymptoms = [...prev.symptoms];
      if (!updatedSymptoms.includes(symptom)) {
        updatedSymptoms.push(symptom);
      }
      
      return { ...prev, symptoms: updatedSymptoms };
    });
  }, []);

  const updateLocation = useCallback((location: string) => {
    setEmergencyContext(prev => prev ? { ...prev, location } : undefined);
  }, []);

  const updatePainLevel = useCallback((level: number) => {
    setEmergencyContext(prev => prev ? { ...prev, painLevel: level } : undefined);
  }, []);

  const isEmergencyActive = emergencyContext !== undefined;

  const canProceedToStep = useCallback((step: number): boolean => {
    if (!emergencyContext) return false;
    
    switch (step) {
      case 1:
        return true; // Always can start
      case 2:
        return emergencyContext.symptoms.length > 0 && emergencyContext.severityLevel !== undefined;
      case 3:
        return emergencyContext.selectedCareOption !== undefined;
      case 4:
        return emergencyContext.treatmentStartTime !== undefined;
      default:
        return false;
    }
  }, [emergencyContext]);

  const getStepProgress = useCallback(() => {
    if (!emergencyContext) {
      return { current: 0, total: 4, percentage: 0 };
    }
    
    const current = emergencyContext.currentStep;
    const total = 4;
    const percentage = (current / total) * 100;
    
    return { current, total, percentage };
  }, [emergencyContext]);

  return {
    emergencyContext,
    initializeEmergency,
    updateSeverity,
    selectCareOption,
    startTreatment,
    completeTreatment,
    moveToStep,
    addSymptom,
    updateLocation,
    updatePainLevel,
    isEmergencyActive,
    canProceedToStep,
    getStepProgress
  };
}

// Helper functions for emergency flow management
export function detectEmergencyFromMessage(message: Message): {
  isEmergency: boolean;
  symptoms: string[];
  location?: string;
  painLevel?: number;
} {
  const content = message.content.toLowerCase();
  
  // Emergency keywords
  const emergencyKeywords = [
    'emergency', 'urgent', 'accident', 'injury', 'fall', 'trip', 'hurt', 'pain',
    'bleeding', 'broken', 'fracture', 'unconscious', 'difficulty breathing',
    'chest pain', 'severe', 'critical', 'ambulance', 'hospital', 'a&e'
  ];
  
  const isEmergency = emergencyKeywords.some(keyword => content.includes(keyword));
  
  if (!isEmergency) {
    return { isEmergency: false, symptoms: [] };
  }
  
  // Extract symptoms
  const symptoms: string[] = [];
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
  let painLevel: number | undefined;
  const painMatch = content.match(/pain\s*level?\s*(\d+)/i);
  if (painMatch) {
    painLevel = parseInt(painMatch[1]);
  }
  
  // Extract location
  let location: string | undefined;
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
  
  return {
    isEmergency,
    symptoms,
    location,
    painLevel
  };
}

export function getSeverityFromSymptoms(
  symptoms: string[],
  painLevel?: number
): EmergencyContext['severityLevel'] {
  // Critical symptoms
  const criticalSymptoms = [
    'unconscious', 'difficulty breathing', 'chest pain', 'severe bleeding',
    'broken', 'fracture', 'head injury'
  ];
  
  if (criticalSymptoms.some(symptom => symptoms.includes(symptom))) {
    return 'critical';
  }
  
  // Severe symptoms
  const severeSymptoms = [
    'bleeding', 'severe pain', 'cannot walk', 'cannot move', 'swelling'
  ];
  
  if (severeSymptoms.some(symptom => symptoms.includes(symptom)) || (painLevel && painLevel >= 8)) {
    return 'severe';
  }
  
  // Moderate symptoms
  if (painLevel && painLevel >= 5) {
    return 'moderate';
  }
  
  // Minor symptoms
  return 'minor';
}

export function getStepDescription(step: number): string {
  switch (step) {
    case 1:
      return 'Assessing your symptoms and severity';
    case 2:
      return 'Finding the best care options for you';
    case 3:
      return 'Preparing for your treatment';
    case 4:
      return 'Helping with insurance claims';
    default:
      return 'Emergency assistance';
  }
}

export function getStepIcon(step: number): string {
  switch (step) {
    case 1:
      return '🔍';
    case 2:
      return '🏥';
    case 3:
      return '📋';
    case 4:
      return '📄';
    default:
      return '🚨';
  }
}

export function shouldShowEmergencyFlow(messages: Message[]): boolean {
  // Check if any recent message indicates an emergency
  const recentMessages = messages.slice(-5); // Check last 5 messages
  
  return recentMessages.some(message => {
    const detection = detectEmergencyFromMessage(message);
    return detection.isEmergency;
  });
}

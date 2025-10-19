import { useState, useEffect, useCallback } from 'react';
import { EmergencyContext } from '../types';

export interface FollowUpSchedule {
  id: string;
  sessionId: string;
  scheduledTime: Date;
  message: string;
  isTriggered: boolean;
  createdAt: Date;
}

export interface UseFollowUpReturn {
  scheduleFollowUp: (sessionId: string, delayMinutes: number, message: string) => string;
  cancelFollowUp: (followUpId: string) => void;
  triggerFollowUp: (followUpId: string) => void;
  getPendingFollowUps: (sessionId: string) => FollowUpSchedule[];
  isFollowUpDue: (followUpId: string) => boolean;
}

const STORAGE_KEY = 'carecover_follow_ups';

export function useFollowUp(): UseFollowUpReturn {
  const [followUps, setFollowUps] = useState<FollowUpSchedule[]>([]);

  // Load follow-ups from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored).map((fu: any) => ({
          ...fu,
          scheduledTime: new Date(fu.scheduledTime),
          createdAt: new Date(fu.createdAt)
        }));
        setFollowUps(parsed);
      }
    } catch (error) {
      console.error('Error loading follow-ups from localStorage:', error);
    }
  }, []);

  // Save follow-ups to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(followUps));
    } catch (error) {
      console.error('Error saving follow-ups to localStorage:', error);
    }
  }, [followUps]);

  // Check for due follow-ups every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const dueFollowUps = followUps.filter(fu => 
        !fu.isTriggered && fu.scheduledTime <= now
      );

      if (dueFollowUps.length > 0) {
        // Trigger due follow-ups
        dueFollowUps.forEach(fu => {
          triggerFollowUp(fu.id);
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [followUps]);

  const scheduleFollowUp = useCallback((
    sessionId: string,
    delayMinutes: number,
    message: string
  ): string => {
    const scheduledTime = new Date();
    scheduledTime.setMinutes(scheduledTime.getMinutes() + delayMinutes);

    const followUp: FollowUpSchedule = {
      id: `followup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      scheduledTime,
      message,
      isTriggered: false,
      createdAt: new Date()
    };

    setFollowUps(prev => [...prev, followUp]);
    return followUp.id;
  }, []);

  const cancelFollowUp = useCallback((followUpId: string) => {
    setFollowUps(prev => prev.filter(fu => fu.id !== followUpId));
  }, []);

  const triggerFollowUp = useCallback((followUpId: string) => {
    setFollowUps(prev =>
      prev.map(fu =>
        fu.id === followUpId ? { ...fu, isTriggered: true } : fu
      )
    );
  }, []);

  const getPendingFollowUps = useCallback((sessionId: string): FollowUpSchedule[] => {
    return followUps.filter(fu => 
      fu.sessionId === sessionId && !fu.isTriggered
    );
  }, [followUps]);

  const isFollowUpDue = useCallback((followUpId: string): boolean => {
    const followUp = followUps.find(fu => fu.id === followUpId);
    if (!followUp) return false;
    
    return new Date() >= followUp.scheduledTime && !followUp.isTriggered;
  }, [followUps]);

  return {
    scheduleFollowUp,
    cancelFollowUp,
    triggerFollowUp,
    getPendingFollowUps,
    isFollowUpDue
  };
}

// Helper functions for follow-up management
export function calculateFollowUpDelay(
  severity: EmergencyContext['severityLevel'],
  _treatmentType: 'emergency' | 'consultation' | 'specialist'
): number {
  // Return delay in minutes
  switch (severity) {
    case 'critical':
      return 30; // 30 minutes for critical cases
    case 'severe':
      return 60; // 1 hour for severe cases
    case 'moderate':
      return 120; // 2 hours for moderate cases
    case 'minor':
      return 240; // 4 hours for minor cases
    default:
      return 120; // Default 2 hours
  }
}

export function generateFollowUpMessage(
  severity: EmergencyContext['severityLevel'],
  _facilityName?: string
): string {
  const baseMessage = "How are you feeling now? Have you received treatment?";
  
  switch (severity) {
    case 'critical':
      return `🚨 ${baseMessage} Please let me know if you need any help with your insurance claims or have any questions about your treatment.`;
    case 'severe':
      return `⚠️ ${baseMessage} I'm here to help with any insurance questions or next steps you might need.`;
    case 'moderate':
      return `📋 ${baseMessage} If you've seen a doctor, I can help you understand your insurance coverage and next steps.`;
    case 'minor':
      return `💡 ${baseMessage} If you've received treatment, I can help you with insurance claims or any follow-up questions.`;
    default:
      return baseMessage;
  }
}

export function shouldScheduleFollowUp(
  emergencyContext: EmergencyContext | undefined
): boolean {
  if (!emergencyContext) return false;
  
  // Don't schedule if already in step 4 (claims documentation)
  if (emergencyContext.currentStep === 4) return false;
  
  // Don't schedule if treatment has already started
  if (emergencyContext.treatmentStartTime) return false;
  
  // Don't schedule if follow-up is already scheduled
  if (emergencyContext.followUpScheduled) return false;
  
  return true;
}

export function getFollowUpStatus(followUp: FollowUpSchedule): {
  status: 'pending' | 'due' | 'triggered';
  timeRemaining?: string;
} {
  const now = new Date();
  
  if (followUp.isTriggered) {
    return { status: 'triggered' };
  }
  
  if (followUp.scheduledTime <= now) {
    return { status: 'due' };
  }
  
  const timeRemaining = followUp.scheduledTime.getTime() - now.getTime();
  const minutes = Math.ceil(timeRemaining / (1000 * 60));
  
  let timeString: string;
  if (minutes < 60) {
    timeString = `${minutes} minutes`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    timeString = `${hours}h ${remainingMinutes}m`;
  }
  
  return { status: 'pending', timeRemaining: timeString };
}

export function cleanupOldFollowUps(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const followUps: FollowUpSchedule[] = JSON.parse(stored).map((fu: any) => ({
        ...fu,
        scheduledTime: new Date(fu.scheduledTime),
        createdAt: new Date(fu.createdAt)
      }));
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const cleaned = followUps.filter(fu => 
        fu.createdAt > oneWeekAgo || !fu.isTriggered
      );
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }
  } catch (error) {
    console.error('Error cleaning up old follow-ups:', error);
  }
}

// Auto-cleanup on app start
if (typeof window !== 'undefined') {
  cleanupOldFollowUps();
}

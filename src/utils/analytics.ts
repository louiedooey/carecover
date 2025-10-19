// Google Analytics 4 utility functions

// TypeScript declarations for gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

// Initialize Google Analytics
export const initializeGA = (measurementId: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', measurementId, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

// Track page view
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-FLCP6DGXW8', {
      page_path: pagePath,
      page_title: pageTitle || document.title,
    });
  }
};

// Track custom event
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

// Track session start
export const trackSessionStart = (sessionId: string) => {
  trackEvent('session_start', {
    session_id: sessionId,
    timestamp: new Date().toISOString(),
  });
};

// Track session switch
export const trackSessionSwitch = (fromSessionId: string, toSessionId: string) => {
  trackEvent('session_switch', {
    from_session_id: fromSessionId,
    to_session_id: toSessionId,
    timestamp: new Date().toISOString(),
  });
};

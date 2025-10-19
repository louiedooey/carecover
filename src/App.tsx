import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
// Password wall temporarily disabled
// import PasswordScreen from './components/PasswordScreen';
import { ChatSession, ModalState, UserProfile, ExtractedDocument } from './types';
import { DocumentProvider } from './contexts/DocumentContext';
import { useTranslation } from 'react-i18next';
import { initializeGA, trackSessionStart, trackSessionSwitch } from './utils/analytics';

const App: React.FC = () => {
  const { t } = useTranslation();
  
  // Password wall temporarily disabled
  // const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthenticated] = useState<boolean>(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: null,
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Initialize Google Analytics when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      initializeGA('G-FLCP6DGXW8');
    }
  }, [isAuthenticated]);

  // Create initial session and update when language changes
  useEffect(() => {
    if (sessions.length === 0) {
      const initialSession: ChatSession = {
        id: '1',
        title: t('chat.session') + ' 1',
        messages: [
          {
            id: '1',
            content: t('app.welcome'),
            sender: 'bot',
            timestamp: new Date(),
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        documentCache: {
          insurance: [],
          medical: []
        },
        claimHistory: []
      };
      setSessions([initialSession]);
      setCurrentSessionId('1');
      // Track initial session start
      if (isAuthenticated) {
        trackSessionStart('1');
      }
    } else {
      // Update existing sessions' welcome message when language changes
      setSessions(prev => prev.map(session => {
        if (session.messages.length > 0 && session.messages[0].sender === 'bot') {
          return {
            ...session,
            messages: [
              {
                ...session.messages[0],
                content: t('app.welcome'),
                timestamp: new Date(),
              },
              ...session.messages.slice(1)
            ]
          };
        }
        return session;
      }));
    }
  }, [t, sessions.length]);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'John Doe',
    initials: 'JD',
    nric: '**** 1234A',
    hasCustomName: false,
  });

  const currentSession = sessions.find(session => session.id === currentSessionId);

  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `${t('chat.session')} ${sessions.length + 1}`,
      messages: [
        {
          id: '1',
          content: t('app.welcome'),
          sender: 'bot',
          timestamp: new Date(),
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      documentCache: {
        insurance: [],
        medical: []
      },
      claimHistory: []
    };
    
    setSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newSession.id);
    
    // Track new session start
    if (isAuthenticated) {
      trackSessionStart(newSession.id);
    }
  };

  const handleDocumentExtracted = (document: ExtractedDocument) => {
    setSessions(prev => prev.map(session => 
      session.id === currentSessionId 
        ? {
            ...session,
            documentCache: {
              ...session.documentCache,
              [document.category]: [
                ...session.documentCache[document.category],
                document
              ]
            },
            updatedAt: new Date()
          }
        : session
    ));
  };

  const handleSessionSwitch = (sessionId: string) => {
    const previousSessionId = currentSessionId;
    setCurrentSessionId(sessionId);
    
    // Track session switch
    if (isAuthenticated && previousSessionId && previousSessionId !== sessionId) {
      trackSessionSwitch(previousSessionId, sessionId);
    }
  };

  const handleModalOpen = (type: 'insurance' | 'medical' | 'demographic') => {
    setModalState({ isOpen: true, type });
  };

  const handleModalClose = () => {
    setModalState({ isOpen: false, type: null });
  };

  const handleProfileUpdate = (name: string) => {
    setUserProfile(prev => ({
      ...prev,
      name,
      hasCustomName: true,
    }));
  };

  return (
    <DocumentProvider>
      {/* Password wall temporarily disabled - uncomment below to re-enable */}
      {/* {!isAuthenticated ? (
        <PasswordScreen onAuthenticate={() => setIsAuthenticated(true)} />
      ) : ( */}
        <div className="flex h-screen bg-white font-inter">
          {/* Sidebar */}
          <Sidebar
            userProfile={userProfile}
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSessionSwitch={handleSessionSwitch}
            onModalOpen={handleModalOpen}
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          />
          
          {/* Main Chat Area */}
          <ChatArea
            session={currentSession}
            modalState={modalState}
            onModalClose={handleModalClose}
            onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            isSidebarOpen={isSidebarOpen}
            onDocumentExtracted={handleDocumentExtracted}
            onNewSession={handleNewSession}
            onProfileUpdate={handleProfileUpdate}
          />
        </div>
      {/* )} */}
    </DocumentProvider>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import { ChatSession, ModalState, UserProfile, ExtractedDocument } from './types';
import { DocumentProvider } from './contexts/DocumentContext';
import { useTranslation } from 'react-i18next';

const App: React.FC = () => {
  const { t } = useTranslation();
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: null,
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

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
        }
      };
      setSessions([initialSession]);
      setCurrentSessionId('1');
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

  const userProfile: UserProfile = {
    name: 'John Doe',
    initials: 'JD',
    nric: '**** 1234A',
  };

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
      }
    };
    
    setSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newSession.id);
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
    setCurrentSessionId(sessionId);
  };

  const handleModalOpen = (type: 'insurance' | 'medical' | 'demographic') => {
    setModalState({ isOpen: true, type });
  };

  const handleModalClose = () => {
    setModalState({ isOpen: false, type: null });
  };

  return (
    <DocumentProvider>
      <div className="flex h-screen bg-white font-inter">
        {/* Sidebar */}
        <Sidebar
          userProfile={userProfile}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewSession={handleNewSession}
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
        />
      </div>
    </DocumentProvider>
  );
};

export default App;

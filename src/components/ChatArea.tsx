import React from 'react';
import { Menu, Plus, AlertCircle } from 'lucide-react';
import { ChatSession, ModalState, ExtractedDocument } from '../types';
import Message from './Message';
import ChatInput from './ChatInput';
import InsuranceModal from './modals/InsuranceModal';
import MedicalRecordsModal from './modals/MedicalRecordsModal';
import DemographicModal from './modals/DemographicModal';
import { useChat } from '../hooks/useChat';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle';
import Logo from './Logo';

interface ChatAreaProps {
  session: ChatSession | undefined;
  modalState: ModalState;
  onModalClose: () => void;
  onSidebarToggle: () => void;
  isSidebarOpen: boolean;
  onDocumentExtracted: (document: ExtractedDocument) => void;
  onNewSession: () => void;
  onProfileUpdate: (name: string) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  session,
  modalState,
  onModalClose,
  onSidebarToggle,
  onDocumentExtracted,
  onNewSession,
  onProfileUpdate,
}) => {
  const { t } = useTranslation();
  
  const { sendMessage, isGenerating, error, clearError } = useChat({
    enableStreaming: true,
    model: 'interfaze-beta',
    temperature: 0.7,
    maxTokens: 1000
  });


  const handleSendMessage = async (content: string) => {
    if (!session) {
      console.error('No active session');
      return;
    }

    try {
      await sendMessage(content, session);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleFileUpload = (file: File) => {
    // TODO: Implement file upload logic
    console.log('Uploading file:', file.name);
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={onSidebarToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Logo size="md" />
              <h1 className="text-xl font-bold text-gray-900">CareCover</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <LanguageToggle />
            <button
              onClick={onNewSession}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-carecover-blue hover:bg-carecover-blue/90 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('chat.newSession')}</span>
              <span className="sm:hidden">+</span>
            </button>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600 text-sm font-medium"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {session?.messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
          
          {/* Typing indicator */}
          {isGenerating && (
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm">{t('chat.typing')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSendMessage={handleSendMessage}
            onFileUpload={handleFileUpload}
            placeholder={t('chat.sendMessage')}
            disabled={isGenerating}
          />
        </div>
      </div>

      {/* Modals */}
      {modalState.isOpen && modalState.type === 'insurance' && (
        <InsuranceModal onClose={onModalClose} onDocumentExtracted={onDocumentExtracted} />
      )}
      
      {modalState.isOpen && modalState.type === 'medical' && (
        <MedicalRecordsModal onClose={onModalClose} onDocumentExtracted={onDocumentExtracted} />
      )}
      
      {modalState.isOpen && modalState.type === 'demographic' && (
        <DemographicModal onClose={onModalClose} onProfileUpdate={onProfileUpdate} />
      )}
    </div>
  );
};

export default ChatArea;

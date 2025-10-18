import React, { useState } from 'react';
import { FileText, Calendar, Shield, X, ChevronDown, ChevronRight, File, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { UserProfile, ChatSession } from '../types';
import { useDocumentContext, StoredDocument } from '../contexts/DocumentContext';
import ExtractedTextModal from './ExtractedTextModal';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  userProfile: UserProfile;
  sessions: ChatSession[];
  currentSessionId: string;
  onSessionSwitch: (sessionId: string) => void;
  onModalOpen: (type: 'insurance' | 'medical' | 'demographic') => void;
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  userProfile,
  sessions,
  currentSessionId,
  onSessionSwitch,
  onModalOpen,
  isOpen,
  onToggle,
}) => {
  const { state: _state, getDocumentsByCategory } = useDocumentContext();
  const { t } = useTranslation();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedDocument, setSelectedDocument] = useState<StoredDocument | null>(null);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const menuItems = [
    {
      id: 'personal',
      label: t('sidebar.personalDetails'),
      icon: Shield,
      onClick: () => onModalOpen('demographic'),
      category: null,
    },
    {
      id: 'insurance',
      label: t('sidebar.insurancePolicies'),
      icon: FileText,
      onClick: () => onModalOpen('insurance'),
      category: 'insurance' as const,
    },
    {
      id: 'medical',
      label: t('sidebar.medicalRecords'),
      icon: Calendar,
      onClick: () => onModalOpen('medical'),
      category: 'medical' as const,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-80 bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Mobile close button */}
        <button
          onClick={onToggle}
          className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* User Profile */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-carecover-light-blue rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {userProfile.initials}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-lg">
                {userProfile.name}
              </h2>
              <p className="text-sm text-gray-500">
                NRIC: {userProfile.nric}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {t('sidebar.myProfile')}
          </h3>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isExpanded = expandedSections.has(item.id);
              const documents = item.category ? getDocumentsByCategory(item.category) : [];
              const hasDocuments = documents.length > 0;
              
              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center">
                    <button
                      onClick={item.onClick}
                      className="flex-1 flex items-center space-x-3 px-4 py-3 text-left rounded-lg hover:bg-carecover-light-blue hover:bg-opacity-10 transition-colors group"
                    >
                      <Icon className="w-5 h-5 text-gray-600 group-hover:text-carecover-blue" />
                      <span className="text-gray-700 group-hover:text-carecover-blue font-medium">
                        {item.label}
                      </span>
                      {hasDocuments && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {documents.length}
                        </span>
                      )}
                    </button>
                    {hasDocuments && (
                      <button
                        onClick={() => toggleSection(item.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* Expanded content */}
                  {isExpanded && hasDocuments && (
                    <div className="ml-8 space-y-1">
                      {documents.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => setSelectedDocument(doc)}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                        >
                          <File className="w-4 h-4 text-gray-400" />
                          <span className="flex-1 text-gray-600 truncate">
                            {doc.name}
                          </span>
                          {getStatusIcon(doc.extractionStatus || 'pending')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Session History */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {t('sidebar.sessions')}
          </h3>
          <div className="space-y-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSessionSwitch(session.id)}
                className={`
                  w-full text-left px-4 py-3 rounded-lg transition-colors
                  ${session.id === currentSessionId
                    ? 'bg-carecover-light-blue bg-opacity-20 text-carecover-blue'
                    : 'hover:bg-gray-100 text-gray-700'
                  }
                `}
              >
                <div className="font-medium text-sm">{session.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {session.messages.length} {t('sidebar.messages')}
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Extracted Text Modal */}
      <ExtractedTextModal
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />
    </>
  );
};

export default Sidebar;

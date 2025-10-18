import React, { useState } from 'react';
import { Search, FileText, Calendar, Tag, X, Eye, Copy, Check } from 'lucide-react';
import { useDocumentContext, StoredDocument } from '../contexts/DocumentContext';
import { useTranslation } from 'react-i18next';

interface DocumentSearchProps {
  onDocumentSelect?: (document: StoredDocument) => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

const DocumentSearch: React.FC<DocumentSearchProps> = ({ 
  onDocumentSelect, 
  onClose, 
  showCloseButton = false 
}) => {
  const { t } = useTranslation();
  const { state, dispatch, getFilteredDocuments, searchDocuments } = useDocumentContext();
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSearch = (query: string) => {
    setLocalSearchQuery(query);
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  };

  const handleCategoryChange = (category: 'all' | 'insurance' | 'medical') => {
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: category });
  };

  const handleDocumentClick = (document: StoredDocument) => {
    dispatch({ type: 'SET_SELECTED_DOCUMENT', payload: document });
    onDocumentSelect?.(document);
  };

  const handleCopyReference = async (document: StoredDocument) => {
    const reference = `[${document.parentTitle} - ${document.name}]`;
    try {
      await navigator.clipboard.writeText(reference);
      setCopiedId(document.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy reference:', error);
    }
  };

  const filteredDocuments = getFilteredDocuments();
  const searchResults = localSearchQuery ? searchDocuments(localSearchQuery) : filteredDocuments;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getCategoryIcon = (category: 'insurance' | 'medical') => {
    return category === 'insurance' ? '🛡️' : '🏥';
  };

  const getCategoryColor = (category: 'insurance' | 'medical') => {
    return category === 'insurance' ? 'text-blue-600' : 'text-green-600';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg max-h-96 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{t('search.documentLibrary')}</h3>
          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('search.searchPlaceholder')}
            value={localSearchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carecover-blue focus:border-carecover-blue"
          />
        </div>

        {/* Category Filter */}
        <div className="flex space-x-2">
          {(['all', 'insurance', 'medical'] as const).map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                state.selectedCategory === category
                  ? 'bg-carecover-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? t('search.all') : category === 'insurance' ? t('search.insurance') : t('search.medical')}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="overflow-y-auto max-h-64">
        {searchResults.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">
              {localSearchQuery ? t('search.noDocumentsFound') : t('search.noDocumentsAvailable')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {searchResults.map((document) => (
              <div
                key={document.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleDocumentClick(document)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">
                        {getCategoryIcon(document.category)}
                      </span>
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {document.name}
                      </h4>
                      <span className={`text-xs font-medium ${getCategoryColor(document.category)}`}>
                        {document.category}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-2">
                      {document.parentTitle}
                    </p>
                    
                    {document.extractedText && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {document.extractedText.substring(0, 100)}...
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(document.uploadedAt)}</span>
                      </div>
                      {document.extractedAt && (
                        <div className="flex items-center space-x-1">
                          <span>{t('document.extractedDate')}: {formatDate(document.extractedAt)}</span>
                        </div>
                      )}
                      {document.tags.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Tag className="w-3 h-3" />
                          <span>{document.tags.length} {t('document.tags')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyReference(document);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title={t('document.copyReference')}
                    >
                      {copiedId === document.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDocumentClick(document);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title={t('document.viewDocument')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {searchResults.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            {searchResults.length} {t('search.documentsFound')}
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentSearch;

import React, { useState } from 'react';
import { X, Copy, Check, Tag, Calendar, FileText, Download, Share2 } from 'lucide-react';
import { StoredDocument } from '../contexts/DocumentContext';

interface DocumentViewerProps {
  document: StoredDocument;
  onClose: () => void;
  onAddTag?: (documentId: string, tag: string) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  document, 
  onClose, 
  onAddTag 
}) => {
  const [copied, setCopied] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);

  const handleCopyText = async () => {
    if (!document.extractedText) return;
    
    try {
      await navigator.clipboard.writeText(document.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleCopyReference = async () => {
    const reference = `[${document.parentTitle} - ${document.name}]`;
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy reference:', error);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && onAddTag) {
      onAddTag(document.id, newTag.trim());
      setNewTag('');
      setShowAddTag(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getCategoryIcon = (category: 'insurance' | 'medical') => {
    return category === 'insurance' ? '🛡️' : '🏥';
  };

  const getCategoryColor = (category: 'insurance' | 'medical') => {
    return category === 'insurance' ? 'text-blue-600' : 'text-green-600';
  };

  const getCategoryBgColor = (category: 'insurance' | 'medical') => {
    return category === 'insurance' ? 'bg-blue-50' : 'bg-green-50';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getCategoryIcon(document.category)}</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{document.name}</h2>
              <p className="text-sm text-gray-600">{document.parentTitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyReference}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              title="Copy reference"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Document Info */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {(document.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Uploaded {formatDate(document.uploadedAt)}
              </span>
            </div>
            {document.extractedAt && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Extracted {formatDate(document.extractedAt)}
                </span>
              </div>
            )}
          </div>
          
          {/* Tags */}
          <div className="mt-4">
            <div className="flex items-center space-x-2 mb-2">
              <Tag className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Tags</span>
              <button
                onClick={() => setShowAddTag(!showAddTag)}
                className="text-xs text-carecover-blue hover:underline"
              >
                + Add tag
              </button>
            </div>
            
            {showAddTag && (
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter tag name"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-carecover-blue focus:border-carecover-blue"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <button
                  onClick={handleAddTag}
                  className="px-3 py-1 text-xs bg-carecover-blue text-white rounded hover:bg-carecover-blue/90"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddTag(false);
                    setNewTag('');
                  }}
                  className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              {document.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 text-xs rounded-full ${getCategoryBgColor(document.category)} ${getCategoryColor(document.category)}`}
                >
                  {tag}
                </span>
              ))}
              {document.tags.length === 0 && (
                <span className="text-xs text-gray-500">No tags added</span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          {document.extractedText ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">File Contents</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {document.extractedText.length} characters
                  </p>
                </div>
                <button
                  onClick={handleCopyText}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {copied ? 'Copied!' : 'Copy Text'}
                  </span>
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                  {document.extractedText}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Text Extracted</h3>
              <p className="text-gray-500">
                This document hasn't been processed for text extraction yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;

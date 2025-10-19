import React from 'react';
import { X, Copy, Check, FileText, Download, Trash2 } from 'lucide-react';
import { StoredDocument, useDocumentContext } from '../contexts/DocumentContext';
import { getFileTypeDisplay } from '../utils/fileTypeHelper';

interface ExtractedTextModalProps {
  document: StoredDocument | null;
  onClose: () => void;
}

const ExtractedTextModal: React.FC<ExtractedTextModalProps> = ({ document, onClose }) => {
  const [copied, setCopied] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const { dispatch } = useDocumentContext();

  if (!document) return null;

  const handleCopy = async () => {
    if (!document.extractedText) return;
    
    try {
      await navigator.clipboard.writeText(document.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleDownload = () => {
    if (!document.extractedText) return;
    
    const blob = new Blob([document.extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.name}_extracted.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    if (!document) return;
    
    dispatch({ type: 'DELETE_DOCUMENT', payload: document.id });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-carecover-blue" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{document.name}</h2>
              <p className="text-sm text-gray-600">{document.parentTitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {document.extractedText && (
              <>
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                  <span className="text-gray-700">
                    {copied ? 'Copied!' : 'Copy'}
                  </span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700">Download</span>
                </button>
              </>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {document.extractedText ? (
            <div className="space-y-4">
              {/* File Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">File Size:</span>
                    <p className="font-medium">{(document.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <div>
                    <span className="text-gray-500">File Type:</span>
                    <p className="font-medium">{getFileTypeDisplay(document.type)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Uploaded:</span>
                    <p className="font-medium">{document.uploadedAt.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Extracted:</span>
                    <p className="font-medium">
                      {document.extractedAt ? document.extractedAt.toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* File Contents */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">File Contents</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {document.extractedText.length} characters
                  </p>
                </div>
                <div className="p-6">
                  <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words font-mono bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    {document.extractedText}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Extracted Text</h3>
              <p className="text-gray-600">
                This file hasn't been processed for text extraction yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Document</h3>
                <p className="text-sm text-gray-600">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{document.name}</strong>? 
              This will remove the document and all its extracted text from your profile.
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtractedTextModal;

import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Trash2, AlertCircle } from 'lucide-react';
import { FileUpload, ExtractedDocument } from '../../types';
import { useDocumentContext } from '../../contexts/DocumentContext';
import { useDocumentExtraction } from '../../hooks/useDocumentExtraction';
import ExtractionStatusBadge from '../ExtractionStatusBadge';
import ExtractedTextPreview from '../ExtractedTextPreview';
import { useTranslation } from 'react-i18next';

interface MedicalRecordsModalProps {
  onClose: () => void;
  onDocumentExtracted?: (document: ExtractedDocument) => void;
}

const MedicalRecordsModal: React.FC<MedicalRecordsModalProps> = ({ onClose, onDocumentExtracted }) => {
  const { t } = useTranslation();
  const { dispatch, getDocumentCacheStats } = useDocumentContext();
  const { extractDocument } = useDocumentExtraction();
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  
  // Track ongoing extractions that should continue in background
  const ongoingExtractionsRef = useRef<Set<string>>(new Set());
  
  const [extractionError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    const newFile: FileUpload = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      uploadedAt: new Date(),
      extractionStatus: 'pending',
    };

    setUploadedFiles(prev => [...prev, newFile]);

    // Store in document context
    dispatch({
      type: 'ADD_DOCUMENT',
      payload: {
        fileId: newFile.id,
        fileName: newFile.name,
        fileSize: newFile.size,
        fileType: newFile.type,
        fileUrl: newFile.url,
        category: 'medical',
        parentId: newFile.id,
        parentTitle: file.name
      }
    });

    // Track this extraction as ongoing
    ongoingExtractionsRef.current.add(newFile.id);

    // Automatically extract text in background
    (async () => {
      try {
        // Update status to processing
        setUploadedFiles(prev => prev.map(f => 
          f.id === newFile.id 
            ? { ...f, extractionStatus: 'processing' as const, extractionError: undefined }
            : f
        ));

        // Extract document
        const { extractedText } = await extractDocument({
          file: newFile,
          category: 'medical',
          parentId: newFile.id,
          parentTitle: file.name,
          onDocumentExtracted,
        });

        // Update with extracted text
        setUploadedFiles(prev => prev.map(f => 
          f.id === newFile.id 
            ? { 
                ...f, 
                extractedText,
                extractionStatus: 'completed' as const,
                extractionError: undefined
              }
            : f
        ));

      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Failed to extract text from file';

        // Update with error
        setUploadedFiles(prev => prev.map(f => 
          f.id === newFile.id 
            ? { 
                ...f, 
                extractionStatus: 'error' as const,
                extractionError: errorMessage
              }
            : f
        ));
      } finally {
        // Remove from ongoing extractions
        ongoingExtractionsRef.current.delete(newFile.id);
      }
    })();
  };

  const handleDeleteFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    
    // Remove from document context
    dispatch({ type: 'DELETE_DOCUMENT', payload: fileId });
  };

  const getAllFilesCount = () => {
    return uploadedFiles.length;
  };

  const getPendingFilesCount = () => {
    return uploadedFiles.filter(file => 
      file.extractionStatus === 'pending' || file.extractionStatus === 'error'
    ).length;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('medical.title')}</h2>
            {getAllFilesCount() > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {getAllFilesCount()} {t('medical.filesUploaded')}
                {getPendingFilesCount() > 0 && (
                  <span className="ml-2 text-carecover-blue">
                    • {getPendingFilesCount()} {t('medical.readyForExtraction')}
                  </span>
                )}
                <span className="ml-2 text-green-600">
                  • {t('medical.cache')} {getDocumentCacheStats().total} {t('medical.docs')} ({getDocumentCacheStats().extracted} {t('medical.extracted')})
                </span>
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="flex items-center space-x-2 px-4 py-2 bg-carecover-blue text-white rounded-lg hover:bg-carecover-blue/90 transition-colors font-medium"
            >
              <span>Save and Close</span>
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
          {/* Error Notification */}
          {extractionError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">{t('medical.extractionError')}</p>
                <p className="text-sm text-red-700 mt-1">{extractionError}</p>
              </div>
            </div>
          )}

          {/* Top-level File Upload */}
          <div className="mb-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-carecover-blue transition-colors">
              <input
                type="file"
                id="upload-medical"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                multiple
                onChange={(e) => {
                  const files = e.target.files;
                  if (files) {
                    Array.from(files).forEach(file => handleFileUpload(file));
                  }
                }}
              />
              <label
                htmlFor="upload-medical"
                className="cursor-pointer flex flex-col items-center space-y-3"
              >
                <Upload className="w-12 h-12 text-gray-400" />
                <div>
                  <span className="text-lg text-gray-700 font-medium">
                    {t('medical.uploadTitle')}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('medical.uploadDescription')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('medical.uploadExamples')}
                  </p>
                </div>
              </label>
            </div>
          </div>
          
          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('medical.uploadedFiles')}</h3>
              {uploadedFiles.map((file) => (
                <div key={file.id} className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {file.extractionStatus && (
                        <ExtractionStatusBadge 
                          status={file.extractionStatus} 
                          error={file.extractionError}
                        />
                      )}
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Extracted Text Preview */}
                  <ExtractedTextPreview file={file} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordsModal;

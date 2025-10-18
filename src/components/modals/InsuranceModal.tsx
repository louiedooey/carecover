import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Trash2, Search, Edit2, Save, X as CancelIcon } from 'lucide-react';
import { InsurancePolicy, FileUpload, ExtractedDocument } from '../../types';
import { useDocumentContext } from '../../contexts/DocumentContext';
import { useDocumentExtraction } from '../../hooks/useDocumentExtraction';
import ExtractionStatusBadge from '../ExtractionStatusBadge';
import ExtractedTextPreview from '../ExtractedTextPreview';
import DocumentSearch from '../DocumentSearch';
import { useTranslation } from 'react-i18next';

interface InsuranceModalProps {
  onClose: () => void;
  onDocumentExtracted?: (document: ExtractedDocument) => void;
}

const InsuranceModal: React.FC<InsuranceModalProps> = ({ onClose, onDocumentExtracted }) => {
  const { t } = useTranslation();
  const { state, dispatch } = useDocumentContext();
  const { extractDocument } = useDocumentExtraction();
  const [policies, setPolicies] = useState<InsurancePolicy[]>(state.insurancePolicies);
  
  // Track ongoing extractions that should continue in background
  const ongoingExtractionsRef = useRef<Set<string>>(new Set());
  
  // Sync with document context when it changes
  React.useEffect(() => {
    setPolicies(state.insurancePolicies);
  }, [state.insurancePolicies]);
  
  const [showDocumentSearch, setShowDocumentSearch] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    provider: '',
    policyNumber: '',
    coverageType: '',
    documentName: '',
    summary: '',
    keyCoveragePoints: [] as string[],
  });

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

    // Create a temporary policy for the uploaded file
    const tempPolicy: InsurancePolicy = {
      id: Date.now().toString(),
      provider: '',
      policyNumber: '',
      coverageType: '',
      files: [newFile],
      documentName: file.name,
      summary: 'Processing document...',
      keyCoveragePoints: [],
      isEditing: false,
    };

    setPolicies(prev => [...prev, tempPolicy]);
    dispatch({ type: 'ADD_INSURANCE_POLICY', payload: tempPolicy });

    // Store in document context
    dispatch({
      type: 'ADD_DOCUMENT',
      payload: {
        fileId: newFile.id,
        fileName: newFile.name,
        fileSize: newFile.size,
        fileType: newFile.type,
        fileUrl: newFile.url,
        category: 'insurance',
        parentId: tempPolicy.id,
        parentTitle: file.name
      }
    });

    // Track this extraction as ongoing
    ongoingExtractionsRef.current.add(newFile.id);

    // Automatically extract text and analyze in background
    (async () => {
      try {
        // Update status to processing
        setPolicies(prev => prev.map(policy => 
          policy.id === tempPolicy.id 
            ? {
                ...policy,
                files: policy.files.map(f => 
                  f.id === newFile.id 
                    ? { ...f, extractionStatus: 'processing' as const, extractionError: undefined }
                    : f
                )
              }
            : policy
        ));

        // Extract and analyze document
        const { extractedText, analysis } = await extractDocument({
          file: newFile,
          category: 'insurance',
          parentId: tempPolicy.id,
          parentTitle: file.name,
          onDocumentExtracted,
          onAnalysis: (analysis) => {
            // Update policy with analysis results
            const updatedPolicy: InsurancePolicy = {
              ...tempPolicy,
              provider: analysis.provider,
              policyNumber: analysis.policyNumber,
              coverageType: analysis.coverageType,
              documentName: analysis.documentName,
              summary: analysis.summary,
              keyCoveragePoints: analysis.keyCoveragePoints,
              files: [{
                ...newFile,
                extractedText,
                extractionStatus: 'completed' as const,
                extractionError: undefined
              }],
            };

            setPolicies(prev => prev.map(policy => 
              policy.id === tempPolicy.id ? updatedPolicy : policy
            ));
            
            dispatch({ type: 'UPDATE_INSURANCE_POLICY', payload: updatedPolicy });
          }
        });

        // If no analysis (unlikely), just update with extracted text
        if (!analysis) {
          setPolicies(prev => prev.map(policy => 
            policy.id === tempPolicy.id 
              ? {
                  ...policy,
                  files: policy.files.map(f => 
                    f.id === newFile.id 
                      ? { 
                          ...f, 
                          extractedText,
                          extractionStatus: 'completed' as const,
                          extractionError: undefined
                        }
                      : f
                  )
                }
              : policy
          ));
        }

      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Failed to extract text from file';

        // Update with error
        setPolicies(prev => prev.map(policy => 
          policy.id === tempPolicy.id 
            ? {
                ...policy,
                files: policy.files.map(f => 
                  f.id === newFile.id 
                    ? { 
                        ...f, 
                        extractionStatus: 'error' as const,
                        extractionError: errorMessage
                      }
                    : f
                )
              }
            : policy
        ));
      } finally {
        // Remove from ongoing extractions
        ongoingExtractionsRef.current.delete(newFile.id);
      }
    })();
  };

  const handleDeletePolicy = (policyId: string) => {
    setPolicies(prev => prev.filter(policy => policy.id !== policyId));
  };

  const handleDeleteFile = (policyId: string, fileId: string) => {
    setPolicies(prev => prev.map(policy => 
      policy.id === policyId 
        ? { ...policy, files: policy.files.filter(file => file.id !== fileId) }
        : policy
    ));
    
    // Remove from document context
    dispatch({ type: 'DELETE_DOCUMENT', payload: fileId });
  };

  const handleStartEdit = (policy: InsurancePolicy) => {
    setEditingPolicy(policy.id);
    setEditForm({
      provider: policy.provider,
      policyNumber: policy.policyNumber,
      coverageType: policy.coverageType,
      documentName: policy.documentName || '',
      summary: policy.summary || '',
      keyCoveragePoints: policy.keyCoveragePoints || [],
    });
  };

  const handleSaveEdit = () => {
    if (editingPolicy) {
      setPolicies(prev => prev.map(policy => 
        policy.id === editingPolicy 
          ? {
              ...policy,
              provider: editForm.provider,
              policyNumber: editForm.policyNumber,
              coverageType: editForm.coverageType,
              documentName: editForm.documentName,
              summary: editForm.summary,
              keyCoveragePoints: editForm.keyCoveragePoints,
              isEditing: false,
            }
          : policy
      ));
      setEditingPolicy(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingPolicy(null);
    setEditForm({
      provider: '',
      policyNumber: '',
      coverageType: '',
      documentName: '',
      summary: '',
      keyCoveragePoints: [],
    });
  };

  const getAllFilesCount = () => {
    return policies.reduce((count, policy) => count + policy.files.length, 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('insurance.title')}</h2>
            {getAllFilesCount() > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {getAllFilesCount()} {t('insurance.filesUploaded')}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowDocumentSearch(!showDocumentSearch)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              <Search className="w-4 h-4" />
              <span>{t('insurance.searchDocuments')}</span>
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
          {/* Document Search */}
          {showDocumentSearch && (
            <div className="mb-6">
              <DocumentSearch 
                onClose={() => setShowDocumentSearch(false)}
                showCloseButton={true}
              />
            </div>
          )}


          {/* Top-level File Upload */}
          <div className="mb-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-carecover-blue transition-colors">
              <input
                type="file"
                id="upload-insurance"
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
                htmlFor="upload-insurance"
                className="cursor-pointer flex flex-col items-center space-y-3"
              >
                <Upload className="w-12 h-12 text-gray-400" />
                <div>
                  <span className="text-lg text-gray-700 font-medium">
                    {t('insurance.uploadTitle')}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('insurance.uploadDescription')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('insurance.uploadSubtext')}
                  </p>
                </div>
              </label>
            </div>
          </div>
          
          {/* Policy Cards */}
          <div className="space-y-4">
            {policies.map((policy) => (
              <div key={policy.id} className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {editingPolicy === policy.id ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('insurance.documentName')}
                          </label>
                          <input
                            type="text"
                            value={editForm.documentName}
                            onChange={(e) => setEditForm(prev => ({ ...prev, documentName: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carecover-blue focus:border-carecover-blue"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('insurance.provider')}
                            </label>
                            <input
                              type="text"
                              value={editForm.provider}
                              onChange={(e) => setEditForm(prev => ({ ...prev, provider: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carecover-blue focus:border-carecover-blue"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('insurance.policyNumber')}
                            </label>
                            <input
                              type="text"
                              value={editForm.policyNumber}
                              onChange={(e) => setEditForm(prev => ({ ...prev, policyNumber: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carecover-blue focus:border-carecover-blue"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('insurance.coverageType')}
                          </label>
                          <input
                            type="text"
                            value={editForm.coverageType}
                            onChange={(e) => setEditForm(prev => ({ ...prev, coverageType: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carecover-blue focus:border-carecover-blue"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('insurance.summary')}
                          </label>
                          <textarea
                            value={editForm.summary}
                            onChange={(e) => setEditForm(prev => ({ ...prev, summary: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carecover-blue focus:border-carecover-blue"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('insurance.keyCoveragePoints')}
                          </label>
                          <textarea
                            value={editForm.keyCoveragePoints.join('\n')}
                            onChange={(e) => setEditForm(prev => ({ 
                              ...prev, 
                              keyCoveragePoints: e.target.value.split('\n').filter(point => point.trim())
                            }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carecover-blue focus:border-carecover-blue"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {policy.documentName || `${policy.provider} - ${policy.policyNumber}`}
                        </h3>
                        {policy.provider && policy.policyNumber && policy.coverageType ? (
                          <p className="text-sm text-gray-600 mt-1">
                            {policy.provider} • Policy: {policy.policyNumber} • {policy.coverageType}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 mt-1 italic">
                            {policy.summary || 'Processing document...'}
                          </p>
                        )}
                        {policy.summary && policy.provider && (
                          <p className="text-sm text-gray-700 mt-2">{policy.summary}</p>
                        )}
                        {policy.keyCoveragePoints && policy.keyCoveragePoints.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700">Key Coverage Points:</p>
                            <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                              {policy.keyCoveragePoints.map((point, index) => (
                                <li key={index}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {editingPolicy === policy.id ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Save className="w-5 h-5" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <CancelIcon className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(policy)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeletePolicy(policy.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Uploaded Files */}
                {policy.files.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Document Files:</h4>
                    {policy.files.map((file) => (
                      <div key={file.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
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
                              onClick={() => handleDeleteFile(policy.id, file.id)}
                              className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceModal;
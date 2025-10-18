import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Plus, Trash2, Calendar, FileSearch, AlertCircle } from 'lucide-react';
import { MedicalRecord, FileUpload, ExtractedDocument } from '../../types';
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
  const { state, dispatch, getDocumentCacheStats } = useDocumentContext();
  const { extractDocument } = useDocumentExtraction();
  const [records, setRecords] = useState<MedicalRecord[]>(state.medicalRecords);
  
  // Track ongoing extractions that should continue in background
  const ongoingExtractionsRef = useRef<Set<string>>(new Set());
  
  // Sync with document context when it changes
  React.useEffect(() => {
    setRecords(state.medicalRecords);
  }, [state.medicalRecords]);
  
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [newRecord, setNewRecord] = useState({
    title: '',
    date: '',
    type: '',
  });
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const handleFileUpload = (recordId: string, file: File) => {
    const newFile: FileUpload = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      uploadedAt: new Date(),
      extractionStatus: 'pending',
    };

    setRecords(prev => prev.map(record => 
      record.id === recordId 
        ? { ...record, files: [...record.files, newFile] }
        : record
    ));

    // Store in document context
    const record = records.find(r => r.id === recordId);
    if (record) {
      dispatch({
        type: 'ADD_DOCUMENT',
        payload: {
          fileId: newFile.id,
          fileName: newFile.name,
          fileSize: newFile.size,
          fileType: newFile.type,
          fileUrl: newFile.url,
          category: 'medical',
          parentId: recordId,
          parentTitle: `${record.title} - ${record.type}`
        }
      });

      // Track this extraction as ongoing
      ongoingExtractionsRef.current.add(newFile.id);

      // Start background extraction
      (async () => {
        try {
          // Update status to processing
          setRecords(prev => prev.map(r => 
            r.id === recordId 
              ? {
                  ...r,
                  files: r.files.map(f => 
                    f.id === newFile.id 
                      ? { ...f, extractionStatus: 'processing' as const, extractionError: undefined }
                      : f
                  )
                }
              : r
          ));

          // Extract document
          const { extractedText } = await extractDocument({
            file: newFile,
            category: 'medical',
            parentId: recordId,
            parentTitle: `${record.title} - ${record.type}`,
            onDocumentExtracted,
          });

          // Update with extracted text
          setRecords(prev => prev.map(r => 
            r.id === recordId 
              ? {
                  ...r,
                  files: r.files.map(f => 
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
              : r
          ));

          // Update the record in context
          const updatedRecord = records.find(r => r.id === recordId);
          if (updatedRecord) {
            const updatedFiles = updatedRecord.files.map(f => 
              f.id === newFile.id 
                ? { 
                    ...f, 
                    extractedText,
                    extractionStatus: 'completed' as const,
                    extractionError: undefined
                  }
                : f
            );
            dispatch({ 
              type: 'UPDATE_MEDICAL_RECORD', 
              payload: { ...updatedRecord, files: updatedFiles }
            });
          }

        } catch (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Failed to extract text from file';

          // Update with error
          setRecords(prev => prev.map(r => 
            r.id === recordId 
              ? {
                  ...r,
                  files: r.files.map(f => 
                    f.id === newFile.id 
                      ? { 
                          ...f, 
                          extractionStatus: 'error' as const,
                          extractionError: errorMessage
                        }
                      : f
                  )
                }
              : r
          ));
        } finally {
          // Remove from ongoing extractions
          ongoingExtractionsRef.current.delete(newFile.id);
        }
      })();
    }
  };

  const handleAddRecord = () => {
    if (newRecord.title && newRecord.date && newRecord.type) {
      const record: MedicalRecord = {
        id: Date.now().toString(),
        title: newRecord.title,
        date: new Date(newRecord.date),
        type: newRecord.type,
        files: [],
      };
      setRecords(prev => [...prev, record]);
      dispatch({ type: 'ADD_MEDICAL_RECORD', payload: record });
      setNewRecord({ title: '', date: '', type: '' });
      setIsAddingRecord(false);
    }
  };

  const handleDeleteRecord = (recordId: string) => {
    setRecords(prev => prev.filter(record => record.id !== recordId));
    dispatch({ type: 'DELETE_MEDICAL_RECORD', payload: recordId });
  };

  const handleDeleteFile = (recordId: string, fileId: string) => {
    setRecords(prev => prev.map(record => 
      record.id === recordId 
        ? { ...record, files: record.files.filter(file => file.id !== fileId) }
        : record
    ));
    
    // Remove from document context
    dispatch({ type: 'DELETE_DOCUMENT', payload: fileId });
  };

  const handleExtractAllText = async () => {
    setIsExtracting(true);
    setExtractionError(null);

    try {
      // Get all files that need extraction
      const allFiles = records.flatMap(record => 
        record.files
          .filter(file => file.extractionStatus === 'pending' || file.extractionStatus === 'error')
          .map(file => ({ recordId: record.id, file, record }))
      );

      if (allFiles.length === 0) {
        setExtractionError('No files available for text extraction.');
        return;
      }

      // Process each file in background
      const extractionPromises = allFiles.map(async ({ recordId, file, record }) => {
        // Track this extraction as ongoing
        ongoingExtractionsRef.current.add(file.id);

        // Update status to processing
        setRecords(prev => prev.map(r => 
          r.id === recordId 
            ? {
                ...r,
                files: r.files.map(f => 
                  f.id === file.id 
                    ? { ...f, extractionStatus: 'processing' as const, extractionError: undefined }
                    : f
                )
              }
            : r
        ));

        try {
          // Extract document
          const { extractedText } = await extractDocument({
            file,
            category: 'medical',
            parentId: recordId,
            parentTitle: `${record.title} - ${record.type}`,
            onDocumentExtracted,
          });

          // Update with extracted text
          setRecords(prev => prev.map(r => 
            r.id === recordId 
              ? {
                  ...r,
                  files: r.files.map(f => 
                    f.id === file.id 
                      ? { 
                          ...f, 
                          extractedText,
                          extractionStatus: 'completed' as const,
                          extractionError: undefined
                        }
                      : f
                  )
                }
              : r
          ));

          // Update the record in context
          const updatedRecord = records.find(r => r.id === recordId);
          if (updatedRecord) {
            const updatedFiles = updatedRecord.files.map(f => 
              f.id === file.id 
                ? { 
                    ...f, 
                    extractedText,
                    extractionStatus: 'completed' as const,
                    extractionError: undefined
                  }
                : f
            );
            dispatch({ 
              type: 'UPDATE_MEDICAL_RECORD', 
              payload: { ...updatedRecord, files: updatedFiles }
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Failed to extract text from file';

          // Update with error
          setRecords(prev => prev.map(r => 
            r.id === recordId 
              ? {
                  ...r,
                  files: r.files.map(f => 
                    f.id === file.id 
                      ? { 
                          ...f, 
                          extractionStatus: 'error' as const,
                          extractionError: errorMessage
                        }
                      : f
                  )
                }
              : r
          ));
        } finally {
          // Remove from ongoing extractions
          ongoingExtractionsRef.current.delete(file.id);
        }
      });

      // Wait for all extractions to complete
      await Promise.all(extractionPromises);
    } catch (error) {
      setExtractionError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsExtracting(false);
    }
  };

  const getAllFilesCount = () => {
    return records.reduce((count, record) => count + record.files.length, 0);
  };

  const getPendingFilesCount = () => {
    return records.reduce((count, record) => 
      count + record.files.filter(file => 
        file.extractionStatus === 'pending' || file.extractionStatus === 'error'
      ).length, 0
    );
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
          
          <div className="space-y-6">
            {records.map((record) => (
              <div key={record.id} className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {record.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{record.date.toLocaleDateString()}</span>
                      </div>
                      <span>•</span>
                      <span>{record.type}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRecord(record.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-carecover-blue transition-colors">
                  <input
                    type="file"
                    id={`upload-${record.id}`}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(record.id, file);
                    }}
                  />
                  <label
                    htmlFor={`upload-${record.id}`}
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {t('medical.uploadMedicalDocuments')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {t('medical.uploadDescription')}
                    </span>
                  </label>
                </div>

                {/* Uploaded Files */}
                {record.files.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">{t('medical.uploadedFiles')}</h4>
                    {record.files.map((file) => (
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
                              onClick={() => handleDeleteFile(record.id, file.id)}
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

            {/* Add New Record */}
            {isAddingRecord ? (
              <div className="border border-carecover-blue rounded-xl p-6 bg-carecover-blue bg-opacity-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('medical.addNewRecord')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('medical.recordTitle')}
                    </label>
                    <input
                      type="text"
                      value={newRecord.title}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carecover-blue focus:border-carecover-blue"
                      placeholder={t('medical.exampleTitle')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('medical.date')}
                    </label>
                    <input
                      type="date"
                      value={newRecord.date}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carecover-blue focus:border-carecover-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('medical.recordType')}
                    </label>
                    <select
                      value={newRecord.type}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carecover-blue focus:border-carecover-blue"
                    >
                      <option value="">{t('medical.selectRecordType')}</option>
                      <option value="General Checkup">{t('medical.generalCheckup')}</option>
                      <option value="Laboratory">{t('medical.laboratory')}</option>
                      <option value="Radiology">{t('medical.radiology')}</option>
                      <option value="Specialist Consultation">{t('medical.specialistConsultation')}</option>
                      <option value="Emergency">{t('medical.emergency')}</option>
                      <option value="Surgery">{t('medical.surgery')}</option>
                      <option value="Prescription">{t('medical.prescription')}</option>
                    </select>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleAddRecord}
                      className="px-4 py-2 bg-carecover-blue text-white rounded-lg hover:bg-carecover-blue/90 transition-colors"
                    >
                      {t('medical.addRecord')}
                    </button>
                    <button
                      onClick={() => setIsAddingRecord(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingRecord(true)}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-carecover-blue hover:bg-carecover-blue hover:bg-opacity-5 transition-colors"
              >
                <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <span className="text-carecover-blue font-medium">{t('medical.addNewRecord')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordsModal;

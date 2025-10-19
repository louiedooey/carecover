import React, { useState } from 'react';
import { X, Save, User, Calendar, MapPin, Edit2 } from 'lucide-react';
import { DemographicInfo } from '../../types';
import { useTranslation } from 'react-i18next';

interface DemographicModalProps {
  onClose: () => void;
  onProfileUpdate: (name: string) => void;
}

const DemographicModal: React.FC<DemographicModalProps> = ({ onClose, onProfileUpdate }) => {
  const { t } = useTranslation();
  const [demographicInfo, setDemographicInfo] = useState<DemographicInfo>({
    id: '1',
    fullName: '',
    dateOfBirth: new Date('1990-01-15'),
    residencyStatus: 'Singapore Citizen',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(demographicInfo);

  const handleSave = () => {
    setDemographicInfo(formData);
    setIsEditing(false);
    // Update profile name if it's not empty
    if (formData.fullName.trim()) {
      onProfileUpdate(formData.fullName.trim());
    }
  };

  const handleCancel = () => {
    setFormData(demographicInfo);
    setIsEditing(false);
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{t('demographic.title')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!isEditing ? (
            /* View Mode */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-gray-400" />
                    <label className="text-sm font-medium text-gray-700">{t('demographic.fullName')}</label>
                  </div>
                  <p className="text-gray-900 font-medium">{demographicInfo.fullName || 'Not provided'}</p>
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <label className="text-sm font-medium text-gray-700">{t('demographic.dateOfBirth')}</label>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {demographicInfo.dateOfBirth.toLocaleDateString()}
                  </p>
                </div>

                {/* Residency Status */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <label className="text-sm font-medium text-gray-700">{t('demographic.residencyStatus')}</label>
                  </div>
                  <p className="text-gray-900 font-medium">{demographicInfo.residencyStatus}</p>
                </div>
              </div>

              {/* Edit Button */}
              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-carecover-blue text-white rounded-lg hover:bg-carecover-blue/90 transition-all duration-200 hover-scale btn-active font-medium"
                >
                  <Edit2 className="w-5 h-5" />
                  <span>{t('demographic.editInformation')}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('demographic.fullName')} *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carecover-blue focus:border-carecover-blue"
                    placeholder={t('demographic.enterFullName')}
                    required
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('demographic.dateOfBirth')} *
                  </label>
                  <input
                    type="date"
                    value={formatDate(formData.dateOfBirth)}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: new Date(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carecover-blue focus:border-carecover-blue"
                    required
                  />
                </div>

                {/* Residency Status */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('demographic.residencyStatus')} *
                  </label>
                  <select
                    value={formData.residencyStatus}
                    onChange={(e) => setFormData(prev => ({ ...prev, residencyStatus: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carecover-blue focus:border-carecover-blue"
                    required
                  >
                    <option value="Singapore Citizen">{t('demographic.singaporeCitizen')}</option>
                    <option value="Singapore Permanent Resident">{t('demographic.singaporePR')}</option>
                    <option value="Work Permit Holder">{t('demographic.workPermit')}</option>
                    <option value="Student Pass Holder">{t('demographic.studentPass')}</option>
                    <option value="Dependent Pass Holder">{t('demographic.dependentPass')}</option>
                    <option value="Other">{t('demographic.other')}</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 hover-scale btn-active font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-6 py-3 bg-carecover-blue text-white rounded-lg hover:bg-carecover-blue/90 transition-all duration-200 hover-scale btn-active font-medium"
                >
                  <Save className="w-5 h-5" />
                  <span>Save and Close</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemographicModal;

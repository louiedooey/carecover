import React, { useState } from 'react';
import { X, Save, User, Calendar, MapPin, Phone, Users } from 'lucide-react';
import { DemographicInfo } from '../../types';
import { useTranslation } from 'react-i18next';

interface DemographicModalProps {
  onClose: () => void;
}

const DemographicModal: React.FC<DemographicModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [demographicInfo, setDemographicInfo] = useState<DemographicInfo>({
    id: '1',
    fullName: 'John Doe',
    dateOfBirth: new Date('1990-01-15'),
    gender: 'Male',
    address: '123 Main Street, Singapore 123456',
    phoneNumber: '+65 9123 4567',
    emergencyContact: '+65 9876 5432',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(demographicInfo);

  const handleSave = () => {
    setDemographicInfo(formData);
    setIsEditing(false);
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
                  <p className="text-gray-900 font-medium">{demographicInfo.fullName}</p>
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

                {/* Gender */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-gray-400" />
                    <label className="text-sm font-medium text-gray-700">{t('demographic.gender')}</label>
                  </div>
                  <p className="text-gray-900 font-medium">{demographicInfo.gender}</p>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <label className="text-sm font-medium text-gray-700">{t('demographic.phoneNumber')}</label>
                  </div>
                  <p className="text-gray-900 font-medium">{demographicInfo.phoneNumber}</p>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <label className="text-sm font-medium text-gray-700">{t('demographic.address')}</label>
                </div>
                <p className="text-gray-900 font-medium">{demographicInfo.address}</p>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <label className="text-sm font-medium text-gray-700">{t('demographic.emergencyContact')}</label>
                </div>
                <p className="text-gray-900 font-medium">{demographicInfo.emergencyContact}</p>
              </div>

              {/* Edit Button */}
              <div className="pt-4">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-carecover-blue text-white rounded-lg hover:bg-carecover-blue/90 transition-colors font-medium"
                >
                  {t('demographic.editInformation')}
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
                    {t('demographic.fullName')}
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carecover-blue focus:border-carecover-blue"
                    placeholder={t('demographic.enterFullName')}
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('demographic.dateOfBirth')}
                  </label>
                  <input
                    type="date"
                    value={formatDate(formData.dateOfBirth)}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: new Date(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carecover-blue focus:border-carecover-blue"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('demographic.gender')}
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carecover-blue focus:border-carecover-blue"
                  >
                    <option value="Male">{t('demographic.male')}</option>
                    <option value="Female">{t('demographic.female')}</option>
                    <option value="Other">{t('demographic.other')}</option>
                    <option value="Prefer not to say">{t('demographic.preferNotToSay')}</option>
                  </select>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('demographic.phoneNumber')}
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carecover-blue focus:border-carecover-blue"
                    placeholder="+65 9123 4567"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('demographic.address')}
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carecover-blue focus:border-carecover-blue"
                  placeholder={t('demographic.enterAddress')}
                />
              </div>

              {/* Emergency Contact */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('demographic.emergencyContact')}
                </label>
                <input
                  type="tel"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carecover-blue focus:border-carecover-blue"
                  placeholder="+65 9876 5432"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-6 py-3 bg-carecover-blue text-white rounded-lg hover:bg-carecover-blue/90 transition-colors font-medium"
                >
                  <Save className="w-5 h-5" />
                  <span>{t('demographic.saveChanges')}</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  {t('common.cancel')}
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

import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

const LanguageToggle: React.FC = () => {
  const { currentLanguage, setLanguage, availableLanguages } = useLanguage();
  const { t } = useTranslation();

  const handleLanguageSelect = (languageCode: string) => {
    setLanguage(languageCode as any);
  };

  return (
    <div className="flex items-center space-x-1 sm:space-x-2">
      <Globe className="w-4 h-4 text-gray-600 hidden sm:block" />
      <div className="flex items-center space-x-0.5 sm:space-x-1 bg-gray-100 rounded-lg p-0.5 sm:p-1">
        {availableLanguages.map((language) => (
          <button
            key={language.code}
            onClick={() => handleLanguageSelect(language.code)}
            className={`
              px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-md transition-all duration-200
              ${currentLanguage === language.code
                ? 'bg-white text-carecover-blue shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
            title={`${language.name} - ${language.nativeName}`}
          >
            <span className="hidden sm:inline">{language.nativeName}</span>
            <span className="sm:hidden">{language.code.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageToggle;

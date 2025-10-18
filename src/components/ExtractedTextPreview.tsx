import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { FileUpload } from '../types';
import { useTranslation } from 'react-i18next';

interface ExtractedTextPreviewProps {
  file: FileUpload;
}

const ExtractedTextPreview: React.FC<ExtractedTextPreviewProps> = ({ file }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!file.extractedText) {
    return null;
  }

  const previewText = file.extractedText.length > 200 
    ? file.extractedText.substring(0, 200) + '...'
    : file.extractedText;

  const displayText = isExpanded ? file.extractedText : previewText;
  const hasMoreText = file.extractedText.length > 200;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(file.extractedText!);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  return (
    <div className="mt-3 border border-gray-200 rounded-lg bg-gray-50">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">{t('document.extractedText')}</h4>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              title="Copy text"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            {hasMoreText && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                title={isExpanded ? t('document.showLess') : t('document.showMore')}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
        
        <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
          {displayText}
        </div>
        
        {hasMoreText && !isExpanded && (
          <div className="mt-2 text-xs text-gray-500">
            {file.extractedText.length} {t('document.charactersTotal')}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtractedTextPreview;

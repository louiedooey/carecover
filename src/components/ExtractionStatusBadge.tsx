import React from 'react';
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ExtractionStatusBadgeProps {
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

const ExtractionStatusBadge: React.FC<ExtractionStatusBadgeProps> = ({ status, error }) => {
  const { t } = useTranslation();
  
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          text: t('status.pending'),
          className: 'bg-gray-100 text-gray-700',
          iconClassName: 'text-gray-500',
        };
      case 'processing':
        return {
          icon: Loader2,
          text: t('status.processing'),
          className: 'bg-blue-100 text-blue-700',
          iconClassName: 'text-blue-500 animate-spin',
        };
      case 'completed':
        return {
          icon: CheckCircle,
          text: t('status.extracted'),
          className: 'bg-green-100 text-green-700',
          iconClassName: 'text-green-500',
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: t('status.error'),
          className: 'bg-red-100 text-red-700',
          iconClassName: 'text-red-500',
        };
      default:
        return {
          icon: Clock,
          text: t('status.unknown'),
          className: 'bg-gray-100 text-gray-700',
          iconClassName: 'text-gray-500',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-center space-x-2">
      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className={`w-3 h-3 ${config.iconClassName}`} />
        <span>{config.text}</span>
      </div>
      {status === 'error' && error && (
        <div className="text-xs text-red-600 max-w-xs truncate" title={error}>
          {error}
        </div>
      )}
    </div>
  );
};

export default ExtractionStatusBadge;

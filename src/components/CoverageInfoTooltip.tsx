import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface CoverageInfoTooltipProps {
  className?: string;
}

const CoverageInfoTooltip: React.FC<CoverageInfoTooltipProps> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Coverage information"
      >
        <Info className="w-3 h-3" />
      </button>
      
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-50">
          <div className="font-medium mb-2">Coverage may not apply when:</div>
          <ul className="space-y-1 text-gray-200">
            <li>• Pre-existing conditions (waiting period)</li>
            <li>• Non-panel providers</li>
            <li>• Annual limits exceeded</li>
            <li>• Non-emergency A&E visits</li>
            <li>• Leaving against medical advice</li>
            <li>• Cosmetic procedures</li>
            <li>• Experimental treatments</li>
          </ul>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default CoverageInfoTooltip;

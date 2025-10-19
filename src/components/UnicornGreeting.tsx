import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface UnicornGreetingProps {
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const UnicornGreeting: React.FC<UnicornGreetingProps> = ({ 
  onClose, 
  autoClose = true, 
  autoCloseDelay = 4000 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300); // Wait for fade out animation
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      {/* Speech Bubble */}
      <div className="relative mb-2 animate-speech-bubble">
        <div className="bg-white rounded-2xl px-4 py-3 shadow-lg border border-gray-200 max-w-xs">
          <p className="text-sm font-medium text-gray-800">
            Hi! I'm CareCover 🦄
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Your health insurance assistant
          </p>
        </div>
        {/* Speech bubble tail */}
        <div className="absolute bottom-0 right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white"></div>
        <div className="absolute bottom-[-1px] right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-200"></div>
      </div>

      {/* Unicorn Nurse */}
      <div className="animate-unicorn-bounce">
        <div className="relative">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute -top-2 -right-2 w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors z-10"
          >
            <X className="w-3 h-3 text-gray-600" />
          </button>

          {/* Unicorn SVG */}
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            className="animate-unicorn-wiggle drop-shadow-lg"
          >
            {/* Unicorn Body */}
            <ellipse
              cx="60"
              cy="80"
              rx="25"
              ry="15"
              fill="#10b3b1"
              stroke="#0d9488"
              strokeWidth="2"
              strokeLinecap="round"
            />
            
            {/* Unicorn Head */}
            <ellipse
              cx="60"
              cy="55"
              rx="20"
              ry="18"
              fill="#5dd4d2"
              stroke="#10b3b1"
              strokeWidth="2"
              strokeLinecap="round"
            />
            
            {/* Horn */}
            <polygon
              points="60,40 55,55 65,55"
              fill="#fbbf24"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Eyes */}
            <circle cx="55" cy="50" r="3" fill="#1f2937" />
            <circle cx="65" cy="50" r="3" fill="#1f2937" />
            
            {/* Eye sparkles */}
            <circle cx="55" cy="50" r="1" fill="white" />
            <circle cx="65" cy="50" r="1" fill="white" />
            
            {/* Nose */}
            <ellipse cx="60" cy="58" rx="2" ry="1.5" fill="#ec4899" />
            
            {/* Smile */}
            <path
              d="M 55 62 Q 60 67 65 62"
              fill="none"
              stroke="#1f2937"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            
            {/* Ears */}
            <ellipse
              cx="50"
              cy="45"
              rx="4"
              ry="6"
              fill="#5dd4d2"
              stroke="#10b3b1"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <ellipse
              cx="70"
              cy="45"
              rx="4"
              ry="6"
              fill="#5dd4d2"
              stroke="#10b3b1"
              strokeWidth="2"
              strokeLinecap="round"
            />
            
            {/* Inner ears */}
            <ellipse cx="50" cy="45" rx="2" ry="3" fill="#fbbf24" />
            <ellipse cx="70" cy="45" rx="2" ry="3" fill="#fbbf24" />
            
            {/* Legs */}
            <ellipse cx="50" cy="95" rx="3" ry="8" fill="#10b3b1" stroke="#0d9488" strokeWidth="1.5" />
            <ellipse cx="70" cy="95" rx="3" ry="8" fill="#10b3b1" stroke="#0d9488" strokeWidth="1.5" />
            
            {/* Hooves */}
            <ellipse cx="50" cy="102" rx="3" ry="2" fill="#374151" />
            <ellipse cx="70" cy="102" rx="3" ry="2" fill="#374151" />
            
            {/* Tail */}
            <path
              d="M 35 80 Q 20 75 25 90 Q 30 85 35 80"
              fill="#fbbf24"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Mane */}
            <path
              d="M 45 50 Q 35 40 40 55 Q 45 50 50 45 Q 55 40 60 50 Q 65 40 70 45 Q 75 50 80 55 Q 85 40 75 50"
              fill="#ec4899"
              stroke="#db2777"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Nurse Cap */}
            <ellipse
              cx="60"
              cy="42"
              rx="18"
              ry="8"
              fill="#ef4444"
              stroke="#dc2626"
              strokeWidth="2"
              strokeLinecap="round"
            />
            
            {/* Cross on cap */}
            <rect x="56" y="38" width="8" height="2" fill="white" rx="1" />
            <rect x="59" y="35" width="2" height="8" fill="white" rx="1" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default UnicornGreeting;

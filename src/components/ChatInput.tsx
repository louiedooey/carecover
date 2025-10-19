import React, { useState, useRef } from 'react';
import { Send, Paperclip, Image } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onFileUpload: (file: File) => void;
  placeholder?: string;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onFileUpload,
  placeholder = "Type your message...",
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isAnimating) {
      setIsAnimating(true);
      onSendMessage(message.trim());
      setMessage('');
      
      // Reset animation after completion
      setTimeout(() => {
        setIsAnimating(false);
      }, 600);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end space-x-3 bg-white border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-carecover-blue focus-within:ring-2 focus-within:ring-carecover-blue focus-within:ring-opacity-20 transition-all shadow-lg hover-lift">
          {/* File Upload Buttons */}
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => !disabled && imageInputRef.current?.click()}
              disabled={disabled}
              className={`p-2 rounded-lg transition-all duration-200 hover-scale ${
                disabled 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-400 hover:text-carecover-blue hover:bg-carecover-blue hover:bg-opacity-10 hover:shadow-md'
              }`}
              title="Upload image"
            >
              <Image className="w-5 h-5" />
            </button>
            
            <button
              type="button"
              onClick={() => !disabled && fileInputRef.current?.click()}
              disabled={disabled}
              className={`p-2 rounded-lg transition-all duration-200 hover-scale ${
                disabled 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-400 hover:text-carecover-blue hover:bg-carecover-blue hover:bg-opacity-10 hover:shadow-md'
              }`}
              title="Upload file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>

          {/* Text Input */}
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={disabled ? "Please wait..." : placeholder}
              disabled={disabled}
              className={`w-full resize-none border-none outline-none bg-transparent text-sm leading-relaxed max-h-32 ${
                disabled 
                  ? 'text-gray-400 placeholder-gray-300 cursor-not-allowed' 
                  : 'text-gray-900 placeholder-gray-500'
              }`}
              rows={1}
              style={{
                minHeight: '24px',
                height: 'auto',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className={`
              p-2 rounded-lg transition-all duration-200 hover-scale btn-active
              ${!message.trim() || disabled || isAnimating
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-carecover-blue hover:bg-carecover-blue/90 text-white shadow-lg hover:shadow-xl hover-glow'
              }
              ${isAnimating ? 'animate-fly-away' : ''}
            `}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt"
        />
        
        <input
          ref={imageInputRef}
          type="file"
          onChange={handleImageSelect}
          className="hidden"
          accept="image/*"
        />
      </form>
      
      {/* Disclaimer */}
      <p className="text-xs text-gray-400 mt-2 text-center">
        {t('app.disclaimer')}
      </p>
    </div>
  );
};

export default ChatInput;

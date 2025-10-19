import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Message as MessageType, CarouselOption, FileAttachment } from '../types';
import OptionCarousel from './OptionCarousel';
import { FileText, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Clock, CheckSquare, Square } from 'lucide-react';
import 'highlight.js/styles/github.css';

interface MessageProps {
  message: MessageType;
}

const FileAttachmentDisplay: React.FC<{ attachment: FileAttachment }> = ({ attachment }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = () => {
    switch (attachment.extractionStatus) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (attachment.extractionStatus) {
      case 'completed':
        return 'Extracted successfully';
      case 'error':
        return 'Extraction failed';
      case 'processing':
        return 'Processing...';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="mt-3 border border-gray-200 rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
            <p className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-xs text-gray-500">{getStatusText()}</span>
        </div>
      </div>

      {attachment.extractionError && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {attachment.extractionError}
        </div>
      )}

      {attachment.extractedText && attachment.extractionStatus === 'completed' && (
        <div className="mt-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 text-xs text-carecover-blue hover:text-carecover-blue/80 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                <span>Hide extracted text</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                <span>Show extracted text</span>
              </>
            )}
          </button>

          {isExpanded && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700 max-h-40 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans">{attachment.extractedText}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Message: React.FC<MessageProps> = ({ message }) => {
  const isBot = message.sender === 'bot';

  // Parse carousel content from message
  const parseCarouselContent = (content: string): { textContent: string; carouselOptions?: CarouselOption[] } => {
    const carouselStartRegex = /CAROUSEL_START([\s\S]*?)CAROUSEL_END/g;
    const match = carouselStartRegex.exec(content);
    
    if (!match) {
      return { textContent: content };
    }

    const carouselContent = match[1];
    const textContent = content.replace(carouselStartRegex, '').trim();
    
    // Parse options
    const options: CarouselOption[] = [];
    const optionBlocks = carouselContent.split('CAROUSEL_NEXT');
    
    optionBlocks.forEach(block => {
      const lines = block.trim().split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        const titleLine = lines[0];
        const title = titleLine.replace(/^Option:\s*/, '').trim();
        const points = lines.slice(1).map(line => 
          line.replace(/^\s*•\s*/, '').trim()
        ).filter(point => point);
        
        if (title && points.length > 0) {
          options.push({ title, points });
        }
      }
    });

    return { textContent, carouselOptions: options.length > 0 ? options : undefined };
  };

  const { textContent, carouselOptions } = isBot ? parseCarouselContent(message.content) : { textContent: message.content };
  
  // Convert \n escape sequences to actual newlines for proper markdown rendering
  const processedTextContent = textContent ? textContent.replace(/\\n/g, '\n') : textContent;

  // Parse structured content for emergency flow
  const parseStructuredContent = (content: string) => {
    const sections: Array<{ type: string; title: string; content: string[] }> = [];
    
    // Split content by markdown headers
    const parts = content.split(/^## (.+)$/gm);
    
    for (let i = 1; i < parts.length; i += 2) {
      const title = parts[i];
      const content = parts[i + 1]?.trim();
      
      if (title && content) {
        const lines = content.split('\n').filter(line => line.trim());
        sections.push({
          type: getSectionType(title),
          title,
          content: lines
        });
      }
    }
    
    return sections;
  };

  const getSectionType = (title: string): string => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('required documents') || titleLower.includes('recommended documents')) {
      return 'checklist';
    }
    if (titleLower.includes('questions') || titleLower.includes('instructions')) {
      return 'list';
    }
    if (titleLower.includes('treatment summary') || titleLower.includes('claims documentation')) {
      return 'info';
    }
    return 'default';
  };

  const structuredSections = isBot ? parseStructuredContent(processedTextContent || '') : [];
  
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-6`}>
      <div className={`flex items-start space-x-3 max-w-3xl ${isBot ? 'flex-row' : 'flex-row-reverse space-x-reverse'}`}>
        {/* Avatar */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          ${isBot 
            ? 'bg-carecover-light-blue' 
            : 'bg-gray-300'
          }
        `}>
          {isBot ? (
            <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          ) : (
            <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
          )}
        </div>
        
        {/* Message Content */}
        <div className={`
          px-4 py-3 rounded-2xl max-w-full
          ${isBot 
            ? 'bg-gray-100 text-gray-800' 
            : 'bg-carecover-blue text-white'
          }
        `}>
          {isBot ? (
            <div className="text-sm leading-relaxed prose prose-sm max-w-none">
              {/* Render text content */}
              {textContent && (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    // Custom styling for markdown elements
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-sm">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                      ) : (
                        <code className={className}>{children}</code>
                      );
                    },
                    pre: ({ children }) => (
                      <pre className="bg-gray-200 p-3 rounded-lg overflow-x-auto text-xs mb-2">
                        {children}
                      </pre>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-carecover-blue pl-4 italic text-gray-700 mb-2">
                        {children}
                      </blockquote>
                    ),
                    h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-gray-900">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-gray-900">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold mb-1 text-gray-900">{children}</h3>,
                    table: ({ children }) => (
                      <div className="overflow-x-auto mb-2">
                        <table className="min-w-full border-collapse border border-gray-300 text-xs">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-gray-300 px-2 py-1 bg-gray-200 font-semibold text-left">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-gray-300 px-2 py-1">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {processedTextContent}
                </ReactMarkdown>
              )}
              
              {/* Render structured content sections */}
              {structuredSections.length > 0 && (
                <div className="mt-4 space-y-4">
                  {structuredSections.map((section, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                        {section.title}
                      </h4>
                      
                      {section.type === 'checklist' && (
                        <div className="space-y-2">
                          {section.content.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-start space-x-2">
                              <Square className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{item.replace(/^[-*]\s*/, '')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {section.type === 'list' && (
                        <div className="space-y-2">
                          {section.content.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-start space-x-2">
                              <span className="text-carecover-blue mr-2 mt-0.5">•</span>
                              <span className="text-sm text-gray-700">{item.replace(/^[-*]\s*/, '')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {section.type === 'info' && (
                        <div className="text-sm text-gray-700 leading-relaxed">
                          {section.content.map((line, lineIndex) => (
                            <p key={lineIndex} className="mb-2 last:mb-0">
                              {line}
                            </p>
                          ))}
                        </div>
                      )}
                      
                      {section.type === 'default' && (
                        <div className="space-y-2">
                          {section.content.map((item, itemIndex) => (
                            <div key={itemIndex} className="text-sm text-gray-700">
                              {item}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Render carousel if present */}
              {carouselOptions && carouselOptions.length > 0 && (
                <div className="mt-4">
                  <OptionCarousel options={carouselOptions} />
                </div>
              )}

              {/* Render file attachments if present */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-4">
                  {message.attachments.map((attachment) => (
                    <FileAttachmentDisplay key={attachment.id} attachment={attachment} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          )}
          
          {/* Timestamp */}
          <div className={`
            text-xs mt-2 opacity-70
            ${isBot ? 'text-gray-500' : 'text-white'}
          `}>
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;

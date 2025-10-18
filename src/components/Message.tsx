import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Message as MessageType, CarouselOption } from '../types';
import OptionCarousel from './OptionCarousel';
import 'highlight.js/styles/github.css';

interface MessageProps {
  message: MessageType;
}

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
                  {textContent}
                </ReactMarkdown>
              )}
              
              {/* Render carousel if present */}
              {carouselOptions && carouselOptions.length > 0 && (
                <div className="mt-4">
                  <OptionCarousel options={carouselOptions} />
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

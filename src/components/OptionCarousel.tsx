import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { CarouselOption } from '../types';
import HealthcareOptionCard from './HealthcareOptionCard';
import { HealthcareFacility } from '../data/singaporeHealthcare';
import { CoverageEstimate } from '../utils/coverageCalculator';
import 'highlight.js/styles/github.css';

interface OptionCarouselProps {
  options: CarouselOption[];
  healthcareOptions?: Array<{
    facility: HealthcareFacility;
    coverage: CoverageEstimate;
    procedure: string;
  }>;
  onSelectOption?: (option: any) => void;
  onCall?: (phone: string) => void;
  onGetDirections?: (address: string) => void;
}

const OptionCarousel: React.FC<OptionCarouselProps> = ({ 
  options, 
  healthcareOptions, 
  onSelectOption, 
  onCall, 
  onGetDirections 
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.8; // Scroll 80% of container width
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      
      // Check if we can scroll more
      setTimeout(() => {
        if (container) {
          const isAtEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth - 10;
          setCanScrollRight(!isAtEnd);
        }
      }, 300);
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const isAtEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth - 10;
      setCanScrollRight(!isAtEnd);
    }
  };

  // Render healthcare options if provided
  if (healthcareOptions && healthcareOptions.length > 0) {
    return (
      <div className="relative">
        {/* Healthcare Options Carousel */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {healthcareOptions.map((healthcareOption, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-80"
              style={{ scrollSnapAlign: 'start' }}
            >
              <HealthcareOptionCard
                facility={healthcareOption.facility}
                coverage={healthcareOption.coverage}
                procedure={healthcareOption.procedure}
                onSelect={onSelectOption}
                onCall={onCall}
                onGetDirections={onGetDirections}
              />
            </div>
          ))}
        </div>

        {/* Right Arrow Button */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
            aria-label="Scroll right"
          >
            <svg 
              className="w-4 h-4 text-gray-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5l7 7-7 7" 
              />
            </svg>
          </button>
        )}

        {/* Scroll Indicator */}
        <div className="flex justify-center mt-3 space-x-1">
          {healthcareOptions.map((_, index) => (
            <div
              key={index}
              className="w-1.5 h-1.5 rounded-full bg-gray-300"
            />
          ))}
        </div>
      </div>
    );
  }

  // Render regular options
  return (
    <div className="relative">
      {/* Carousel Container */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {options.map((option, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-72 bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            style={{ scrollSnapAlign: 'start' }}
          >
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">
              {option.title}
            </h3>
            <div className="text-xs text-gray-700">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-xs">{children}</li>,
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
                }}
              >
                {option.points.map((point) => `• ${point}`).join('\n\n')}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      {/* Right Arrow Button */}
      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
          aria-label="Scroll right"
        >
          <svg 
            className="w-4 h-4 text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5l7 7-7 7" 
            />
          </svg>
        </button>
      )}

      {/* Scroll Indicator */}
      <div className="flex justify-center mt-3 space-x-1">
        {options.map((_, index) => (
          <div
            key={index}
            className="w-1.5 h-1.5 rounded-full bg-gray-300"
          />
        ))}
      </div>
    </div>
  );
};

export default OptionCarousel;

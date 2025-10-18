import React, { useRef, useState } from 'react';
import { CarouselOption } from '../types';

interface OptionCarouselProps {
  options: CarouselOption[];
}

const OptionCarousel: React.FC<OptionCarouselProps> = ({ options }) => {
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
            <ul className="space-y-2">
              {option.points.map((point, pointIndex) => (
                <li key={pointIndex} className="text-xs text-gray-700 flex items-start">
                  <span className="text-carecover-blue mr-2 mt-0.5">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
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

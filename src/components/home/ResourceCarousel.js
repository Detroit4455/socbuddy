'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const ResourceCarousel = ({ resources, loading, darkMode }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef(null);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);

  // Auto-rotation effect
  useEffect(() => {
    if (resources.length === 0) return;
    
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % resources.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [resources.length]);

  // Touch event handlers for swipe functionality
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const touchDiff = touchStartXRef.current - touchEndXRef.current;
    
    // Min swipe distance to trigger navigation
    if (Math.abs(touchDiff) > 50) {
      if (touchDiff > 0) {
        // Swiped left
        setActiveIndex((current) => (current + 1) % resources.length);
      } else {
        // Swiped right
        setActiveIndex((current) => (current - 1 + resources.length) % resources.length);
      }
    }
  };

  const goToSlide = (index) => {
    setActiveIndex(index);
  };

  const goToPrevSlide = () => {
    setActiveIndex((current) => (current - 1 + resources.length) % resources.length);
  };

  const goToNextSlide = () => {
    setActiveIndex((current) => (current + 1) % resources.length);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgba(9,203,177,0.823)]"></div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Main carousel container */}
      <div 
        ref={carouselRef}
        className="relative overflow-hidden rounded-xl"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="flex transition-transform duration-500 ease-in-out" 
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {resources.map((resource, index) => (
            <div key={resource.id} className="w-full flex-shrink-0">
              <div className={`relative h-96 ${darkMode ? 'bg-[#252525]' : 'bg-white'} rounded-xl overflow-hidden`}>
                {/* Decorative gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[rgba(9,203,177,0.3)] to-purple-900/20 opacity-30"></div>
                
                {/* Resource content */}
                <div className="relative h-full flex flex-col justify-between p-8 z-10">
                  <div>
                    <span 
                      className={`inline-block px-3 py-1 text-xs rounded-full ${
                        darkMode ? 'bg-[rgba(9,203,177,0.1)]' : 'bg-[rgba(9,203,177,0.1)]'
                      } text-[rgba(9,203,177,0.823)] mb-4`}
                    >
                      {resource.category}
                    </span>
                    <h3 className={`text-2xl sm:text-3xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {resource.title}
                    </h3>
                    <p className={`text-lg mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {resource.description}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Link 
                      href={resource.link}
                      className={`px-5 py-2 rounded-lg ${
                        darkMode 
                          ? 'bg-[rgba(9,203,177,0.2)] hover:bg-[rgba(9,203,177,0.3)]' 
                          : 'bg-[rgba(9,203,177,0.2)] hover:bg-[rgba(9,203,177,0.3)]'
                      } text-[rgba(9,203,177,0.823)] font-medium transition-all duration-300 group flex items-center space-x-2`}
                    >
                      <span>Explore Resource</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </Link>
                    
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {index + 1} / {resources.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Navigation arrows */}
      <button 
        onClick={goToPrevSlide}
        className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center z-20 transition-all ${
          darkMode 
            ? 'bg-[#333]/80 hover:bg-[#444] text-white' 
            : 'bg-white/80 hover:bg-white text-gray-800'
        } shadow-md focus:outline-none focus:ring-2 focus:ring-[rgba(9,203,177,0.4)] transform hover:scale-105`}
        aria-label="Previous slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </button>
      
      <button 
        onClick={goToNextSlide}
        className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center z-20 transition-all ${
          darkMode 
            ? 'bg-[#333]/80 hover:bg-[#444] text-white' 
            : 'bg-white/80 hover:bg-white text-gray-800'
        } shadow-md focus:outline-none focus:ring-2 focus:ring-[rgba(9,203,177,0.4)] transform hover:scale-105`}
        aria-label="Next slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>
      
      {/* Navigation dots */}
      <div className="flex justify-center mt-4 space-x-2">
        {resources.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              activeIndex === index 
                ? 'bg-[rgba(9,203,177,0.823)] w-5' 
                : darkMode ? 'bg-gray-600' : 'bg-gray-300'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ResourceCarousel; 
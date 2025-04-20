'use client';

import React, { useState, useEffect } from 'react';

const Testimonials = ({ darkMode }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const testimonials = [
    {
      id: 1,
      quote: "SocBuddy has transformed how our security team manages daily tasks and prioritizes threat responses. The habit tracking feature has helped us maintain consistent security protocols.",
      author: "Emily Chen",
      position: "CISO, TechSolutions Inc.",
      image: "https://randomuser.me/api/portraits/women/32.jpg"
    },
    {
      id: 2,
      quote: "As a security analyst, I need tools that are both powerful and easy to use. SocBuddy delivers both, making our SOC more efficient and allowing us to focus on what matters most.",
      author: "Marcus Johnson",
      position: "Senior Security Analyst, CyberDefense Corp",
      image: "https://randomuser.me/api/portraits/men/45.jpg"
    },
    {
      id: 3,
      quote: "The integration of task management with security resources has streamlined our operations. We've reduced response time by 35% since implementing SocBuddy.",
      author: "Sarah Williams",
      position: "SOC Team Lead, SecureBank",
      image: "https://randomuser.me/api/portraits/women/68.jpg"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonials.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [testimonials.length]);
  
  return (
    <section className={`py-16 px-4 md:px-8 ${darkMode ? 'bg-[#121212]' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            Trusted by Security Professionals
          </h2>
          <p className={`${darkMode ? 'text-[#bbb]' : 'text-gray-600'} max-w-3xl mx-auto`}>
            Learn how security teams are enhancing their operations with SocBuddy's integrated toolset.
          </p>
        </div>
        
        <div className="relative mx-auto max-w-5xl">
          {/* Testimonial cards with animation */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out" 
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div 
                  key={testimonial.id} 
                  className="w-full flex-shrink-0 px-4"
                >
                  <div className={`relative ${darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-gray-200'} p-8 md:p-10 rounded-xl border shadow-sm`}>
                    <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 opacity-10">
                      <svg width="120" height="120" fill="none" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
                        <path d="M28.2 36.9V31.5c0-5.5-1.7-10.1-5.2-14-3.5-3.9-8-5.8-13.5-5.8h-.8c-1.2 0-2.1.4-2.9 1.2-.8.8-1.2 1.7-1.2 2.9v1c0 1.1.4 2.1 1.2 2.8.8.7 1.8 1.1 3 1.1 3.8.1 6.7 1.2 8.8 3.3 2.1 2.1 3.1 5 3.2 8.5-2.4.5-4.3 1.7-5.9 3.5-1.6 1.9-2.4 4-2.4 6.5 0 2.7.9 5 2.7 6.8 1.8 1.9 4 2.8 6.6 2.8 3.5 0 6.3-1.3 8.5-4 2.2-2.6 3.3-6.1 3.3-10.4l-.2-1.3zm32.2 0V31.5c0-5.5-1.7-10.1-5.2-14-3.5-3.9-8-5.8-13.5-5.8h-.8c-1.2 0-2.1.4-2.9 1.2-.8.8-1.2 1.7-1.2 2.9v1c0 1.1.4 2.1 1.2 2.8.8.7 1.8 1.1 3 1.1 3.8.1 6.7 1.2 8.8 3.3 2.1 2.1 3.1 5 3.2 8.5-2.4.5-4.3 1.7-5.9 3.5-1.6 1.9-2.4 4-2.4 6.5 0 2.7.9 5 2.7 6.8 1.8 1.9 4 2.8 6.6 2.8 3.5 0 6.3-1.3 8.5-4 2.2-2.6 3.3-6.1 3.3-10.4l-.2-1.3z" fill="currentColor" className={darkMode ? 'text-[rgba(9,203,177,0.4)]' : 'text-gray-300'} />
                      </svg>
                    </div>
                    <div className="relative z-10">
                      <p className={`text-lg md:text-xl italic mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        "{testimonial.quote}"
                      </p>
                      <div className="flex items-center">
                        <img 
                          src={testimonial.image} 
                          alt={testimonial.author} 
                          className="w-12 h-12 rounded-full object-cover border-2 border-[rgba(9,203,177,0.4)]"
                        />
                        <div className="ml-4">
                          <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{testimonial.author}</h4>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{testimonial.position}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Navigation dots */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  activeIndex === index 
                    ? 'bg-[rgba(9,203,177,0.823)] w-6' 
                    : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
        
        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          <div className={`text-center p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-gray-200'} border`}>
            <div className="text-[rgba(9,203,177,0.823)] text-4xl font-bold mb-2">94%</div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Improved response time</p>
          </div>
          <div className={`text-center p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-gray-200'} border`}>
            <div className="text-[rgba(9,203,177,0.823)] text-4xl font-bold mb-2">5000+</div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Security professionals</p>
          </div>
          <div className={`text-center p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-gray-200'} border`}>
            <div className="text-[rgba(9,203,177,0.823)] text-4xl font-bold mb-2">120+</div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Enterprise teams</p>
          </div>
          <div className={`text-center p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-gray-200'} border`}>
            <div className="text-[rgba(9,203,177,0.823)] text-4xl font-bold mb-2">35%</div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Reduced alert fatigue</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials; 
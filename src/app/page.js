'use client';

import React, { useEffect, useState } from "react";
import Link from 'next/link';

const Home = () => {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await fetch('/data/tools.json');
        const data = await response.json();
        setTools(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching tools:', error);
        setLoading(false);
      }
    };

    fetchTools();
  }, []);

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Top Navigation */}
      <nav className="w-full bg-[#1e1e1e] p-2 text-white flex justify-between fixed top-0 left-0 right-0 z-40 border-b border-[#333]">
        <div className="flex items-center space-x-2">
          <img 
            src="/ICON.svg" 
            alt="SocBuddy Logo" 
            className="w-6 h-6"
          />
          <span className="text-lg font-bold text-[rgba(9,203,177,0.823)]">SocBuddy</span>
        </div>
        <ul className="flex space-x-4">
          <li><a href="#" className="hover:text-[rgba(9,203,177,0.823)] transition-colors">Home</a></li>
          <li><a href="#" className="hover:text-[rgba(9,203,177,0.823)] transition-colors">About</a></li>
          <li><a href="#" className="hover:text-[rgba(9,203,177,0.823)] transition-colors">Contact</a></li>
          <li><Link href="/admin" className="hover:text-[rgba(9,203,177,0.823)] transition-colors">Admin</Link></li>
        </ul>
      </nav>

      {/* Main Content */}
      <div className="pt-12 min-h-screen flex flex-col items-center text-[#e0e0e0] font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] px-4">
        <div className="max-w-4xl w-full space-y-12">
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold text-[rgba(9, 203, 177, 0.4)]">⚡ Unlock the Power of Cybersecurity & IT – All in One Place!</h1>
            <p className="text-[#bbb] text-lg leading-relaxed max-w-3xl mx-auto">
              Welcome to Security Hub, where technology meets intelligence. Whether you're a cybersecurity expert, IT professional, ethical hacker, or a curious learner, we've built the ultimate toolkit to help you analyze, secure, and innovate—all at your fingertips.
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-16">
            {loading ? (
              <div className="col-span-2 text-center py-6">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-[rgba(9,203,177,0.823)] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                  <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
                </div>
                <p className="mt-2 text-[#bbb] text-sm">Loading tools...</p>
              </div>
            ) : (
              tools.map((tool, index) => (
                <Link 
                  key={index}
                  href={tool.url} 
                  className="p-2 bg-[#1e1e1e] text-[#e0e0e0] rounded-md hover:bg-[#2a2a2a] hover:text-[rgba(9,203,177,0.823)] transition-all duration-300 border-[1px] border-[rgba(9,203,177,0.823)] hover:border-[rgba(9,203,177,0.823)] hover:shadow-[0_0_20px_rgba(45,169,164,0.3)] flex items-center justify-center"
                >
                  <h2 className="text-sm font-medium">{tool.name}</h2>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;


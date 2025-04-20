'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import ModernNavbar from '@/components/ModernNavbar';
import ResourceCarousel from '@/components/home/ResourceCarousel';
import Testimonials from '@/components/home/Testimonials';
import SecurityAlerts from '@/components/home/SecurityAlerts';

export default function Index2() {
  const { data: session, status } = useSession();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === 'true');
    }

    const fetchResources = async () => {
      try {
        // Simulate fetching resources
        setResources([
          { id: 1, title: 'MITRE ATT&CK Framework', description: 'A globally-accessible knowledge base of adversary tactics and techniques', category: 'Threat Intelligence', link: '/cybersecurity-resources/mitre' },
          { id: 2, title: 'OWASP Top 10', description: 'Standard awareness document for developers about the most critical security risks to web applications', category: 'Web Security', link: '/cybersecurity-resources/owasp' },
          { id: 3, title: 'SOC Playbooks', description: 'Security Operations Center response procedures for common incidents', category: 'Incident Response', link: '/cybersecurity-resources/playbooks' },
          { id: 4, title: 'Indicator Analysis', description: 'Tools and techniques for analyzing potential security threats', category: 'Threat Analysis', link: '/indicator-extractor' },
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching resources:', error);
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // In a real app, you would implement actual search functionality
      console.log('Searching for:', searchQuery);
      // Redirect to search results page or filter content
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#121212] text-white' : 'bg-white text-gray-900'} flex flex-col`}>
      {/* Use ModernNavbar instead of standard Navbar */}
      <ModernNavbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      {/* Hero Section with Search Bar */}
      <section className={`pt-24 px-4 md:px-8 pb-12 ${darkMode ? 'bg-[#1c1c1c] border-[#333]' : 'bg-gray-50 border-gray-200'} border-b`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h1 className={`text-3xl md:text-5xl font-bold ${darkMode ? 'text-[rgba(9,203,177,0.823)]' : 'text-[rgba(9,203,177,0.823)]'} leading-tight`}>
                Security Operations <br/>
                <span className={darkMode ? 'text-white' : 'text-gray-900'}>Made Simple</span>
              </h1>
              <p className={`text-lg leading-relaxed ${darkMode ? 'text-[#bbb]' : 'text-gray-700'}`}>
                SocBuddy brings together the tools, resources, and workflows 
                security professionals need to detect, investigate, and respond to threats efficiently.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="mt-8 relative">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for security tools, resources, or guides..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full px-5 py-3 ${
                      darkMode 
                        ? 'bg-[#2a2a2a] border-[#444] text-white placeholder-gray-400 focus:border-[rgba(9,203,177,0.5)]' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[rgba(9,203,177,0.5)]'
                    } border rounded-lg focus:ring-2 focus:ring-[rgba(9,203,177,0.3)] focus:outline-none transition-all duration-300`}
                  />
                  <button 
                    type="submit"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[rgba(9,203,177,0.823)] hover:text-[rgba(9,203,177,1)] transition-colors duration-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </form>

              <div className="flex space-x-4 pt-4">
                <Link href="/todo-list-manager" className={`px-6 py-3 ${
                  darkMode 
                    ? 'bg-[rgba(9,203,177,0.2)] hover:bg-[rgba(9,203,177,0.3)]' 
                    : 'bg-[rgba(9,203,177,0.2)] hover:bg-[rgba(9,203,177,0.3)]'
                  } text-[rgba(9,203,177,0.823)] font-medium rounded-lg transition-all`}>
                  Manage Tasks
                </Link>
                <Link href="/cybersecurity-resources" className={`px-6 py-3 ${
                  darkMode 
                    ? 'bg-[#2a2a2a] hover:bg-[#333] text-white border-[#444]' 
                    : 'bg-white hover:bg-gray-100 text-gray-900 border-gray-300'
                  } font-medium rounded-lg transition-all border`}>
                  Explore Resources
                </Link>
              </div>
            </div>
            <div className="hidden md:flex justify-end">
              <div className="relative w-full max-w-md group perspective-500">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[rgba(9,203,177,0.5)] to-purple-600 rounded-lg blur opacity-30 animate-pulse"></div>
                <div className={`relative ${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} p-6 rounded-lg border transform group-hover:rotate-y-6 transition-transform duration-700`}>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-full ${darkMode ? 'bg-[rgba(9,203,177,0.2)]' : 'bg-[rgba(9,203,177,0.1)]'} flex items-center justify-center text-[rgba(9,203,177,0.823)]`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-1l1-1-1-1H3v-1l1-1-1-1H2V8a6 6 0 1112 0zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className={darkMode ? 'text-white' : 'text-gray-900'}>Real-time Threat Monitoring</h3>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className={darkMode ? 'text-white' : 'text-gray-900'}>Task Management</h3>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6.625 2.655A9 9 0 0119 11a1 1 0 11-2 0 7 7 0 00-9.625-6.492 1 1 0 11-.75-1.853zM4.662 4.959A1 1 0 014.75 6.37 6.97 6.97 0 003 11a1 1 0 11-2 0 8.97 8.97 0 012.25-5.953 1 1 0 011.412-.088z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M5 11a5 5 0 1110 0 1 1 0 11-2 0 3 3 0 10-6 0c0 1.677-.345 3.276-.968 4.729a1 1 0 11-1.838-.789A9.964 9.964 0 005 11zm8.921 2.012a1 1 0 01.831 1.145 19.86 19.86 0 01-.545 2.436 1 1 0 11-1.92-.558c.207-.713.371-1.445.49-2.192a1 1 0 011.144-.83z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className={darkMode ? 'text-white' : 'text-gray-900'}>Habit Building</h3>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-red-900/30 flex items-center justify-center text-red-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className={darkMode ? 'text-white' : 'text-gray-900'}>Code Analysis</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-16 px-4 md:px-8 ${darkMode ? 'bg-[#121212]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fadeIn">
            <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Why Security Teams Trust SocBuddy</h2>
            <p className={`${darkMode ? 'text-[#bbb]' : 'text-gray-600'} max-w-3xl mx-auto`}>
              Built by security professionals for security professionals, SocBuddy streamlines your workflow with powerful tools designed for the modern SOC.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`${darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-gray-200'} p-6 rounded-lg border hover:border-[rgba(9,203,177,0.4)] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl`}>
              <div className={`h-12 w-12 mb-4 rounded-lg ${darkMode ? 'bg-[rgba(9,203,177,0.1)]' : 'bg-[rgba(9,203,177,0.1)]'} flex items-center justify-center text-[rgba(9,203,177,0.823)]`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Threat Intelligence</h3>
              <p className={`${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>
                Access up-to-date threat intelligence and IOC analysis to quickly identify and respond to emerging threats.
              </p>
            </div>

            <div className={`${darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-gray-200'} p-6 rounded-lg border hover:border-[rgba(9,203,177,0.4)] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl`}>
              <div className={`h-12 w-12 mb-4 rounded-lg ${darkMode ? 'bg-[rgba(9,203,177,0.1)]' : 'bg-[rgba(9,203,177,0.1)]'} flex items-center justify-center text-[rgba(9,203,177,0.823)]`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Task Management</h3>
              <p className={`${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>
                Stay organized with customizable task lists, assignment tracking, and progress monitoring for your security team.
              </p>
            </div>

            <div className={`${darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-gray-200'} p-6 rounded-lg border hover:border-[rgba(9,203,177,0.4)] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl`}>
              <div className={`h-12 w-12 mb-4 rounded-lg ${darkMode ? 'bg-[rgba(9,203,177,0.1)]' : 'bg-[rgba(9,203,177,0.1)]'} flex items-center justify-center text-[rgba(9,203,177,0.823)]`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Habit Tracking</h3>
              <p className={`${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>
                Build better security habits with our tracking system designed to reinforce best practices and continuous improvement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cybersecurity Resources Section with Carousel */}
      <section className={`py-16 px-4 md:px-8 ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : 'bg-gray-50 border-gray-200'} border-y`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Featured Resources</h2>
            <Link href="/cybersecurity-resources" className={`px-4 py-2 ${
              darkMode ? 'bg-[rgba(9,203,177,0.1)]' : 'bg-[rgba(9,203,177,0.1)]'
            } text-[rgba(9,203,177,0.823)] rounded-lg hover:bg-[rgba(9,203,177,0.2)] transition-all`}>
              View All Resources
            </Link>
          </div>

          {/* Resource carousel component */}
          <ResourceCarousel resources={resources} loading={loading} darkMode={darkMode} />
        </div>
      </section>

      {/* Security Alerts Section */}
      <SecurityAlerts darkMode={darkMode} />

      {/* Testimonials Section */}
      <Testimonials darkMode={darkMode} />

      {/* CTA Section */}
      <section className={`py-16 px-4 md:px-8 ${darkMode ? 'bg-[#121212]' : 'bg-white'}`}>
        <div className={`max-w-5xl mx-auto ${
          darkMode 
            ? 'bg-gradient-to-r from-[#1e1e1e] to-[#252525] border-[#333]' 
            : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
        } rounded-xl p-8 md:p-12 border relative overflow-hidden`}>
          <div className={`absolute top-0 right-0 w-64 h-64 ${
            darkMode ? 'bg-[rgba(9,203,177,0.1)]' : 'bg-[rgba(9,203,177,0.05)]'
          } rounded-full filter blur-3xl opacity-30 -z-0 animate-pulse`}></div>
          <div className="relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Ready to Enhance Your Security Operations?</h2>
              <p className={`${darkMode ? 'text-[#bbb]' : 'text-gray-600'} mb-8`}>
                Join thousands of security professionals who trust SocBuddy to streamline their workflow, improve collaboration, and respond to threats faster.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link 
                  href="/auth/signup" 
                  className={`px-6 py-3 ${
                    darkMode ? 'bg-[rgba(9,203,177,0.2)]' : 'bg-[rgba(9,203,177,0.2)]'
                  } hover:bg-[rgba(9,203,177,0.3)] text-[rgba(9,203,177,0.823)] font-medium rounded-lg transition-all text-center`}
                >
                  Create an Account
                </Link>
                <Link 
                  href="/dashboard" 
                  className={`px-6 py-3 ${
                    darkMode ? 'bg-[#2a2a2a] hover:bg-[#333] text-white border-[#444]' : 'bg-white hover:bg-gray-100 text-gray-900 border-gray-300'
                  } font-medium rounded-lg transition-all border text-center`}
                >
                  {session ? 'Go to Dashboard' : 'Learn More'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${darkMode ? 'bg-[#1a1a1a] border-[#333]' : 'bg-gray-100 border-gray-200'} border-t py-12 px-4 md:px-8`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4 group">
                <img src="/ICON.svg" alt="SocBuddy Logo" className="w-8 h-8 mr-2 transition-transform duration-500 transform group-hover:rotate-12" />
                <span className={`text-xl font-bold text-[rgba(9,203,177,0.823)]`}>SocBuddy</span>
              </div>
              <p className={`${darkMode ? 'text-[#bbb]' : 'text-gray-600'} mb-6`}>
                Empowering security professionals with tools and resources to detect, investigate, and respond to threats efficiently.
              </p>
              <div className="flex space-x-4">
                <a href="#" className={`${darkMode ? 'text-[#888]' : 'text-gray-500'} hover:text-[rgba(9,203,177,0.823)] transition-colors duration-300`}>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className={`${darkMode ? 'text-[#888]' : 'text-gray-500'} hover:text-[rgba(9,203,177,0.823)] transition-colors duration-300`}>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className={`${darkMode ? 'text-[#888]' : 'text-gray-500'} hover:text-[rgba(9,203,177,0.823)] transition-colors duration-300`}>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className={`${darkMode ? 'text-white' : 'text-gray-900'} font-semibold mb-4`}>Features</h3>
              <ul className="space-y-2">
                <li><Link href="/todo-list-manager" className={`${darkMode ? 'text-[#bbb]' : 'text-gray-600'} hover:text-[rgba(9,203,177,0.823)] transition-colors duration-300`}>Task Management</Link></li>
                <li><Link href="/habit-tracker" className={`${darkMode ? 'text-[#bbb]' : 'text-gray-600'} hover:text-[rgba(9,203,177,0.823)] transition-colors duration-300`}>Habit Tracking</Link></li>
                <li><Link href="/cybersecurity-resources" className={`${darkMode ? 'text-[#bbb]' : 'text-gray-600'} hover:text-[rgba(9,203,177,0.823)] transition-colors duration-300`}>Resources</Link></li>
                <li><Link href="/indicator-extractor" className={`${darkMode ? 'text-[#bbb]' : 'text-gray-600'} hover:text-[rgba(9,203,177,0.823)] transition-colors duration-300`}>Indicator Analysis</Link></li>
              </ul>
            </div>
            <div>
              <h3 className={`${darkMode ? 'text-white' : 'text-gray-900'} font-semibold mb-4`}>Account</h3>
              <ul className="space-y-2">
                <li><Link href="/dashboard" className={`${darkMode ? 'text-[#bbb]' : 'text-gray-600'} hover:text-[rgba(9,203,177,0.823)] transition-colors duration-300`}>Dashboard</Link></li>
                <li><Link href="/profile" className={`${darkMode ? 'text-[#bbb]' : 'text-gray-600'} hover:text-[rgba(9,203,177,0.823)] transition-colors duration-300`}>Profile</Link></li>
                <li><Link href="/auth/signin" className={`${darkMode ? 'text-[#bbb]' : 'text-gray-600'} hover:text-[rgba(9,203,177,0.823)] transition-colors duration-300`}>Sign In</Link></li>
                <li><Link href="/auth/signup" className={`${darkMode ? 'text-[#bbb]' : 'text-gray-600'} hover:text-[rgba(9,203,177,0.823)] transition-colors duration-300`}>Sign Up</Link></li>
              </ul>
            </div>
          </div>
          <div className={`border-t ${darkMode ? 'border-[#333]' : 'border-gray-200'} mt-12 pt-8 text-center`}>
            <p className={`text-sm ${darkMode ? 'text-[#888]' : 'text-gray-500'}`}>
              &copy; {new Date().getFullYear()} SocBuddy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 
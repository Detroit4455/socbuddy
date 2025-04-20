'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const SecurityAlerts = ({ darkMode }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        // In a production environment, this would be an API call to fetch real alerts
        // For demonstration, we'll use mock data
        const mockAlerts = [
          {
            id: 1,
            title: "Critical Log4j Vulnerability (CVE-2021-44228)",
            severity: "Critical",
            date: "2023-05-15",
            summary: "A remote code execution vulnerability in Log4j has been discovered. Patch your systems immediately.",
            link: "/cybersecurity-resources/alerts/log4j"
          },
          {
            id: 2,
            title: "Phishing Campaign Targeting Financial Institutions",
            severity: "High",
            date: "2023-05-12",
            summary: "New phishing campaign using sophisticated techniques to target employees of financial institutions.",
            link: "/cybersecurity-resources/alerts/phishing-campaign"
          },
          {
            id: 3,
            title: "Ransomware Attack Targeting Healthcare Sector",
            severity: "High",
            date: "2023-05-10",
            summary: "A new strain of ransomware is specifically targeting healthcare organizations. Review your defenses.",
            link: "/cybersecurity-resources/alerts/healthcare-ransomware"
          },
          {
            id: 4,
            title: "Microsoft Patch Tuesday Updates",
            severity: "Medium",
            date: "2023-05-09",
            summary: "Monthly security updates from Microsoft address 75 vulnerabilities. Apply updates as soon as possible.",
            link: "/cybersecurity-resources/alerts/ms-patch-may"
          }
        ];
        
        // Simulate API delay
        setTimeout(() => {
          setAlerts(mockAlerts);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching alerts:', error);
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className={`py-16 px-4 md:px-8 ${darkMode ? 'bg-[#1a1a1a]' : 'bg-gray-50'} border-y ${darkMode ? 'border-[#333]' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className={`h-8 ${darkMode ? 'bg-[#333]' : 'bg-gray-300'} rounded w-1/3 mb-6`}></div>
            <div className={`h-4 ${darkMode ? 'bg-[#333]' : 'bg-gray-300'} rounded w-1/2 mb-8`}></div>
            <div className="grid md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className={`${darkMode ? 'bg-[#252525]' : 'bg-white'} p-6 rounded-lg border ${darkMode ? 'border-[#444]' : 'border-gray-200'} mb-6`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className={`h-5 ${darkMode ? 'bg-[#333]' : 'bg-gray-300'} rounded w-16 mb-2`}></div>
                    <div className={`h-4 ${darkMode ? 'bg-[#333]' : 'bg-gray-300'} rounded w-24`}></div>
                  </div>
                  <div className={`h-5 ${darkMode ? 'bg-[#333]' : 'bg-gray-300'} rounded w-3/4 mb-2`}></div>
                  <div className={`h-4 ${darkMode ? 'bg-[#333]' : 'bg-gray-300'} rounded w-full mb-3`}></div>
                  <div className={`h-4 ${darkMode ? 'bg-[#333]' : 'bg-gray-300'} rounded w-full mb-3`}></div>
                  <div className={`h-4 ${darkMode ? 'bg-[#333]' : 'bg-gray-300'} rounded w-24`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className={`py-16 px-4 md:px-8 ${darkMode ? 'bg-[#1a1a1a]' : 'bg-gray-50'} border-y ${darkMode ? 'border-[#333]' : 'border-gray-200'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
          <div>
            <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2 animate-fadeIn`}>
              Security Alerts & Advisories
            </h2>
            <p className={`${darkMode ? 'text-[#bbb]' : 'text-gray-600'} max-w-2xl animate-fadeIn`}>
              Stay informed about the latest threats, vulnerabilities, and security updates that matter to your organization.
            </p>
          </div>
          <Link 
            href="/cybersecurity-resources/alerts" 
            className={`mt-4 md:mt-0 px-5 py-2 rounded-lg ${
              darkMode 
                ? 'bg-[rgba(9,203,177,0.1)] hover:bg-[rgba(9,203,177,0.2)]' 
                : 'bg-[rgba(9,203,177,0.1)] hover:bg-[rgba(9,203,177,0.2)]'
            } text-[rgba(9,203,177,0.823)] font-medium transition-all duration-300 flex items-center animate-fadeIn`}
          >
            <span>View All Alerts</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {alerts.map((alert, index) => (
            <div 
              key={alert.id} 
              className={`${darkMode ? 'bg-[#252525] border-[#444] hover:border-[rgba(9,203,177,0.4)]' : 'bg-white border-gray-200 hover:border-[rgba(9,203,177,0.4)]'} border rounded-lg p-6 transition-all duration-300 hover:shadow-md group relative overflow-hidden animate-fadeInUp`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                  {alert.severity}
                </span>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatDate(alert.date)}
                </span>
              </div>
              <h3 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-white group-hover:text-[rgba(9,203,177,0.823)]' : 'text-gray-900 group-hover:text-[rgba(9,203,177,0.823)]'} transition-colors duration-300`}>
                {alert.title}
              </h3>
              <p className={`mb-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {alert.summary}
              </p>
              <Link 
                href={alert.link}
                className={`inline-flex items-center ${
                  darkMode ? 'text-[rgba(9,203,177,0.823)]' : 'text-[rgba(9,203,177,0.823)]'
                } hover:underline font-medium transition-all duration-300`}
              >
                <span>Read details</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-5 w-5 transform transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
              
              {/* Decorative alert icon */}
              <div className="absolute top-4 right-4 opacity-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SecurityAlerts; 
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const SiteManagementContent = ({ darkMode }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Navigate to the website map
  const navigateToWebsiteMap = () => {
    router.push('/admin/website-map');
  };
  
  // Navigate to the cybersecurity resources
  const navigateToCyberResources = () => {
    router.push('/admin/cyber-resources');
  };
  
  // Clear site message
  const clearMessage = () => {
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 3000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Site Management</h1>
      
      {message.text && (
        <div className={`mb-6 p-4 rounded ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow-md'}`}>
          <h3 className="text-xl font-semibold mb-3">Website Map</h3>
          <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            View and manage the structure of all pages in the application.
          </p>
          <button
            onClick={navigateToWebsiteMap}
            className="px-4 py-2 bg-[rgba(9,203,177,0.823)] text-white rounded hover:bg-[rgba(9,203,177,0.9)] transition-colors"
          >
            View Website Map
          </button>
        </div>
        
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow-md'}`}>
          <h3 className="text-xl font-semibold mb-3">Cybersecurity Resources</h3>
          <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage the resources displayed in the cybersecurity resources section.
          </p>
          <button
            onClick={navigateToCyberResources}
            className="px-4 py-2 bg-[rgba(9,203,177,0.823)] text-white rounded hover:bg-[rgba(9,203,177,0.9)] transition-colors"
          >
            Manage Resources
          </button>
        </div>
      </div>
      
      <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow-md'}`}>
        <h3 className="text-xl font-semibold mb-4">Maintenance Tools</h3>
        
        <div className="space-y-6">
          <div className="p-4 rounded bg-black/10">
            <h4 className="font-semibold mb-3">Clear Cache</h4>
            <p className={`mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Clear the application cache to refresh content and resolve potential display issues.
            </p>
            <button
              onClick={() => {
                setIsLoading(true);
                // Simulate cache clearing
                setTimeout(() => {
                  setIsLoading(false);
                  setMessage({ type: 'success', text: 'Cache cleared successfully!' });
                  clearMessage();
                }, 1500);
              }}
              className={`px-4 py-2 rounded ${
                darkMode 
                  ? 'bg-[#333] text-white hover:bg-[#444]' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Clear Cache'}
            </button>
          </div>
          
          <div className="p-4 rounded bg-black/10">
            <h4 className="font-semibold mb-3">Test Email System</h4>
            <p className={`mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Send a test email to verify that the email notification system is working properly.
            </p>
            <button
              onClick={() => {
                setIsLoading(true);
                // Simulate email test
                setTimeout(() => {
                  setIsLoading(false);
                  setMessage({ type: 'success', text: 'Test email sent successfully!' });
                  clearMessage();
                }, 1500);
              }}
              className={`px-4 py-2 rounded ${
                darkMode 
                  ? 'bg-[#333] text-white hover:bg-[#444]' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>
          
          <div className="p-4 rounded bg-red-100/30">
            <h4 className="font-semibold mb-3 text-red-800">Danger Zone</h4>
            <p className={`mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              These actions are potentially destructive and require careful consideration.
            </p>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to rebuild the search index? This may take several minutes.')) {
                  setIsLoading(true);
                  // Simulate rebuild
                  setTimeout(() => {
                    setIsLoading(false);
                    setMessage({ type: 'success', text: 'Search index rebuilt successfully!' });
                    clearMessage();
                  }, 2000);
                }
              }}
              className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors mr-3"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Rebuild Search Index'}
            </button>
            <button
              onClick={() => {
                if (confirm('WARNING: This will log out all current users. Are you sure you want to proceed?')) {
                  setIsLoading(true);
                  // Simulate session clearing
                  setTimeout(() => {
                    setIsLoading(false);
                    setMessage({ type: 'success', text: 'All user sessions cleared!' });
                    clearMessage();
                  }, 2000);
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Clear All User Sessions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteManagementContent; 
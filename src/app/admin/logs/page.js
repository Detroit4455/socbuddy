'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LogsViewerPage() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/view-logs');
        if (!response.ok) {
          throw new Error('Failed to fetch logs');
        }
        const data = await response.json();
        setLogs(data.logs);
        setIsLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load logs');
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="w-screen min-h-screen bg-[#121212] flex flex-col text-[#e0e0e0] relative font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif]">
      {/* Navigation Bar */}
      <nav className="bg-[#1e1e1e] border-b border-[#333]">
        <div className="w-full flex items-center px-4 py-3">
          <Link 
            href="/" 
            className="bg-transparent border-2 border-[rgba(9,203,177,0.823)] text-[rgba(240,245,244,0.701)] px-4 py-2 text-xs cursor-pointer rounded-md uppercase font-semibold tracking-wider relative overflow-hidden transition-all duration-300 ease-in-out shadow-[0_0_15px_rgba(45,169,164,0.4)] min-w-[100px] h-9 inline-flex items-center justify-center no-underline hover:text-[rgb(247,246,250)] hover:bg-[rgba(10,238,162,0.59)] hover:shadow-[0_0_25px_rgba(45,169,164,0.8)] hover:border-[rgba(10,238,162,0.8)] active:scale-95 active:shadow-[0_0_10px_rgba(45,169,164,0.5)] before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-[rgba(9,199,228,0.3)] before:scale-x-0 before:origin-left before:transition-transform before:duration-300 before:ease-in-out before:-z-10 hover:before:scale-x-100"
          >
            Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-center">User Search Logs</h1>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-[#252525] text-[#e0e0e0] rounded-md hover:bg-[#333] transition-colors"
            >
              Refresh
            </button>
          </div>
          
          {error && (
            <div className="text-[#ff6b6b] font-bold mt-4 p-4 bg-[rgba(255,107,107,0.1)] rounded-md border-l-4 border-[#ff6b6b] mb-6">
              {error}
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-pulse text-[rgba(9,203,177,0.823)]">Loading logs...</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 bg-[#1e1e1e] rounded-xl border border-[#333]">
              <p className="text-[#bbb]">No logs found.</p>
            </div>
          ) : (
            <div className="bg-[#1e1e1e] rounded-xl border border-[#333] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#333]">
                  <thead className="bg-[#252525]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#aaa] uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#aaa] uppercase tracking-wider">Page</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#aaa] uppercase tracking-wider">Search Query</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#aaa] uppercase tracking-wider">User Agent</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#1e1e1e] divide-y divide-[#333]">
                    {logs.map((log, index) => (
                      <tr key={index} className="hover:bg-[#252525]">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#e0e0e0]">{log.timestamp}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#e0e0e0]">{log.page}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgba(9,203,177,0.823)]">{log.query}</td>
                        <td className="px-6 py-4 text-sm text-[#aaa] truncate max-w-xs">{log.userAgent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-[#252525] border-t border-[#333]">
                <p className="text-sm text-[#aaa]">Total logs: {logs.length}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
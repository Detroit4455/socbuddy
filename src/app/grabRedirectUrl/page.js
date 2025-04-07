'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function GrabRedirectUrlPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGrabUrl = async () => {
    setIsLoading(true);
    setError('');
    setOutput('');

    try {
      // Do NOT log at the beginning of the operation
      // We'll only log at the end based on success/failure
      
      const response = await fetch('/api/grab-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: input }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to grab URL';
        throw new Error(errorMessage);
      }

      // Format the output in a more readable way
      let formattedOutput = `Final URL: ${data.finalUrl}\n\n`;
      formattedOutput += `Status Code: ${data.statusCode}\n`;
      formattedOutput += `Total Redirects: ${data.redirectCount}\n\n`;
      
      // Direct location output section
      formattedOutput += `location: ${data.finalUrl}\n\n`;
      
      formattedOutput += `Redirect Information:\n`;
      formattedOutput += `-------------------\n`;
      formattedOutput += `Input URL: ${data.originalUrl}\n\n`;
      
      if (data.redirects.length > 0) {
        data.redirects.forEach((redirect, index) => {
          formattedOutput += `${index + 1}. From: ${redirect.from}\n`;
          formattedOutput += `   To: ${redirect.to}\n`;
          formattedOutput += `   Status: ${redirect.status}\n`;
          formattedOutput += `   Location: ${redirect.headers.location || 'N/A'}\n\n`;
        });
      } else {
        formattedOutput += `No redirects found.\n`;
      }

      setOutput(formattedOutput);
      
      // Log success after everything worked
      logUserInput('grab_url', input, true);
    } catch (err) {
      const errorMessage = err.message || 'Error grabbing URL. Please check your input.';
      setError(errorMessage);
      
      // Log the failure with error message
      logUserInput('grab_url', input, false, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  // Function to log user input
  const logUserInput = async (action, content, success = true, errorMessage = '') => {
    try {
      await fetch('/api/log-input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: `Action: ${action}, URL: ${content}`,
          source: 'grab_redirect_url',
          success,
          errorMessage,
        }),
      });
    } catch (error) {
      console.error('Failed to log input:', error);
    }
  };

  return (
    <div className="w-screen h-screen bg-[#121212] flex flex-col text-[#e0e0e0] relative font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] overflow-hidden">
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
      <div className="flex-1 p-2.5 flex justify-center items-start overflow-auto">
        <div className="bg-[#1e1e1e] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.4)] w-[90%] max-w-[850px] border border-[#333] p-5 mt-5">
          <h1 className="text-center mb-2.5 text-[#e0e0e0] text-2xl">
            URL Redirect Grabber
          </h1>
          
          <div className="relative flex mb-4 border border-[#444] rounded-lg overflow-hidden bg-[#2a2a2a] focus-within:border-[rgba(9,203,177,0.823)] focus-within:shadow-[0_0_0_3px_rgba(9,203,177,0.2)]">
            <input
              type="url"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter URL to grab redirects..."
              className="w-full p-3 border-none font-['Consolas',monospace] text-sm bg-transparent leading-normal m-0 outline-none box-border text-[#e0e0e0]"
            />
          </div>

          <div className="flex gap-2 mb-2.5 pb-2.5 border-b border-[#333]">
            <button 
              onClick={handleGrabUrl}
              disabled={isLoading}
              className="flex-1 bg-transparent border-2 border-[rgba(9,203,177,0.823)] text-[rgba(240,245,244,0.701)] px-4 py-2 my-1 text-xs cursor-pointer rounded-md uppercase font-semibold tracking-wider relative overflow-hidden transition-all duration-300 ease-in-out shadow-[0_0_15px_rgba(45,169,164,0.4)] min-w-[140px] h-9 inline-flex items-center justify-center hover:text-[rgb(247,246,250)] hover:bg-[rgba(10,238,162,0.59)] hover:shadow-[0_0_25px_rgba(45,169,164,0.8)] hover:border-[rgba(10,238,162,0.8)] active:scale-95 active:shadow-[0_0_10px_rgba(45,169,164,0.5)] before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-[rgba(9,199,228,0.3)] before:scale-x-0 before:origin-left before:transition-transform before:duration-300 before:ease-in-out before:-z-10 hover:before:scale-x-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Grabbing...' : 'Grab URL'}
            </button>
            <button 
              onClick={handleClear}
              className="flex-1 bg-transparent border-2 border-[rgba(9,203,177,0.823)] text-[rgba(240,245,244,0.701)] px-4 py-2 my-1 text-xs cursor-pointer rounded-md uppercase font-semibold tracking-wider relative overflow-hidden transition-all duration-300 ease-in-out shadow-[0_0_15px_rgba(45,169,164,0.4)] min-w-[140px] h-9 inline-flex items-center justify-center hover:text-[rgb(247,246,250)] hover:bg-[rgba(10,238,162,0.59)] hover:shadow-[0_0_25px_rgba(45,169,164,0.8)] hover:border-[rgba(10,238,162,0.8)] active:scale-95 active:shadow-[0_0_10px_rgba(45,169,164,0.5)] before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-[rgba(9,199,228,0.3)] before:scale-x-0 before:origin-left before:transition-transform before:duration-300 before:ease-in-out before:-z-10 hover:before:scale-x-100"
            >
              Clear
            </button>
          </div>

          {error && (
            <div className="text-[#ff6b6b] font-bold mt-2.5 p-2.5 bg-[rgba(255,107,107,0.1)] rounded-md border-l-3 border-[#ff6b6b]">
              {error}
            </div>
          )}

          {output && (
            <div className="relative mt-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-semibold text-[#bbb]">URL Information</span>
              </div>
              <div className="relative flex border border-[#444] rounded-lg overflow-hidden bg-[#2a2a2a]">
                <pre className="w-full p-3 border-none font-['Consolas',monospace] text-sm bg-transparent leading-normal m-0 outline-none box-border text-[#e0e0e0] whitespace-pre-wrap">
                  {output}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
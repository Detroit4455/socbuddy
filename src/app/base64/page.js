'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Base64Page() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const handleEncode = () => {
    try {
      const encoded = btoa(input);
      setOutput(encoded);
      setError('');
      
      // Log the successful user input
      logUserInput('encode', input, true);
    } catch (err) {
      const errorMessage = 'Error encoding text. Please check your input.';
      setError(errorMessage);
      setOutput('');
      
      // Log the failed operation with error
      logUserInput('encode', input, false, errorMessage);
    }
  };

  const handleDecode = () => {
    try {
      const decoded = atob(input);
      setOutput(decoded);
      setError('');
      
      // Log the successful user input
      logUserInput('decode', input, true);
    } catch (err) {
      const errorMessage = 'Error decoding text. Please check if the input is valid Base64.';
      setError(errorMessage);
      setOutput('');
      
      // Log the failed operation with error
      logUserInput('decode', input, false, errorMessage);
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
          input: `Action: ${action}, Content: ${content}`,
          source: 'base64',
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
            Base64 Encoder/Decoder
          </h1>
          
          <div className="relative flex mb-4 border border-[#444] rounded-lg overflow-hidden bg-[#2a2a2a] focus-within:border-[rgba(9,203,177,0.823)] focus-within:shadow-[0_0_0_3px_rgba(9,203,177,0.2)]">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to encode/decode..."
              className="w-full h-40 p-3 border-none font-['Consolas',monospace] text-sm resize-y bg-transparent leading-normal m-0 outline-none box-border text-[#e0e0e0]"
            />
          </div>

          <div className="flex gap-2 mb-2.5 pb-2.5 border-b border-[#333]">
            <button 
              onClick={handleEncode}
              className="flex-1 bg-transparent border-2 border-[rgba(9,203,177,0.823)] text-[rgba(240,245,244,0.701)] px-4 py-2 my-1 text-xs cursor-pointer rounded-md uppercase font-semibold tracking-wider relative overflow-hidden transition-all duration-300 ease-in-out shadow-[0_0_15px_rgba(45,169,164,0.4)] min-w-[140px] h-9 inline-flex items-center justify-center hover:text-[rgb(247,246,250)] hover:bg-[rgba(10,238,162,0.59)] hover:shadow-[0_0_25px_rgba(45,169,164,0.8)] hover:border-[rgba(10,238,162,0.8)] active:scale-95 active:shadow-[0_0_10px_rgba(45,169,164,0.5)] before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-[rgba(9,199,228,0.3)] before:scale-x-0 before:origin-left before:transition-transform before:duration-300 before:ease-in-out before:-z-10 hover:before:scale-x-100"
            >
              Encode
            </button>
            <button 
              onClick={handleDecode}
              className="flex-1 bg-transparent border-2 border-[rgba(9,203,177,0.823)] text-[rgba(240,245,244,0.701)] px-4 py-2 my-1 text-xs cursor-pointer rounded-md uppercase font-semibold tracking-wider relative overflow-hidden transition-all duration-300 ease-in-out shadow-[0_0_15px_rgba(45,169,164,0.4)] min-w-[140px] h-9 inline-flex items-center justify-center hover:text-[rgb(247,246,250)] hover:bg-[rgba(10,238,162,0.59)] hover:shadow-[0_0_25px_rgba(45,169,164,0.8)] hover:border-[rgba(10,238,162,0.8)] active:scale-95 active:shadow-[0_0_10px_rgba(45,169,164,0.5)] before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-[rgba(9,199,228,0.3)] before:scale-x-0 before:origin-left before:transition-transform before:duration-300 before:ease-in-out before:-z-10 hover:before:scale-x-100"
            >
              Decode
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
                <span className="font-semibold text-[#bbb]">Output</span>
              </div>
              <div className="relative flex border border-[#444] rounded-lg overflow-hidden bg-[#2a2a2a]">
                <textarea
                  value={output}
                  readOnly
                  className="w-full h-40 p-3 border-none font-['Consolas',monospace] text-sm resize-y bg-transparent leading-normal m-0 outline-none box-border text-[#e0e0e0]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
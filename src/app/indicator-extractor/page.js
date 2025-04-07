'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function IndicatorExtractorPage() {
  const [inputText, setInputText] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inputMethod, setInputMethod] = useState('text'); // 'text', 'file', or 'url'
  const [selectedIndicators, setSelectedIndicators] = useState({
    ip: false, 
    ipv6: false, 
    url: false, 
    domain: false, 
    email: false, 
    phone: false,
    all: true
  });
  const [expandedSections, setExpandedSections] = useState({});
  const [copiedStatus, setCopiedStatus] = useState({});
  const fileInputRef = useRef(null);
  const [urlInput, setUrlInput] = useState('');
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [filePreview, setFilePreview] = useState(null);

  // Indicator extraction patterns
  const patterns = {
    ip: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    ipv6: /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))/g,
    url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
    domain: /\b((?:[\w-]+\.)+(?:com|net|org|edu|gov|mil|biz|info|io|co|ai|dev|me|app|uk|us|ca|au|jp|ru|eu|it|fr|de|nl|se|no|es|ch))\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b(?:\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/g
  };

  // Color scheme for different indicator types
  const typeColors = {
    ip: 'bg-[#3498db] text-white', // blue
    ipv6: 'bg-[#3498db] text-white', // blue
    url: 'bg-[#2ecc71] text-white', // green
    domain: 'bg-[#9b59b6] text-white', // purple
    email: 'bg-[#e74c3c] text-white', // red
    phone: 'bg-[#f39c12] text-white' // orange
  };

  // Display names for indicator types
  const typeNames = {
    ip: 'IPV4',
    ipv6: 'IPV6',
    url: 'URL',
    domain: 'DOMAIN',
    email: 'EMAIL',
    phone: 'PHONE'
  };

  // Dynamic import of Tesseract.js only on client side
  useEffect(() => {
    let isMounted = true;
    const loadTesseract = async () => {
      if (typeof window !== 'undefined') {
        window.Tesseract = await import('tesseract.js');
      }
    };
    
    loadTesseract();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size should be less than 10MB');
      return;
    }

    setIsLoading(true);
    setError('');
    setInputText('');
    setExtractedData(null);
    setExpandedSections({});
    setFilePreview(null);

    try {
      let processedText = '';

      // Check if file is an image
      if (file.type.startsWith('image/')) {
        setIsImageProcessing(true);
        
        // Create a preview URL for the image
        const previewUrl = URL.createObjectURL(file);
        setFilePreview(previewUrl);
        
        try {
          // Process image with Tesseract OCR on client side
          if (typeof window !== 'undefined' && window.Tesseract) {
            const { createWorker } = window.Tesseract;
            
            // Create worker with language specified
            const worker = await createWorker('eng');
            
            // Recognize text
            const { data } = await worker.recognize(previewUrl);
            processedText = data.text;
           
            
            // Show confidence warning if needed
            if (data.confidence < 50) {
              setError('Warning: Low OCR confidence. Results may be inaccurate.');
            }
            
            // Terminate worker
            await worker.terminate();
          } else {
            throw new Error('OCR library not loaded. Please try again.');
          }
        } catch (ocrError) {
          console.error('OCR Error:', ocrError);
          throw new Error(`Failed to process image: ${ocrError.message}`);
        } finally {
          setIsImageProcessing(false);
        }
      } else {
        // Handle text-based files
        processedText = await file.text();
      }

      // Update input text state
      setInputText(processedText);

      // Process the extracted text for indicators
      const extractedData = extractIndicators(processedText);
      setExtractedData(extractedData);
    } catch (err) {
      setError(err.message || 'Error processing file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIndicatorSelection = (type) => {
    if (type === 'all') {
      const newState = {
        ip: true,
        ipv6: true,
        url: true,
        domain: true,
        email: true,
        phone: true,
        all: true
      };
      setSelectedIndicators(newState);
    } else {
      setSelectedIndicators({
        ...selectedIndicators,
        [type]: !selectedIndicators[type],
        all: false
      });
    }
  };

  const extractIndicators = (text) => {
    const results = {};
    const indicatorsToExtract = selectedIndicators.all 
      ? Object.keys(patterns).filter(k => k !== 'all') 
      : Object.keys(selectedIndicators).filter(k => selectedIndicators[k] && k !== 'all');

    indicatorsToExtract.forEach(type => {
      const matches = [...new Set(text.match(patterns[type]) || [])];
      results[type] = {
        items: matches,
        count: matches.length
      };
    });

    return results;
  };

  const handleExtract = async () => {
    setIsLoading(true);
    setError('');
    setExtractedData(null);
    setExpandedSections({});

    try {
      let contentToProcess = '';

      if (inputMethod === 'url' && urlInput.trim()) {
        // Handle URL input
        setIsUrlLoading(true);
        
        try {
          // Don't log at the beginning, only log at the end with success/failure
          
          const response = await fetch('/api/fetch-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: urlInput }),
          });

          if (!response.ok) {
            const data = await response.json();
            const errorMessage = data.error || 'Failed to fetch URL content';
            throw new Error(errorMessage);
          }

          const data = await response.json();
          contentToProcess = data.content;
        } catch (urlError) {
          const errorMessage = urlError.message || 'Error fetching URL';
          // Log the URL operation failure
          logUserInput('extract_from_url', urlInput, false, errorMessage);
          throw urlError; // Rethrow to be caught by the outer try/catch
        } finally {
          setIsUrlLoading(false);
        }
      } else if (inputMethod === 'file' && filePreview) {
        // Handle file input (already processed)
        contentToProcess = inputText;
        
        // Don't log here, wait for final success/failure
      } else {
        // Handle direct text input
        contentToProcess = inputText;
        
        // Don't log here, wait for final success/failure
      }

      // Process the extracted data
      const extractedData = extractIndicators(contentToProcess);
      setExtractedData(extractedData);
      
      // Log successful extraction with counts
      const totalIndicators = Object.values(extractedData).reduce(
        (total, type) => total + type.count, 0
      );
      
      // Log success for the appropriate input method
      if (inputMethod === 'url') {
        logUserInput('extract_from_url', urlInput, true);
      } else if (inputMethod === 'file') {
        logUserInput('extract_from_file', `File processed with content length: ${contentToProcess.length}`, true);
      } else {
        logUserInput('extract_from_text', inputText, true);
      }
      
    } catch (err) {
      const errorMessage = err.message || 'Error extracting indicators';
      setError(errorMessage);
      
      // If not already logged by the inner try/catch (for URL failures)
      if (!(inputMethod === 'url' && err.message.includes('fetch'))) {
        // Log the failure for text/file input
        if (inputMethod === 'file') {
          logUserInput('extract_from_file', 'file input', false, errorMessage);
        } else if (inputMethod === 'text') {
          logUserInput('extract_from_text', inputText, false, errorMessage);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setExtractedData(null);
    setError('');
    setExpandedSections({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleExpand = (type) => {
    setExpandedSections({
      ...expandedSections,
      [type]: !expandedSections[type]
    });
  };

  // Function to copy indicators to clipboard
  const copyToClipboard = async (type) => {
    if (!extractedData || !extractedData[type] || !extractedData[type].items) return;
    
    const textToCopy = extractedData[type].items.join('\n');
    
    try {
      // Try to use the clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback method using a temporary textarea element
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';  // Prevent scrolling to bottom
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (!successful) {
          throw new Error('Copy command was unsuccessful');
        }
      }
      
      // Set copied status for this type
      setCopiedStatus({
        ...copiedStatus,
        [type]: true
      });
      
      // Reset copied status after 2 seconds
      setTimeout(() => {
        setCopiedStatus(prev => ({
          ...prev,
          [type]: false
        }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      
      // Show specific error message
      if (err.name === 'NotAllowedError') {
        setError('Copy failed: Permission denied. Try using keyboard shortcut (Ctrl/Cmd+C) instead.');
      } else if (err.name === 'SecurityError') {
        setError('Copy failed: The operation is insecure. This feature requires HTTPS.');
      } else {
        setError(`Failed to copy to clipboard: ${err.message || 'Unknown error'}`);
      }
      
      // Clear error after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    }
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
          input: `Action: ${action}, Content: ${typeof content === 'string' ? 
            (content.length > 100 ? content.substring(0, 100) + '...' : content) : 
            'Non-text content'}`,
          source: 'indicator_extractor',
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
            Indicator Extractor
          </h1>

          {/* Input Method Selection */}
          <div className="flex mb-4">
            <button
              onClick={() => setInputMethod('text')}
              className={`flex-1 py-2 px-4 rounded-l-lg ${
                inputMethod === 'text'
                  ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.9)] border-[rgba(9,203,177,0.823)]'
                  : 'bg-[#2a2a2a] text-[#999] hover:bg-[#333]'
              } border border-r-0 transition-colors`}
            >
              Text Input
            </button>
            <button
              onClick={() => setInputMethod('file')}
              className={`flex-1 py-2 px-4 ${
                inputMethod === 'file'
                  ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.9)] border-[rgba(9,203,177,0.823)]'
                  : 'bg-[#2a2a2a] text-[#999] hover:bg-[#333]'
              } border border-r-0 transition-colors`}
            >
              File Upload
            </button>
            <button
              onClick={() => setInputMethod('url')}
              className={`flex-1 py-2 px-4 rounded-r-lg ${
                inputMethod === 'url'
                  ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.9)] border-[rgba(9,203,177,0.823)]'
                  : 'bg-[#2a2a2a] text-[#999] hover:bg-[#333]'
              } border transition-colors`}
            >
              URL Input
            </button>
          </div>

          {/* Input Area */}
          {inputMethod === 'text' ? (
            <div className="relative flex mb-4 border border-[#444] rounded-lg overflow-hidden bg-[#2a2a2a] focus-within:border-[rgba(9,203,177,0.823)] focus-within:shadow-[0_0_0_3px_rgba(9,203,177,0.2)]">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter text to extract indicators..."
                className="w-full p-3 min-h-[120px] border-none font-['Consolas',monospace] text-sm bg-transparent leading-normal m-0 outline-none box-border text-[#e0e0e0] resize-y"
              />
            </div>
          ) : inputMethod === 'file' ? (
            <div className="mb-4">
              <div className="border-2 border-dashed border-[#444] rounded-lg p-6 text-center bg-[#2a2a2a] hover:border-[rgba(9,203,177,0.823)] transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".txt,.json,.html,.csv,.xml,.md,image/jpeg,image/png,image/gif,image/bmp,image/webp"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-2 bg-transparent border-2 border-[rgba(9,203,177,0.823)] text-[rgba(240,245,244,0.701)] px-4 py-2 text-xs cursor-pointer rounded-md uppercase font-semibold tracking-wider relative overflow-hidden transition-all duration-300 ease-in-out shadow-[0_0_15px_rgba(45,169,164,0.4)] min-w-[140px] h-9 inline-flex items-center justify-center hover:text-[rgb(247,246,250)] hover:bg-[rgba(10,238,162,0.59)] hover:shadow-[0_0_25px_rgba(45,169,164,0.8)] hover:border-[rgba(10,238,162,0.8)] active:scale-95 active:shadow-[0_0_10px_rgba(45,169,164,0.5)]"
                >
                  Choose File
                </button>
                <p className="text-sm text-[#999] mt-2">
                  Supported formats: TXT, JSON, HTML, CSV, XML, MD, <span className="text-[#3498db] font-semibold">JPEG, PNG, GIF, BMP, WEBP</span>
                </p>
                {isImageProcessing && (
                  <div className="mt-4">
                    <p className="text-sm text-[#e0e0e0] animate-pulse">Processing image with OCR... This may take a moment.</p>
                    {filePreview && (
                      <div className="mt-2 max-w-xs mx-auto">
                        <img src={filePreview} alt="Preview" className="max-w-full h-auto rounded-md opacity-50" />
                      </div>
                    )}
                  </div>
                )}
                {inputText && !isImageProcessing && (
                  <p className="text-sm text-[rgba(9,203,177,0.823)] mt-2">
                    File loaded successfully! ({inputText.length} characters)
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <div className="relative flex mb-4 border border-[#444] rounded-lg overflow-hidden bg-[#2a2a2a] focus-within:border-[rgba(9,203,177,0.823)] focus-within:shadow-[0_0_0_3px_rgba(9,203,177,0.2)]">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Enter URL to extract indicators..."
                  className="w-full p-3 border-none font-['Consolas',monospace] text-sm bg-transparent leading-normal m-0 outline-none box-border text-[#e0e0e0]"
                />
              </div>
              <p className="text-sm text-[#999] mt-2">
                Enter a valid URL to extract indicators from its content
              </p>
            </div>
          )}

          {/* Indicator Type Selection */}
          <div className="mb-4 p-4 border border-[#444] rounded-lg bg-[#2a2a2a]">
            <p className="mb-2 text-sm font-semibold text-[#bbb]">Select indicators to extract:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIndicators.all}
                  onChange={() => handleIndicatorSelection('all')}
                  className="form-checkbox h-4 w-4 text-[rgba(9,203,177,0.823)]"
                />
                <span>All Indicators</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIndicators.ip}
                  onChange={() => handleIndicatorSelection('ip')}
                  className="form-checkbox h-4 w-4 text-[rgba(9,203,177,0.823)]"
                />
                <span className={selectedIndicators.all ? "text-[#ccc]" : ""}>IP Addresses</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIndicators.ipv6}
                  onChange={() => handleIndicatorSelection('ipv6')}
                  className="form-checkbox h-4 w-4 text-[rgba(9,203,177,0.823)]"
                />
                <span className={selectedIndicators.all ? "text-[#ccc]" : ""}>IPv6 Addresses</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIndicators.url}
                  onChange={() => handleIndicatorSelection('url')}
                  className="form-checkbox h-4 w-4 text-[rgba(9,203,177,0.823)]"
                />
                <span className={selectedIndicators.all ? "text-[#ccc]" : ""}>URLs</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIndicators.domain}
                  onChange={() => handleIndicatorSelection('domain')}
                  className="form-checkbox h-4 w-4 text-[rgba(9,203,177,0.823)]"
                />
                <span className={selectedIndicators.all ? "text-[#ccc]" : ""}>Domains</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIndicators.email}
                  onChange={() => handleIndicatorSelection('email')}
                  className="form-checkbox h-4 w-4 text-[rgba(9,203,177,0.823)]"
                />
                <span className={selectedIndicators.all ? "text-[#ccc]" : ""}>Email Addresses</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIndicators.phone}
                  onChange={() => handleIndicatorSelection('phone')}
                  className="form-checkbox h-4 w-4 text-[rgba(9,203,177,0.823)]"
                />
                <span className={selectedIndicators.all ? "text-[#ccc]" : ""}>Phone Numbers</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 mb-2.5 pb-2.5 border-b border-[#333]">
            <button 
              onClick={handleExtract}
              disabled={isLoading || (!inputText.trim() && !urlInput.trim())}
              className="flex-1 bg-transparent border-2 border-[rgba(9,203,177,0.823)] text-[rgba(240,245,244,0.701)] px-4 py-2 my-1 text-xs cursor-pointer rounded-md uppercase font-semibold tracking-wider relative overflow-hidden transition-all duration-300 ease-in-out shadow-[0_0_15px_rgba(45,169,164,0.4)] min-w-[140px] h-9 inline-flex items-center justify-center hover:text-[rgb(247,246,250)] hover:bg-[rgba(10,238,162,0.59)] hover:shadow-[0_0_25px_rgba(45,169,164,0.8)] hover:border-[rgba(10,238,162,0.8)] active:scale-95 active:shadow-[0_0_10px_rgba(45,169,164,0.5)] before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-[rgba(9,199,228,0.3)] before:scale-x-0 before:origin-left before:transition-transform before:duration-300 before:ease-in-out before:-z-10 hover:before:scale-x-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Extract Indicators'}
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

          {extractedData && (
            <div className="relative mt-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-xl text-[#e0e0e0]">Extraction Results</h2>
              </div>
              
              <div className="space-y-6">
                {Object.keys(extractedData).map(type => {
                  const { items, count } = extractedData[type];
                  if (count === 0) return null;

                  const displayItems = expandedSections[type] 
                    ? items 
                    : items.slice(0, 5);
                  
                  return (
                    <div key={type} className="border border-[#444] rounded-lg overflow-hidden">
                      <div className={`px-4 py-3 flex justify-between items-center ${typeColors[type]}`}>
                        <h3 className="font-semibold">{typeNames[type]}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm bg-black bg-opacity-30 px-2 py-1 rounded-full">
                            {count} found
                          </span>
                          <button
                            onClick={() => copyToClipboard(type)}
                            className="bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-1 rounded-full transition-all duration-200 flex items-center justify-center w-7 h-7"
                            title={`Copy all ${typeNames[type]} indicators`}
                          >
                            {copiedStatus[type] ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-[#2a2a2a] p-4">
                        {displayItems.length > 0 ? (
                          <ul className="space-y-2">
                            {displayItems.map((item, idx) => (
                              <li key={idx} className="font-mono">{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[#999]">No {type} indicators found.</p>
                        )}
                        
                        {items.length > 5 && (
                          <button
                            onClick={() => toggleExpand(type)}
                            className="mt-3 text-sm text-[rgba(9,203,177,0.823)] hover:text-[rgba(10,238,162,0.8)] transition-colors"
                          >
                            {expandedSections[type] ? 'Show Less' : `Show ${items.length - 5} More`}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
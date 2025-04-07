'use client';

import React, { useState, useRef, useEffect } from "react";
import Link from 'next/link';
import { sampleLogs } from './sample-logs';
import { demoLogList } from './logs';
import { fixLogEntry, CORRECT_LOGS } from './fix-log-entries';

const LogAnalyzer = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [filterGroups, setFilterGroups] = useState([]);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [currentLogic, setCurrentLogic] = useState('AND');
  const fileInputRef = useRef(null);
  const [sidebarWidth, setSidebarWidth] = useState(33); // Default 33%
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [wrapText, setWrapText] = useState(false);
  const resizeRef = useRef(null);
  const [highlightNumbers, setHighlightNumbers] = useState(false);
  const [customHighlights, setCustomHighlights] = useState([
    { keyword: 'ERROR', color: 'text-red-500' },
    { keyword: 'WARNING', color: 'text-orange-400' },
    { keyword: 'INFO', color: 'text-blue-400' }
  ]);
  const [isEditingHighlights, setIsEditingHighlights] = useState(false);
  const [editingHighlight, setEditingHighlight] = useState(null);
  const leftPanelRef = useRef(null);
  const autoHideTimerRef = useRef(null);
  const [autoHideCountdown, setAutoHideCountdown] = useState(null);
  const [selectedText, setSelectedText] = useState("");
  const [showSelectionPopup, setShowSelectionPopup] = useState(false);
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });
  const [fileName, setFileName] = useState('');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  // Load sample logs when the component mounts if logs array is empty
  useEffect(() => {
    // Empty useEffect - no auto-loading
  }, [logs.length]);

  // Reset auto-hide timer on user interaction
  const resetAutoHideTimer = () => {
    setAutoHideCountdown(null);
    
    // Clear any existing timers
    cleanupTimers();
    
    // Set a timer to start the countdown at 7 seconds
    const warningTimer = setTimeout(() => {
      // Start the countdown from 3
      setAutoHideCountdown(3);
      
      // Update the countdown every second
      const countdownInterval = setInterval(() => {
        setAutoHideCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Create a new timer object if none exists
      if (!autoHideTimerRef.current) {
        autoHideTimerRef.current = {};
      }
      
      // Save the interval ID to clear it if needed
      autoHideTimerRef.current.countdownInterval = countdownInterval;
    }, 7000);
    
    // Create the main timer
    const hideTimer = setTimeout(() => {
      if (!sidebarCollapsed) {
        setSidebarCollapsed(true);
        setAutoHideCountdown(null);
        cleanupTimers();
      }
    }, 10000); // 10 seconds
    
    // Create a new timer object if none exists
    if (!autoHideTimerRef.current) {
      autoHideTimerRef.current = {};
    }
    
    // Store references to all timers
    autoHideTimerRef.current.warningTimer = warningTimer;
    autoHideTimerRef.current.hideTimer = hideTimer;
  };

  // Clean up all timers
  const cleanupTimers = () => {
    if (autoHideTimerRef.current) {
      if (autoHideTimerRef.current.hideTimer) {
        clearTimeout(autoHideTimerRef.current.hideTimer);
      }
      if (autoHideTimerRef.current.warningTimer) {
        clearTimeout(autoHideTimerRef.current.warningTimer);
      }
      if (autoHideTimerRef.current.countdownInterval) {
        clearInterval(autoHideTimerRef.current.countdownInterval);
      }
      
      // Reset the timer object
      autoHideTimerRef.current = {};
    }
  };

  // Start the auto-hide timer when component mounts
  useEffect(() => {
    resetAutoHideTimer();
    
    // Clear timer on unmount
    return () => {
      cleanupTimers();
    };
  }, []);

  // Reset the timer whenever the sidebar is expanded
  useEffect(() => {
    if (!sidebarCollapsed) {
      resetAutoHideTimer();
    }
  }, [sidebarCollapsed]);

  // Toggle sidebar with reset timer
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    setAutoHideCountdown(null);
    
    if (sidebarCollapsed) {
      resetAutoHideTimer();
    } else {
      cleanupTimers();
    }
  };

  // Resize handler functions
  const startResizing = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const stopResizing = () => {
    setIsResizing(false);
    document.body.style.cursor = 'default';
  };

  const resize = (e) => {
    if (isResizing && !sidebarCollapsed) {
      const containerWidth = e.currentTarget.offsetWidth;
      const newWidth = (e.clientX / containerWidth) * 100;
      if (newWidth >= 15 && newWidth <= 50) {
        setSidebarWidth(newWidth);
        document.body.style.cursor = 'col-resize';
      }
    }
  };

  useEffect(() => {
    window.addEventListener('mouseup', stopResizing);
    window.addEventListener('mousemove', resize);
    
    return () => {
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('mousemove', resize);
    };
  });

  // A reusable sanitization function for log lines
  const sanitizeLogLine = (line) => {
    if (!line) return '';
    
    // Ensure line is a string
    const lineStr = String(line);
    
    // Special handling for <e> tags (replace with <ERROR>)
    let processedLine = lineStr.replace(/<e>/g, "<ERROR>");
    
    // Clean any potentially problematic HTML, but preserve log level tags
    return processedLine.replace(/<(?!\/?(?:ERROR|WARNING|INFO)>)[^>]*>/g, ' ');
  };

  // Handle file upload and parse content
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setLogs([]);
    setFilteredLogs([]);
    
    const fileType = file.name.split('.').pop().toLowerCase();

    if (fileType === 'pdf') {
      processPdfFile(file);
      return;
    }

    // Handle CSV files with smart column detection and formatting
    if (fileType === 'csv') {
      processCsvFile(file);
      return;
    }
    
    // Handle TSV files - Tab Separated Values
    if (fileType === 'tsv') {
      processTsvFile(file);
      return;
    }

    // Handle other file types (existing code)
    const fileReader = new FileReader();
    
    fileReader.onload = function() {
      const content = this.result;
      
      // Detect if file is NDJSON based on extension or content structure
      const isNdJson = file.name.endsWith('.ndjson') || file.name.endsWith('.jsonl') || 
                       (content.trim().startsWith('{') && content.includes('}\n{'));
      
      let logLines = [];
      
      if (isNdJson) {
        // Process NDJSON format
        logLines = content.split('\n')
          .filter(line => line.trim() !== '')
          .map(line => {
            try {
              // Try to parse each line as JSON
              const jsonObj = JSON.parse(line);
              
              // Extract message or format JSON as string
              if (jsonObj.message) {
                return sanitizeLogLine(jsonObj.message);
              } else if (jsonObj.log || jsonObj.msg) {
                return sanitizeLogLine(jsonObj.log || jsonObj.msg);
              } else {
                // Format the entire JSON object as a readable log line
                return sanitizeLogLine(JSON.stringify(jsonObj, null, 0));
              }
            } catch (err) {
              // If JSON parsing fails, treat as regular text
              return sanitizeLogLine(line);
            }
          });
      } else {
        // Process regular log format
        logLines = content.split('\n')
          .filter(line => line.trim() !== '')
          .map(sanitizeLogLine);
      }
      
      setLogs(logLines);
      setFilteredLogs(logLines);
    };
    fileReader.readAsText(file);
  };

  // Process CSV files with smart column detection and formatting
  const processCsvFile = (file) => {
    const fileReader = new FileReader();
    fileReader.onload = function() {
      const content = this.result;
      const lines = content.split(/\r?\n/);
      
      if (lines.length === 0) {
        setLogs(['No content found in CSV file']);
        setFilteredLogs(['No content found in CSV file']);
        return;
      }
      
      // Check if first line might be a header (contains common log field names)
      const firstLine = lines[0].toLowerCase();
      const hasHeaders = firstLine.includes('timestamp') || 
                         firstLine.includes('date') || 
                         firstLine.includes('time') || 
                         firstLine.includes('level') || 
                         firstLine.includes('message') ||
                         firstLine.includes('severity');
      
      let headers = [];
      let startIndex = 0;
      
      if (hasHeaders) {
        // Parse headers and start processing from second line
        headers = parseCSVLine(lines[0]);
        startIndex = 1;
      }
      
      // Process CSV lines into log entries
      const logLines = [];
      
      for (let i = startIndex; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = parseCSVLine(lines[i]);
        
        if (hasHeaders) {
          // Create formatted log entry from header-value pairs
          let logEntry = '';
          
          // Try to find timestamp/date column
          const timestampIndex = headers.findIndex(h => 
            h.toLowerCase().includes('time') || 
            h.toLowerCase().includes('date')
          );
          
          // Try to find log level column
          const levelIndex = headers.findIndex(h => 
            h.toLowerCase().includes('level') || 
            h.toLowerCase().includes('severity') ||
            h.toLowerCase().includes('type')
          );
          
          // Try to find message column
          const messageIndex = headers.findIndex(h => 
            h.toLowerCase().includes('message') || 
            h.toLowerCase().includes('msg') ||
            h.toLowerCase().includes('description')
          );
          
          // Build log entry with proper format
          if (timestampIndex !== -1 && values[timestampIndex]) {
            logEntry += `[${values[timestampIndex]}] `;
          }
          
          if (levelIndex !== -1 && values[levelIndex]) {
            // Convert log level to standard format if possible
            const level = values[levelIndex].toUpperCase();
            if (level.includes('ERR')) {
              logEntry += '<ERROR> ';
            } else if (level.includes('WARN')) {
              logEntry += '<WARNING> ';
            } else if (level.includes('INFO')) {
              logEntry += '<INFO> ';
            } else {
              logEntry += `${level} `;
            }
          }
          
          if (messageIndex !== -1 && values[messageIndex]) {
            logEntry += values[messageIndex];
          } else {
            // If no specific message column, include all fields
            logEntry += headers.map((header, index) => 
              `${header}: ${values[index] || ''}`
            ).join(' | ');
          }
          
          logLines.push(sanitizeLogLine(logEntry));
        } else {
          // No headers - treat each line as a complete log entry
          logLines.push(sanitizeLogLine(values.join(' ')));
        }
      }
      
      setLogs(logLines);
      setFilteredLogs(logLines);
    };
    fileReader.readAsText(file);
  };

  // Helper function to parse CSV line considering quotes
  const parseCSVLine = (line) => {
    const result = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(currentField);
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    result.push(currentField); // Add the last field
    return result;
  };

  // Process TSV files with tab-separated values
  const processTsvFile = (file) => {
    const fileReader = new FileReader();
    fileReader.onload = function() {
      const content = this.result;
      const lines = content.split(/\r?\n/);
      
      if (lines.length === 0) {
        setLogs(['No content found in TSV file']);
        setFilteredLogs(['No content found in TSV file']);
        return;
      }
      
      // Check if first line might be a header (contains common log field names)
      const firstLine = lines[0].toLowerCase();
      const hasHeaders = firstLine.includes('timestamp') || 
                         firstLine.includes('date') || 
                         firstLine.includes('time') || 
                         firstLine.includes('level') || 
                         firstLine.includes('message') ||
                         firstLine.includes('severity');
      
      let headers = [];
      let startIndex = 0;
      
      if (hasHeaders) {
        // Parse headers from tab-separated first line
        headers = lines[0].split('\t');
        startIndex = 1;
      }
      
      // Process TSV lines into log entries
      const logLines = [];
      
      for (let i = startIndex; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = lines[i].split('\t');
        
        if (hasHeaders) {
          // Create formatted log entry from header-value pairs
          let logEntry = '';
          
          // Try to find timestamp/date column
          const timestampIndex = headers.findIndex(h => 
            h.toLowerCase().includes('time') || 
            h.toLowerCase().includes('date')
          );
          
          // Try to find log level column
          const levelIndex = headers.findIndex(h => 
            h.toLowerCase().includes('level') || 
            h.toLowerCase().includes('severity') ||
            h.toLowerCase().includes('type')
          );
          
          // Try to find message column
          const messageIndex = headers.findIndex(h => 
            h.toLowerCase().includes('message') || 
            h.toLowerCase().includes('msg') ||
            h.toLowerCase().includes('description')
          );
          
          // Build log entry with proper format
          if (timestampIndex !== -1 && values[timestampIndex]) {
            logEntry += `[${values[timestampIndex]}] `;
          }
          
          if (levelIndex !== -1 && values[levelIndex]) {
            // Convert log level to standard format if possible
            const level = values[levelIndex].toUpperCase();
            if (level.includes('ERR')) {
              logEntry += '<ERROR> ';
            } else if (level.includes('WARN')) {
              logEntry += '<WARNING> ';
            } else if (level.includes('INFO')) {
              logEntry += '<INFO> ';
            } else {
              logEntry += `${level} `;
            }
          }
          
          if (messageIndex !== -1 && values[messageIndex]) {
            logEntry += values[messageIndex];
          } else {
            // If no specific message column, include all fields
            logEntry += headers.map((header, index) => 
              `${header}: ${values[index] || ''}`
            ).join(' | ');
          }
          
          logLines.push(sanitizeLogLine(logEntry));
        } else {
          // No headers - treat each line as a complete log entry
          logLines.push(sanitizeLogLine(values.join(' ')));
        }
      }
      
      setLogs(logLines);
      setFilteredLogs(logLines);
    };
    fileReader.readAsText(file);
  };

  // Add keyword for filtering
  const addKeyword = () => {
    if (currentKeyword.trim()) {
      // Find the group with the current logic type or create a new one
      let groupIndex = filterGroups.findIndex(group => group.logic === currentLogic);
      
      if (groupIndex === -1) {
        setFilterGroups([...filterGroups, { 
          logic: currentLogic, 
          keywords: [currentKeyword.trim()]
        }]);
      } else {
        // Add to existing group if keyword doesn't already exist in this group
        if (!filterGroups[groupIndex].keywords.includes(currentKeyword.trim())) {
          const updatedGroups = [...filterGroups];
          updatedGroups[groupIndex].keywords.push(currentKeyword.trim());
          setFilterGroups(updatedGroups);
        }
      }
      setCurrentKeyword('');
    }
  };

  // Remove keyword from filter
  const removeKeyword = (groupIndex, keywordIndex) => {
    const updatedGroups = [...filterGroups];
    updatedGroups[groupIndex].keywords.splice(keywordIndex, 1);
    
    // Remove empty groups
    if (updatedGroups[groupIndex].keywords.length === 0) {
      updatedGroups.splice(groupIndex, 1);
    }
    
    setFilterGroups(updatedGroups);
  };

  // Reset all filters
  const resetFilters = () => {
    setFilterGroups([]);
  };

  // Apply filters
  useEffect(() => {
    if (filterGroups.length === 0) {
      setFilteredLogs(logs);
      return;
    }

    setFilteredLogs(logs.filter(log => {
      // Process each filter group
      return filterGroups.every(group => {
        if (group.logic === 'AND') {
          return group.keywords.every(keyword => 
            log.toLowerCase().includes(keyword.toLowerCase())
          );
        } else if (group.logic === 'OR') {
          return group.keywords.some(keyword => 
            log.toLowerCase().includes(keyword.toLowerCase())
          );
        } else if (group.logic === 'NOT') {
          return group.keywords.every(keyword => 
            !log.toLowerCase().includes(keyword.toLowerCase())
          );
        }
        return false;
      });
    }));
  }, [filterGroups, logs]);

  // Add custom highlight
  const addCustomHighlight = () => {
    if (editingHighlight && editingHighlight.keyword.trim()) {
      if (editingHighlight.id !== undefined) {
        // Update existing
        const updatedHighlights = [...customHighlights];
        updatedHighlights[editingHighlight.id] = { ...editingHighlight };
        setCustomHighlights(updatedHighlights);
      } else {
        // Add new
        setCustomHighlights([...customHighlights, {
          ...editingHighlight
        }]);
      }
      setEditingHighlight(null);
    }
  };

  // Remove custom highlight
  const removeCustomHighlight = (index) => {
    const updatedHighlights = [...customHighlights];
    updatedHighlights.splice(index, 1);
    setCustomHighlights(updatedHighlights);
  };

  // Edit custom highlight
  const startEditingHighlight = (highlight, index) => {
    setEditingHighlight({
      ...highlight,
      id: index
    });
  };

  // Cancel editing
  const cancelEditingHighlight = () => {
    setEditingHighlight(null);
  };

  // Handle highlight field change
  const handleHighlightChange = (field, value) => {
    setEditingHighlight({
      ...editingHighlight,
      [field]: value
    });
  };

  // Highlight keywords in log
  const highlightLog = (log) => {
    try {
      // Clean the log string of any potential problematic characters
      const cleanedLog = log.replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control characters
      
      // Use our improved fixLogEntry function to safely highlight the log entry
      const processedLog = fixLogEntry(cleanedLog, highlightNumbers, customHighlights);
      return { __html: processedLog };
    } catch (err) {
      console.error("Error highlighting log:", err);
      // Fallback to plain text if there's an error
      return { __html: `<span class="log-entry">${log.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>` };
    }
  };

  // Helper function to convert tailwind color classes to hex values
  const getColorHex = (colorClass) => {
    const colorMap = {
      'text-red-500': '#ef4444',
      'text-orange-400': '#fb923c',
      'text-yellow-400': '#facc15',
      'text-green-400': '#4ade80',
      'text-blue-400': '#60a5fa',
      'text-indigo-400': '#818cf8',
      'text-purple-400': '#c084fc',
      'text-pink-400': '#f472b6'
    };
    
    return colorMap[colorClass] || '#60a5fa'; // Default to blue if not found
  };

  // Function to handle text selection
  const handleTextSelection = (e) => {
    // Prevent event propagation to stop immediate popup hiding
    e.stopPropagation();
    
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text && text.length > 0) {
      setSelectedText(text);
      
      // Get position for the popup
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionPosition({
        x: rect.left + (rect.width / 2),
        y: rect.bottom + window.scrollY + 10
      });
      
      setShowSelectionPopup(true);
    } else {
      setShowSelectionPopup(false);
    }
  };

  // Function to add selected text to filter
  const addSelectedTextToFilter = () => {
    if (selectedText) {
      setCurrentKeyword(selectedText);
      setShowSelectionPopup(false);
      
      // Automatically add to filter
      if (selectedText.trim()) {
        // Find the group with the current logic type or create a new one
        let groupIndex = filterGroups.findIndex(group => group.logic === currentLogic);
        
        if (groupIndex === -1) {
          setFilterGroups([...filterGroups, { 
            logic: currentLogic, 
            keywords: [selectedText.trim()]
          }]);
        } else {
          // Add to existing group if keyword doesn't already exist in this group
          if (!filterGroups[groupIndex].keywords.includes(selectedText.trim())) {
            const updatedGroups = [...filterGroups];
            updatedGroups[groupIndex].keywords.push(selectedText.trim());
            setFilterGroups(updatedGroups);
          }
        }
      }

      // If sidebar is collapsed, expand it
      if (sidebarCollapsed) {
        setSidebarCollapsed(false);
        resetAutoHideTimer();
      }
    }
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Don't close if click is inside selection popup
      if (e.target.closest('.selection-popup')) return;
      setShowSelectionPopup(false);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fallback copy function using textarea element
  const fallbackCopy = (text) => {
    try {
      // Create temporary textarea
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Make the textarea out of viewport
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      
      // Select and copy
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      
      // Remove the textarea
      document.body.removeChild(textArea);
      
      // Visual feedback with glowing animation
      if (successful) {
        const button = document.getElementById('copy-button');
        if (button) {
          button.classList.add('text-green-400', 'copy-success');
          setTimeout(() => {
            button.classList.remove('text-green-400', 'copy-success');
          }, 1500);
        }
      }
    } catch (err) {
      console.error('Fallback copy method failed:', err);
      alert('Copy failed. Please press Ctrl+C to copy manually.');
    }
  };

  // Handle search in filtered logs
  useEffect(() => {
    if (!searchText.trim()) {
      setSearchResults(filteredLogs);
      return;
    }
    
    const results = filteredLogs.filter(log => 
      log.toLowerCase().includes(searchText.toLowerCase())
    );
    setSearchResults(results);
  }, [searchText, filteredLogs]);

  // Function to export logs in different formats
  const exportLogs = (format) => {
    // Close the dropdown
    setShowExportOptions(false);
    
    // Get the logs to export (filtered logs or search results)
    const logsToExport = searchText ? searchResults : filteredLogs;
    
    if (logsToExport.length === 0) {
      alert('No logs to export.');
      return;
    }
    
    let content = '';
    let filename = `log-export-${new Date().toISOString().slice(0, 10)}`;
    let mimeType = '';
    
    switch (format) {
      case 'txt':
        content = logsToExport.join('\n');
        filename += '.txt';
        mimeType = 'text/plain';
        break;
        
      case 'csv':
        // Create CSV with headers
        content = 'Index,Log Entry\n';
        content += logsToExport.map((log, index) => {
          // Escape quotes in the log text
          const escapedLog = log.replace(/"/g, '""');
          return `${index + 1},"${escapedLog}"`;
        }).join('\n');
        filename += '.csv';
        mimeType = 'text/csv';
        break;
        
      case 'json':
        const jsonData = {
          exportDate: new Date().toISOString(),
          totalLogs: logsToExport.length,
          fileName: fileName || 'manual-input',
          logs: logsToExport.map((log, index) => ({
            index: index + 1,
            content: log
          }))
        };
        content = JSON.stringify(jsonData, null, 2);
        filename += '.json';
        mimeType = 'application/json';
        break;
        
      default:
        alert('Invalid export format.');
        return;
    }
    
    // Create and trigger download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Show feedback
    const button = document.getElementById('export-button');
    if (button) {
      button.classList.add('text-green-400');
      setTimeout(() => {
        button.classList.remove('text-green-400');
      }, 1500);
    }
  };

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showExportOptions && !e.target.closest('.export-dropdown')) {
        setShowExportOptions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportOptions]);

  // Load saved templates from localStorage on component mount
  useEffect(() => {
    const savedTemplatesFromStorage = localStorage.getItem('logAnalyzerTemplates');
    if (savedTemplatesFromStorage) {
      try {
        setSavedTemplates(JSON.parse(savedTemplatesFromStorage));
      } catch (err) {
        console.error('Failed to parse saved templates:', err);
      }
    }
  }, []);

  // Save a filter template
  const saveFilterTemplate = () => {
    if (!templateName.trim() || filterGroups.length === 0) {
      alert('Please enter a template name and add at least one filter.');
      return;
    }

    const newTemplate = {
      id: Date.now(),
      name: templateName.trim(),
      filterGroups: [...filterGroups]
    };

    const updatedTemplates = [...savedTemplates, newTemplate];
    setSavedTemplates(updatedTemplates);
    
    // Save to localStorage
    localStorage.setItem('logAnalyzerTemplates', JSON.stringify(updatedTemplates));
    
    // Close modal and reset name
    setShowSaveTemplateModal(false);
    setTemplateName('');
  };

  // Load a filter template
  const loadFilterTemplate = (template) => {
    setFilterGroups(template.filterGroups);
    setShowTemplatesModal(false);
  };

  // Delete a filter template
  const deleteFilterTemplate = (id) => {
    const updatedTemplates = savedTemplates.filter(template => template.id !== id);
    setSavedTemplates(updatedTemplates);
    
    // Save to localStorage
    localStorage.setItem('logAnalyzerTemplates', JSON.stringify(updatedTemplates));
  };

  // Export templates to a JSON file
  const exportTemplates = () => {
    if (savedTemplates.length === 0) {
      alert('No templates to export.');
      return;
    }
    
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      templates: savedTemplates
    };
    
    const content = JSON.stringify(exportData, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `log-analyzer-templates-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Import templates from a JSON file
  const importTemplates = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Validate the imported data
        if (!importedData.templates || !Array.isArray(importedData.templates)) {
          alert('Invalid template file format.');
          return;
        }
        
        // Ask user if they want to merge or replace
        const action = confirm(
          `Found ${importedData.templates.length} templates.\n\n` +
          `Do you want to merge with existing templates (OK) or replace all (Cancel)?`
        );
        
        let newTemplates;
        if (action) {
          // Merge: Add new templates without duplicates (based on name)
          const existingNames = savedTemplates.map(t => t.name.toLowerCase());
          const uniqueNewTemplates = importedData.templates.filter(
            t => !existingNames.includes(t.name.toLowerCase())
          );
          
          newTemplates = [...savedTemplates, ...uniqueNewTemplates];
          alert(`Successfully imported ${uniqueNewTemplates.length} new templates.`);
        } else {
          // Replace all
          newTemplates = importedData.templates;
          alert(`Replaced existing templates with ${newTemplates.length} imported templates.`);
        }
        
        // Update state and localStorage
        setSavedTemplates(newTemplates);
        localStorage.setItem('logAnalyzerTemplates', JSON.stringify(newTemplates));
        
      } catch (err) {
        alert('Error parsing template file: ' + err.message);
      }
    };
    reader.readAsText(file);
    
    // Reset the input value so the same file can be selected again
    event.target.value = null;
  };

  // Process PDF files (stub - functionality not implemented)
  const processPdfFile = (file) => {
    // Create a readable message for the user about PDF processing
    const logLines = ["[PDF Import] Starting PDF text extraction..."];
    setLogs(logLines);
    setFilteredLogs(logLines);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // Use text extraction approach - simpler but less reliable than full PDF.js
        const text = e.target.result;
        
        // Basic processing - split by newlines and filter empty lines
        let extractedLines = text.split(/\r?\n/)
          .filter(line => line.trim() !== '')
          .map(sanitizeLogLine);
          
        // If we didn't get any meaningful text with simple method, inform the user
        if (extractedLines.length === 0 || (extractedLines.length === 1 && extractedLines[0].trim() === '')) {
          extractedLines = [
            "[PDF Import] PDF appears to contain no extractable text content.",
            "[PDF Import] This could be due to the PDF containing only images or scanned content.",
            "[PDF Import] Try converting the PDF to text using an external tool first."
          ];
        } else {
          // Add information at the beginning
          extractedLines.unshift(`[PDF Import] Successfully extracted ${extractedLines.length} lines from ${file.name}`);
        }
        
        setLogs(extractedLines);
        setFilteredLogs(extractedLines);
      } catch (error) {
        console.error("Error processing PDF:", error);
        const errorLines = [
          "[PDF Import] Error processing PDF file: " + error.message,
          "[PDF Import] This PDF might be encrypted, corrupted, or in an unsupported format."
        ];
        setLogs(errorLines);
        setFilteredLogs(errorLines);
      }
    };
    
    reader.onerror = () => {
      const errorLines = ["[PDF Import] Failed to read the PDF file. The file might be corrupted or too large."];
      setLogs(errorLines);
      setFilteredLogs(errorLines);
    };
    
    // Read as text - this won't properly parse PDF structure but can extract some text
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Selection Popup */}
      {showSelectionPopup && (
        <div 
          className="fixed bg-[#242424] shadow-lg border border-[#333] rounded-md p-2 z-50 transform -translate-x-1/2 selection-popup"
          style={{ 
            left: selectionPosition.x, 
            top: selectionPosition.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-2">
            <div className="text-xs text-[rgba(9,203,177,0.823)] font-medium pb-1 border-b border-[#333] mb-1 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter Log
            </div>
            <div className="flex items-center gap-2">
              <select
                value={currentLogic}
                onChange={(e) => setCurrentLogic(e.target.value)}
                className="px-1 py-0.5 bg-[#333] text-[#e0e0e0] rounded-md border border-[#444] text-xs focus:outline-none focus:ring-1 focus:ring-[rgba(9,203,177,0.823)]"
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
                <option value="NOT">NOT</option>
              </select>
              <button 
                onClick={addSelectedTextToFilter}
                className="flex items-center text-xs text-white hover:text-[rgba(9,203,177,0.823)] transition-colors gap-1 whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add "{selectedText.length > 15 ? selectedText.slice(0, 15) + '...' : selectedText}"
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[#242424] rounded-lg shadow-lg border border-[#333] w-full max-w-md p-5">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[rgba(9,203,177,0.823)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Filter Template
            </h3>
            
            {filterGroups.length === 0 ? (
              <div className="text-center p-4 text-[#999]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm">You need to add at least one filter before you can save a template.</p>
                <button 
                  onClick={() => setShowSaveTemplateModal(false)}
                  className="mt-3 px-4 py-2 bg-[#333] text-[#bbb] rounded-md hover:bg-[#444]"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-[#bbb] text-sm mb-2">Template Name</label>
                  <input
                    type="text"
                    className="w-full p-2 bg-[#333] text-white rounded-md border border-[#444] focus:outline-none focus:ring-1 focus:ring-[rgba(9,203,177,0.823)]"
                    placeholder="Enter a descriptive name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>
                
                <div className="p-3 bg-[#1a1a1a] rounded-md mb-4 border border-[#333]">
                  <h4 className="text-sm font-medium text-white mb-2">Template Contents</h4>
                  <div className="text-sm text-[#999] mb-4">
                    <p>This will save {filterGroups.length} filter groups with {filterGroups.reduce((count, group) => count + (group.keywords?.length || 0), 0)} keywords total.</p>
                  </div>
                  <ul className="text-xs text-[#bbb] space-y-1 pl-2">
                    <li className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[rgba(9,203,177,0.823)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {filterGroups.length} filter {filterGroups.length === 1 ? 'group' : 'groups'}
                    </li>
                    <li className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[rgba(9,203,177,0.823)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {filterGroups.reduce((count, group) => count + (group.keywords?.length || 0), 0)} keyword {filterGroups.reduce((count, group) => count + (group.keywords?.length || 0), 0) === 1 ? 'filter' : 'filters'}
                    </li>
                  </ul>
                </div>
                
                <div className="flex justify-between gap-3">
                  <button 
                    onClick={() => setShowSaveTemplateModal(false)}
                    className="flex-1 px-4 py-2 bg-[#333] text-[#bbb] rounded-md hover:bg-[#444]"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveFilterTemplate}
                    disabled={!templateName.trim()}
                    className={`flex-1 px-4 py-2 rounded-md flex items-center justify-center gap-1
                      ${!templateName.trim() 
                        ? 'bg-[#333] text-[#777] cursor-not-allowed' 
                        : 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save Template
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[#242424] rounded-lg shadow-lg border border-[#333] w-full max-w-md p-5">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[rgba(9,203,177,0.823)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Manage Filter Templates
            </h3>
            
            {savedTemplates.length === 0 ? (
              <div className="text-center p-4 text-[#999]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <p>You don't have any saved templates yet</p>
                <div className="flex justify-center gap-2 mt-3">
                  <button
                    onClick={() => {
                      setShowTemplatesModal(false);
                      setShowSaveTemplateModal(true);
                    }}
                    className="text-sm px-4 py-2 bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] rounded-md hover:bg-[rgba(9,203,177,0.3)]"
                  >
                    Create Template
                  </button>
                  
                  <input
                    type="file"
                    id="importTemplatesInput"
                    accept=".json"
                    onChange={importTemplates}
                    className="hidden"
                  />
                  <label
                    htmlFor="importTemplatesInput"
                    className="text-sm px-4 py-2 bg-[#333] text-[#bbb] rounded-md hover:bg-[#444] cursor-pointer flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import Templates
                  </label>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-[#bbb]">
                    {savedTemplates.length} {savedTemplates.length === 1 ? 'template' : 'templates'} available
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="importTemplatesInput"
                      accept=".json"
                      onChange={importTemplates}
                      className="hidden"
                    />
                    <label
                      htmlFor="importTemplatesInput"
                      className="text-xs text-[rgba(9,203,177,0.823)] hover:underline flex items-center gap-1 cursor-pointer"
                      title="Import templates from file"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Import
                    </label>
                    
                    <button
                      onClick={exportTemplates}
                      className="text-xs text-[rgba(9,203,177,0.823)] hover:underline flex items-center gap-1"
                      title="Export templates to file"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export
                    </button>
                    
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete all templates? This cannot be undone.')) {
                          setSavedTemplates([]);
                          localStorage.removeItem('logAnalyzerTemplates');
                        }
                      }}
                      className="text-xs text-red-400 hover:underline flex items-center gap-1"
                      title="Delete all templates"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="max-h-[50vh] overflow-y-auto mb-4">
                  {savedTemplates.map(template => (
                    <div 
                      key={template.id}
                      className="border border-[#333] rounded-md p-3 mb-2 hover:bg-[#333] transition-colors group"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-white font-medium">{template.name}</h4>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => loadFilterTemplate(template)}
                            className="text-xs text-[rgba(9,203,177,0.823)] hover:underline flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Apply
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
                                deleteFilterTemplate(template.id);
                              }
                            }}
                            className="text-xs text-red-400 hover:underline flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="text-[#999] text-xs">
                        {template.filterGroups.length} filter groups, {template.filterGroups.reduce((count, group) => 
                          count + (group.keywords?.length || 0), 0)} keywords total
                      </div>
                      <div className="mt-2 space-y-1">
                        {template.filterGroups.map((group, index) => (
                          <div key={index} className="flex flex-col">
                            <span className="text-xs px-1.5 py-0.5 rounded-sm bg-[#444] text-[rgba(9,203,177,0.823)] mr-2 inline-block w-fit">
                              {group.logic}
                            </span>
                            
                            {/* Keywords */}
                            {group.keywords && group.keywords.length > 0 && (
                              <span className="text-xs text-[#bbb] truncate mt-1">
                                <span className="text-[#777]">Keywords: </span>
                                {group.keywords.join(', ')}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            <div className="flex justify-between">
              <button
                onClick={() => {
                  setShowTemplatesModal(false);
                  setShowSaveTemplateModal(true);
                }}
                className="px-4 py-2 bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] rounded-md hover:bg-[rgba(9,203,177,0.3)]"
                disabled={filterGroups.length === 0}
                title={filterGroups.length === 0 ? "Add filters first to save a template" : "Save current filters as template"}
              >
                {savedTemplates.length === 0 ? "Create Template" : "Save Current Filters"}
              </button>
              <button 
                onClick={() => setShowTemplatesModal(false)}
                className="px-4 py-2 bg-[#333] text-[#bbb] rounded-md hover:bg-[#444]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <nav className="w-full bg-[#1e1e1e] p-2 text-white flex justify-between fixed top-0 left-0 right-0 z-40 border-b border-[#333]">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <div className="flex items-center space-x-2">
              <img 
                src="/ICON.svg" 
                alt="SocBuddy Logo" 
                className="w-6 h-6"
              />
              <span className="text-lg font-bold text-[rgba(9,203,177,0.823)]">SocBuddy</span>
            </div>
          </Link>
        </div>
        <ul className="flex space-x-4">
          <li><Link href="/" className="hover:text-[rgba(9,203,177,0.823)] transition-colors">Home</Link></li>
          <li><a href="#" className="hover:text-[rgba(9,203,177,0.823)] transition-colors">About</a></li>
          <li><a href="#" className="hover:text-[rgba(9,203,177,0.823)] transition-colors">Contact</a></li>
          <li><Link href="/admin" className="hover:text-[rgba(9,203,177,0.823)] transition-colors">Admin</Link></li>
        </ul>
      </nav>

      {/* Main Content */}
      <div className="pt-16 min-h-screen bg-gradient-to-b from-[#121212] to-[#1a1a1a]">
        <div 
          className="container mx-auto px-4 py-6 relative border border-[#333] rounded-lg"
          onMouseMove={(e) => {
            resize(e);
            // Don't reset timer on container mouse movement
          }}
        >
          <div className="flex relative h-full">
            {/* Left Panel - Controls */}
            <div 
              ref={leftPanelRef}
              className="space-y-4 transition-all duration-300 overflow-y-auto relative"
              style={{ 
                width: sidebarCollapsed ? '0' : `${sidebarWidth}%`, 
                opacity: sidebarCollapsed ? 0 : 1,
                maxHeight: 'calc(100vh - 80px)'
              }}
              onMouseMove={resetAutoHideTimer}
              onClick={resetAutoHideTimer}
            >
              {autoHideCountdown !== null && (
                <div className="absolute top-2 right-2 z-50 w-8 h-8 bg-[rgba(0,0,0,0.7)] rounded-full flex items-center justify-center text-[rgba(9,203,177,0.823)] font-bold text-sm">
                  {autoHideCountdown}
                </div>
              )}
              
              {/* Header */}
              <div className="bg-[#1e1e1e] p-4 rounded-lg border border-[#333] shadow-lg">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[rgba(9,203,177,0.823)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Log Analyzer
                </h1>
                <p className="text-[#bbb] text-sm mt-1">
                  Advanced log analysis with support for text, PDF, CSV, TSV, JSON and NDJSON formats
                </p>
              </div>

              {/* Filters */}
              {logs.length > 0 && (
                <div className="bg-[#1e1e1e] p-4 rounded-lg border border-[#333] shadow-lg">
                  <h2 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[rgba(9,203,177,0.823)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filter Logs
                  </h2>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentKeyword}
                        onChange={(e) => setCurrentKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                        placeholder="Enter keyword..."
                        className="flex-grow p-2 bg-[#242424] text-[#e0e0e0] rounded-md border border-[#333] focus:outline-none focus:ring-1 focus:ring-[rgba(9,203,177,0.823)] focus:border-[rgba(9,203,177,0.823)]"
                      />
                      <select
                        value={currentLogic}
                        onChange={(e) => setCurrentLogic(e.target.value)}
                        className="px-2 bg-[#242424] text-[#e0e0e0] rounded-md border border-[#333] focus:outline-none focus:ring-1 focus:ring-[rgba(9,203,177,0.823)] focus:border-[rgba(9,203,177,0.823)]"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                        <option value="NOT">NOT</option>
                      </select>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={addKeyword}
                        className="flex-grow p-2 bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] font-medium rounded-md border border-[#444] hover:bg-[rgba(9,203,177,0.3)] transition-colors flex items-center justify-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Filter
                      </button>
                      
                      <button
                        onClick={() => setShowTemplatesModal(true)}
                        className="px-2 bg-[#242424] text-[rgba(9,203,177,0.823)] rounded-md border border-[#444] hover:bg-[#333] transition-colors flex items-center justify-center"
                        title="Load filter templates"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => setShowSaveTemplateModal(true)}
                        className="px-2 bg-[#242424] text-[rgba(9,203,177,0.823)] rounded-md border border-[#444] hover:bg-[#333] transition-colors flex items-center justify-center"
                        title="Save current filters as template"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Filter Groups Display */}
                  {filterGroups.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#333]">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium text-white">Active Filters</h3>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={resetFilters}
                            className="text-xs text-[rgba(9,203,177,0.823)] hover:underline flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Clear All
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                        {filterGroups.map((group, groupIndex) => (
                          <div key={groupIndex} className="bg-[#242424] rounded-md p-2">
                            <div className="mb-1 pb-1 border-b border-[#333] flex justify-between items-center">
                              <span className="text-xs px-2 py-0.5 bg-[#333] text-[rgba(9,203,177,0.823)] rounded-full">
                                {group.logic}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {group.keywords.map((keyword, keywordIndex) => (
                                <div 
                                  key={keywordIndex} 
                                  className="flex items-center bg-[#333] text-[#e0e0e0] px-2 py-0.5 rounded-md text-xs"
                                >
                                  <span>{keyword}</span>
                                  <button 
                                    onClick={() => removeKeyword(groupIndex, keywordIndex)}
                                    className="ml-1.5 text-[#999] hover:text-[rgba(9,203,177,0.823)] transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-3 flex items-center gap-2 justify-between text-xs text-[#999]">
                        <div className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Filter groups combined with AND logic</span>
                        </div>
                        <span className="font-medium text-[rgba(9,203,177,0.823)]">
                          {filteredLogs.length}/{logs.length}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* File Upload */}
              <div className="bg-[#1e1e1e] p-3 rounded-lg border border-[#333] shadow-lg">
                <h2 className="text-sm font-medium text-white mb-2 flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[rgba(9,203,177,0.823)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload Log File
                </h2>
                <div className="flex items-center gap-2">
                  <input
                    id="file-upload"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".log,.txt,.ndjson,.jsonl,.csv,.tsv,.pdf"
                  />
                  <label 
                    htmlFor="file-upload" 
                    className="flex-1 flex items-center px-3 py-1.5 border border-[#333] hover:border-[rgba(9,203,177,0.4)] rounded-md cursor-pointer bg-[#242424] transition-all text-xs text-[#999]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Select .log, .txt, .pdf, .csv, .tsv or .ndjson
                  </label>
                  {logs.length > 0 && (
                    <div className="text-xs text-[rgba(9,203,177,0.823)] whitespace-nowrap">
                      {logs.length} entries
                    </div>
                  )}
                </div>
              </div>
              
              {/* Paste Logs */}
              <div className="bg-[#1e1e1e] p-3 rounded-lg border border-[#333] shadow-lg">
                <h2 className="text-sm font-medium text-white mb-2 flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[rgba(9,203,177,0.823)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Paste Log Content
                </h2>
                <div className="space-y-2">
                  <textarea
                    placeholder="Paste your log content here..."
                    className="w-full h-24 p-2 bg-[#242424] text-[#e0e0e0] rounded-md border border-[#333] text-xs focus:outline-none focus:ring-1 focus:ring-[rgba(9,203,177,0.823)] focus:border-[rgba(9,203,177,0.823)]"
                    onChange={(e) => {
                      const content = e.target.value;
                      if (content.trim()) {
                        // Detect if content is NDJSON
                        const isNdJson = content.trim().startsWith('{') && content.includes('}\n{');
                        
                        let logLines = [];
                        
                        if (isNdJson) {
                          // Process NDJSON format
                          logLines = content.split('\n')
                            .filter(line => line.trim() !== '')
                            .map(line => {
                              try {
                                // Try to parse each line as JSON
                                const jsonObj = JSON.parse(line);
                                
                                // Extract message or format JSON as string
                                if (jsonObj.message) {
                                  return sanitizeLogLine(jsonObj.message);
                                } else if (jsonObj.log || jsonObj.msg) {
                                  return sanitizeLogLine(jsonObj.log || jsonObj.msg);
                                } else {
                                  // Format the entire JSON object as a readable log line
                                  return sanitizeLogLine(JSON.stringify(jsonObj, null, 0));
                                }
                              } catch (err) {
                                // If JSON parsing fails, treat as regular text
                                return sanitizeLogLine(line);
                              }
                            });
                        } else {
                          // Process regular log format
                          logLines = content.split('\n')
                            .filter(line => line.trim() !== '')
                            .map(sanitizeLogLine);
                        }
                        
                        setLogs(logLines);
                        setFilteredLogs(logLines);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const textarea = document.querySelector('textarea');
                      if (textarea) textarea.value = '';
                      setLogs([]);
                      setFilteredLogs([]);
                      setFilterGroups([]);
                    }}
                    className="w-full text-xs px-2 py-1.5 bg-[#242424] text-[#999] rounded-md hover:bg-[#333] hover:text-[rgba(9,203,177,0.823)] transition-colors flex items-center justify-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear Textarea
                  </button>
                </div>
              </div>

              {/* Legend with custom highlights */}
              {logs.length > 0 && (
                <div className="bg-[#1e1e1e] p-4 rounded-lg border border-[#333] shadow-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-sm font-medium text-white flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[rgba(9,203,177,0.823)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Highlighting Legend
                    </h2>
                    <button 
                      onClick={() => setIsEditingHighlights(!isEditingHighlights)}
                      className="text-xs text-[rgba(9,203,177,0.823)] hover:underline"
                    >
                      {isEditingHighlights ? "Done" : "Edit"}
                    </button>
                  </div>
                  
                  <div className="text-xs text-[#999] mb-3 italic flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[rgba(9,203,177,0.823)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Add keywords below to highlight them in the logs with custom colors
                  </div>

                  {/* Highlights list */}
                  <div className="space-y-2 mt-2">
                    {customHighlights.map((highlight, index) => (
                      <div key={index} className="flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: getColorHex(highlight.color) }}></div>
                          <span className={`text-xs ${highlight.color}`}>
                            {highlight.keyword}
                          </span>
                        </div>
                        {isEditingHighlights && (
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => startEditingHighlight(highlight, index)}
                              className="text-xs text-[#999] hover:text-[rgba(9,203,177,0.823)] opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => removeCustomHighlight(index)}
                              className="text-xs text-[#999] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add/Edit highlight form */}
                  {isEditingHighlights && (
                    <div>
                      {editingHighlight ? (
                        <div className="mt-3 pt-3 border-t border-[#333] space-y-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-[#999]">Keyword</label>
                            <input
                              type="text"
                              value={editingHighlight.keyword || ''}
                              onChange={(e) => handleHighlightChange('keyword', e.target.value)}
                              placeholder="Keyword to highlight"
                              className="text-xs p-1.5 bg-[#242424] text-[#e0e0e0] rounded-md border border-[#333] focus:outline-none focus:ring-1 focus:ring-[rgba(9,203,177,0.823)]"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-[#999]">Color</label>
                            <select
                              value={editingHighlight.color || 'text-blue-400'}
                              onChange={(e) => handleHighlightChange('color', e.target.value)}
                              className="text-xs p-1.5 bg-[#242424] text-[#e0e0e0] rounded-md border border-[#333] focus:outline-none focus:ring-1 focus:ring-[rgba(9,203,177,0.823)]"
                            >
                              <option value="text-red-500">Red</option>
                              <option value="text-orange-400">Orange</option>
                              <option value="text-yellow-400">Yellow</option>
                              <option value="text-green-400">Green</option>
                              <option value="text-blue-400">Blue</option>
                              <option value="text-indigo-400">Indigo</option>
                              <option value="text-purple-400">Purple</option>
                              <option value="text-pink-400">Pink</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button 
                              onClick={addCustomHighlight}
                              className="text-xs px-3 py-1 bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] rounded-md hover:bg-[rgba(9,203,177,0.3)]"
                            >
                              {editingHighlight.id !== undefined ? 'Update' : 'Add'}
                            </button>
                            <button 
                              onClick={cancelEditingHighlight}
                              className="text-xs px-3 py-1 bg-[#333] text-[#999] rounded-md hover:bg-[#444]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setEditingHighlight({ keyword: '', color: 'text-blue-400' })}
                          className="mt-3 w-full flex items-center justify-center gap-1 text-xs px-2 py-1.5 bg-[#242424] text-[#999] rounded-md hover:bg-[#333] hover:text-[rgba(9,203,177,0.823)] transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add New Highlight
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Log Analyzer Info */}
              <div className="bg-[#1e1e1e] p-4 rounded-lg border border-[#333] shadow-lg">
                <h2 className="text-sm font-medium text-white flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[rgba(9,203,177,0.823)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  About
                </h2>
                <p className="text-[#bbb] text-xs mt-2 leading-relaxed">
                  Process logs from files or paste directly for instant analysis with powerful filtering and highlighting features.
                </p>
              </div>
            </div>

            {/* Resizer Handle */}
            {!sidebarCollapsed && (
              <div
                className="w-2 cursor-col-resize bg-transparent hover:bg-[rgba(9,203,177,0.5)] absolute transition-colors"
                style={{ 
                  left: `calc(${sidebarWidth}% - 2px)`, 
                  top: 0, 
                  bottom: 0,
                  zIndex: 10,
                  opacity: 0
                }}
                onMouseDown={startResizing}
                onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                onMouseOut={(e) => e.currentTarget.style.opacity = 0}
              />
            )}

            {/* Collapse/Expand Button */}
            <button 
              className="absolute top-[200px] z-20 bg-[#1e1e1e] rounded-full p-1 shadow-lg border border-[rgba(9,203,177,0.4)] hover:bg-[#242424] transition-colors"
              style={{ 
                left: sidebarCollapsed ? '0.5rem' : `calc(${sidebarWidth}% - 0.75rem)`
              }}
              onClick={toggleSidebar}
              onMouseEnter={resetAutoHideTimer}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 text-[rgba(9,203,177,0.823)] transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Right Panel - Log Display */}
            <div 
              className="transition-all duration-300"
              style={{ 
                width: sidebarCollapsed ? '100%' : `${100 - sidebarWidth}%`,
                marginLeft: sidebarCollapsed ? '0' : '1rem'
              }}
            >
              {logs.length === 0 ? (
                <div className="bg-[#1e1e1e] p-6 rounded-lg shadow-lg border border-[#333] text-center">
                  <h2 className="text-xl font-semibold mb-3 text-white">Welcome to the Log Analyzer</h2>
                  <p className="mb-4 text-[#bbb]">Upload a log file to start analyzing. The analyzer supports .log, .txt, .pdf, .csv, .tsv, and .ndjson files.</p>
                  <p className="text-sm text-[rgba(9,203,177,0.823)]">
                    <span className="font-semibold">Latest:</span> PDF support added! Extract and analyze text from PDF documents.
                  </p>
                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] font-medium rounded-md border border-[#444] hover:bg-[rgba(9,203,177,0.3)] transition-colors flex items-center gap-2 w-full sm:w-auto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload Log File
                    </button>
                    <button 
                      onClick={() => {
                        // Sanitize logs before setting them
                        const sanitizedLogs = CORRECT_LOGS.map(sanitizeLogLine);
                        setLogs(sanitizedLogs);
                        setFilteredLogs(sanitizedLogs);
                        setFileName('sample-logs.txt');
                      }}
                      className="px-4 py-2 bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] font-medium rounded-md border border-[#444] hover:bg-[rgba(9,203,177,0.3)] transition-colors flex items-center gap-2 w-full sm:w-auto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Load Sample Logs
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#1e1e1e] rounded-lg overflow-hidden shadow-lg border border-[#333] h-auto max-h-[calc(100vh-80px)]">
                  <div className="flex items-center justify-between py-2 px-4 bg-[#242424] border-b border-[#333]">
                    <h2 className="font-medium text-white flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[rgba(9,203,177,0.823)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Log Entries
                    </h2>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          placeholder="Search in logs..."
                          className="py-1 px-2 bg-[#333] text-white text-xs rounded-md border border-[#444] w-40 focus:outline-none focus:ring-1 focus:ring-[rgba(9,203,177,0.823)] focus:border-[rgba(9,203,177,0.823)] pl-7"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 absolute left-2 top-1/2 transform -translate-y-1/2 text-[#999]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchText && (
                          <button 
                            onClick={() => setSearchText('')}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#999] hover:text-white"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      <button
                        onClick={() => setWrapText(!wrapText)}
                        className="flex items-center text-xs text-[#999] hover:text-[rgba(9,203,177,0.823)] transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                        {wrapText ? "Unwrap" : "Wrap"}
                      </button>
                      
                      <div className="flex items-center border-l border-[#333] pl-3">
                        <button
                          onClick={() => setHighlightNumbers(!highlightNumbers)}
                          className={`flex items-center text-xs ${highlightNumbers ? 'text-[rgba(9,203,177,0.823)]' : 'text-[#999]'} hover:text-[rgba(9,203,177,0.823)] transition-colors`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                          {highlightNumbers ? "Numbers On" : "Numbers Off"}
                        </button>
                      </div>
                      
                      <button
                        onClick={() => {
                          setLogs([]);
                          setFilteredLogs([]);
                          setFilterGroups([]);
                        }}
                        className="flex items-center text-xs text-[#999] hover:text-red-400 transition-colors border-l border-[#333] pl-3"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Clear
                      </button>
                      
                      <button
                        onClick={() => {
                          const logText = filteredLogs.join('\n');
                          
                          // Check if clipboard API is available
                          if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                            navigator.clipboard.writeText(logText)
                              .then(() => {
                                // Visual feedback with glowing animation
                                const button = document.getElementById('copy-button');
                                if (button) {
                                  button.classList.add('text-green-400', 'copy-success');
                                  setTimeout(() => {
                                    button.classList.remove('text-green-400', 'copy-success');
                                  }, 1500);
                                }
                              })
                              .catch(err => {
                                console.error('Failed to copy logs: ', err);
                                fallbackCopy(logText);
                              });
                          } else {
                            // Fallback method for browsers that don't support clipboard API
                            fallbackCopy(logText);
                          }
                        }}
                        id="copy-button"
                        className="flex items-center text-xs text-[#999] hover:text-[rgba(9,203,177,0.823)] transition-colors border-l border-[#333] pl-3"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copy
                      </button>
                      
                      {/* Export Dropdown */}
                      <div className="relative export-dropdown">
                        <button
                          id="export-button"
                          onClick={() => setShowExportOptions(!showExportOptions)}
                          className="flex items-center text-xs text-[#999] hover:text-[rgba(9,203,177,0.823)] transition-colors border-l border-[#333] pl-3"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Export
                        </button>
                        
                        {showExportOptions && (
                          <div className="absolute right-0 mt-1 bg-[#242424] border border-[#333] rounded-md shadow-lg z-10 py-1 min-w-[120px]">
                            <button
                              onClick={() => exportLogs('txt')}
                              className="w-full text-left px-3 py-1.5 text-xs text-[#bbb] hover:bg-[#333] transition-colors flex items-center"
                            >
                              <span className="w-5">.txt</span>
                              <span>Plain Text</span>
                            </button>
                            <button
                              onClick={() => exportLogs('csv')}
                              className="w-full text-left px-3 py-1.5 text-xs text-[#bbb] hover:bg-[#333] transition-colors flex items-center"
                            >
                              <span className="w-5">.csv</span>
                              <span>CSV</span>
                            </button>
                            <button
                              onClick={() => exportLogs('json')}
                              className="w-full text-left px-3 py-1.5 text-xs text-[#bbb] hover:bg-[#333] transition-colors flex items-center"
                            >
                              <span className="w-5">.json</span>
                              <span>JSON</span>
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <span className="text-xs bg-[#333] px-2 py-0.5 rounded-full text-[rgba(9,203,177,0.823)]">
                        {searchText ? `${searchResults.length}/${filteredLogs.length}` : `${filteredLogs.length}/${logs.length}`} entries
                      </span>
                    </div>
                  </div>
                  {(searchText ? searchResults : filteredLogs).length > 0 ? (
                    <div 
                      className={`overflow-y-auto max-h-[calc(100vh-125px)] font-mono text-sm bg-[#181818] ${!wrapText ? 'overflow-x-auto' : 'overflow-x-hidden'}`}
                      onMouseUp={handleTextSelection}
                    >
                      {(searchText ? searchResults : filteredLogs).map((log, index) => {
                        // First clean log of any problematic characters and ensure ERROR tags
                        const cleanedLog = log.replace(/<e>/g, "<ERROR>");
                        
                        return (
                          <div 
                            key={index} 
                            className="flex leading-tight px-4 py-0.5 border-b border-[#222] hover:bg-[#202020]"
                          >
                            <div className="text-[#666] w-10 flex-shrink-0 select-none">
                              {index + 1}
                            </div>
                            <div 
                              className={`log-content ${wrapText ? 'break-words' : 'whitespace-nowrap'} flex-grow text-white`}
                              dangerouslySetInnerHTML={highlightLog(cleanedLog)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[calc(100%-40px)] text-[#666]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-lg font-medium">No matching logs found</h3>
                      <p className="text-sm mt-1">{searchText ? "Try different search terms" : "Try adjusting your filter criteria"}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LogAnalyzer; 

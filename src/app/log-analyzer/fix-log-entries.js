/**
 * This utility function handles log rendering with proper HTML escaping and highlighting
 * 
 * @param {string} log - The original log string
 * @param {boolean} highlightNumbers - Whether to highlight all numbers (optional)
 * @param {Array} customHighlights - Array of custom highlights {keyword, color} (optional)
 * @returns {string} The highlighted and sanitized log HTML
 */
export function fixLogEntry(log, highlightNumbers = false, customHighlights = []) {
  if (!log) return '';
  
  // First handle <e> replacement before any other processing
  let processedLog = String(log).replace(/<e>/g, "<ERROR>");
  
  // Escape HTML characters in the log to prevent rendering issues
  const escapedLog = processedLog
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  // Define a safe way to create colored spans
  const colorSpan = (text, color) => 
    `<span style="color: ${color}; display: inline !important; font-family: inherit !important;">${text}</span>`;

  // Process the log with proper markup
  let result = escapedLog;
  
  // Apply default white text color to the entire log first
  result = `<span style="color: #ffffff; display: inline !important; font-family: inherit !important;">${result}</span>`;
  
  // Log level tags with different colors
  result = result.replace(/&lt;(ERROR|WARNING|INFO)&gt;/g, (match, level) => {
    let color = "#60a5fa"; // Default blue for INFO
    if (level === "ERROR") color = "#ef4444"; // Red
    if (level === "WARNING") color = "#fb923c"; // Orange
    
    return colorSpan(`&lt;${level}&gt;`, color);
  });
  
  // Apply custom highlights if provided
  if (customHighlights && customHighlights.length > 0) {
    // Sort highlights by length (longest first) to avoid highlighting within highlights
    const sortedHighlights = [...customHighlights].sort((a, b) => 
      (b.keyword?.length || 0) - (a.keyword?.length || 0)
    );
    
    sortedHighlights.forEach(highlight => {
      if (highlight.keyword && highlight.keyword.trim()) {
        // Escape regex special characters in the keyword
        const escapedKeyword = highlight.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Create regex that doesn't match inside existing spans
        const regex = new RegExp(`(${escapedKeyword})(?![^<]*>)`, 'gi');
        
        result = result.replace(regex, (match) => {
          const colorHex = getColorFromClass(highlight.color);
          return colorSpan(match, colorHex);
        });
      }
    });
  }
  
  // Only highlight all numbers if explicitly enabled by the user
  if (highlightNumbers) {
    result = result.replace(
      /\b(\d+)\b(?![^<]*>)/g, 
      (match) => colorSpan(match, "#4ade80") // Green
    );
  }
  
  // Wrap the entire result in a clean container to isolate styles
  return `<span class="log-entry">${result}</span>`;
}

// Helper function to convert Tailwind color classes to hex values
function getColorFromClass(colorClass) {
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
}

/**
 * Correct version of logs with ERROR tags
 */
export const CORRECT_LOGS = [
  "2025-03-14 17:37:56,178 <INFO> server_comm.py:heartbeats:214 - HTTP response 200 {",
  "2025-03-14 17:37:58,234 <ERROR> auth_service.py:validate_token:112 - Authentication failed with code 401",
  "2025-03-14 17:38:01,543 <WARNING> data_processor.py:process_batch:87 - Processing taking longer than expected (2500ms)",
  "2025-03-14 17:38:05,876 <INFO> user_manager.py:create_user:156 - Created new user with ID: 45982",
  "2025-03-14 17:38:10,129 <ERROR> database.py:execute_query:78 - Query execution failed: timeout after 30000ms",
  "2025-03-14 17:38:15,432 <INFO> analytics.py:track_event:205 - Tracking page_view event for user 45982",
  "2025-03-14 17:38:20,765 <WARNING> cache_manager.py:invalidate:134 - Cache miss rate exceeded 25%, consider increasing cache size",
  "2025-03-14 17:38:25,098 <INFO> server_proxy.py:__http_request:524 - Forwarding request to internal API endpoint",
  "2025-03-14 17:38:30,321 <ERROR> file_handler.py:write_chunk:302 - Failed to write chunk: insufficient disk space",
  "2025-03-14 17:38:35,654 <INFO> session_manager.py:cleanup:450 - Removed 128 expired sessions from database"
]; 
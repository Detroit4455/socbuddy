import { fixLogEntry } from '../fix-log-entries';

describe('Log Entry Formatting', () => {
  test('does not highlight all numbers by default', () => {
    const log = "Request took 500ms, processing 2000 items with ID 12345";
    const result = fixLogEntry(log);
    
    // No numbers should be highlighted by default
    expect(result).not.toContain('style="color: #4ade80;">500</span>');
    expect(result).not.toContain('style="color: #4ade80;">2000</span>');
    expect(result).not.toContain('style="color: #4ade80;">12345</span>');
  });
  
  test('highlights all numbers when enabled', () => {
    const log = "Request took 500ms, processing 2000 items with ID 12345";
    const result = fixLogEntry(log, true);
    
    // With number highlighting enabled, all numbers should be highlighted
    expect(result).toContain('style="color: #4ade80;">500</span>');
    expect(result).toContain('style="color: #4ade80;">2000</span>');
    expect(result).toContain('style="color: #4ade80;">12345</span>');
  });
  
  test('highlights log levels correctly', () => {
    const log = "2025-03-14 17:37:58,234 <ERROR> auth_service.py:validate_token:112";
    const result = fixLogEntry(log);
    
    // Log levels should be highlighted with appropriate colors
    expect(result).toContain('style="color: #ef4444;');
    expect(result).toContain('&lt;ERROR&gt;');
  });
  
  test('only highlights log levels when number highlighting is off', () => {
    const log = "2025-03-14 17:37:56,178 <INFO> server_comm.py:heartbeats:214 - HTTP response 200";
    const result = fixLogEntry(log, false);
    
    // Only log levels should be highlighted
    expect(result).toContain('style="color: #60a5fa;">&lt;INFO&gt;</span>');
    expect(result).not.toContain('style="color: #c084fc;"'); // No timestamp highlighting
    expect(result).not.toContain('style="color: #facc15;">'); // No file path highlighting
    
    // Numbers should not be highlighted when the option is off
    expect(result).not.toContain('style="color: #4ade80;">200</span>');
    expect(result).not.toContain('style="color: #4ade80;">214</span>');
  });
  
  test('properly wraps output in log-entry span', () => {
    const log = "2025-03-14 17:37:56,178 <INFO> server_comm.py:heartbeats:214";
    const result = fixLogEntry(log);
    
    // Output should be wrapped in a log-entry span
    expect(result).toMatch(/^<span class="log-entry">.*<\/span>$/);
  });
  
  test('correctly replaces <e> tag with <ERROR> tag', () => {
    const log = "2025-03-14 17:37:58,234 <e> auth_service.py:validate_token:112";
    const result = fixLogEntry(log);
    
    // <e> should be replaced with <ERROR>
    expect(result).toContain('&lt;ERROR&gt;');
    expect(result).not.toContain('&lt;e&gt;');
  });
}); 
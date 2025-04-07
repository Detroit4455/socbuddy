import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LogAnalyzer from '../page';
import { fixLogEntry } from '../fix-log-entries';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('LogAnalyzer Component', () => {
  test('renders empty state correctly', () => {
    render(<LogAnalyzer />);
    expect(screen.getByText('No Log File Loaded')).toBeInTheDocument();
    expect(screen.getByText('Load Sample Logs')).toBeInTheDocument();
    expect(screen.getByText('Browse for Log File')).toBeInTheDocument();
  });

  test('loads sample logs correctly', () => {
    render(<LogAnalyzer />);
    const loadButton = screen.getByText('Load Sample Logs');
    fireEvent.click(loadButton);
    
    // Sample logs should now be displayed
    expect(screen.queryByText('No Log File Loaded')).not.toBeInTheDocument();
    expect(screen.getByText('Log Entries')).toBeInTheDocument();
  });
});

describe('fixLogEntry Function', () => {
  test('replaces <e> with <ERROR>', () => {
    const input = "2025-03-14 17:37:58,234 <e> auth_service.py:validate_token:112";
    const result = fixLogEntry(input);
    
    // Should properly handle the <e> tag by converting it to <ERROR>
    expect(result).toContain("ERROR");
    expect(result).not.toContain("<e>"); // The original <e> should be replaced
  });
  
  test('escapes HTML in logs correctly', () => {
    const logWithTags = "<script>alert('test')</script> 2025-03-14 17:37:58,234 <ERROR>";
    const result = fixLogEntry(logWithTags);
    
    // HTML should be escaped
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
    
    // But the <ERROR> tag should be highlighted
    expect(result).toContain("font-semibold");
    expect(result).toContain("text-red-500");
  });
  
  test('highlights different log levels with appropriate colors', () => {
    const input1 = "2025-03-14 17:37:58,234 <ERROR> auth_service.py";
    const input2 = "2025-03-14 17:37:58,234 <INFO> auth_service.py";
    const input3 = "2025-03-14 17:37:58,234 <WARNING> auth_service.py";
    
    const result1 = fixLogEntry(input1);
    const result2 = fixLogEntry(input2);
    const result3 = fixLogEntry(input3);
    
    // ERROR should be red
    expect(result1).toContain("text-red-500");
    
    // INFO should be blue
    expect(result2).toContain("text-blue-400");
    
    // WARNING should be orange
    expect(result3).toContain("text-orange-400");
  });
  
  test('highlights timestamps', () => {
    const input = "2025-03-14 17:37:58,234 <INFO> server_log.py";
    const result = fixLogEntry(input);
    
    // Should highlight the timestamp with text-purple-400 class
    expect(result).toContain("text-purple-400");
    expect(result).toContain("2025-03-14 17:37:58,234");
  });
  
  test('highlights HTTP status codes', () => {
    const input = "HTTP response 200 OK";
    const result = fixLogEntry(input);
    
    // Should highlight HTTP status code
    expect(result).toContain("style='color: #");
    expect(result).toContain("200");
  });
}); 
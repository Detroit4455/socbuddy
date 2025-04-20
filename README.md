# date 20 APril
# Tools Hub - Web Utilities Collection

This is a comprehensive web tools application built with Next.js that provides multiple utility functions for common web tasks. The application features a modern, responsive UI and secure backend functionality.

## Features

### Home Dashboard
- Central hub with easy navigation to all available tools
- Clean, modern UI with card-based navigation
- Responsive design that works on mobile and desktop

### Base64 Encoder/Decoder
- Instantly encode text to Base64 format
- Decode Base64 strings back to plain text
- Simple, intuitive interface with error handling

### URL Redirect Grabber
- Track redirects chains for any URL
- Display detailed information about each redirect
- Shows status codes, locations, and full redirect path 

### Indicator Extractor
- Extract various indicators from text, including:
  - IP addresses (IPv4 and IPv6)
  - URLs and domains
  - Email addresses
  - Phone numbers
- Supports input from multiple sources:
  - Direct text input
  - File uploads (including text and image files)
  - URL content fetching
- OCR capabilities for extracting text from images using Tesseract.js

### Cybersecurity Resources Directory
- Comprehensive collection of cybersecurity websites and tools
- Filter resources by type (News, Security Tool, Vulnerability Database, etc.)
- Search functionality to find specific resources
- Sort by name or type
- Card design displaying website details with favicons
- Interactive grid layout optimized for desktop and mobile

### Log Analyzer
- Advanced log analysis with support for multiple file formats:
  - Text files (.log, .txt)
  - CSV and TSV files with smart column detection
  - JSON and NDJSON logs with automatic parsing
- Powerful filtering capabilities:
  - Multi-group filters with AND/OR/NOT logic
  - Advanced filters with operations (contains, starts with, ends with, regex)
  - Saved filter templates with import/export functionality
  - Smart text selection to create filters from log content
- Rich visualization features:
  - Syntax highlighting for log levels, timestamps, and other patterns
  - Customizable highlighting with user-defined keywords and colors
  - Optional number highlighting
  - Text size and wrapping controls
- Export capabilities:
  - Copy logs to clipboard
  - Export filtered logs in multiple formats (TXT, CSV, JSON)
  - Export with metadata and timestamps
- User-friendly interface:
  - Resizable and collapsible sidebar
  - Auto-hiding controls for maximum log viewing space
  - Line numbers and log statistics
  - Smart log processing with sanitization and formatting

### Administrator Dashboard (Protected)
- Password-protected admin interface (password: 1234)
- Analytics tracking:
  - Page view counts for each tool
  - Percentage breakdown of site usage
  - Persistent analytics data (survives server restarts)
  - Analytics reset functionality
- User input logging:
  - Logs all user activities with timestamps
  - Captures user IP addresses for audit purposes
  - Records operation status (Success/Failure)
  - Includes error details for failed operations
  - Color-coded success/error indicators for quick visual scanning
  - Advanced log management features:
    - Pagination with customizable page size
    - Full-text search functionality
    - Log entry filtering
  - Organized log display with refresh capability

## Technical Features

### Persistence
- Analytics data persists across server restarts using file-based storage
- User input logs are stored in a dedicated log file

### Security
- Admin access is password protected
- Input validation and error handling throughout
- Rate limiting on API endpoints
- Sanitized user inputs

### Logging System
- All user inputs are logged with the following information:
  - Timestamp of the action
  - User's IP address
  - Source/page where the action was performed
  - Status of the operation (Success/Failure)
  - The actual input content
  - Error details if operation failed
- Log format: `[timestamp] [IP] [source] Status: [Success/Failure] [input]`
- If operation failed: `Error: [input] > [error message]`
- Log entries are separated by a delimiter for easy parsing
- Logs are displayed newest first for easier review
- Logs are viewable from the admin dashboard

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```
4. Build for production:
   ```
   npm run build
   ```
5. Start the production server:
   ```
   npm start
   ```

## Environment Setup

No environment variables are required for basic functionality. The application will work out of the box.

## Technology Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API Routes
- **OCR Processing**: Tesseract.js
- **Data Persistence**: File-based storage with localStorage for user preferences and templates
- **Logging**: Custom logging system with filesystem storage
- **Log Processing**: Custom log parsing and highlighting system
- **File Formats**: Support for TXT, CSV, TSV, JSON and NDJSON

## Project Structure

- `/app`: Main application components
  - `/base64`: Base64 encoder/decoder tool
  - `/grabRedirectUrl`: URL redirect tracking tool
  - `/indicator-extractor`: IOC extraction tool
  - `/cybersecurity-resources`: Cybersecurity websites directory
  - `/log-analyzer`: Advanced log analysis tool
    - `/page.js`: Main Log Analyzer component
    - `/fix-log-entries.js`: Log processing and highlighting utilities
    - `/sample-logs.js`: Sample logs for testing
    - `/__tests__`: Unit and component tests
  - `/administrator`: Administrator dashboard
  - `/api`: API endpoints
    - `/grab-url`: Handles URL redirect tracking
    - `/fetch-url`: Fetches content from external URLs
    - `/log-input`: Logs user inputs
    - `/page-analytics`: Tracks and provides page view statistics
    - `/user-logs`: Provides access to stored user logs
    - `/process-image`: Handles image processing (placeholder)
  - `/components`: Reusable components
    - `/PageTracker`: Tracks page views across the site
  - `/utils`: Utility functions
    - `/logger.js`: Functions for logging user activity
- `/middleware.js`: Middleware for IP tracking and request processing
- `/public/data`: Data files
  - `/website.json`: Collection of cybersecurity websites and resources

## License

This project is proprietary and confidential.

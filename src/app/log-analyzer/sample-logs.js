// Sample logs for the Log Analyzer component
export const sampleLogs = [
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
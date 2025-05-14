export function rateLimit({ interval, limit, uniqueTokenPerInterval }) {
  const tokenCache = new Map();
  
  return {
    check: (limit, token) => {
      const now = Date.now();
      const tokenKey = token || 'global';
      
      // Get data from cache or initialize new data
      let tokenData = tokenCache.get(tokenKey) || {
        count: 0,
        resetTime: now + interval,
        tokens: []
      };

      // Reset if the interval has passed
      if (now >= tokenData.resetTime) {
        tokenData = {
          count: 0,
          resetTime: now + interval,
          tokens: []
        };
      }

      // Check if rate limit is exceeded
      if (tokenData.count >= limit) {
        const retryAfterSeconds = Math.ceil((tokenData.resetTime - now) / 1000);
        
        const error = new Error('Rate limit exceeded');
        error.retryAfter = retryAfterSeconds;
        error.status = 429;
        
        throw error;
      }

      // Update counter and store in cache
      tokenData.count += 1;
      tokenData.tokens.push(now);
      
      // Cleanup old data from cache (keep max uniqueTokenPerInterval)
      if (tokenCache.size >= uniqueTokenPerInterval) {
        // Find and delete the oldest entry
        let oldestKey = null;
        let oldestTime = Infinity;
        
        for (const [key, data] of tokenCache.entries()) {
          if (data.resetTime < oldestTime) {
            oldestKey = key;
            oldestTime = data.resetTime;
          }
        }
        
        if (oldestKey) tokenCache.delete(oldestKey);
      }
      
      tokenCache.set(tokenKey, tokenData);
      
      return {
        success: true,
        limit,
        remaining: limit - tokenData.count,
        reset: tokenData.resetTime
      };
    }
  };
} 
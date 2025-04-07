'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Don't track admin page visits
    if (pathname.startsWith('/admin')) {
      return;
    }
    
    // Track page view
    const trackPageView = async () => {
      try {
        await fetch('/api/page-analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page: pathname,
            action: 'track',
          }),
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };

    trackPageView();
  }, [pathname]);

  // This component doesn't render anything
  return null;
} 
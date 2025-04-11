'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogsRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the new administrator logs page
    router.replace('/administrator/logs');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center h-screen bg-[#121212] text-[#e0e0e0]">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p>Please wait while we redirect you to the new Administrator logs page.</p>
        <p className="mt-4">
          If you are not redirected automatically, please click{' '}
          <a href="/administrator/logs" className="text-[rgba(9,203,177,0.823)] hover:underline">
            here
          </a>.
        </p>
      </div>
    </div>
  );
} 
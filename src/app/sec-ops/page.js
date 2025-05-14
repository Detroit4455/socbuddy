'use client';

import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';

const SecOps = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (status === 'loading') return;
      
      if (!session) {
        router.push('/auth/signin?callbackUrl=/sec-ops');
        return;
      }

      try {
        // Fetch RBAC permissions
        const response = await fetch('/api/admin/rbac');
        const data = await response.json();
        
        if (response.ok) {
          const permissions = data.permissions;
          
          // Check if 'access_secops' permission exists and user's role has access
          // If permission doesn't exist, default to true (accessible to all)
          const userRole = session.user.role || 'User';
          const secOpsPermission = permissions['access_secops'];
          
          if (secOpsPermission === undefined) {
            setHasAccess(true); // Default access if permission not defined
          } else {
            setHasAccess(!!secOpsPermission[userRole]);
          }
        } else {
          // If API fails, default to allowing access
          setHasAccess(true);
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
        setHasAccess(true); // Default to true on error
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [session, status, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] text-[#e0e0e0] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[rgba(9,203,177,0.823)] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4">Checking access permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#121212] text-[#e0e0e0] flex items-center justify-center">
        <div className="bg-[#1e1e1e] rounded-lg p-6 shadow-lg border border-red-500 max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-[#bbb] mb-4">You don't have permission to access the Security Operations Center.</p>
          <Link href="/" className="inline-block px-4 py-2 bg-[rgba(9,203,177,0.3)] hover:bg-[rgba(9,203,177,0.5)] rounded text-[#e0e0e0] transition-all">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-[#e0e0e0] p-4 md:p-8">
      {/* Header section */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[rgba(9,203,177,0.823)]">Security Operations Center</h1>
            <p className="text-[#bbb] mt-2">Centralized monitoring and analysis platform</p>
          </div>
          <div>
            <Link href="/" className="text-[rgba(9,203,177,0.823)] hover:text-[rgba(9,203,177,1)] transition-all">
              Back to Home
            </Link>
          </div>
        </div>

        {/* Main content */}
        <div className="bg-[#1e1e1e] rounded-lg p-6 shadow-lg border border-[rgba(9,203,177,0.3)]">
          <h2 className="text-xl font-semibold mb-4 text-[rgba(9,203,177,0.823)]">Security Operations Dashboard</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-[#252525] p-4 rounded-md border border-[rgba(9,203,177,0.2)]">
              <h3 className="text-lg font-medium mb-2">Security Monitoring</h3>
              <p className="text-[#bbb] text-sm">Real-time security event monitoring and threat detection</p>
              <div className="mt-4 h-40 flex items-center justify-center bg-[#1a1a1a] rounded">
                <p className="text-[#777]">Dashboard visualization coming soon</p>
              </div>
            </div>
            
            <div className="bg-[#252525] p-4 rounded-md border border-[rgba(9,203,177,0.2)]">
              <h3 className="text-lg font-medium mb-2">Incident Response</h3>
              <p className="text-[#bbb] text-sm">Track and manage security incidents through their lifecycle</p>
              <div className="mt-4 h-40 flex items-center justify-center bg-[#1a1a1a] rounded">
                <p className="text-[#777]">Incident tracking panel coming soon</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#252525] p-4 rounded-md border border-[rgba(9,203,177,0.2)] mb-6">
            <h3 className="text-lg font-medium mb-2">Threat Intelligence Feed</h3>
            <p className="text-[#bbb] text-sm mb-4">Latest security advisories and threat intelligence updates</p>
            
            <div className="space-y-3">
              <div className="p-3 bg-[#1a1a1a] rounded border-l-4 border-red-500">
                <p className="font-medium">Critical Vulnerability Alert</p>
                <p className="text-sm text-[#aaa]">Placeholder for upcoming security intelligence feed</p>
              </div>
              <div className="p-3 bg-[#1a1a1a] rounded border-l-4 border-yellow-500">
                <p className="font-medium">New Malware Campaign Detected</p>
                <p className="text-sm text-[#aaa]">Placeholder for upcoming security intelligence feed</p>
              </div>
              <div className="p-3 bg-[#1a1a1a] rounded border-l-4 border-blue-500">
                <p className="font-medium">Security Advisory Update</p>
                <p className="text-sm text-[#aaa]">Placeholder for upcoming security intelligence feed</p>
              </div>
            </div>
          </div>
          
          <div className="text-center p-4 bg-[#1a1a1a] rounded-md">
            <p className="text-[#bbb]">SecOps module is under development</p>
            <p className="text-sm text-[#777] mt-1">More features coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecOps; 
'use client';

import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function SignIn() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session) {
      console.log('User authenticated, redirecting to:', callbackUrl);
      
      // Handle absolute URLs (including protocol)
      if (callbackUrl.includes('://') || callbackUrl.startsWith('//')) {
        window.location.href = callbackUrl;
      } else {
        router.replace(callbackUrl);
      }
    }
  }, [status, session, callbackUrl, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    setError('');
    setLoading(true);

    try {
      const { email, password } = formData;
      
      if (!email || !password) {
        setError('Please enter both email and password');
        setLoading(false);
        return;
      }

      console.log('Attempting sign in, will redirect to:', callbackUrl);
      
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
      // Success case is handled by the useEffect above when session changes
      
    } catch (error) {
      setError('Something went wrong. Please try again.');
      console.error('Sign in error:', error);
      setLoading(false);
    }
  };

  // If already logged in, show a loading spinner
  if (status === 'loading' || (status === 'authenticated' && session)) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[rgba(9,203,177,0.823)] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-2 text-[#bbb]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      <Navbar />
      
      <div className="flex min-h-screen pt-16 items-center justify-center">
        <div className="w-full max-w-md p-8 space-y-6 bg-[#1e1e1e] rounded-xl shadow-lg border border-[#444]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Sign In</h1>
            <p className="mt-2 text-sm text-gray-400">Welcome back! Please sign in to your account.</p>
          </div>
          
          {error && (
            <div className="bg-red-900/40 text-red-200 px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full bg-[#2a2a2a] border border-[#444] rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[rgba(9,203,177,0.5)] focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full bg-[#2a2a2a] border border-[#444] rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[rgba(9,203,177,0.5)] focus:border-transparent"
                placeholder="******"
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[rgba(9,203,177,0.5)] hover:bg-[rgba(9,203,177,0.7)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgba(9,203,177,0.8)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-400">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-[rgba(9,203,177,0.8)] hover:text-[rgba(9,203,177,1)]">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
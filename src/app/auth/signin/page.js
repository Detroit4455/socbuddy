'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { email, password } = formData;
      
      // Validate form
      if (!email || !password) {
        setError('Please enter both email and password');
        setLoading(false);
        return;
      }

      // Sign in with NextAuth
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push(callbackUrl);
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

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
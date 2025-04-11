'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function SignUp() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
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
      const { username, email, password, confirmPassword } = formData;
      
      // Validate form
      if (!username || !email || !password || !confirmPassword) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      if (username.length < 3) {
        setError('Username must be at least 3 characters long');
        setLoading(false);
        return;
      }
      
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        setLoading(false);
        return;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      
      // Send sign up request to API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }
      
      // If sign up is successful, sign in the user automatically
      const signInResult = await signIn('credentials', {
        redirect: false,
        email,
        password
      });
      
      if (signInResult?.error) {
        // If sign in fails, still redirect to sign in page
        router.push('/auth/signin');
      } else {
        // If sign in succeeds, redirect to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      setError(error.message || 'Something went wrong. Please try again.');
      console.error('Sign up error:', error);
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
            <h1 className="text-2xl font-bold text-white">Create an Account</h1>
            <p className="mt-2 text-sm text-gray-400">Sign up to get started with SocBuddy</p>
          </div>
          
          {error && (
            <div className="bg-red-900/40 text-red-200 px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full bg-[#2a2a2a] border border-[#444] rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[rgba(9,203,177,0.5)] focus:border-transparent"
                placeholder="johndoe"
              />
              <p className="mt-1 text-xs text-gray-400">Must be at least 3 characters</p>
            </div>
            
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
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full bg-[#2a2a2a] border border-[#444] rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[rgba(9,203,177,0.5)] focus:border-transparent"
                placeholder="******"
              />
              <p className="mt-1 text-xs text-gray-400">Must be at least 6 characters</p>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
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
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
          </form>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-[rgba(9,203,177,0.8)] hover:text-[rgba(9,203,177,1)]">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
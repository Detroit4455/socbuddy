'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DbTestPage() {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const runTest = async (endpoint) => {
    try {
      setLoading(true);
      setMessage(`Running test: ${endpoint}...`);
      
      const response = await fetch(`/api/${endpoint}`);
      const data = await response.json();
      
      setTestResults(data);
      setMessage(`Test ${data.success ? 'succeeded' : 'failed'}: ${data.message || ''}`);
    } catch (error) {
      console.error('Test error:', error);
      setMessage(`Error: ${error.message}`);
      setTestResults({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#121212] py-10 px-4">
      <div className="max-w-4xl mx-auto bg-[#1e1e1e] rounded-lg shadow-lg p-6 border border-[#444]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-white">MongoDB Connection Tests</h1>
          <Link 
            href="/"
            className="bg-[#1e1e1e] hover:bg-[#2a2a2a] text-[rgba(9,203,177,0.823)] py-2 px-4 rounded border border-[rgba(9,203,177,0.823)]"
          >
            Back to Home
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button 
            onClick={() => runTest('db-test')}
            className="bg-[#1e1e1e] hover:bg-[#2a2a2a] text-[rgba(9,203,177,0.823)] py-2 px-4 rounded border border-[rgba(9,203,177,0.823)] hover:shadow-[0_0_20px_rgba(45,169,164,0.3)] transition-all duration-300"
          >
            Test Basic Connection
          </button>
          
          <button 
            onClick={() => runTest('tasks/test')}
            className="bg-[#1e1e1e] hover:bg-[#2a2a2a] text-[rgba(9,203,177,0.823)] py-2 px-4 rounded border border-[rgba(9,203,177,0.823)] hover:shadow-[0_0_20px_rgba(45,169,164,0.3)] transition-all duration-300"
          >
            Create Test Task
          </button>
          
          <button 
            onClick={() => runTest('db-test/stats')}
            className="bg-[#1e1e1e] hover:bg-[#2a2a2a] text-[rgba(9,203,177,0.823)] py-2 px-4 rounded border border-[rgba(9,203,177,0.823)] hover:shadow-[0_0_20px_rgba(45,169,164,0.3)] transition-all duration-300"
          >
            Test Statistics
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[rgba(9,203,177,0.823)] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
            </div>
            <p className="mt-2 text-[#bbb]">{message}</p>
          </div>
        ) : message && (
          <div className={`text-center py-2 mb-4 rounded ${testResults?.success ? 'bg-[rgba(9,203,177,0.15)] text-[rgba(9,203,177,0.823)]' : 'bg-red-900 text-white'}`}>
            {message}
          </div>
        )}
        
        {testResults && (
          <div className="bg-[#2a2a2a] p-4 rounded border border-[#444] overflow-x-auto">
            <pre className="text-[#e0e0e0] whitespace-pre-wrap">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-6 text-[#bbb]">
          <h2 className="text-xl font-semibold text-white mb-2">MongoDB Test Instructions</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Click <b>Test Basic Connection</b> to verify the MongoDB connection is working properly.</li>
            <li>Click <b>Create Test Task</b> to add a sample task to the database.</li>
            <li>Click <b>Test Statistics</b> to verify the statistics calculations are working with MongoDB.</li>
            <li>After running these tests, you can go to the <Link href="/todo-list-manager" className="text-[rgba(9,203,177,0.823)]">Todo List Manager</Link> to see the tasks.</li>
            <li>You can also check the <Link href="/todo-list-manager/statistics" className="text-[rgba(9,203,177,0.823)]">Statistics Page</Link> to verify it's showing data from the database.</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RBACManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [isDefault, setIsDefault] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  
  // Fetch roles on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      
      fetchRoles();
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/rbac');
    }
  }, [status, session, router]);
  
  // Fetch permissions after roles are loaded
  useEffect(() => {
    if (roles.length > 0) {
      fetchPermissions();
    }
  }, [roles]);
  
  // Function to fetch roles
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/rbac/roles');
      const data = await response.json();
      
      if (response.ok) {
        setRoles(data.roles);
        setIsDefault(data.isDefault);
      } else {
        setError(data.error || 'Failed to fetch roles');
      }
    } catch (err) {
      setError('Error fetching roles: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch permissions
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/rbac');
      const data = await response.json();
      
      if (response.ok) {
        // Initialize AI Buddy permission if it doesn't exist
        const updatedPermissions = { ...data.permissions };
        
        if (!updatedPermissions.access_ai_buddy) {
          updatedPermissions.access_ai_buddy = {};
          
          // By default, give admin access and deny others
          roles.forEach(role => {
            updatedPermissions.access_ai_buddy[role] = role === 'admin';
          });
        }
        
        console.log("Fetched permissions:", updatedPermissions);
        setPermissions(updatedPermissions);
      } else {
        setError(data.error || 'Failed to fetch permissions');
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError('Error fetching permissions: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to save roles
  const saveRoles = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await fetch('/api/admin/rbac/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roles }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Roles saved successfully');
        setIsDefault(false);
      } else {
        setError(data.error || 'Failed to save roles');
      }
    } catch (err) {
      setError('Error saving roles: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to save permissions
  const savePermissions = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await fetch('/api/admin/rbac', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Check if AI Buddy permissions were changed
        if (permissions.access_ai_buddy) {
          setSuccess('Permissions saved successfully! AI Buddy access settings have been updated.');
        } else {
          setSuccess('Permissions saved successfully!');
        }
      } else {
        setError(data.error || 'Failed to save permissions');
      }
    } catch (err) {
      console.error('Error saving permissions:', err);
      setError('Error saving permissions: ' + err.message);
    } finally {
      setLoading(false);
      
      // Scroll to the success message
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };
  
  // Function to add a new role
  const addRole = () => {
    if (!newRole.trim()) {
      setError('Role name cannot be empty');
      return;
    }
    
    // Check if role already exists
    if (roles.includes(newRole.trim().toLowerCase())) {
      setError('Role already exists');
      return;
    }
    
    // Add new role
    setRoles([...roles, newRole.trim().toLowerCase()]);
    setNewRole('');
    setError('');
    setSuccess('Role added. Remember to save changes.');
  };
  
  // Function to delete a role
  const deleteRole = async (role) => {
    // Prevent deleting admin or user roles
    if (role === 'admin' || role === 'user') {
      setError(`The '${role}' role cannot be deleted`);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await fetch('/api/admin/rbac/roles', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setRoles(data.roles);
        setSuccess(`Role '${role}' deleted successfully`);
      } else {
        setError(data.error || `Failed to delete role '${role}'`);
      }
    } catch (err) {
      setError('Error deleting role: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to update permission for a role
  const updatePermission = (permission, role, value) => {
    setPermissions(prev => {
      const updated = { ...prev };
      
      // Initialize permission object if it doesn't exist
      if (!updated[permission]) {
        updated[permission] = {};
      }
      
      // Set the permission value for the role
      updated[permission][role] = value;
      
      return updated;
    });
  };
  
  // Handle key press for adding new role
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addRole();
    }
  };
  
  if (status === 'loading' || (status === 'authenticated' && loading && roles.length === 0)) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-[#121212] text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgba(9,203,177,0.823)]"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#121212] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[rgba(9,203,177,0.823)]">RBAC Management</h1>
          <Link 
            href="/admin"
            className={`px-4 py-2 rounded ${darkMode ? 'bg-[#2a2a2a] hover:bg-[#333]' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
          >
            Back to Admin Dashboard
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-900/20 border-l-4 border-red-500 text-red-300 p-4 mb-6 rounded">
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-900/20 border-l-4 border-green-500 text-green-300 p-4 mb-6 rounded animate-pulse">
            <div className="flex items-center">
              <svg className="h-6 w-6 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="font-medium">{success}</p>
            </div>
          </div>
        )}
        
        <div className={`mb-8 p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow'}`}>
          <h2 className="text-xl font-semibold mb-4">Role Management</h2>
          
          {isDefault && (
            <div className="bg-yellow-900/20 border-l-4 border-yellow-500 text-yellow-300 p-4 mb-6 rounded">
              <p>You are using default roles. Save changes to store your custom roles.</p>
            </div>
          )}
          
          <div className="mb-6">
            <div className="flex mb-2">
              <input
                type="text"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter new role name"
                className={`flex-grow px-4 py-2 rounded-l focus:outline-none ${darkMode ? 'bg-[#2a2a2a] border border-[#444]' : 'bg-gray-100 border border-gray-300'}`}
              />
              <button
                onClick={addRole}
                disabled={loading}
                className="px-4 py-2 bg-[rgba(9,203,177,0.823)] text-white rounded-r hover:bg-[rgba(9,203,177,0.9)] transition-colors disabled:opacity-50"
              >
                Add Role
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Current Roles</h3>
            <div className="space-y-2">
              {roles.map((role) => (
                <div 
                  key={role}
                  className={`flex justify-between items-center p-3 rounded ${darkMode ? 'bg-[#2a2a2a] border border-[#444]' : 'bg-gray-100 border border-gray-200'}`}
                >
                  <span className="capitalize">{role}</span>
                  <div>
                    {role !== 'admin' && role !== 'user' ? (
                      <button
                        onClick={() => deleteRole(role)}
                        disabled={loading}
                        className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                      >
                        Delete
                      </button>
                    ) : (
                      <span className="text-gray-500 text-sm">System Role</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={saveRoles}
              disabled={loading}
              className="px-6 py-2 bg-[rgba(9,203,177,0.823)] text-white rounded hover:bg-[rgba(9,203,177,0.9)] transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
        
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow'}`}>
          <h2 className="text-xl font-semibold mb-4">User Role Management</h2>
          <p className="mb-4">Assign roles to users in the User Management section.</p>
          
          <Link 
            href="/admin/users"
            className="px-6 py-2 bg-[rgba(9,203,177,0.823)] text-white rounded hover:bg-[rgba(9,203,177,0.9)] transition-colors inline-block"
          >
            Go to User Management
          </Link>
        </div>
        
        <div className={`mt-8 p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow'}`}>
          <h2 className="text-xl font-semibold mb-4">Permission Management</h2>
          
          <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gradient-to-r from-[#10332e] to-[#27322b]' : 'bg-gradient-to-r from-green-50 to-teal-50'} border ${darkMode ? 'border-green-800' : 'border-green-200'}`}>
            <h3 className={`text-lg font-bold ${darkMode ? 'text-green-400' : 'text-green-700'} flex items-center`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              AI Buddy Access Control
            </h3>
            <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Use the toggles below to control which user roles can access the AI Buddy feature at <code className={`font-mono ${darkMode ? 'bg-[#1a1a1a] text-green-300' : 'bg-gray-100 text-green-700'} px-2 py-1 rounded`}>/ai-buddy</code>.
              Toggle the switch to enable access for specific roles. Changes take effect immediately after saving.
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className={`w-full ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <thead>
                <tr className={`border-b ${darkMode ? 'border-[#444]' : 'border-gray-200'}`}>
                  <th className="text-left py-3 px-4">Permission</th>
                  {roles.map(role => (
                    <th key={role} className="text-center py-3 px-4 capitalize">{role}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* AI Buddy Access Permission */}
                <tr className={`border-b ${darkMode ? 'border-[#444]' : 'border-gray-200'} hover:${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
                  <td className="py-4 px-4">
                    <div className="font-medium text-lg">AI Buddy Access</div>
                    <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Access to AI Security Buddy feature at <span className="font-mono bg-gray-800 text-green-300 px-1 rounded text-xs">/ai-buddy</span>
                    </div>
                  </td>
                  {roles.map(role => (
                    <td key={role} className="text-center py-4 px-4">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={permissions?.access_ai_buddy?.[role] === true}
                          onChange={e => updatePermission('access_ai_buddy', role, e.target.checked)}
                          disabled={role === 'admin'} // Admin always has access
                        />
                        <div className={`relative w-14 h-7 ${role === 'admin' ? 'opacity-70' : ''} 
                          rounded-full peer ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} 
                          peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                          peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 
                          after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full 
                          after:h-6 after:w-6 after:transition-all
                          peer-checked:${darkMode ? 'bg-green-600' : 'bg-green-500'}`}>
                        </div>
                        <span className={`ms-3 text-sm font-medium ${
                          permissions?.access_ai_buddy?.[role] === true ? 
                            (darkMode ? 'text-green-400' : 'text-green-600') : 
                            (darkMode ? 'text-gray-400' : 'text-gray-500')
                        }`}>
                          {permissions?.access_ai_buddy?.[role] === true ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    </td>
                  ))}
                </tr>
                
                {/* Add other permissions here */}
                {Object.keys(permissions).filter(perm => perm !== 'access_ai_buddy').map(permission => (
                  <tr key={permission} className={`border-b ${darkMode ? 'border-[#444]' : 'border-gray-200'} hover:${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
                    <td className="py-4 px-4">
                      <div className="font-medium text-lg capitalize">{permission.replace(/_/g, ' ')}</div>
                    </td>
                    {roles.map(role => (
                      <td key={role} className="text-center py-4 px-4">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={permissions[permission]?.[role] === true}
                            onChange={e => updatePermission(permission, role, e.target.checked)}
                            disabled={permission === 'manage_users' && role === 'admin'} // Admin always has user management
                          />
                          <div className={`relative w-14 h-7 ${permission === 'manage_users' && role === 'admin' ? 'opacity-70' : ''} 
                            rounded-full peer ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} 
                            peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                            peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 
                            after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full 
                            after:h-6 after:w-6 after:transition-all
                            peer-checked:${darkMode ? 'bg-green-600' : 'bg-green-500'}`}>
                          </div>
                          <span className={`ms-3 text-sm font-medium ${
                            permissions[permission]?.[role] === true ? 
                              (darkMode ? 'text-green-400' : 'text-green-600') : 
                              (darkMode ? 'text-gray-400' : 'text-gray-500')
                          }`}>
                            {permissions[permission]?.[role] === true ? 'Enabled' : 'Disabled'}
                          </span>
                        </label>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={savePermissions}
              disabled={loading}
              className="px-6 py-2 bg-[rgba(9,203,177,0.823)] text-white rounded hover:bg-[rgba(9,203,177,0.9)] transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Permissions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
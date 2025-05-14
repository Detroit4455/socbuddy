'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UserManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Edit role modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserRole, setSelectedUserRole] = useState('');
  
  // Fetch users and roles on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      
      // Fetch roles first, then users
      fetchRoles().then(() => fetchUsers());
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/users');
    }
  }, [status, session, router]);
  
  // Fetch users when pagination, search, or filter changes
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchUsers();
    }
  }, [page, limit, searchTerm, selectedRole, status, session]);
  
  // Function to fetch roles
  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/rbac/roles');
      const data = await response.json();
      
      if (response.ok) {
        setRoles(data.roles);
        return true;
      } else {
        setError(data.error || 'Failed to fetch roles');
        return false;
      }
    } catch (err) {
      setError('Error fetching roles: ' + err.message);
      return false;
    }
  };
  
  // Function to fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Build query string
      let queryParams = new URLSearchParams({
        page,
        limit,
      });
      
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      
      if (selectedRole) {
        queryParams.append('role', selectedRole);
      }
      
      const response = await fetch(`/api/admin/users/list?${queryParams.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Error fetching users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to open the edit role modal
  const openEditRoleModal = (user) => {
    setSelectedUser(user);
    setSelectedUserRole(user.role);
    setShowModal(true);
  };
  
  // Function to close the edit role modal
  const closeEditRoleModal = () => {
    setSelectedUser(null);
    setSelectedUserRole('');
    setShowModal(false);
  };
  
  // Function to update a user's role
  const updateUserRole = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await fetch('/api/admin/users/role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: selectedUserRole,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Update the user in the local state
        setUsers(users.map(user => 
          user.id === selectedUser.id 
            ? { ...user, role: selectedUserRole } 
            : user
        ));
        
        setSuccess(`Role for ${selectedUser.username} updated successfully`);
        closeEditRoleModal();
      } else {
        setError(data.error || 'Failed to update user role');
      }
    } catch (err) {
      setError('Error updating user role: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
    fetchUsers();
  };
  
  // Function to handle role filter change
  const handleRoleFilterChange = (e) => {
    setSelectedRole(e.target.value);
    setPage(1); // Reset to first page on filter change
  };
  
  // Pagination functions
  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };
  
  if (status === 'loading' || (status === 'authenticated' && loading && users.length === 0)) {
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
          <h1 className="text-2xl font-bold text-[rgba(9,203,177,0.823)]">User Management</h1>
          <div className="flex space-x-4">
            <Link 
              href="/admin/rbac"
              className={`px-4 py-2 rounded bg-[rgba(9,203,177,0.15)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)] transition-colors`}
            >
              Manage Roles
            </Link>
            <Link 
              href="/admin"
              className={`px-4 py-2 rounded ${darkMode ? 'bg-[#2a2a2a] hover:bg-[#333]' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
            >
              Back to Admin Dashboard
            </Link>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-900/20 border-l-4 border-red-500 text-red-300 p-4 mb-6 rounded">
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-900/20 border-l-4 border-green-500 text-green-300 p-4 mb-6 rounded">
            <p>{success}</p>
          </div>
        )}
        
        <div className={`p-6 rounded-lg mb-8 ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow'}`}>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 gap-4">
            <div className="flex-grow">
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users by username or email"
                  className={`flex-grow px-4 py-2 rounded-l focus:outline-none ${darkMode ? 'bg-[#2a2a2a] border border-[#444]' : 'bg-gray-100 border border-gray-300'}`}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[rgba(9,203,177,0.823)] text-white rounded-r hover:bg-[rgba(9,203,177,0.9)] transition-colors"
                >
                  Search
                </button>
              </form>
            </div>
            
            <div className="flex items-center">
              <label className="mr-2">Filter by Role:</label>
              <select
                value={selectedRole}
                onChange={handleRoleFilterChange}
                className={`px-4 py-2 rounded focus:outline-none ${darkMode ? 'bg-[#2a2a2a] border border-[#444]' : 'bg-gray-100 border border-gray-300'}`}
              >
                <option value="">All Roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className={`min-w-full ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              <thead>
                <tr className={darkMode ? 'border-b border-[#444]' : 'border-b border-gray-300'}>
                  <th className="py-3 px-4 text-left">Username</th>
                  <th className="py-3 px-4 text-left">Email</th>
                  <th className="py-3 px-4 text-left">Role</th>
                  <th className="py-3 px-4 text-left">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr 
                      key={user.id} 
                      className={darkMode ? 'border-b border-[#333]' : 'border-b border-gray-200'}
                    >
                      <td className="py-3 px-4">{user.username}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4 capitalize">{user.role}</td>
                      <td className="py-3 px-4">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openEditRoleModal(user)}
                          className="text-[rgba(9,203,177,0.823)] hover:text-[rgba(9,203,177,0.9)] transition-colors"
                        >
                          Edit Role
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-4 text-center">
                      {loading ? 'Loading users...' : 'No users found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {users.length > 0 && (
            <div className="flex justify-between items-center mt-6">
              <div>
                Showing {users.length} of {total} users
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className={`px-3 py-1 rounded ${
                    darkMode ? 'bg-[#2a2a2a] hover:bg-[#333]' : 'bg-gray-200 hover:bg-gray-300'
                  } transition-colors disabled:opacity-50`}
                >
                  Previous
                </button>
                <span className={`px-3 py-1 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className={`px-3 py-1 rounded ${
                    darkMode ? 'bg-[#2a2a2a] hover:bg-[#333]' : 'bg-gray-200 hover:bg-gray-300'
                  } transition-colors disabled:opacity-50`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Edit Role Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={closeEditRoleModal}
            ></div>
            
            <div className={`relative z-10 rounded-lg w-full max-w-md p-6 ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow-xl'}`}>
              <h3 className="text-xl font-semibold mb-4">Edit User Role</h3>
              
              <p className="mb-4">
                Update role for <span className="font-semibold">{selectedUser?.username}</span>
              </p>
              
              <div className="mb-6">
                <label className="block mb-2">Select Role:</label>
                <select
                  value={selectedUserRole}
                  onChange={(e) => setSelectedUserRole(e.target.value)}
                  className={`w-full px-4 py-2 rounded focus:outline-none ${darkMode ? 'bg-[#2a2a2a] border border-[#444]' : 'bg-gray-100 border border-gray-300'}`}
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeEditRoleModal}
                  className={`px-4 py-2 rounded ${darkMode ? 'bg-[#2a2a2a] hover:bg-[#333]' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                >
                  Cancel
                </button>
                <button
                  onClick={updateUserRole}
                  disabled={loading}
                  className="px-4 py-2 bg-[rgba(9,203,177,0.823)] text-white rounded hover:bg-[rgba(9,203,177,0.9)] transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
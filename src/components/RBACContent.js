import { useRouter } from 'next/navigation';

// Helper component to display role-based access control settings
const RBACContent = ({ darkMode }) => {
  const router = useRouter();
  
  const navigateToRBAC = () => {
    router.push('/admin/rbac');
  };
  
  const navigateToUserManagement = () => {
    router.push('/admin/users');
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Role-Based Access Control</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow-md'}`}>
          <h3 className="text-xl font-semibold mb-3">Role Management</h3>
          <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Create and manage user roles in the system (admin, user, premium, manager).
          </p>
          <button
            onClick={navigateToRBAC}
            className="px-4 py-2 bg-[rgba(9,203,177,0.823)] text-white rounded hover:bg-[rgba(9,203,177,0.9)] transition-colors"
          >
            Manage Roles
          </button>
        </div>
        
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow-md'}`}>
          <h3 className="text-xl font-semibold mb-3">User Role Management</h3>
          <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Assign and manage roles for individual users.
          </p>
          <button
            onClick={navigateToUserManagement}
            className="px-4 py-2 bg-[rgba(9,203,177,0.823)] text-white rounded hover:bg-[rgba(9,203,177,0.9)] transition-colors"
          >
            Manage User Roles
          </button>
        </div>
      </div>
      
      <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow-md'}`}>
        <h3 className="text-xl font-semibold mb-3">API Endpoints</h3>
        <div className={`font-mono text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <ul className="space-y-2">
            <li className="p-2 rounded bg-black/20">/api/admin/rbac/roles - GET, POST, DELETE for role management</li>
            <li className="p-2 rounded bg-black/20">/api/admin/users/role - PUT to update a user's role</li>
            <li className="p-2 rounded bg-black/20">/api/admin/users/list - GET to list users with pagination</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RBACContent; 
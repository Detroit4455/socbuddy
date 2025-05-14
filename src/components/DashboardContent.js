import { useState, useEffect } from 'react';
import Link from 'next/link';

const DashboardContent = ({ darkMode }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTasks: 0,
    completedTasks: 0
  });

  useEffect(() => {
    // In a real app, you would fetch these stats from an API
    // This is just placeholder data
    setStats({
      totalUsers: 124,
      activeUsers: 87,
      totalTasks: 1205,
      completedTasks: 842
    });
  }, []);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Users" value={stats.totalUsers} darkMode={darkMode} />
        <StatCard title="Active Users" value={stats.activeUsers} darkMode={darkMode} />
        <StatCard title="Total Tasks" value={stats.totalTasks} darkMode={darkMode} />
        <StatCard title="Completed Tasks" value={stats.completedTasks} darkMode={darkMode} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow-md'}`}>
          <h3 className="text-xl font-semibold mb-3">Quick Actions</h3>
          <div className="space-y-3">
            <Link href="/admin/users" 
              className={`block px-4 py-2 rounded ${darkMode ? 'bg-[#2a2a2a] hover:bg-[#333] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}>
              Manage Users
            </Link>
            <Link href="/admin/rbac" 
              className={`block px-4 py-2 rounded ${darkMode ? 'bg-[#2a2a2a] hover:bg-[#333] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}>
              Manage Roles
            </Link>
            <Link href="/admin/logs" 
              className={`block px-4 py-2 rounded ${darkMode ? 'bg-[#2a2a2a] hover:bg-[#333] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}>
              View Logs
            </Link>
            <Link href="/admin/website-map" 
              className={`block px-4 py-2 rounded ${darkMode ? 'bg-[#2a2a2a] hover:bg-[#333] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}>
              Website Map
            </Link>
          </div>
        </div>

        <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow-md'}`}>
          <h3 className="text-xl font-semibold mb-3">System Status</h3>
          <ul className="space-y-2">
            <li className="flex justify-between items-center">
              <span>Server Status</span>
              <span className="px-2 py-1 rounded bg-green-100 text-green-800">Online</span>
            </li>
            <li className="flex justify-between items-center">
              <span>Database</span>
              <span className="px-2 py-1 rounded bg-green-100 text-green-800">Connected</span>
            </li>
            <li className="flex justify-between items-center">
              <span>API Services</span>
              <span className="px-2 py-1 rounded bg-green-100 text-green-800">Operational</span>
            </li>
            <li className="flex justify-between items-center">
              <span>Last Backup</span>
              <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">Today, 03:00 AM</span>
            </li>
          </ul>
        </div>
      </div>

      <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow-md'}`}>
        <h3 className="text-xl font-semibold mb-3">Recent Activity</h3>
        <div className={`overflow-x-auto ${darkMode ? 'scrollbar-dark' : ''}`}>
          <table className={`min-w-full ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <thead>
              <tr className={darkMode ? 'border-b border-gray-700' : 'border-b'}>
                <th className="py-2 px-4 text-left">User</th>
                <th className="py-2 px-4 text-left">Action</th>
                <th className="py-2 px-4 text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              <tr className={darkMode ? 'border-b border-gray-700' : 'border-b'}>
                <td className="py-2 px-4">admin@example.com</td>
                <td className="py-2 px-4">Updated user roles</td>
                <td className="py-2 px-4">5 minutes ago</td>
              </tr>
              <tr className={darkMode ? 'border-b border-gray-700' : 'border-b'}>
                <td className="py-2 px-4">user123@example.com</td>
                <td className="py-2 px-4">Created a new task</td>
                <td className="py-2 px-4">12 minutes ago</td>
              </tr>
              <tr className={darkMode ? 'border-b border-gray-700' : 'border-b'}>
                <td className="py-2 px-4">admin@example.com</td>
                <td className="py-2 px-4">Added new resource</td>
                <td className="py-2 px-4">35 minutes ago</td>
              </tr>
              <tr>
                <td className="py-2 px-4">system</td>
                <td className="py-2 px-4">Database backup completed</td>
                <td className="py-2 px-4">1 hour ago</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
function StatCard({ title, value, darkMode }) {
  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-50 border border-gray-200'}`}>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-semibold mt-2 text-[rgba(9,203,177,0.823)]">{value}</p>
    </div>
  );
}

export default DashboardContent; 
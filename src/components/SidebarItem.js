// SidebarItem component for navigation elements in the sidebar
const SidebarItem = ({ label, icon, active, onClick, darkMode }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-4 py-2 rounded-md text-left transition-colors ${
        active
          ? darkMode
            ? 'bg-[#2a2a2a] text-[rgba(9,203,177,0.823)]'
            : 'bg-gray-100 text-[rgba(9,203,177,0.823)]'
          : darkMode
            ? 'text-gray-300 hover:bg-[#2a2a2a]'
            : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <span className="mr-3">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

export default SidebarItem; 
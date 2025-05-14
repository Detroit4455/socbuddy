import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import HomeIcon from './icons/HomeIcon';
import CalendarIcon from './icons/CalendarIcon';
import ChatAlt2Icon from './icons/ChatAlt2Icon';

const SideNav = ({ darkMode }) => {
  const pathname = usePathname();

  // Define navigation items
  const navItems = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Habits', href: '/habit-tracker', icon: CalendarIcon },
    { name: 'Messages', href: '/messages', icon: ChatAlt2Icon },
    // Add other navigation links as needed
  ];

  return (
    <nav className={`fixed left-0 top-0 bottom-0 w-16 ${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} border-r z-30 py-4 flex flex-col items-center`}>
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        
        return (
          <Link 
            key={item.name}
            href={item.href}
            className={`w-12 h-12 mb-2 flex items-center justify-center rounded-lg ${
              isActive 
                ? darkMode 
                  ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)]' 
                  : 'bg-purple-100 text-purple-600'
                : darkMode
                  ? 'text-[#aaa] hover:bg-[#333] hover:text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            } transition-colors`}
            title={item.name}
          >
            <item.icon className="w-6 h-6" />
          </Link>
        );
      })}
    </nav>
  );
};

export default SideNav; 
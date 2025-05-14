'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ThemeToggle from '@/components/ThemeToggle';
import SidebarItem from '@/components/SidebarItem';
import DashboardContent from '@/components/DashboardContent';
import HabitRepositoryContent from '@/components/HabitRepositoryContent';
import MarathonSettingsContent from '@/components/MarathonSettingsContent';
import NotificationSettingsContent from '@/components/NotificationSettingsContent';
import SiteManagementContent from '@/components/SiteManagementContent';
import RBACContent from '@/components/RBACContent';

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  
  // State for habit templates management
  const [habitTemplates, setHabitTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    habit: '',
    category: '',
    icon: '✓',
    used_count: 0
  });
  // Add search state
  const [searchTerm, setSearchTerm] = useState('');
  const [importJsonVisible, setImportJsonVisible] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [importResults, setImportResults] = useState(null);

  // State for public marathon threshold setting
  const [threshold, setThreshold] = useState(10);
  const [description, setDescription] = useState('');
  const [loadedThreshold, setLoadedThreshold] = useState(10);
  const [loadedDescription, setLoadedDescription] = useState('');
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Add a new state for notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    habitNotificationsEnabled: true,
    isLoading: false,
    error: '',
    success: false
  });

  // Check if user has admin role
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'admin') {
      router.replace('/');
    }
  }, [session, status, router]);
  
  // Initialize dark mode
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      setDarkMode(savedMode === 'true');
    } else {
      // Use system preference as default
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, []);
  
  // Load habit templates when visiting repository section
  useEffect(() => {
    if (activeSection === 'habit-repository') {
      loadHabitTemplates();
    }
  }, [activeSection]);

  // Fetch public marathon threshold when section is active
  useEffect(() => {
    if (activeSection === 'public-marathon-settings') {
      fetch('/api/settings/public-marathon-threshold')
        .then(res => res.json())
        .then(data => {
          if (data.threshold !== undefined) {
            setThreshold(data.threshold);
            setLoadedThreshold(data.threshold);
          }
          if (data.description !== undefined) {
            setDescription(data.description);
            setLoadedDescription(data.description);
          }
          setIsEditingSettings(false);
        })
        .catch(() => setSaveError('Failed to load threshold'));
    }
  }, [activeSection]);
  
  // Add effect to load notification settings when that section is active
  useEffect(() => {
    if (activeSection === 'notification-settings') {
      loadNotificationSettings();
    }
  }, [activeSection]);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };
  
  // Function to load notification settings
  const loadNotificationSettings = async () => {
    try {
      console.log("🔧 Loading notification settings...");
      setNotificationSettings(prev => ({ ...prev, isLoading: true, error: '' }));
      
      const response = await fetch('/api/settings/notification');
      
      console.log("🔧 Settings response status:", response.status);
      const data = await response.json();
      console.log("🔧 Settings data received:", data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load notification settings');
      }
      
      // Ensure value is boolean
      const enabledValue = data.value === true || data.value === 'true' || data.value === 1;
      console.log("🔧 Setting enabled value:", enabledValue, "type:", typeof enabledValue);
      
      setNotificationSettings(prev => ({
        ...prev,
        habitNotificationsEnabled: enabledValue,
        isLoading: false
      }));
      
      console.log("🔧 Notification settings loaded and state updated");
    } catch (error) {
      console.error('🔧 Error loading notification settings:', error);
      setNotificationSettings(prev => ({
        ...prev,
        error: error.message || 'Failed to load notification settings',
        isLoading: false
      }));
    }
  };
  
  // Function to update notification settings
  const updateNotificationSettings = async (enabled) => {
    try {
      console.log("🔧 Updating notification settings to:", enabled);
      setNotificationSettings(prev => ({ ...prev, isLoading: true, error: '', success: false }));
      
      // Convert to a strict boolean value to ensure it's properly handled
      const enabledBool = enabled === true;
      
      const response = await fetch('/api/settings/notification', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: enabledBool })
      });
      
      const responseData = await response.json();
      console.log("🔧 Response status:", response.status);
      console.log("🔧 Response data:", responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update notification settings');
      }
      
      console.log("🔧 Setting update successful, updating UI state");
      setNotificationSettings(prev => ({
        ...prev,
        habitNotificationsEnabled: enabled,
        isLoading: false,
        success: true
      }));
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setNotificationSettings(prev => ({ ...prev, success: false }));
      }, 3000);
      
    } catch (error) {
      console.error('🔧 Error updating notification settings:', error);
      setNotificationSettings(prev => ({
        ...prev,
        error: error.message || 'Failed to update notification settings',
        isLoading: false
      }));
    }
  };
  
  // Load habit templates from API
  const loadHabitTemplates = async () => {
    try {
      setIsLoading(true);
      // Add search parameter if search term exists
      const searchParam = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetch(`/api/habit-templates${searchParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch habit templates');
      }
      const data = await response.json();
      setHabitTemplates(data);
    } catch (error) {
      console.error('Error loading habit templates:', error);
      setFormError('Failed to load habit templates');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle search input changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    loadHabitTemplates();
  };
  
  // Handle JSON import
  const handleJsonImport = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setImportResults(null);
    
    try {
      // Validate JSON format
      let habitData;
      try {
        habitData = JSON.parse(jsonInput);
        if (!Array.isArray(habitData)) {
          throw new Error('JSON must be an array of habit objects');
        }
      } catch (jsonError) {
        setFormError('Invalid JSON format. Please check your input.');
        return;
      }
      
      setIsLoading(true);
      
      // Send to API
      const response = await fetch('/api/habit-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: jsonInput
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import habits');
      }
      
      const results = await response.json();
      setImportResults(results);
      setFormSuccess(`Successfully imported ${results.imported} habit templates.`);
      
      // Reset form and refresh data
      setJsonInput('');
      setImportJsonVisible(false);
      loadHabitTemplates();
      
    } catch (error) {
      console.error('Error importing habits:', error);
      setFormError(error.message || 'Failed to import habits');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTemplateForm({
      ...templateForm,
      [name]: name === 'used_count' ? parseInt(value, 10) : value
    });
  };
  
  // Handle form submission
  const handleTemplateSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setFormError('');
      setFormSuccess('');
      
      const method = isEditMode ? 'PUT' : 'POST';
      const endpoint = '/api/habit-templates';
      
      const payload = isEditMode 
        ? { ...templateForm, _id: selectedTemplate._id }
        : templateForm;
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save habit template');
      }
      
      // Reset form and refresh data
      setFormSuccess(isEditMode ? 'Template updated successfully!' : 'Template added successfully!');
      resetForm();
      loadHabitTemplates();
      
    } catch (error) {
      console.error('Error saving habit template:', error);
      setFormError(error.message || 'Failed to save habit template');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Edit a template
  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setTemplateForm({
      habit: template.habit,
      category: template.category,
      icon: template.icon,
      used_count: template.used_count
    });
    setIsEditMode(true);
  };
  
  // Delete a template
  const handleDeleteTemplate = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/habit-templates', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ _id: id })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete habit template');
      }
      
      setFormSuccess('Template deleted successfully!');
      loadHabitTemplates();
      
    } catch (error) {
      console.error('Error deleting habit template:', error);
      setFormError(error.message || 'Failed to delete habit template');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setTemplateForm({
      habit: '',
      category: '',
      icon: '✓',
      used_count: 0
    });
    setIsEditMode(false);
    setSelectedTemplate(null);
  };
  
  // Handler for saving threshold
  const handleSaveThreshold = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/settings/public-marathon-threshold', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold, description }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save settings');
      setLoadedThreshold(json.threshold);
      setLoadedDescription(json.description);
      setIsEditingSettings(false);
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  // If loading or not authenticated, show loading state
  if (status === 'loading' || (status === 'authenticated' && session?.user?.role !== 'admin')) {
  return (
      <div className="flex min-h-screen flex-col bg-[#121212] text-white">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgba(9,203,177,0.823)]"></div>
        </div>
      </div>
    );
  }
  
  // If not admin, should be redirected by the useEffect

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#121212] text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Theme toggle button */}
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      </div>
      
      <div className="flex">
        {/* Sidebar */}
        <div className={`w-64 fixed h-full ${darkMode ? 'bg-[#1e1e1e] border-r border-[#333]' : 'bg-white border-r border-gray-200'}`}>
          <div className="px-6 py-4">
            <Link href="/" className="flex items-center space-x-2 mb-6">
              <img 
                src="/ICON.svg" 
                alt="SocBuddy Logo" 
                className="w-8 h-8"
              />
              <span className="text-lg font-bold text-[rgba(9,203,177,0.823)]">Admin Portal</span>
            </Link>
            
            <div className="space-y-1">
              <SidebarItem 
                label="Dashboard"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>}
                active={activeSection === 'dashboard'}
                onClick={() => setActiveSection('dashboard')}
                darkMode={darkMode}
              />
              
              <SidebarItem 
                label="RBAC Management"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>}
                active={activeSection === 'rbac'}
                onClick={() => setActiveSection('rbac')}
                darkMode={darkMode}
              />
              
              <SidebarItem 
                label="User Management"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>}
                active={activeSection === 'users'}
                onClick={() => router.push('/admin/users')}
                darkMode={darkMode}
              />
              
              <SidebarItem 
                label="Habit Repository"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>}
                active={activeSection === 'habit-repository'}
                onClick={() => setActiveSection('habit-repository')}
                darkMode={darkMode}
              />
              
              <SidebarItem 
                label="Cyber Resources"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>}
                active={activeSection === 'cyber-resources'}
                onClick={() => router.push('/admin/cyber-resources')}
                darkMode={darkMode}
              />
              
              <SidebarItem 
                label="Marathon Settings"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>}
                active={activeSection === 'public-marathon-settings'}
                onClick={() => setActiveSection('public-marathon-settings')}
                darkMode={darkMode}
              />
              
              <SidebarItem 
                label="Notifications"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>}
                active={activeSection === 'notification-settings'}
                onClick={() => setActiveSection('notification-settings')}
                darkMode={darkMode}
              />
              
              <SidebarItem 
                label="Site Management"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>}
                active={activeSection === 'site-management'}
                onClick={() => setActiveSection('site-management')}
                darkMode={darkMode}
              />
              
              <SidebarItem 
                label="Website Map"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>}
                active={activeSection === 'website-map'}
                onClick={() => router.push('/admin/website-map')}
                darkMode={darkMode}
              />
            </div>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="ml-64 flex-1 p-8">
          <h1 className="text-3xl font-bold mb-8">{getPageTitle(activeSection)}</h1>
          
          {activeSection === 'dashboard' && (
            <DashboardContent darkMode={darkMode} />
          )}
          
          {activeSection === 'rbac' && (
            <RBACContent darkMode={darkMode} />
          )}
          
          {activeSection === 'habit-repository' && (
            <HabitRepositoryContent 
              darkMode={darkMode} 
              habitTemplates={habitTemplates}
              isLoading={isLoading}
              formError={formError}
              formSuccess={formSuccess}
              isEditMode={isEditMode}
              selectedTemplate={selectedTemplate}
              templateForm={templateForm}
              searchTerm={searchTerm}
              importJsonVisible={importJsonVisible}
              jsonInput={jsonInput}
              importResults={importResults}
              onSearchChange={handleSearchChange}
              onSearch={handleSearch}
              onInputChange={handleInputChange}
              onFormSubmit={handleTemplateSubmit}
              onEditTemplate={handleEditTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onResetForm={resetForm}
              setImportJsonVisible={setImportJsonVisible}
              setJsonInput={setJsonInput}
              onJsonImport={handleJsonImport}
            />
          )}
          
          {activeSection === 'public-marathon-settings' && (
            <MarathonSettingsContent 
              darkMode={darkMode}
              threshold={threshold}
              description={description}
              loadedThreshold={loadedThreshold}
              loadedDescription={loadedDescription}
              isEditingSettings={isEditingSettings}
              isSaving={isSaving}
              saveError={saveError}
              saveSuccess={saveSuccess}
              setThreshold={setThreshold}
              setDescription={setDescription}
              setIsEditingSettings={setIsEditingSettings}
              onSaveThreshold={handleSaveThreshold}
            />
          )}
          
          {activeSection === 'notification-settings' && (
            <NotificationSettingsContent 
              darkMode={darkMode}
              notificationSettings={notificationSettings}
              onUpdateSettings={updateNotificationSettings}
            />
          )}
          
          {activeSection === 'site-management' && (
            <SiteManagementContent darkMode={darkMode} />
          )}
        </div>
      </div>
    </div>
  );
} 

// Helper function to get page title
function getPageTitle(section) {
  switch (section) {
    case 'users': return 'User Management';
    case 'task-overview': return 'Task Overview';
    case 'task-analytics': return 'Task Analytics';
    case 'website-map': return 'Website Map';
    default: return 'Admin Dashboard';
  }
}
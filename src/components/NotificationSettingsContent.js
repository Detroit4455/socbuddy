import React from 'react';

const NotificationSettingsContent = ({ darkMode, notificationSettings, onUpdateSettings }) => {
  const {
    habitNotificationsEnabled,
    isLoading,
    error,
    success
  } = notificationSettings;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>
      
      <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow-md'}`}>
        <h2 className="text-xl font-semibold mb-4">System Notifications</h2>
        
        <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Configure notification settings for all users. These settings apply system-wide.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
            Settings updated successfully!
          </div>
        )}
        
        <div className="space-y-6">
          <div className={`p-4 rounded ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-2">Habit Reminders</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Enable daily reminders for users to complete their habits
                </p>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  value=""
                  className="sr-only peer"
                  checked={habitNotificationsEnabled}
                  onChange={() => onUpdateSettings(!habitNotificationsEnabled)}
                  disabled={isLoading}
                />
                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 ${
                  darkMode ? 'peer-focus:ring-[rgba(9,203,177,0.2)]' : 'peer-focus:ring-[rgba(9,203,177,0.2)]'
                } rounded-full peer ${
                  habitNotificationsEnabled ? 'peer-checked:after:translate-x-full peer-checked:after:border-white' : ''
                } peer-checked:bg-[rgba(9,203,177,0.823)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
              </label>
            </div>
          </div>
          
          <div className="mt-4">
            <p className={`text-sm italic ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Note: Individual users can override these settings in their profile preferences.
            </p>
          </div>
        </div>
      </div>
      
      <div className={`p-6 rounded-lg mt-6 ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow-md'}`}>
        <h2 className="text-xl font-semibold mb-4">Notification Guidelines</h2>
        
        <div className={`space-y-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <p>
            <strong>Best Practices:</strong> Notifications should be used sparingly and provide value to users.
            Too many notifications can lead to user fatigue and app abandonment.
          </p>
          
          <p>
            <strong>Timing:</strong> Habit reminders are sent at 8:00 PM local time by default,
            encouraging users to complete their daily habits.
          </p>
          
          <p>
            <strong>Content:</strong> Notification messages should be concise, action-oriented,
            and provide clear value. Avoid vague or generic messages.
          </p>
          
          <p>
            <strong>User Control:</strong> Always ensure users have easy access to manage their 
            notification preferences in their profile settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsContent; 
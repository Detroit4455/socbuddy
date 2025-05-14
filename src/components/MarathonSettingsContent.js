import React from 'react';

const MarathonSettingsContent = ({
  darkMode,
  threshold,
  description,
  loadedThreshold,
  loadedDescription,
  isEditingSettings,
  isSaving,
  saveError,
  saveSuccess,
  setThreshold,
  setDescription,
  setIsEditingSettings,
  onSaveThreshold
}) => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Marathon Settings</h1>
      
      <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow-md'}`}>
        <h2 className="text-xl font-semibold mb-4">Public Marathon Threshold</h2>
        
        <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Set the minimum number of active participants required for a habit marathon to be featured on the public board.
        </p>
        
        {saveError && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
            {saveError}
          </div>
        )}
        
        {saveSuccess && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
            Settings saved successfully!
          </div>
        )}
        
        {isEditingSettings ? (
          <div className="space-y-4">
            <div>
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Threshold
              </label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
                className={`w-full px-3 py-2 rounded border ${
                  darkMode 
                    ? 'bg-[#2a2a2a] border-[#444] text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                min="1"
              />
            </div>
            
            <div>
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full px-3 py-2 rounded border h-20 ${
                  darkMode 
                    ? 'bg-[#2a2a2a] border-[#444] text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Explain the threshold policy..."
              ></textarea>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onSaveThreshold}
                className="px-4 py-2 bg-[rgba(9,203,177,0.823)] text-white rounded hover:bg-[rgba(9,203,177,0.9)] transition-colors"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
              
              <button
                onClick={() => {
                  setThreshold(loadedThreshold);
                  setDescription(loadedDescription);
                  setIsEditingSettings(false);
                }}
                className={`px-4 py-2 rounded ${
                  darkMode 
                    ? 'bg-[#333] text-white hover:bg-[#444]' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between p-4 mb-3 rounded bg-black/10">
              <span className="font-semibold">Current Threshold:</span>
              <span className="text-xl font-bold text-[rgba(9,203,177,0.823)]">{loadedThreshold} participants</span>
            </div>
            
            <div className="p-4 mb-6 rounded bg-black/10">
              <h3 className="font-semibold mb-2">Description:</h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                {loadedDescription || 'No description provided.'}
              </p>
            </div>
            
            <button
              onClick={() => setIsEditingSettings(true)}
              className="px-4 py-2 bg-[rgba(9,203,177,0.823)] text-white rounded hover:bg-[rgba(9,203,177,0.9)] transition-colors"
            >
              Edit Settings
            </button>
          </div>
        )}
      </div>
      
      <div className={`p-6 rounded-lg mt-6 ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow-md'}`}>
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        
        <div className={`space-y-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <p>
            <strong>Threshold Setting:</strong> This determines how many active participants 
            are needed for a marathon to be featured on the public board.
          </p>
          
          <p>
            <strong>Public Board:</strong> Marathons that meet the threshold will appear 
            on the public marathon board, visible to all users.
          </p>
          
          <p>
            <strong>Private Marathons:</strong> Marathons with fewer participants than the 
            threshold will remain private and only visible to participants.
          </p>
          
          <p>
            <strong>Description:</strong> Use the description field to explain the policy 
            to users who view the marathon pages.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarathonSettingsContent; 
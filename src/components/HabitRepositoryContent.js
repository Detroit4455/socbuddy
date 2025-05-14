import React from 'react';

const HabitRepositoryContent = ({
  darkMode,
  habitTemplates,
  isLoading,
  formError,
  formSuccess,
  isEditMode,
  selectedTemplate,
  templateForm,
  searchTerm,
  importJsonVisible,
  jsonInput,
  importResults,
  onSearchChange,
  onSearch,
  onInputChange,
  onFormSubmit,
  onEditTemplate,
  onDeleteTemplate,
  onResetForm,
  setImportJsonVisible,
  setJsonInput,
  onJsonImport
}) => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Habit Repository Management</h1>
      
      {/* Template Form */}
      <div className={`p-6 rounded-lg mb-6 ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow-md'}`}>
        <h2 className="text-xl font-semibold mb-4">{isEditMode ? 'Edit Habit Template' : 'Add New Habit Template'}</h2>
        
        {formError && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
            {formError}
          </div>
        )}
        
        {formSuccess && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
            {formSuccess}
          </div>
        )}
        
        <form onSubmit={onFormSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Habit Name
              </label>
              <input
                type="text"
                name="habit"
                value={templateForm.habit}
                onChange={onInputChange}
                className={`w-full px-3 py-2 rounded border ${
                  darkMode 
                    ? 'bg-[#2a2a2a] border-[#444] text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>
            
            <div>
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Category
              </label>
              <input
                type="text"
                name="category"
                value={templateForm.category}
                onChange={onInputChange}
                className={`w-full px-3 py-2 rounded border ${
                  darkMode 
                    ? 'bg-[#2a2a2a] border-[#444] text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>
            
            <div>
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Icon
              </label>
              <input
                type="text"
                name="icon"
                value={templateForm.icon}
                onChange={onInputChange}
                className={`w-full px-3 py-2 rounded border ${
                  darkMode 
                    ? 'bg-[#2a2a2a] border-[#444] text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>
            
            <div>
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Used Count
              </label>
              <input
                type="number"
                name="used_count"
                value={templateForm.used_count}
                onChange={onInputChange}
                className={`w-full px-3 py-2 rounded border ${
                  darkMode 
                    ? 'bg-[#2a2a2a] border-[#444] text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                min="0"
              />
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              type="submit"
              className="px-4 py-2 bg-[rgba(9,203,177,0.823)] text-white rounded hover:bg-[rgba(9,203,177,0.9)] transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : isEditMode ? 'Update Template' : 'Add Template'}
            </button>
            
            {isEditMode && (
              <button
                type="button"
                onClick={onResetForm}
                className={`px-4 py-2 rounded ${
                  darkMode 
                    ? 'bg-[#333] text-white hover:bg-[#444]' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            )}
            
            <button
              type="button"
              onClick={() => setImportJsonVisible(!importJsonVisible)}
              className={`px-4 py-2 rounded ml-auto ${
                darkMode 
                  ? 'bg-[#333] text-white hover:bg-[#444]' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {importJsonVisible ? 'Hide JSON Import' : 'Import JSON'}
            </button>
          </div>
        </form>
        
        {importJsonVisible && (
          <div className="mt-6 p-4 border rounded border-gray-300">
            <h3 className="text-lg font-medium mb-3">Import Habits from JSON</h3>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className={`w-full px-3 py-2 rounded border h-40 font-mono text-sm ${
                darkMode 
                  ? 'bg-[#2a2a2a] border-[#444] text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder='[{"habit": "Example Habit", "category": "Example", "icon": "✓"}]'
            ></textarea>
            <button
              onClick={onJsonImport}
              className="mt-3 px-4 py-2 bg-[rgba(9,203,177,0.823)] text-white rounded hover:bg-[rgba(9,203,177,0.9)] transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Importing...' : 'Import'}
            </button>
            
            {importResults && (
              <div className="mt-3 p-3 bg-green-100 text-green-800 rounded">
                Successfully imported {importResults.imported} habit template(s).
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Template List */}
      <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow-md'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Habit Templates</h2>
          
          <form onSubmit={onSearch} className="flex">
            <input
              type="text"
              value={searchTerm}
              onChange={onSearchChange}
              placeholder="Search templates..."
              className={`px-3 py-2 rounded-l border ${
                darkMode 
                  ? 'bg-[#2a2a2a] border-[#444] text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <button
              type="submit"
              className="px-3 py-2 bg-[rgba(9,203,177,0.823)] text-white rounded-r hover:bg-[rgba(9,203,177,0.9)] transition-colors"
            >
              Search
            </button>
          </form>
        </div>
        
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[rgba(9,203,177,0.823)]"></div>
          </div>
        ) : habitTemplates.length === 0 ? (
          <div className="py-8 text-center">
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              No templates found. {searchTerm && 'Try a different search term or '}Add some templates!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className={darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                  <th className="py-2 px-4 text-left">Habit</th>
                  <th className="py-2 px-4 text-left">Category</th>
                  <th className="py-2 px-4 text-left">Icon</th>
                  <th className="py-2 px-4 text-left">Used Count</th>
                  <th className="py-2 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {habitTemplates.map(template => (
                  <tr key={template._id} className={darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                    <td className="py-2 px-4">{template.habit}</td>
                    <td className="py-2 px-4">{template.category}</td>
                    <td className="py-2 px-4">{template.icon}</td>
                    <td className="py-2 px-4">{template.used_count}</td>
                    <td className="py-2 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onEditTemplate(template)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteTemplate(template._id)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitRepositoryContent; 
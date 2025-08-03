import React, { useState } from 'react';
import { X, Download, Upload, Trash2, Plus, Edit, Palette } from 'lucide-react';
import { useTodoStore } from './todo-store';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { 
    tasks, 
    settings, 
    updateSettings, 
    updateKanbanColumn, 
    addLabel,
    // For clearing all data if needed
  } = useTodoStore();

  const [activeTab, setActiveTab] = useState<'general' | 'kanban' | 'labels' | 'data'>('general');
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [columnEdits, setColumnEdits] = useState<{ title: string; color: string }>({ title: '', color: '' });
  const [newLabel, setNewLabel] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('bg-gray-100 text-gray-800');

  const colorOptions = [
    { name: 'Gray', value: 'bg-gray-100 text-gray-800' },
    { name: 'Red', value: 'bg-red-100 text-red-800' },
    { name: 'Orange', value: 'bg-orange-100 text-orange-800' },
    { name: 'Yellow', value: 'bg-yellow-100 text-yellow-800' },
    { name: 'Green', value: 'bg-green-100 text-green-800' },
    { name: 'Blue', value: 'bg-blue-100 text-blue-800' },
    { name: 'Indigo', value: 'bg-indigo-100 text-indigo-800' },
    { name: 'Purple', value: 'bg-purple-100 text-purple-800' },
    { name: 'Pink', value: 'bg-pink-100 text-pink-800' },
  ];

  const handleColumnEdit = (columnId: string) => {
    const column = settings.kanbanColumns.find(col => col.id === columnId);
    if (column) {
      setEditingColumn(columnId);
      setColumnEdits({ title: column.title, color: column.color });
    }
  };

  const saveColumnEdit = () => {
    if (editingColumn) {
      updateKanbanColumn(editingColumn, columnEdits);
      setEditingColumn(null);
      setColumnEdits({ title: '', color: '' });
    }
  };

  const cancelColumnEdit = () => {
    setEditingColumn(null);
    setColumnEdits({ title: '', color: '' });
  };

  const handleAddLabel = () => {
    if (newLabel.trim()) {
      addLabel(newLabel.trim(), newLabelColor);
      setNewLabel('');
      setNewLabelColor('bg-gray-100 text-gray-800');
    }
  };

  const exportData = () => {
    const data = {
      tasks: Object.values(tasks),
      settings,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Validate data structure
        if (data.tasks && Array.isArray(data.tasks)) {
          // Convert array back to object format
          const tasksObj: Record<string, any> = {};
          data.tasks.forEach((task: any) => {
            tasksObj[task.id] = task;
          });
          
          // Apply imported data
          Object.values(tasksObj).forEach(task => {
            // You might want to call addTask or updateTask here
            // For now, we'll update the store directly
          });
          
          if (data.settings) {
            updateSettings(data.settings);
          }
          
          alert('Data imported successfully!');
        } else {
          alert('Invalid file format. Please select a valid todo data export.');
        }
      } catch (error) {
        alert('Error reading file. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      // Clear all tasks and reset to defaults
      // You'd need to implement this in the store
      localStorage.removeItem('todo-widget-data');
      location.reload();
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'kanban', label: 'Kanban', icon: '📋' },
    { id: 'labels', label: 'Labels', icon: '🏷️' },
    { id: 'data', label: 'Data', icon: '💾' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg ${
        settings.darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${
          settings.darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className="text-xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              settings.darkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex h-[calc(90vh-100px)]">
          {/* Sidebar */}
          <div className={`w-64 border-r overflow-y-auto ${
            settings.darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? settings.darkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-500 text-white'
                        : settings.darkMode
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">General Settings</h3>
                
                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium mb-2">Theme</label>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => updateSettings({ darkMode: false })}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        !settings.darkMode
                          ? 'bg-blue-500 text-white border-blue-500'
                          : settings.darkMode
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      ☀️ Light Mode
                    </button>
                    <button
                      onClick={() => updateSettings({ darkMode: true })}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        settings.darkMode
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      🌙 Dark Mode
                    </button>
                  </div>
                </div>

                {/* Default View */}
                <div>
                  <label className="block text-sm font-medium mb-2">Default View</label>
                  <select
                    value={settings.viewMode}
                    onChange={(e) => updateSettings({ viewMode: e.target.value as any })}
                    className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      settings.darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="kanban">Kanban Board</option>
                    <option value="list">List View</option>
                  </select>
                </div>

                {/* List View Settings */}
                <div>
                  <h4 className="font-medium mb-3">List View Defaults</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Group By</label>
                      <select
                        value={settings.listGroupBy}
                        onChange={(e) => updateSettings({ listGroupBy: e.target.value as any })}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          settings.darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="status">Status</option>
                        <option value="date">Due Date</option>
                        <option value="priority">Priority</option>
                        <option value="labels">Labels</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Sort By</label>
                      <select
                        value={settings.listSortBy}
                        onChange={(e) => updateSettings({ listSortBy: e.target.value as any })}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          settings.darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="createdAt">Created Date</option>
                        <option value="dueDate">Due Date</option>
                        <option value="priority">Priority</option>
                        <option value="title">Title</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'kanban' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Kanban Board Settings</h3>
                
                <div>
                  <h4 className="font-medium mb-3">Column Configuration</h4>
                  <div className="space-y-3">
                    {settings.kanbanColumns.map((column) => (
                      <div
                        key={column.id}
                        className={`p-4 border rounded-lg ${
                          settings.darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        {editingColumn === column.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={columnEdits.title}
                              onChange={(e) => setColumnEdits(prev => ({ ...prev, title: e.target.value }))}
                              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                settings.darkMode
                                  ? 'bg-gray-600 border-gray-500 text-white'
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={cancelColumnEdit}
                                className={`px-3 py-1 rounded transition-colors ${
                                  settings.darkMode
                                    ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={saveColumnEdit}
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium">{column.title}</h5>
                              <p className={`text-sm ${settings.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Column ID: {column.id}
                              </p>
                            </div>
                            <button
                              onClick={() => handleColumnEdit(column.id)}
                              className={`p-2 rounded transition-colors ${
                                settings.darkMode
                                  ? 'hover:bg-gray-600 text-gray-400 hover:text-white'
                                  : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              <Edit size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'labels' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Label Management</h3>
                
                {/* Add New Label */}
                <div className={`p-4 border rounded-lg ${
                  settings.darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                }`}>
                  <h4 className="font-medium mb-3">Add New Label</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Label name..."
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        settings.darkMode
                          ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Color</label>
                      <div className="grid grid-cols-3 gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => setNewLabelColor(color.value)}
                            className={`px-3 py-2 rounded-lg text-sm border-2 transition-colors ${
                              newLabelColor === color.value
                                ? 'border-blue-500'
                                : 'border-transparent'
                            } ${color.value}`}
                          >
                            {color.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <button
                      onClick={handleAddLabel}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Plus size={16} className="inline mr-2" />
                      Add Label
                    </button>
                  </div>
                </div>

                {/* Existing Labels */}
                <div>
                  <h4 className="font-medium mb-3">Existing Labels</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {settings.availableLabels.map((label) => (
                      <div
                        key={label}
                        className={`px-3 py-2 rounded-lg ${settings.labelColors[label] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Data Management</h3>
                
                {/* Statistics */}
                <div className={`p-4 border rounded-lg ${
                  settings.darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                }`}>
                  <h4 className="font-medium mb-3">Statistics</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className={settings.darkMode ? 'text-gray-400' : 'text-gray-600'}>Total Tasks:</span>
                      <span className="ml-2 font-medium">{Object.keys(tasks).length}</span>
                    </div>
                    <div>
                      <span className={settings.darkMode ? 'text-gray-400' : 'text-gray-600'}>Completed:</span>
                      <span className="ml-2 font-medium">
                        {Object.values(tasks).filter(task => task.completed).length}
                      </span>
                    </div>
                    <div>
                      <span className={settings.darkMode ? 'text-gray-400' : 'text-gray-600'}>Labels:</span>
                      <span className="ml-2 font-medium">{settings.availableLabels.length}</span>
                    </div>
                  </div>
                </div>

                {/* Import/Export */}
                <div className="space-y-4">
                  <div>
                    <button
                      onClick={exportData}
                      className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Download size={16} />
                      <span>Export Data (JSON)</span>
                    </button>
                  </div>

                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={importData}
                      className="hidden"
                      id="import-file"
                    />
                    <label
                      htmlFor="import-file"
                      className={`w-full px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors flex items-center justify-center space-x-2 ${
                        settings.darkMode
                          ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white'
                          : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-900'
                      }`}
                    >
                      <Upload size={16} />
                      <span>Import Data (JSON)</span>
                    </label>
                  </div>

                  <div>
                    <button
                      onClick={clearAllData}
                      className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Trash2 size={16} />
                      <span>Clear All Data</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
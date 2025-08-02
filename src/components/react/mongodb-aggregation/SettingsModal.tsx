import React, { useState } from 'react';
import { X, Palette, Code, HelpCircle, Database } from 'lucide-react';
import { useMongoDBAggregationStore } from './store';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, setSampleData, sampleData } = useMongoDBAggregationStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [customSampleData, setCustomSampleData] = useState(
    JSON.stringify(sampleData, null, 2)
  );

  const handleSave = () => {
    updateSettings(localSettings);
    
    if (localSettings.sampleDataEnabled) {
      try {
        const parsed = JSON.parse(customSampleData);
        if (Array.isArray(parsed)) {
          setSampleData(parsed);
        }
      } catch (error) {
        console.error('Invalid sample data JSON:', error);
      }
    }
    
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setCustomSampleData(JSON.stringify(sampleData, null, 2));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span>Widget Settings</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Theme Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Palette className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-medium text-gray-800">Appearance</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <select
                  value={localSettings.theme}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    theme: e.target.value as 'light' | 'dark'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Code className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-800">Display</h3>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.showJson}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    showJson: e.target.checked
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show JSON preview by default</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.autoFormat}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    autoFormat: e.target.checked
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Auto-format JSON output</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localSettings.showStageHelp}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    showStageHelp: e.target.checked
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show stage help tooltips</span>
              </label>
            </div>
          </div>

          {/* Data Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-medium text-gray-800">Sample Data</h3>
            </div>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={localSettings.sampleDataEnabled}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  sampleDataEnabled: e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enable sample data execution</span>
            </label>
            
            {localSettings.sampleDataEnabled && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Custom Sample Data (JSON Array)
                </label>
                <textarea
                  value={customSampleData}
                  onChange={(e) => setCustomSampleData(e.target.value)}
                  className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`[
  { "_id": 1, "name": "John", "age": 30 },
  { "_id": 2, "name": "Jane", "age": 25 }
]`}
                />
                <p className="text-xs text-gray-500">
                  Provide sample documents to test your aggregation pipeline
                </p>
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-medium text-gray-800">Help</h3>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
              <h4 className="font-medium mb-2">How to use:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Drag stage nodes from the toolbar to build your pipeline</li>
                <li>Connect stages by dragging from output (green) to input (blue) handles</li>
                <li>Click the settings icon on any stage to configure it</li>
                <li>Use the JSON preview to see the generated pipeline</li>
                <li>Enable sample data to test your pipeline with mock data</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            Reset
          </button>
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
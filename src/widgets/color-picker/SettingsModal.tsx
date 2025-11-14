import React from 'react';
import { X } from 'lucide-react';
import { useColorPickerStore } from './store';
import type { ColorFormat } from './types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, clearHistory } = useColorPickerStore();

  if (!isOpen) return null;

  const handleFormatChange = (format: ColorFormat) => {
    updateSettings({ defaultFormat: format });
  };

  const handleToggleHistory = () => {
    updateSettings({ showHistory: !settings.showHistory });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className={`relative ${settings.darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-xl p-6 max-w-md w-full mx-4`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${settings.darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Default Format */}
          <div>
            <label className="block text-sm font-medium mb-2">Default Format</label>
            <div className="grid grid-cols-2 gap-2">
              {(['HEX', 'RGB', 'HSL', 'HSV'] as ColorFormat[]).map((format) => (
                <button
                  key={format}
                  onClick={() => handleFormatChange(format)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    settings.defaultFormat === format
                      ? 'bg-blue-500 text-white'
                      : settings.darkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>

          {/* Show History */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Show Color History</label>
            <button
              onClick={handleToggleHistory}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.showHistory ? 'bg-blue-500' : settings.darkMode ? 'bg-gray-700' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.showHistory ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Clear History */}
          <div>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all color history?')) {
                  clearHistory();
                }
              }}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                settings.darkMode
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              Clear History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

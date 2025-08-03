import React from 'react';
import { X, RotateCcw, Download } from 'lucide-react';
import { useSQLVisualizerStore } from './store';

const SettingsModal: React.FC = () => {
  const {
    settings,
    showSettings,
    setSettings,
    setShowSettings,
    resetToDefaults,
  } = useSQLVisualizerStore();

  if (!showSettings) return null;

  const handleExportSVG = () => {
    // Get the React Flow viewport element
    const flowElement = document.querySelector('.react-flow__viewport');
    if (!flowElement) return;

    // Create SVG
    const svgData = new XMLSerializer().serializeToString(flowElement as Element);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    // Download
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'sql-diagram.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Settings</h3>
          <button
            onClick={() => setShowSettings(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Theme Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({ theme: e.target.value as 'light' | 'dark' | 'auto' })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Dark Mode
            </label>
            <input
              type="checkbox"
              checked={settings.darkMode}
              onChange={(e) => setSettings({ darkMode: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          {/* Auto Layout */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Auto Layout
            </label>
            <input
              type="checkbox"
              checked={settings.autoLayout}
              onChange={(e) => setSettings({ autoLayout: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          {/* Show Table Columns */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Show Table Columns
            </label>
            <input
              type="checkbox"
              checked={settings.showTableColumns}
              onChange={(e) => setSettings({ showTableColumns: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          {/* Node Spacing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Node Spacing: {settings.nodeSpacing}px
            </label>
            <input
              type="range"
              min="150"
              max="400"
              step="25"
              value={settings.nodeSpacing}
              onChange={(e) => setSettings({ nodeSpacing: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Export Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export
            </label>
            <div className="space-y-2">
              <button
                onClick={handleExportSVG}
                className="w-full flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export as SVG
              </button>
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                resetToDefaults();
                setShowSettings(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setShowSettings(false)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
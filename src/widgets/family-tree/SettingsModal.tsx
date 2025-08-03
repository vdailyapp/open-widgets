import React, { useState } from 'react';
import { X, Download, Upload, Moon, Sun, Eye, EyeOff, Trash2, FileJson, Image as ImageIcon } from 'lucide-react';
import { useFamilyTreeStore } from './store';
import { exportToJSON, exportToSVG } from './utils';
import html2canvas from 'html2canvas';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { 
    settings, 
    updateSettings, 
    exportData, 
    loadData, 
    clearData,
    members,
    relationships 
  } = useFamilyTreeStore();
  
  const [importData, setImportData] = useState('');
  const [importError, setImportError] = useState('');
  
  const handleExportJSON = () => {
    const data = exportData();
    const jsonString = exportToJSON(data.members, data.relationships);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'family-tree.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleExportPNG = async () => {
    const treeElement = document.getElementById('family-tree-canvas');
    if (!treeElement) return;
    
    try {
      const canvas = await html2canvas(treeElement, {
        backgroundColor: settings.theme === 'dark' ? '#1f2937' : '#ffffff',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = 'family-tree.png';
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error exporting PNG:', error);
      alert('Error exporting PNG. Please try again.');
    }
  };
  
  const handleExportSVG = () => {
    const svgElement = document.querySelector('#family-tree-canvas svg') as SVGSVGElement;
    if (!svgElement) {
      alert('No SVG found to export');
      return;
    }
    
    try {
      const svgString = exportToSVG(svgElement);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'family-tree.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting SVG:', error);
      alert('Error exporting SVG. Please try again.');
    }
  };
  
  const handleImportJSON = () => {
    try {
      const data = JSON.parse(importData);
      
      // Validate data structure
      if (!data.members || !Array.isArray(data.members)) {
        throw new Error('Invalid data: members array is required');
      }
      if (!data.relationships || !Array.isArray(data.relationships)) {
        throw new Error('Invalid data: relationships array is required');
      }
      
      // Basic validation of member structure
      data.members.forEach((member: any, index: number) => {
        if (!member.id || !member.name) {
          throw new Error(`Invalid member at index ${index}: id and name are required`);
        }
      });
      
      loadData(data);
      setImportData('');
      setImportError('');
      alert('Family tree data imported successfully!');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Invalid JSON format');
    }
  };
  
  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all family tree data? This cannot be undone.')) {
      clearData();
      alert('All data has been cleared.');
    }
  };
  
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Display Settings */}
          <div>
            <h3 className="font-medium mb-3">Display Settings</h3>
            <div className="space-y-3">
              {/* Theme */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  {settings.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  Dark Mode
                </label>
                <button
                  onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              {/* Show Photos */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  {settings.showPhotos ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  Show Photos
                </label>
                <button
                  onClick={() => updateSettings({ showPhotos: !settings.showPhotos })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.showPhotos ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.showPhotos ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              {/* Show Dates */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  {settings.showDates ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  Show Dates
                </label>
                <button
                  onClick={() => updateSettings({ showDates: !settings.showDates })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.showDates ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.showDates ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              {/* Show Notes */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  {settings.showNotes ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  Show Notes in Tooltips
                </label>
                <button
                  onClick={() => updateSettings({ showNotes: !settings.showNotes })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.showNotes ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.showNotes ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Layout Settings */}
          <div>
            <h3 className="font-medium mb-3">Layout Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Node Spacing</label>
                <input
                  type="range"
                  min="100"
                  max="300"
                  value={settings.nodeSpacing}
                  onChange={(e) => updateSettings({ nodeSpacing: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-center">{settings.nodeSpacing}px</div>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-1">Generation Spacing</label>
                <input
                  type="range"
                  min="100"
                  max="250"
                  value={settings.generationSpacing}
                  onChange={(e) => updateSettings({ generationSpacing: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-center">{settings.generationSpacing}px</div>
              </div>
            </div>
          </div>
          
          {/* Export Options */}
          <div>
            <h3 className="font-medium mb-3">Export</h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleExportJSON}
                className="flex items-center justify-center gap-1 p-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                disabled={members.length === 0}
              >
                <FileJson className="w-4 h-4" />
                JSON
              </button>
              <button
                onClick={handleExportPNG}
                className="flex items-center justify-center gap-1 p-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                disabled={members.length === 0}
              >
                <ImageIcon className="w-4 h-4" />
                PNG
              </button>
              <button
                onClick={handleExportSVG}
                className="flex items-center justify-center gap-1 p-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                disabled={members.length === 0}
              >
                <Download className="w-4 h-4" />
                SVG
              </button>
            </div>
          </div>
          
          {/* Import */}
          <div>
            <h3 className="font-medium mb-3">Import</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Import from file</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="w-full text-sm"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-1">Or paste JSON data</label>
                <textarea
                  value={importData}
                  onChange={(e) => {
                    setImportData(e.target.value);
                    setImportError('');
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md h-24 text-xs font-mono"
                  placeholder="Paste JSON data here..."
                />
                {importError && (
                  <p className="text-red-500 text-xs mt-1">{importError}</p>
                )}
              </div>
              
              <button
                onClick={handleImportJSON}
                disabled={!importData.trim()}
                className="w-full flex items-center justify-center gap-2 p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-md"
              >
                <Upload className="w-4 h-4" />
                Import Data
              </button>
            </div>
          </div>
          
          {/* Danger Zone */}
          <div>
            <h3 className="font-medium mb-3 text-red-600">Danger Zone</h3>
            <button
              onClick={handleClearData}
              className="w-full flex items-center justify-center gap-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-md"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
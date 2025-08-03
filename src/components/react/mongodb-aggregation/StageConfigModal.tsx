import React, { useState, useEffect } from 'react';
import { X, Save, HelpCircle } from 'lucide-react';
import { useMongoDBAggregationStore } from './store';
import { getStageConfig, formatJson, parseJsonSafely } from './utils';
import type { ConfigField } from './types';

interface StageConfigModalProps {
  stageId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const StageConfigModal: React.FC<StageConfigModalProps> = ({ stageId, isOpen, onClose }) => {
  const { pipeline, updateStage } = useMongoDBAggregationStore();
  const [config, setConfig] = useState<Record<string, any>>({});
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [jsonConfig, setJsonConfig] = useState('');

  const stage = stageId ? pipeline.stages.find(s => s.id === stageId) : null;
  const stageConfig = stage ? getStageConfig(stage.type) : null;

  useEffect(() => {
    if (stage && stageConfig) {
      const stageConfigData = stage.config[stage.type] || {};
      setConfig(stageConfigData);
      setJsonConfig(formatJson(stageConfigData));
    }
  }, [stage, stageConfig]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSave = () => {
    if (!stage) return;

    let finalConfig = config;
    
    if (isJsonMode) {
      try {
        finalConfig = parseJsonSafely(jsonConfig) || config;
      } catch (error) {
        console.error('Invalid JSON configuration:', error);
        return;
      }
    }

    updateStage(stage.id, { [stage.type]: finalConfig });
    onClose();
  };

  const handleJsonModeToggle = () => {
    if (!isJsonMode) {
      // Switching to JSON mode - update JSON with current config
      setJsonConfig(formatJson(config));
    } else {
      // Switching to form mode - try to parse JSON back to config
      try {
        const parsed = parseJsonSafely(jsonConfig);
        if (parsed) {
          setConfig(parsed);
        }
      } catch (error) {
        console.error('Invalid JSON, keeping form data');
      }
    }
    setIsJsonMode(!isJsonMode);
  };

  const renderFieldInput = (field: ConfigField) => {
    const value = config[field.name] || '';

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, Number(e.target.value) || 0)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{field.label}</span>
          </label>
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'object':
      case 'array':
        return (
          <textarea
            value={typeof value === 'string' ? value : formatJson(value)}
            onChange={(e) => {
              try {
                const parsed = parseJsonSafely(e.target.value);
                handleFieldChange(field.name, parsed || e.target.value);
              } catch {
                handleFieldChange(field.name, e.target.value);
              }
            }}
            placeholder={field.placeholder}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  if (!isOpen || !stage || !stageConfig) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{stageConfig.icon}</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Configure {stageConfig.title} Stage
              </h2>
              <p className="text-sm text-gray-600 mt-1">{stageConfig.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-800">Configuration</h3>
            <button
              onClick={handleJsonModeToggle}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                isJsonMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isJsonMode ? 'Form Mode' : 'JSON Mode'}
            </button>
          </div>

          {isJsonMode ? (
            /* JSON Editor */
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Stage Configuration (JSON)
              </label>
              <textarea
                value={jsonConfig}
                onChange={(e) => setJsonConfig(e.target.value)}
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter JSON configuration..."
              />
              <p className="text-xs text-gray-500">
                Edit the configuration as JSON. Switch back to form mode to use the guided interface.
              </p>
            </div>
          ) : (
            /* Form Fields */
            <div className="space-y-6">
              {stageConfig.configSchema.map((field) => (
                <div key={field.name} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.description && (
                      <div className="group relative">
                        <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          {field.description}
                        </div>
                      </div>
                    )}
                  </div>
                  {renderFieldInput(field)}
                  {field.description && (
                    <p className="text-xs text-gray-500">{field.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            Stage ID: {stage.id}
          </div>
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StageConfigModal;
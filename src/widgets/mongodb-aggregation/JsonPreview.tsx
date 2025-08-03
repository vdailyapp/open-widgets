import React, { useState } from 'react';
import { X, Copy, Download, Upload, Play } from 'lucide-react';
import { useMongoDBAggregationStore } from './store';
import { formatJson, parseJsonSafely } from './utils';

interface JsonPreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

const JsonPreview: React.FC<JsonPreviewProps> = ({ isOpen, onClose }) => {
  const {
    jsonPreview,
    isJsonMode,
    setJsonMode,
    updateJsonPreview,
    syncFromJson,
    exportPipeline,
    importPipeline,
    resetPipeline,
    sampleData,
    settings,
  } = useMongoDBAggregationStore();

  const [editableJson, setEditableJson] = useState(jsonPreview);
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [executeResult, setExecuteResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setEditableJson(jsonPreview);
    }
  }, [isOpen, jsonPreview]);

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableJson(e.target.value);
  };

  const handleApplyJson = () => {
    updateJsonPreview(editableJson);
    syncFromJson();
    setJsonMode(false);
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonPreview);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([jsonPreview], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mongodb-pipeline.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    if (importText.trim()) {
      try {
        const parsed = parseJsonSafely(importText);
        if (parsed) {
          importPipeline(importText);
          setImportText('');
          setShowImport(false);
        }
      } catch (error) {
        console.error('Invalid JSON:', error);
      }
    }
  };

  const handleExecutePipeline = async () => {
    if (!settings.sampleDataEnabled || !sampleData.length) {
      return;
    }

    setIsExecuting(true);
    try {
      // Simulate pipeline execution on sample data
      const pipeline = parseJsonSafely(jsonPreview);
      if (pipeline && Array.isArray(pipeline)) {
        let result = [...sampleData];
        
        // Simple simulation of some common operations
        for (const stage of pipeline) {
          const stageType = Object.keys(stage)[0];
          const stageConfig = stage[stageType];
          
          switch (stageType) {
            case '$match':
              result = result.filter(doc => {
                // Simple matching logic
                for (const [key, value] of Object.entries(stageConfig)) {
                  if (typeof value === 'object' && value !== null) {
                    // Handle operators like $gte, $lt, etc.
                    for (const [op, opValue] of Object.entries(value as any)) {
                      if (op === '$gte' && doc[key] < opValue) return false;
                      if (op === '$lt' && doc[key] >= opValue) return false;
                      if (op === '$eq' && doc[key] !== opValue) return false;
                    }
                  } else {
                    if (doc[key] !== value) return false;
                  }
                }
                return true;
              });
              break;
              
            case '$limit':
              result = result.slice(0, stageConfig);
              break;
              
            case '$sort':
              result.sort((a, b) => {
                for (const [key, order] of Object.entries(stageConfig)) {
                  const aVal = a[key];
                  const bVal = b[key];
                  if (aVal < bVal) return order === 1 ? -1 : 1;
                  if (aVal > bVal) return order === 1 ? 1 : -1;
                }
                return 0;
              });
              break;
              
            case '$project':
              result = result.map(doc => {
                const projected: any = {};
                for (const [key, include] of Object.entries(stageConfig)) {
                  if (include === 1) {
                    projected[key] = doc[key];
                  }
                }
                return projected;
              });
              break;
          }
        }
        
        setExecuteResult(result);
      }
    } catch (error) {
      console.error('Execution error:', error);
      setExecuteResult({ error: 'Failed to execute pipeline' });
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            MongoDB Aggregation Pipeline
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyJson}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              title="Copy JSON"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportJson}
              className="p-2 text-gray-600 hover:text-green-600 transition-colors"
              title="Export JSON"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowImport(!showImport)}
              className="p-2 text-gray-600 hover:text-purple-600 transition-colors"
              title="Import JSON"
            >
              <Upload className="w-4 h-4" />
            </button>
            {settings.sampleDataEnabled && (
              <button
                onClick={handleExecutePipeline}
                disabled={isExecuting}
                className="p-2 text-gray-600 hover:text-orange-600 transition-colors disabled:opacity-50"
                title="Execute on sample data"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Import Section */}
        {showImport && (
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Import Pipeline</h3>
            <div className="flex space-x-2">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste MongoDB aggregation pipeline JSON here..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm resize-none"
                rows={3}
              />
              <button
                onClick={handleImportJson}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
              >
                Import
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* JSON Editor */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700">Pipeline JSON</h3>
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1 text-sm">
                  <input
                    type="checkbox"
                    checked={isJsonMode}
                    onChange={(e) => setJsonMode(e.target.checked)}
                    className="rounded"
                  />
                  <span>Edit mode</span>
                </label>
                {isJsonMode && (
                  <button
                    onClick={handleApplyJson}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              {isJsonMode ? (
                <textarea
                  value={editableJson}
                  onChange={handleJsonChange}
                  className="w-full h-full font-mono text-sm border border-gray-300 rounded p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="MongoDB aggregation pipeline..."
                />
              ) : (
                <pre className="w-full h-full font-mono text-sm text-gray-800 overflow-auto">
                  {formatJson(parseJsonSafely(jsonPreview) || [])}
                </pre>
              )}
            </div>
          </div>

          {/* Execution Results */}
          {settings.sampleDataEnabled && (
            <div className="w-1/2 border-l flex flex-col">
              <div className="p-3 border-b bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700">Execution Result</h3>
              </div>
              <div className="flex-1 p-4 overflow-auto">
                {isExecuting ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : executeResult ? (
                  <pre className="font-mono text-sm text-gray-800">
                    {formatJson(executeResult)}
                  </pre>
                ) : (
                  <div className="text-center text-gray-500 text-sm">
                    <p>Click the play button to execute the pipeline on sample data</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={resetPipeline}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition-colors text-sm"
            >
              Reset Pipeline
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default JsonPreview;
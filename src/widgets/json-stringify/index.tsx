import React, { useState, useEffect } from 'react';
import { Copy, Settings, Check, AlertCircle, Moon, Sun } from 'lucide-react';

interface JsonStringifyConfig {
  indentation: number;
  darkMode: boolean;
}

const JsonStringifyWidget: React.FC = () => {
  const [inputJson, setInputJson] = useState('');
  const [outputString, setOutputString] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<JsonStringifyConfig>({
    indentation: 2,
    darkMode: false,
  });

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('json-stringify-config');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('Failed to load config:', e);
      }
    }

    // Load saved input
    const savedInput = localStorage.getItem('json-stringify-input');
    if (savedInput) {
      setInputJson(savedInput);
    }
  }, []);

  // Save config to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('json-stringify-config', JSON.stringify(config));
  }, [config]);

  // Save input to localStorage
  useEffect(() => {
    localStorage.setItem('json-stringify-input', inputJson);
  }, [inputJson]);

  // Listen for postMessage config updates
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'json-stringify-config') {
        setConfig((prev) => ({
          ...prev,
          ...event.data.config,
        }));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Stringify JSON whenever input or config changes
  useEffect(() => {
    if (!inputJson.trim()) {
      setOutputString('');
      setError('');
      return;
    }

    try {
      const parsed = JSON.parse(inputJson);
      const indentSpaces = config.indentation === 0 ? undefined : config.indentation;
      const stringified = JSON.stringify(parsed, null, indentSpaces);
      setOutputString(stringified);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
      setOutputString('');
    }
  }, [inputJson, config.indentation]);

  const handleCopy = async () => {
    if (outputString) {
      try {
        await navigator.clipboard.writeText(outputString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error('Failed to copy:', e);
      }
    }
  };

  const toggleDarkMode = () => {
    setConfig((prev) => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const handleIndentationChange = (indent: number) => {
    setConfig((prev) => ({ ...prev, indentation: indent }));
  };

  const bgClass = config.darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const textClass = config.darkMode ? 'text-gray-100' : 'text-gray-900';
  const cardClass = config.darkMode ? 'bg-gray-800' : 'bg-white';
  const inputClass = config.darkMode
    ? 'bg-gray-700 text-gray-100 border-gray-600'
    : 'bg-white text-gray-900 border-gray-300';

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} p-4 transition-colors`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">JSON Stringify Tool</h1>
            <div className="flex gap-2">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${
                  config.darkMode
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
                aria-label="Toggle dark mode"
              >
                {config.darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${
                  config.darkMode
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
                aria-label="Settings"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
          <p className={config.darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Paste your JSON object to stringify it with custom formatting
          </p>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className={`${cardClass} rounded-lg shadow-lg p-4 mb-4`}>
            <h2 className="text-xl font-semibold mb-3">Settings</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Indentation (spaces)
                </label>
                <div className="flex gap-2">
                  {[0, 2, 4].map((indent) => (
                    <button
                      key={indent}
                      onClick={() => handleIndentationChange(indent)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        config.indentation === indent
                          ? config.darkMode
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-500 text-white'
                          : config.darkMode
                          ? 'bg-gray-700 hover:bg-gray-600'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      {indent === 0 ? 'Compact' : `${indent} spaces`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Input Section */}
          <div className={`${cardClass} rounded-lg shadow-lg p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Input JSON</h2>
              {error && (
                <div className="flex items-center gap-1 text-red-500 text-sm">
                  <AlertCircle size={16} />
                  <span>Invalid JSON</span>
                </div>
              )}
            </div>
            <textarea
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              placeholder='{"key": "value", "number": 123}'
              className={`w-full h-96 p-3 rounded-lg border ${inputClass} font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {error && (
              <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Output Section */}
          <div className={`${cardClass} rounded-lg shadow-lg p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Stringified Output</h2>
              <button
                onClick={handleCopy}
                disabled={!outputString}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  outputString
                    ? config.darkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                    : config.darkMode
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy
                  </>
                )}
              </button>
            </div>
            <textarea
              value={outputString}
              readOnly
              placeholder="Stringified JSON will appear here..."
              className={`w-full h-96 p-3 rounded-lg border ${inputClass} font-mono text-sm resize-none focus:outline-none`}
            />
            {outputString && (
              <div
                className={`mt-2 text-sm ${
                  config.darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Length: {outputString.length} characters
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className={`${cardClass} rounded-lg shadow-lg p-4 mt-4`}>
          <h3 className="text-lg font-semibold mb-2">Features</h3>
          <ul className={`space-y-1 text-sm ${config.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <li>✅ Real-time JSON validation and stringification</li>
            <li>✅ Customizable indentation (compact, 2 spaces, 4 spaces)</li>
            <li>✅ Copy to clipboard functionality</li>
            <li>✅ Dark mode support</li>
            <li>✅ Persistent state using localStorage</li>
            <li>✅ PostMessage API support for external configuration</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default JsonStringifyWidget;

import React, { useState, useEffect, useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import {
  Upload,
  Download,
  Settings,
  Moon,
  Sun,
  Copy,
  Check,
  FileText,
  Terminal,
  X,
} from 'lucide-react';

// Configure Monaco loader to use local files
loader.config({ monaco });

interface DiffEditorConfig {
  darkMode: boolean;
  fontSize: number;
  lineNumbers: boolean;
}

const DiffEditorWidget: React.FC = () => {
  const [originalContent, setOriginalContent] = useState('');
  const [modifiedContent, setModifiedContent] = useState('');
  const [diffContent, setDiffContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [commandCopied, setCommandCopied] = useState(false);
  const [config, setConfig] = useState<DiffEditorConfig>({
    darkMode: false,
    fontSize: 14,
    lineNumbers: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('diff-editor-config');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('Failed to load config:', e);
      }
    }

    // Load saved content
    const savedDiff = localStorage.getItem('diff-editor-content');
    const savedFileName = localStorage.getItem('diff-editor-filename');
    if (savedDiff) {
      setDiffContent(savedDiff);
      parseDiff(savedDiff);
    }
    if (savedFileName) {
      setFileName(savedFileName);
    }
  }, []);

  // Save config to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('diff-editor-config', JSON.stringify(config));
  }, [config]);

  // Save content to localStorage
  useEffect(() => {
    if (diffContent) {
      localStorage.setItem('diff-editor-content', diffContent);
    }
  }, [diffContent]);

  useEffect(() => {
    if (fileName) {
      localStorage.setItem('diff-editor-filename', fileName);
    }
  }, [fileName]);

  // Listen for postMessage config updates
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'diff-editor-config') {
        setConfig((prev) => ({
          ...prev,
          ...event.data.config,
        }));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const parseDiff = (content: string) => {
    // Simple diff parser - extracts original and modified content
    const lines = content.split('\n');
    let original: string[] = [];
    let modified: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('@@')) {
        continue;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        original.push(line.substring(1));
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        modified.push(line.substring(1));
      } else if (line.startsWith(' ')) {
        original.push(line.substring(1));
        modified.push(line.substring(1));
      } else {
        // Context line
        original.push(line);
        modified.push(line);
      }
    }

    setOriginalContent(original.join('\n'));
    setModifiedContent(modified.join('\n'));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setDiffContent(content);
        parseDiff(content);
      };
      reader.readAsText(file);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setModifiedContent(value);
      // Regenerate diff when modified content changes
      regenerateDiff(originalContent, value);
    }
  };

  const regenerateDiff = (original: string, modified: string) => {
    // Simple unified diff generation
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    
    const diff: string[] = [];
    diff.push('--- a/' + (fileName || 'original'));
    diff.push('+++ b/' + (fileName || 'modified'));
    diff.push('@@ -1,' + originalLines.length + ' +1,' + modifiedLines.length + ' @@');
    
    const maxLen = Math.max(originalLines.length, modifiedLines.length);
    for (let i = 0; i < maxLen; i++) {
      const origLine = originalLines[i];
      const modLine = modifiedLines[i];
      
      if (origLine === modLine) {
        if (origLine !== undefined) {
          diff.push(' ' + origLine);
        }
      } else {
        if (origLine !== undefined) {
          diff.push('-' + origLine);
        }
        if (modLine !== undefined) {
          diff.push('+' + modLine);
        }
      }
    }
    
    setDiffContent(diff.join('\n'));
  };

  const handleDownload = () => {
    const blob = new Blob([diffContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'changes.diff';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyDiff = async () => {
    try {
      await navigator.clipboard.writeText(diffContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const getApplyCommand = () => {
    const filename = fileName || 'changes.diff';
    return `# Apply this diff using one of these commands:\ngit apply ${filename}\n# or\npatch -p1 < ${filename}`;
  };

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(getApplyCommand());
      setCommandCopied(true);
      setTimeout(() => setCommandCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const toggleDarkMode = () => {
    setConfig((prev) => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const bgClass = config.darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const textClass = config.darkMode ? 'text-gray-100' : 'text-gray-900';
  const cardClass = config.darkMode ? 'bg-gray-800' : 'bg-white';
  const borderClass = config.darkMode ? 'border-gray-700' : 'border-gray-300';

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} transition-colors`}>
      {/* Header */}
      <div className="p-4 border-b ${borderClass}">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Diff Editor</h1>
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
            Upload, edit, and export diff files with Monaco editor
          </p>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${cardClass} rounded-lg shadow-xl p-6 max-w-md w-full mx-4`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className={`p-1 rounded hover:${config.darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Font Size</label>
                <div className="flex gap-2">
                  {[12, 14, 16, 18].map((size) => (
                    <button
                      key={size}
                      onClick={() => setConfig((prev) => ({ ...prev, fontSize: size }))}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        config.fontSize === size
                          ? config.darkMode
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-500 text-white'
                          : config.darkMode
                          ? 'bg-gray-700 hover:bg-gray-600'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.lineNumbers}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, lineNumbers: e.target.checked }))
                    }
                    className="w-4 h-4"
                  />
                  <span>Show line numbers</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".diff,.patch"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              config.darkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Upload size={18} />
            Upload Diff
          </button>
          <button
            onClick={handleDownload}
            disabled={!diffContent}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              diffContent
                ? config.darkMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
                : config.darkMode
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Download size={18} />
            Export Diff
          </button>
          <button
            onClick={handleCopyDiff}
            disabled={!diffContent}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              diffContent
                ? config.darkMode
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
                : config.darkMode
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {copied ? (
              <>
                <Check size={18} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={18} />
                Copy Diff
              </>
            )}
          </button>
        </div>

        {fileName && (
          <div className={`${cardClass} rounded-lg p-3 mb-4 flex items-center gap-2`}>
            <FileText size={18} className={config.darkMode ? 'text-gray-400' : 'text-gray-600'} />
            <span className="font-medium">{fileName}</span>
          </div>
        )}

        {/* Editor Area */}
        {diffContent ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Original */}
            <div className={`${cardClass} rounded-lg shadow-lg overflow-hidden`}>
              <div className="px-4 py-2 border-b ${borderClass}">
                <h3 className="font-semibold">Original</h3>
              </div>
              <Editor
                height="500px"
                language="plaintext"
                value={originalContent}
                theme={config.darkMode ? 'vs-dark' : 'light'}
                options={{
                  readOnly: true,
                  fontSize: config.fontSize,
                  lineNumbers: config.lineNumbers ? 'on' : 'off',
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                }}
              />
            </div>

            {/* Modified */}
            <div className={`${cardClass} rounded-lg shadow-lg overflow-hidden`}>
              <div className="px-4 py-2 border-b ${borderClass}">
                <h3 className="font-semibold">Modified (Editable)</h3>
              </div>
              <Editor
                height="500px"
                language="plaintext"
                value={modifiedContent}
                onChange={handleEditorChange}
                theme={config.darkMode ? 'vs-dark' : 'light'}
                options={{
                  fontSize: config.fontSize,
                  lineNumbers: config.lineNumbers ? 'on' : 'off',
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </div>
        ) : (
          <div
            className={`${cardClass} rounded-lg shadow-lg p-12 text-center ${borderClass} border-2 border-dashed`}
          >
            <Upload size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl font-semibold mb-2">No diff file loaded</p>
            <p className={config.darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Upload a .diff or .patch file to get started
            </p>
          </div>
        )}

        {/* Diff Preview */}
        {diffContent && (
          <div className={`${cardClass} rounded-lg shadow-lg overflow-hidden mb-4`}>
            <div className="px-4 py-2 border-b ${borderClass}">
              <h3 className="font-semibold">Unified Diff</h3>
            </div>
            <Editor
              height="300px"
              language="diff"
              value={diffContent}
              theme={config.darkMode ? 'vs-dark' : 'light'}
              options={{
                readOnly: true,
                fontSize: config.fontSize,
                lineNumbers: config.lineNumbers ? 'on' : 'off',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        )}

        {/* Apply Command */}
        {diffContent && (
          <div className={`${cardClass} rounded-lg shadow-lg p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Terminal size={20} />
                <h3 className="font-semibold">Apply Command</h3>
              </div>
              <button
                onClick={handleCopyCommand}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors text-sm ${
                  config.darkMode
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {commandCopied ? (
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
            <pre
              className={`p-3 rounded-lg overflow-x-auto text-sm font-mono ${
                config.darkMode ? 'bg-gray-900' : 'bg-gray-100'
              }`}
            >
              {getApplyCommand()}
            </pre>
          </div>
        )}

        {/* Info Section */}
        <div className={`${cardClass} rounded-lg shadow-lg p-4 mt-4`}>
          <h3 className="text-lg font-semibold mb-2">Features</h3>
          <ul
            className={`space-y-1 text-sm ${config.darkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            <li>✅ Upload and parse .diff and .patch files</li>
            <li>✅ Side-by-side original and modified view</li>
            <li>✅ Edit modified content with Monaco editor</li>
            <li>✅ Live unified diff preview</li>
            <li>✅ Export edited diff file</li>
            <li>✅ Copy command snippets to apply diff</li>
            <li>✅ Dark mode support</li>
            <li>✅ Persistent state using localStorage</li>
            <li>✅ PostMessage API support for external configuration</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DiffEditorWidget;

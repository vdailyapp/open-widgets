import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Settings, 
  Eye, 
  EyeOff, 
  Download, 
  Play, 
  Copy, 
  Layers, 
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Moon,
  Sun,
  X
} from 'lucide-react';

// Types for Dockerfile parsing
interface DockerfileInstruction {
  id: string;
  line: number;
  instruction: string;
  args: string;
  stage?: string;
  description?: string;
  estimatedSize?: string;
}

interface DockerfileBuildStage {
  id: string;
  name: string;
  baseImage: string;
  instructions: DockerfileInstruction[];
  dependencies: string[];
}

interface DockerfileParseResult {
  stages: DockerfileBuildStage[];
  instructions: DockerfileInstruction[];
  isMultiStage: boolean;
}

interface WidgetConfig {
  darkMode: boolean;
  showRawView: boolean;
  showEstimatedSizes: boolean;
  autoParseOnInput: boolean;
}

const DockerfileWidget = () => {
  // Core state
  const [dockerfileContent, setDockerfileContent] = useState('');
  const [parsedDockerfile, setParsedDockerfile] = useState<DockerfileParseResult | null>(null);
  const [selectedInstruction, setSelectedInstruction] = useState<DockerfileInstruction | null>(null);
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<WidgetConfig>({
    darkMode: false,
    showRawView: false,
    showEstimatedSizes: false,
    autoParseOnInput: true
  });
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load persisted state on mount
  useEffect(() => {
    const savedContent = localStorage.getItem('dockerfile-widget-content');
    const savedConfig = localStorage.getItem('dockerfile-widget-config');
    
    if (savedContent) {
      setDockerfileContent(savedContent);
    }
    
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.warn('Failed to parse saved config:', e);
      }
    }

    // Listen for iframe postMessage
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'dockerfile-widget-config') {
        const { dockerfile, config: newConfig } = event.data.payload;
        if (dockerfile) setDockerfileContent(dockerfile);
        if (newConfig) setConfig(prev => ({ ...prev, ...newConfig }));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('dockerfile-widget-content', dockerfileContent);
  }, [dockerfileContent]);

  useEffect(() => {
    localStorage.setItem('dockerfile-widget-config', JSON.stringify(config));
  }, [config]);

  // Auto-parse Dockerfile when content changes
  useEffect(() => {
    if (config.autoParseOnInput && dockerfileContent.trim()) {
      parseDockerfile(dockerfileContent);
    }
  }, [dockerfileContent, config.autoParseOnInput]);

  // Dockerfile parsing function
  const parseDockerfile = (content: string) => {
    const lines = content.split('\n');
    const stages: DockerfileBuildStage[] = [];
    const allInstructions: DockerfileInstruction[] = [];
    let currentStage: DockerfileBuildStage | null = null;
    let lineNumber = 0;

    for (const rawLine of lines) {
      lineNumber++;
      const line = rawLine.trim();
      
      // Skip empty lines and comments
      if (!line || line.startsWith('#')) continue;

      // Parse instruction
      const match = line.match(/^(\w+)\s+(.*)$/);
      if (!match) continue;

      const [, instruction, args] = match;
      const instructionObj: DockerfileInstruction = {
        id: `${lineNumber}-${instruction}`,
        line: lineNumber,
        instruction: instruction.toUpperCase(),
        args: args,
        description: getInstructionDescription(instruction.toUpperCase(), args),
        estimatedSize: estimateInstructionSize(instruction.toUpperCase(), args)
      };

      // Handle multi-stage builds
      if (instruction.toUpperCase() === 'FROM') {
        const stageMatch = args.match(/.*\s+AS\s+(\w+)/i);
        const stageName = stageMatch ? stageMatch[1] : `stage-${stages.length}`;
        const baseImage = stageMatch ? args.replace(/\s+AS\s+\w+/i, '').trim() : args;

        currentStage = {
          id: stageName,
          name: stageName,
          baseImage,
          instructions: [instructionObj],
          dependencies: getImageDependencies(baseImage, stages)
        };
        
        instructionObj.stage = stageName;
        stages.push(currentStage);
      } else if (currentStage) {
        instructionObj.stage = currentStage.name;
        currentStage.instructions.push(instructionObj);
      }

      allInstructions.push(instructionObj);
    }

    setParsedDockerfile({
      stages,
      instructions: allInstructions,
      isMultiStage: stages.length > 1
    });

    // Expand all stages by default
    setExpandedStages(new Set(stages.map(s => s.id)));
  };

  // Helper functions
  const getInstructionDescription = (instruction: string, args: string): string => {
    const descriptions: Record<string, string> = {
      'FROM': `Base image: ${args}`,
      'RUN': `Execute command in container`,
      'COPY': `Copy files from build context`,
      'ADD': `Add files (with extraction support)`,
      'WORKDIR': `Set working directory to ${args}`,
      'ENV': `Set environment variable`,
      'EXPOSE': `Expose port ${args}`,
      'CMD': `Default command to run`,
      'ENTRYPOINT': `Container entry point`,
      'VOLUME': `Create mount point`,
      'USER': `Switch to user ${args}`,
      'LABEL': `Add metadata label`,
      'ARG': `Build-time variable`,
      'ONBUILD': `Trigger for downstream builds`,
      'STOPSIGNAL': `Signal to stop container`,
      'HEALTHCHECK': `Container health check`,
      'SHELL': `Default shell for RUN commands`
    };
    return descriptions[instruction] || `${instruction} instruction`;
  };

  const estimateInstructionSize = (instruction: string, args: string): string => {
    // Simplified size estimation
    const sizeEstimates: Record<string, string> = {
      'FROM': '~100MB',
      'RUN': '~10-50MB',
      'COPY': '~1-10MB',
      'ADD': '~1-20MB',
      'WORKDIR': '~0MB',
      'ENV': '~0MB',
      'EXPOSE': '~0MB',
      'CMD': '~0MB',
      'ENTRYPOINT': '~0MB',
      'VOLUME': '~0MB',
      'USER': '~0MB',
      'LABEL': '~0MB'
    };
    return sizeEstimates[instruction] || '~Unknown';
  };

  const getImageDependencies = (baseImage: string, existingStages: DockerfileBuildStage[]): string[] => {
    // Check if base image references another stage
    const referencedStage = existingStages.find(stage => 
      baseImage.includes(stage.name) || baseImage.includes(stage.id)
    );
    return referencedStage ? [referencedStage.id] : [];
  };

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setDockerfileContent(content);
      };
      reader.readAsText(file);
    }
  };

  // Export functionality
  const exportAsText = () => {
    const blob = new Blob([dockerfileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Dockerfile';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleStageExpansion = (stageId: string) => {
    setExpandedStages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stageId)) {
        newSet.delete(stageId);
      } else {
        newSet.add(stageId);
      }
      return newSet;
    });
  };

  // Sample Dockerfile for demonstration
  const loadSampleDockerfile = () => {
    const sample = `# Multi-stage Node.js application
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine AS production
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist .
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;
    
    setDockerfileContent(sample);
  };

  return (
    <div className={`w-full h-screen flex flex-col ${config.darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b p-4 flex items-center justify-between ${config.darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center gap-2">
          <Layers className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-bold">Dockerfile Visualizer</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <button
            onClick={() => setConfig(prev => ({ ...prev, showRawView: !prev.showRawView }))}
            className={`px-3 py-1 rounded-md flex items-center gap-1 ${
              config.showRawView 
                ? 'bg-blue-500 text-white' 
                : config.darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {config.showRawView ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {config.showRawView ? 'Visual' : 'Raw'}
          </button>

          {/* Export Button */}
          <button
            onClick={exportAsText}
            disabled={!dockerfileContent}
            className={`px-3 py-1 rounded-md flex items-center gap-1 ${
              dockerfileContent 
                ? config.darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Input Panel */}
        <div className={`w-1/2 border-r flex flex-col ${config.darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          {/* Input Controls */}
          <div className={`p-4 border-b flex gap-2 ${config.darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`px-3 py-2 rounded-md flex items-center gap-2 ${
                config.darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
            
            <button
              onClick={loadSampleDockerfile}
              className={`px-3 py-2 rounded-md flex items-center gap-2 ${
                config.darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <FileText className="w-4 h-4" />
              Sample
            </button>
            
            <button
              onClick={() => parseDockerfile(dockerfileContent)}
              disabled={!dockerfileContent.trim()}
              className={`px-3 py-2 rounded-md flex items-center gap-2 ${
                dockerfileContent.trim()
                  ? config.darkMode ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4" />
              Parse
            </button>
          </div>
          
          {/* Text Input */}
          <div className="flex-1 p-4">
            <textarea
              value={dockerfileContent}
              onChange={(e) => setDockerfileContent(e.target.value)}
              placeholder="Paste your Dockerfile content here or upload a file..."
              className={`w-full h-full p-3 font-mono text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                config.darkMode 
                  ? 'bg-gray-800 border-gray-600 text-gray-100' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </div>

        {/* Visualization Panel */}
        <div className="w-1/2 flex flex-col">
          {config.showRawView ? (
            /* Raw View */
            <div className="flex-1 p-4">
              <pre className={`w-full h-full p-3 font-mono text-sm border rounded-md overflow-auto ${
                config.darkMode 
                  ? 'bg-gray-800 border-gray-600 text-gray-100' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}>
                {dockerfileContent || 'No Dockerfile content to display'}
              </pre>
            </div>
          ) : (
            /* Visual View */
            <div className="flex-1 overflow-auto p-4">
              {parsedDockerfile ? (
                <div className="space-y-4">
                  {/* Multi-stage Overview */}
                  {parsedDockerfile.isMultiStage && (
                    <div className={`p-4 rounded-lg border ${
                      config.darkMode ? 'bg-gray-800 border-gray-600' : 'bg-blue-50 border-blue-200'
                    }`}>
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <Layers className="w-5 h-5" />
                        Multi-stage Build ({parsedDockerfile.stages.length} stages)
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        {parsedDockerfile.stages.map((stage, index) => (
                          <div key={stage.id} className="flex items-center gap-1">
                            <div className={`px-2 py-1 rounded text-sm ${
                              config.darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white border'
                            }`}>
                              {stage.name}
                            </div>
                            {index < parsedDockerfile.stages.length - 1 && (
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Build Stages */}
                  {parsedDockerfile.stages.map((stage) => (
                    <div key={stage.id} className={`border rounded-lg ${
                      config.darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
                    }`}>
                      {/* Stage Header */}
                      <div 
                        className={`p-3 border-b cursor-pointer flex items-center justify-between ${
                          config.darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => toggleStageExpansion(stage.id)}
                      >
                        <div className="flex items-center gap-2">
                          {expandedStages.has(stage.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <h4 className="font-semibold">Stage: {stage.name}</h4>
                          <span className={`text-sm px-2 py-1 rounded ${
                            config.darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {stage.baseImage}
                          </span>
                        </div>
                        <span className={`text-sm ${config.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {stage.instructions.length} instructions
                        </span>
                      </div>

                      {/* Stage Instructions */}
                      {expandedStages.has(stage.id) && (
                        <div className="p-3">
                          <div className="space-y-2">
                            {stage.instructions.map((instruction, index) => (
                              <div
                                key={instruction.id}
                                className={`p-3 rounded-md border cursor-pointer transition-all hover:shadow-md ${
                                  selectedInstruction?.id === instruction.id
                                    ? config.darkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
                                    : config.darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => setSelectedInstruction(instruction)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className={`text-xs px-2 py-1 rounded font-mono ${
                                      config.darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {instruction.line}
                                    </span>
                                    <span className="font-mono font-semibold text-blue-600">
                                      {instruction.instruction}
                                    </span>
                                    <span className={`text-sm ${config.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      {instruction.args.length > 50 
                                        ? `${instruction.args.substring(0, 50)}...` 
                                        : instruction.args}
                                    </span>
                                  </div>
                                  {config.showEstimatedSizes && (
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      config.darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {instruction.estimatedSize}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`flex-1 flex items-center justify-center ${
                  config.darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <div className="text-center">
                    <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No Dockerfile parsed yet</p>
                    <p className="text-sm">Upload a Dockerfile or paste content to visualize</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Instruction Details Modal */}
      {selectedInstruction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`max-w-2xl w-full mx-4 rounded-lg shadow-xl ${
            config.darkMode ? 'bg-gray-800 text-white' : 'bg-white'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              config.darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className="text-lg font-semibold">Instruction Details</h3>
              <button
                onClick={() => setSelectedInstruction(null)}
                className={`p-1 rounded-md ${
                  config.darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium opacity-75">Line</label>
                  <div className="text-lg">{selectedInstruction.line}</div>
                </div>
                <div>
                  <label className="text-sm font-medium opacity-75">Instruction</label>
                  <div className="text-lg font-mono font-semibold text-blue-600">
                    {selectedInstruction.instruction}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium opacity-75">Arguments</label>
                  <div className={`font-mono text-sm p-3 rounded-md ${
                    config.darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    {selectedInstruction.args}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium opacity-75">Description</label>
                  <div className="text-sm">{selectedInstruction.description}</div>
                </div>
                {selectedInstruction.stage && (
                  <div>
                    <label className="text-sm font-medium opacity-75">Build Stage</label>
                    <div className="text-sm">{selectedInstruction.stage}</div>
                  </div>
                )}
                {config.showEstimatedSizes && (
                  <div>
                    <label className="text-sm font-medium opacity-75">Estimated Size Impact</label>
                    <div className="text-sm">{selectedInstruction.estimatedSize}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`max-w-md w-full mx-4 rounded-lg shadow-xl ${
            config.darkMode ? 'bg-gray-800 text-white' : 'bg-white'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              config.darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className="text-lg font-semibold">Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className={`p-1 rounded-md ${
                  config.darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Dark Mode</label>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                  className={`p-2 rounded-md ${
                    config.darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {config.darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Show Estimated Sizes</label>
                <input
                  type="checkbox"
                  checked={config.showEstimatedSizes}
                  onChange={(e) => setConfig(prev => ({ ...prev, showEstimatedSizes: e.target.checked }))}
                  className="w-4 h-4"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto-parse on Input</label>
                <input
                  type="checkbox"
                  checked={config.autoParseOnInput}
                  onChange={(e) => setConfig(prev => ({ ...prev, autoParseOnInput: e.target.checked }))}
                  className="w-4 h-4"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Settings Button */}
      <button
        onClick={() => setShowSettings(true)}
        className={`fixed bottom-4 right-4 p-3 rounded-full shadow-lg ${
          config.darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50'
        } border`}
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".dockerfile,Dockerfile,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default DockerfileWidget;
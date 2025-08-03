import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import type { 
  Node,
  Edge,
  Connection,
  EdgeChange,
  NodeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { 
  Plus, 
  Settings, 
  Code, 
  Download, 
  Upload, 
  RotateCcw,
  Zap
} from 'lucide-react';

import { useMongoDBAggregationStore } from './store';
import { getAllStageTypes, getStageConfig, getSamplePipeline } from './utils';
import StageNode from './StageNode';
import JsonPreview from './JsonPreview';
import SettingsModal from './SettingsModal';
import StageConfigModal from './StageConfigModal';
import type { StageType, PostMessageConfig } from './types';

const nodeTypes = {
  stageNode: StageNode,
};

const MongoDBAggregationWidget: React.FC = () => {
  const {
    pipeline,
    settings,
    selectedStage,
    isAddingStage,
    showSettings,
    setSelectedStage,
    setIsAddingStage,
    setShowSettings,
    addStage,
    deleteStage,
    updateStagePosition,
    addConnection,
    removeConnection,
    exportPipeline,
    importPipeline,
    resetPipeline,
    handlePostMessage,
  } = useMongoDBAggregationStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [showStageConfig, setShowStageConfig] = useState(false);
  const [stageToEdit, setStageToEdit] = useState<string | null>(null);
  const [draggedStageType, setDraggedStageType] = useState<StageType | null>(null);

  // Handle postMessage for iframe embedding
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const config: PostMessageConfig = event.data;
        if (config && (config.initialPipeline || config.settings || config.sampleData)) {
          handlePostMessage(config);
        }
      } catch (error) {
        console.warn('Invalid postMessage data:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handlePostMessage]);

  // Sync pipeline stages to React Flow nodes
  useEffect(() => {
    const newNodes: Node[] = pipeline.stages.map((stage) => ({
      id: stage.id,
      type: 'stageNode',
      position: stage.position,
      data: {
        ...stage,
        onEdit: handleEditStage,
        onDelete: handleDeleteStage,
      },
    }));
    setNodes(newNodes);
  }, [pipeline.stages, setNodes]);

  // Sync pipeline connections to React Flow edges
  useEffect(() => {
    const newEdges: Edge[] = pipeline.connections.map((connection) => ({
      id: connection.id,
      source: connection.source,
      target: connection.target,
      type: 'smoothstep',
      animated: true,
    }));
    setEdges(newEdges);
  }, [pipeline.connections, setEdges]);

  const handleNodesChangeWithPosition = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      
      // Update positions in store for dragged nodes
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && change.dragging === false) {
          updateStagePosition(change.id, change.position);
        }
      });
    },
    [onNodesChange, updateStagePosition]
  );

  const handleEdgesChangeWithConnection = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      
      // Handle edge removals
      changes.forEach((change) => {
        if (change.type === 'remove') {
          removeConnection(change.id);
        }
      });
    },
    [onEdgesChange, removeConnection]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        addConnection(connection.source, connection.target);
        setEdges((eds) => addEdge(connection, eds));
      }
    },
    [addConnection, setEdges]
  );

  const handleEditStage = (stageId: string) => {
    setStageToEdit(stageId);
    setShowStageConfig(true);
  };

  const handleDeleteStage = (stageId: string) => {
    deleteStage(stageId);
  };

  const handleAddStage = (stageType: StageType) => {
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
    };
    addStage(stageType, position);
    setIsAddingStage(false);
  };

  const handleDragStart = (event: React.DragEvent, stageType: StageType) => {
    setDraggedStageType(stageType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    
    if (!draggedStageType) return;

    const reactFlowBounds = (event.target as HTMLElement).closest('.react-flow')?.getBoundingClientRect();
    if (!reactFlowBounds) return;

    const position = {
      x: event.clientX - reactFlowBounds.left - 100,
      y: event.clientY - reactFlowBounds.top - 50,
    };

    addStage(draggedStageType, position);
    setDraggedStageType(null);
  };

  const handleLoadSamplePipeline = () => {
    const sampleJson = JSON.stringify(getSamplePipeline(), null, 2);
    importPipeline(sampleJson);
  };

  const handleExportPipeline = () => {
    const json = exportPipeline();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mongodb-aggregation-pipeline.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🍃</div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">
              MongoDB Aggregation Pipeline Builder
            </h1>
            <p className="text-sm text-gray-600">
              Build visual aggregation pipelines with drag-and-drop stages
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowJsonPreview(true)}
            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
            title="View JSON"
          >
            <Code className="w-5 h-5" />
          </button>
          <button
            onClick={handleExportPipeline}
            className="p-2 text-gray-600 hover:text-green-600 transition-colors"
            title="Export Pipeline"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={handleLoadSamplePipeline}
            className="p-2 text-gray-600 hover:text-purple-600 transition-colors"
            title="Load Sample Pipeline"
          >
            <Zap className="w-5 h-5" />
          </button>
          <button
            onClick={resetPipeline}
            className="p-2 text-gray-600 hover:text-orange-600 transition-colors"
            title="Reset Pipeline"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Aggregation Stages
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              Drag stages to the canvas to build your pipeline
            </p>
          </div>
          
          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {getAllStageTypes().map((stageType) => {
              const config = getStageConfig(stageType);
              return (
                <div
                  key={stageType}
                  draggable
                  onDragStart={(e) => handleDragStart(e, stageType)}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 cursor-move hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-800 truncate">
                        {config.title}
                      </h4>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {config.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative" onDragOver={handleDragOver} onDrop={handleDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChangeWithPosition}
            onEdgesChange={handleEdgesChangeWithConnection}
            onConnect={handleConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50"
          >
            <Background color="#e5e7eb" />
            <Controls className="!bottom-4 !left-4" />
            <MiniMap 
              className="!bottom-4 !right-4"
              nodeColor={(node) => {
                if (node.selected) return '#3b82f6';
                return '#9ca3af';
              }}
            />
          </ReactFlow>
          
          {pipeline.stages.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-4">🍃</div>
                <h3 className="text-lg font-medium mb-2">Start Building Your Pipeline</h3>
                <p className="text-sm">
                  Drag aggregation stages from the sidebar to begin
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <JsonPreview
        isOpen={showJsonPreview}
        onClose={() => setShowJsonPreview(false)}
      />
      
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      
      <StageConfigModal
        stageId={stageToEdit}
        isOpen={showStageConfig}
        onClose={() => {
          setShowStageConfig(false);
          setStageToEdit(null);
        }}
      />
    </div>
  );
};

export default MongoDBAggregationWidget;
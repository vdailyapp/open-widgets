import React, { useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  ConnectionLineType,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Settings, Code, Play, AlertCircle } from 'lucide-react';
import { useSQLVisualizerStore } from './store';
import { nodeTypes, type CustomNodeData } from './FlowNodes';
import SettingsModal from './SettingsModal';
import type { PostMessageConfig } from './types';

const SQLVisualizerWidget: React.FC = () => {
  const {
    query,
    parsedQuery,
    settings,
    showSettings,
    isEditing,
    error,
    selectedNode,
    setQuery,
    parseQuery,
    setShowSettings,
    setIsEditing,
    setSelectedNode,
    clearError,
    handlePostMessage,
  } = useSQLVisualizerStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Handle postMessage for iframe embedding
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const config: PostMessageConfig = event.data;
        if (config && (config.initialQuery || config.settings)) {
          handlePostMessage(config);
        }
      } catch (error) {
        console.warn('Invalid postMessage data:', error);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handlePostMessage]);

  // Convert parsed query to nodes and edges
  const generateFlowElements = useCallback(() => {
    if (!parsedQuery) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const newNodes: Node<CustomNodeData>[] = [];
    const newEdges: Edge[] = [];

    // Create nodes for tables
    parsedQuery.tables.forEach((table) => {
      newNodes.push({
        id: table.id,
        type: 'table',
        position: table.position,
        data: { ...table, type: 'table' },
      });
    });

    // Create nodes for projections
    parsedQuery.projections.forEach((projection) => {
      newNodes.push({
        id: projection.id,
        type: 'projection',
        position: projection.position,
        data: { ...projection, type: 'projection' },
      });
    });

    // Create nodes for joins
    parsedQuery.joins.forEach((join) => {
      newNodes.push({
        id: join.id,
        type: 'join',
        position: join.position,
        data: { ...join, type: 'join' },
      });

      // Create edges from tables to joins
      const leftTableNode = parsedQuery.tables.find(t => t.name === join.leftTable);
      const rightTableNode = parsedQuery.tables.find(t => t.name === join.rightTable);
      
      if (leftTableNode) {
        newEdges.push({
          id: `${leftTableNode.id}-${join.id}`,
          source: leftTableNode.id,
          target: join.id,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
        });
      }
      
      if (rightTableNode) {
        newEdges.push({
          id: `${rightTableNode.id}-${join.id}`,
          source: rightTableNode.id,
          target: join.id,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
        });
      }
    });

    // Create nodes for filters
    parsedQuery.filters.forEach((filter) => {
      newNodes.push({
        id: filter.id,
        type: 'filter',
        position: filter.position,
        data: { ...filter, type: 'filter' },
      });

      // Connect filters to relevant tables (simplified approach)
      parsedQuery.tables.forEach((table) => {
        if (filter.condition.includes(table.name)) {
          newEdges.push({
            id: `${table.id}-${filter.id}`,
            source: table.id,
            target: filter.id,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#f59e0b' },
          });
        }
      });
    });

    // Connect projections to tables
    parsedQuery.projections.forEach((projection) => {
      if (projection.table) {
        const sourceTable = parsedQuery.tables.find(t => t.name === projection.table || t.alias === projection.table);
        if (sourceTable) {
          newEdges.push({
            id: `${sourceTable.id}-${projection.id}`,
            source: sourceTable.id,
            target: projection.id,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#6366f1' },
          });
        }
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [parsedQuery, setNodes, setEdges]);

  // Generate flow elements when parsed query changes
  useEffect(() => {
    generateFlowElements();
  }, [generateFlowElements]);

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, [setSelectedNode]);

  // Parse query on mount
  useEffect(() => {
    parseQuery();
  }, []);

  const handleQuerySubmit = () => {
    parseQuery();
    setIsEditing(false);
  };

  const isDarkMode = settings.darkMode || settings.theme === 'dark' || 
    (settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className={`h-screen w-full flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              SQL Query Visualizer
            </h1>
          </div>
          
          <button
            onClick={() => setShowSettings(true)}
            className={`
              p-2 rounded-lg transition-colors
              ${isDarkMode 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }
            `}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* SQL Input */}
        <div className="mt-4">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your SQL query here..."
                className={`
                  w-full h-32 p-3 border rounded-lg font-mono text-sm resize-none
                  ${isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                `}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleQuerySubmit}
                  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Visualize Query
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className={`
                    px-4 py-2 rounded-lg transition-colors
                    ${isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }
                  `}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => setIsEditing(true)}
              className={`
                p-3 border rounded-lg cursor-pointer transition-colors
                ${isDarkMode 
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                  : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                }
              `}
            >
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Click to edit SQL query
              </div>
              <div className={`font-mono text-xs mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} truncate`}>
                {query || 'No query entered'}
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Parsing Error:</span>
            </div>
            <div className="text-red-600 text-sm mt-1">{error}</div>
            <button
              onClick={clearError}
              className="text-red-600 text-sm underline mt-1 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Flow Diagram */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
          className={isDarkMode ? 'dark' : ''}
        >
          <Background color={isDarkMode ? '#374151' : '#e5e7eb'} />
          <Controls />
          <MiniMap 
            className={isDarkMode ? 'bg-gray-800' : 'bg-white'}
            maskColor={isDarkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.1)'}
          />
        </ReactFlow>
      </div>

      {/* Settings Modal */}
      <SettingsModal />
    </div>
  );
};

export default SQLVisualizerWidget;
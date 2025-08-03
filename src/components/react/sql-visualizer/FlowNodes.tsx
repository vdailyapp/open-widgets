import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Database, Filter, ArrowRight, Hash } from 'lucide-react';
import type { SQLTable, SQLJoin, SQLFilter, SQLProjection } from './types';

// Custom node data types
export interface TableNodeData extends SQLTable {
  type: 'table';
}

export interface JoinNodeData extends SQLJoin {
  type: 'join';
}

export interface FilterNodeData extends SQLFilter {
  type: 'filter';
}

export interface ProjectionNodeData extends SQLProjection {
  type: 'projection';
}

export type CustomNodeData = TableNodeData | JoinNodeData | FilterNodeData | ProjectionNodeData;

// Table Node Component
export const TableNode: React.FC<NodeProps<TableNodeData>> = ({ data, selected }) => {
  return (
    <div className={`
      bg-white border-2 rounded-lg p-4 shadow-lg min-w-[200px]
      ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}
      hover:shadow-xl transition-shadow
    `}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2 mb-2">
        <Database className="w-5 h-5 text-blue-600" />
        <div>
          <div className="font-bold text-gray-800">{data.name}</div>
          {data.alias && (
            <div className="text-sm text-gray-500">as {data.alias}</div>
          )}
        </div>
      </div>
      
      {data.columns && data.columns.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Columns:</div>
          {data.columns.slice(0, 5).map((column, index) => (
            <div key={index} className="text-xs text-gray-700 py-1">
              • {column}
            </div>
          ))}
          {data.columns.length > 5 && (
            <div className="text-xs text-gray-500">
              ... and {data.columns.length - 5} more
            </div>
          )}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

// Join Node Component
export const JoinNode: React.FC<NodeProps<JoinNodeData>> = ({ data, selected }) => {
  const getJoinColor = (type: string) => {
    switch (type) {
      case 'INNER': return 'bg-green-100 border-green-300 text-green-800';
      case 'LEFT': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'RIGHT': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'FULL': return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'CROSS': return 'bg-red-100 border-red-300 text-red-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  return (
    <div className={`
      border-2 rounded-lg p-3 shadow-lg min-w-[180px]
      ${selected ? 'ring-2 ring-blue-200' : ''}
      hover:shadow-xl transition-shadow
      ${getJoinColor(data.type)}
    `}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2 mb-2">
        <ArrowRight className="w-4 h-4" />
        <div className="font-bold">{data.type} JOIN</div>
      </div>
      
      {data.condition && (
        <div className="text-sm">
          <div className="font-medium mb-1">Condition:</div>
          <div className="font-mono text-xs bg-white/50 p-1 rounded">
            {data.condition}
          </div>
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

// Filter Node Component
export const FilterNode: React.FC<NodeProps<FilterNodeData>> = ({ data, selected }) => {
  return (
    <div className={`
      bg-orange-50 border-2 border-orange-300 rounded-lg p-3 shadow-lg min-w-[180px]
      ${selected ? 'ring-2 ring-blue-200' : ''}
      hover:shadow-xl transition-shadow
    `}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2 mb-2">
        <Filter className="w-4 h-4 text-orange-600" />
        <div className="font-bold text-orange-800">WHERE</div>
      </div>
      
      <div className="text-sm text-orange-700">
        <div className="font-mono text-xs bg-white/70 p-2 rounded">
          {data.condition}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

// Projection Node Component
export const ProjectionNode: React.FC<NodeProps<ProjectionNodeData>> = ({ data, selected }) => {
  return (
    <div className={`
      bg-indigo-50 border-2 border-indigo-300 rounded-lg p-3 shadow-lg min-w-[160px]
      ${selected ? 'ring-2 ring-blue-200' : ''}
      hover:shadow-xl transition-shadow
    `}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2 mb-2">
        <Hash className="w-4 h-4 text-indigo-600" />
        <div className="font-bold text-indigo-800">SELECT</div>
      </div>
      
      <div className="text-sm text-indigo-700">
        <div className="font-mono text-xs">
          {data.aggregation && (
            <span className="bg-indigo-200 px-1 rounded mr-1">
              {data.aggregation}
            </span>
          )}
          {data.table && <span className="text-gray-600">{data.table}.</span>}
          <span className="font-bold">{data.column}</span>
          {data.alias && (
            <div className="text-xs text-gray-600 mt-1">as {data.alias}</div>
          )}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

// Export node types for React Flow
export const nodeTypes = {
  table: TableNode,
  join: JoinNode,
  filter: FilterNode,
  projection: ProjectionNode
};
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Settings, Trash2, AlertCircle } from 'lucide-react';
import { getStageConfig, validateStageConfig } from './utils';
import type { AggregationStage } from './types';

interface StageNodeData extends AggregationStage {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const StageNode = memo(({ data, selected }: NodeProps<StageNodeData>) => {
  const stageConfig = getStageConfig(data.type);
  const errors = validateStageConfig(data.type, data.config);
  const hasErrors = errors.length > 0;

  const handleEdit = () => {
    data.onEdit(data.id);
  };

  const handleDelete = () => {
    data.onDelete(data.id);
  };

  return (
    <div
      className={`
        bg-white border-2 rounded-lg shadow-lg min-w-[200px] max-w-[250px]
        ${selected ? 'border-blue-500' : 'border-gray-200'}
        ${hasErrors ? 'border-red-300' : ''}
        hover:shadow-xl transition-shadow
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 border-2 border-white"
      />
      
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{stageConfig.icon}</span>
            <h3 className="font-semibold text-gray-800 text-sm">
              {stageConfig.title}
            </h3>
            {hasErrors && (
              <AlertCircle className="w-4 h-4 text-red-500" title={errors.join(', ')} />
            )}
          </div>
          
          <div className="flex space-x-1">
            <button
              onClick={handleEdit}
              className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
              title="Edit stage"
            >
              <Settings className="w-3 h-3" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-gray-500 hover:text-red-600 transition-colors"
              title="Delete stage"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {stageConfig.description}
        </p>

        {/* Preview of configuration */}
        <div className="bg-gray-50 rounded p-2 text-xs font-mono">
          <div className="text-gray-700 truncate">
            {data.type}
          </div>
          {Object.keys(data.config[data.type] || {}).length > 0 && (
            <div className="text-gray-500 mt-1 truncate">
              {JSON.stringify(data.config[data.type]).slice(0, 50)}
              {JSON.stringify(data.config[data.type]).length > 50 && '...'}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-green-500 border-2 border-white"
      />
    </div>
  );
});

StageNode.displayName = 'StageNode';

export default StageNode;
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useTodoStore } from './todo-store';
import TaskCard from './todo-task-card';

interface KanbanColumnProps {
  column: any;
  tasks: any[];
  onEditTask: (taskId: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, tasks, onEditTask }) => {
  const { settings } = useTodoStore();
  
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const getColumnIcon = (columnId: string) => {
    switch (columnId) {
      case 'todo':
        return '📋';
      case 'inprogress':
        return '⏳';
      case 'done':
        return '✅';
      default:
        return '📝';
    }
  };

  const getColumnColor = (columnId: string, darkMode: boolean) => {
    const baseColors = {
      todo: darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200',
      inprogress: darkMode ? 'bg-blue-900/50 border-blue-700' : 'bg-blue-50 border-blue-200',
      done: darkMode ? 'bg-green-900/50 border-green-700' : 'bg-green-50 border-green-200',
    };
    
    return baseColors[columnId as keyof typeof baseColors] || (darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200');
  };

  return (
    <div
      ref={setNodeRef}
      className={`h-full rounded-lg border-2 transition-all duration-200 ${
        getColumnColor(column.id, settings.darkMode)
      } ${isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getColumnIcon(column.id)}</span>
            <h3 className="font-semibold text-lg">{column.title}</h3>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            settings.darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
          }`}>
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks */}
      <div className="p-4 overflow-y-auto h-[calc(100%-80px)]">
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className={`text-center py-8 ${
                settings.darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <p className="text-sm">No tasks</p>
                <p className="text-xs mt-1">Drag tasks here</p>
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={onEditTask} />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export default KanbanColumn;
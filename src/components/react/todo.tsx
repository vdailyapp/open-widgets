import React, { useEffect, useState } from 'react';
import { Settings, Plus, Search, Filter, X, Moon, Sun, LayoutGrid, List, Calendar, Tag, AlertCircle } from 'lucide-react';
import { useTodoStore } from './todo-store';
import KanbanView from './todo-kanban';
import ListView from './todo-list';
import TaskModal from './todo-task-modal';
import SettingsModal from './todo-settings-modal';

// Define ExternalConfig inline for now
interface ExternalConfig {
  initialTasks?: any[];
  settings?: any;
  theme?: {
    darkMode?: boolean;
    primaryColor?: string;
  };
}

const TodoWidget: React.FC = () => {
  const {
    settings,
    searchQuery,
    selectedLabels,
    selectedPriority,
    selectedStatus,
    setSearchQuery,
    setSelectedLabels,
    setSelectedPriority,
    setSelectedStatus,
    clearFilters,
    toggleDarkMode,
    setViewMode,
    applyExternalConfig,
    getFilteredTasks,
  } = useTodoStore();

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Listen for external configuration via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TODO_CONFIG') {
        const config: ExternalConfig = event.data.config;
        applyExternalConfig(config);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [applyExternalConfig]);

  const handleAddTask = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (taskId: string) => {
    setEditingTask(taskId);
    setShowTaskModal(true);
  };

  const filteredTasks = getFilteredTasks();
  const hasActiveFilters = searchQuery || selectedLabels.length > 0 || selectedPriority.length > 0 || selectedStatus.length > 0;

  const themeClasses = settings.darkMode 
    ? 'dark bg-gray-900 text-white'
    : 'bg-gray-50 text-gray-900';

  return (
    <div className={`min-h-screen w-full ${themeClasses} transition-colors duration-200`}>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <header className={`${settings.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-3 flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">📝 Todo</h1>
              
              {/* View Toggle */}
              <div className={`flex rounded-lg ${settings.darkMode ? 'bg-gray-700' : 'bg-gray-100'} p-1`}>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1.5 rounded-md flex items-center space-x-2 transition-colors ${
                    settings.viewMode === 'kanban'
                      ? settings.darkMode 
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : settings.darkMode
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <LayoutGrid size={16} />
                  <span className="hidden sm:inline">Kanban</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md flex items-center space-x-2 transition-colors ${
                    settings.viewMode === 'list'
                      ? settings.darkMode 
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : settings.darkMode
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List size={16} />
                  <span className="hidden sm:inline">List</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    settings.darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  hasActiveFilters
                    ? 'bg-blue-500 text-white'
                    : settings.darkMode
                      ? 'bg-gray-700 text-gray-300 hover:text-white'
                      : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <Filter size={16} />
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${
                  settings.darkMode
                    ? 'bg-gray-700 text-gray-300 hover:text-white'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                {settings.darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              {/* Add Task */}
              <button
                onClick={handleAddTask}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Add Task</span>
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className={`mt-4 p-4 rounded-lg ${settings.darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex flex-wrap gap-4">
                {/* Labels Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Labels</label>
                  <div className="flex flex-wrap gap-2">
                    {settings.availableLabels.map((label) => (
                      <button
                        key={label}
                        onClick={() => {
                          const newLabels = selectedLabels.includes(label)
                            ? selectedLabels.filter(l => l !== label)
                            : [...selectedLabels, label];
                          setSelectedLabels(newLabels);
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedLabels.includes(label)
                            ? 'bg-blue-500 text-white'
                            : settings.labelColors[label] || 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        <Tag size={12} className="inline mr-1" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high'].map((priority) => (
                      <button
                        key={priority}
                        onClick={() => {
                          const newPriorities = selectedPriority.includes(priority)
                            ? selectedPriority.filter(p => p !== priority)
                            : [...selectedPriority, priority];
                          setSelectedPriority(newPriorities);
                        }}
                        className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                          selectedPriority.includes(priority)
                            ? 'bg-blue-500 text-white'
                            : priority === 'high'
                              ? 'bg-red-100 text-red-800'
                              : priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                        }`}
                      >
                        <AlertCircle size={12} className="inline mr-1" />
                        {priority}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <div className="flex gap-2">
                    {['todo', 'inprogress', 'done'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          const newStatuses = selectedStatus.includes(status)
                            ? selectedStatus.filter(s => s !== status)
                            : [...selectedStatus, status];
                          setSelectedStatus(newStatuses);
                        }}
                        className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                          selectedStatus.includes(status)
                            ? 'bg-blue-500 text-white'
                            : settings.darkMode
                              ? 'bg-gray-600 text-gray-300'
                              : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {status === 'todo' && '📋'}
                        {status === 'inprogress' && '⏳'}
                        {status === 'done' && '✅'}
                        <span className="ml-1">{status === 'inprogress' ? 'In Progress' : status}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                      settings.darkMode
                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <X size={16} />
                    <span>Clear Filters</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {settings.viewMode === 'kanban' ? (
            <KanbanView tasks={filteredTasks} onEditTask={handleEditTask} />
          ) : (
            <ListView tasks={filteredTasks} onEditTask={handleEditTask} />
          )}
        </main>

        {/* Floating Settings Button */}
        <button
          onClick={() => setShowSettingsModal(true)}
          className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-colors z-40"
        >
          <Settings size={20} />
        </button>

        {/* Modals */}
        {showTaskModal && (
          <TaskModal
            taskId={editingTask}
            onClose={() => setShowTaskModal(false)}
          />
        )}

        {showSettingsModal && (
          <SettingsModal onClose={() => setShowSettingsModal(false)} />
        )}
      </div>
    </div>
  );
};

export default TodoWidget;
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

// Define types inline for now to avoid import issues
interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  labels: string[];
  subtasks: Subtask[];
  status: 'todo' | 'inprogress' | 'done';
  createdAt: string;
  updatedAt: string;
}

interface TodoColumn {
  id: string;
  title: string;
  color: string;
  taskIds: string[];
}

interface TodoSettings {
  darkMode: boolean;
  viewMode: 'kanban' | 'list';
  kanbanColumns: TodoColumn[];
  listGroupBy: 'date' | 'priority' | 'status' | 'labels';
  listSortBy: 'createdAt' | 'dueDate' | 'priority' | 'title';
  listSortOrder: 'asc' | 'desc';
  availableLabels: string[];
  labelColors: Record<string, string>;
}

interface TodoState {
  tasks: Record<string, Task>;
  settings: TodoSettings;
  searchQuery: string;
  selectedLabels: string[];
  selectedPriority: string[];
  selectedStatus: string[];
}

interface ExternalConfig {
  initialTasks?: Task[];
  settings?: Partial<TodoSettings>;
  theme?: {
    darkMode?: boolean;
    primaryColor?: string;
  };
}

const defaultSettings: TodoSettings = {
  darkMode: false,
  viewMode: 'kanban',
  kanbanColumns: [
    { id: 'todo', title: 'To Do', color: 'bg-gray-100', taskIds: [] },
    { id: 'inprogress', title: 'In Progress', color: 'bg-blue-100', taskIds: [] },
    { id: 'done', title: 'Done', color: 'bg-green-100', taskIds: [] },
  ],
  listGroupBy: 'status',
  listSortBy: 'createdAt',
  listSortOrder: 'desc',
  availableLabels: ['Work', 'Personal', 'Urgent', 'Meeting', 'Project'],
  labelColors: {
    'Work': 'bg-blue-100 text-blue-800',
    'Personal': 'bg-green-100 text-green-800',
    'Urgent': 'bg-red-100 text-red-800',
    'Meeting': 'bg-purple-100 text-purple-800',
    'Project': 'bg-yellow-100 text-yellow-800',
  },
};

const STORAGE_KEY = 'todo-widget-data';

// Load initial state from localStorage
const loadFromStorage = (): Partial<TodoState> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Save state to localStorage
const saveToStorage = (state: TodoState) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      tasks: state.tasks,
      settings: state.settings,
    }));
  } catch {
    // Handle storage errors silently
  }
};

export const useTodoStore = create<TodoState & {
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  moveTask: (taskId: string, newStatus: Task['status']) => void;
  
  // Subtask actions
  addSubtask: (taskId: string, title: string) => void;
  updateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  
  // Settings actions
  updateSettings: (updates: Partial<TodoSettings>) => void;
  toggleDarkMode: () => void;
  setViewMode: (mode: 'kanban' | 'list') => void;
  updateKanbanColumn: (columnId: string, updates: Partial<{ title: string; color: string }>) => void;
  addLabel: (label: string, color?: string) => void;
  
  // Filter actions
  setSearchQuery: (query: string) => void;
  setSelectedLabels: (labels: string[]) => void;
  setSelectedPriority: (priorities: string[]) => void;
  setSelectedStatus: (statuses: string[]) => void;
  clearFilters: () => void;
  
  // External config
  applyExternalConfig: (config: ExternalConfig) => void;
  
  // Utilities
  getFilteredTasks: () => Task[];
}>((set, get) => {
  const storedData = loadFromStorage();
  
  const initialState: TodoState = {
    tasks: storedData.tasks || {},
    settings: { ...defaultSettings, ...storedData.settings },
    searchQuery: '',
    selectedLabels: [],
    selectedPriority: [],
    selectedStatus: [],
  };

  return {
    ...initialState,

    addTask: (taskData) => {
      const task: Task = {
        ...taskData,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      set((state) => {
        const newState = {
          ...state,
          tasks: { ...state.tasks, [task.id]: task },
        };
        saveToStorage(newState);
        return newState;
      });
    },

    updateTask: (id, updates) => {
      set((state) => {
        if (!state.tasks[id]) return state;
        
        const newState = {
          ...state,
          tasks: {
            ...state.tasks,
            [id]: {
              ...state.tasks[id],
              ...updates,
              updatedAt: new Date().toISOString(),
            },
          },
        };
        saveToStorage(newState);
        return newState;
      });
    },

    deleteTask: (id) => {
      set((state) => {
        const { [id]: deleted, ...remainingTasks } = state.tasks;
        const newState = { ...state, tasks: remainingTasks };
        saveToStorage(newState);
        return newState;
      });
    },

    toggleTask: (id) => {
      const task = get().tasks[id];
      if (!task) return;
      
      get().updateTask(id, {
        completed: !task.completed,
        status: !task.completed ? 'done' : 'todo',
      });
    },

    moveTask: (taskId, newStatus) => {
      get().updateTask(taskId, { status: newStatus });
    },

    addSubtask: (taskId, title) => {
      const task = get().tasks[taskId];
      if (!task) return;
      
      const subtask: Subtask = {
        id: uuidv4(),
        title,
        completed: false,
      };
      
      get().updateTask(taskId, {
        subtasks: [...task.subtasks, subtask],
      });
    },

    updateSubtask: (taskId, subtaskId, updates) => {
      const task = get().tasks[taskId];
      if (!task) return;
      
      const updatedSubtasks = task.subtasks.map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, ...updates } : subtask
      );
      
      get().updateTask(taskId, { subtasks: updatedSubtasks });
    },

    deleteSubtask: (taskId, subtaskId) => {
      const task = get().tasks[taskId];
      if (!task) return;
      
      const updatedSubtasks = task.subtasks.filter((subtask) => subtask.id !== subtaskId);
      get().updateTask(taskId, { subtasks: updatedSubtasks });
    },

    toggleSubtask: (taskId, subtaskId) => {
      const task = get().tasks[taskId];
      if (!task) return;
      
      const subtask = task.subtasks.find((s) => s.id === subtaskId);
      if (!subtask) return;
      
      get().updateSubtask(taskId, subtaskId, { completed: !subtask.completed });
    },

    updateSettings: (updates) => {
      set((state) => {
        const newState = {
          ...state,
          settings: { ...state.settings, ...updates },
        };
        saveToStorage(newState);
        return newState;
      });
    },

    toggleDarkMode: () => {
      const settings = get().settings;
      get().updateSettings({ darkMode: !settings.darkMode });
    },

    setViewMode: (mode) => {
      get().updateSettings({ viewMode: mode });
    },

    updateKanbanColumn: (columnId, updates) => {
      const settings = get().settings;
      const updatedColumns = settings.kanbanColumns.map((col) =>
        col.id === columnId ? { ...col, ...updates } : col
      );
      get().updateSettings({ kanbanColumns: updatedColumns });
    },

    addLabel: (label, color) => {
      const settings = get().settings;
      if (settings.availableLabels.includes(label)) return;
      
      const labelColor = color || `bg-gray-100 text-gray-800`;
      
      get().updateSettings({
        availableLabels: [...settings.availableLabels, label],
        labelColors: { ...settings.labelColors, [label]: labelColor },
      });
    },

    setSearchQuery: (query) => {
      set((state) => ({ ...state, searchQuery: query }));
    },

    setSelectedLabels: (labels) => {
      set((state) => ({ ...state, selectedLabels: labels }));
    },

    setSelectedPriority: (priorities) => {
      set((state) => ({ ...state, selectedPriority: priorities }));
    },

    setSelectedStatus: (statuses) => {
      set((state) => ({ ...state, selectedStatus: statuses }));
    },

    clearFilters: () => {
      set((state) => ({
        ...state,
        searchQuery: '',
        selectedLabels: [],
        selectedPriority: [],
        selectedStatus: [],
      }));
    },

    applyExternalConfig: (config) => {
      if (config.initialTasks) {
        const tasks: Record<string, Task> = {};
        config.initialTasks.forEach((task) => {
          tasks[task.id] = task;
        });
        set((state) => ({ ...state, tasks }));
      }
      
      if (config.settings) {
        get().updateSettings(config.settings);
      }
      
      if (config.theme?.darkMode !== undefined) {
        get().updateSettings({ darkMode: config.theme.darkMode });
      }
    },

    getFilteredTasks: () => {
      const state = get();
      const { tasks, searchQuery, selectedLabels, selectedPriority, selectedStatus } = state;
      
      return Object.values(tasks).filter((task) => {
        // Search filter
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          const matchesSearch = 
            task.title.toLowerCase().includes(searchLower) ||
            task.description?.toLowerCase().includes(searchLower) ||
            task.labels.some((label) => label.toLowerCase().includes(searchLower));
          
          if (!matchesSearch) return false;
        }
        
        // Label filter
        if (selectedLabels.length > 0) {
          const hasSelectedLabel = selectedLabels.some((label) => task.labels.includes(label));
          if (!hasSelectedLabel) return false;
        }
        
        // Priority filter
        if (selectedPriority.length > 0) {
          if (!selectedPriority.includes(task.priority)) return false;
        }
        
        // Status filter
        if (selectedStatus.length > 0) {
          if (!selectedStatus.includes(task.status)) return false;
        }
        
        return true;
      });
    },
  };
});
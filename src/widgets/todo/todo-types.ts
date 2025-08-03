export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
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

export interface TodoColumn {
  id: string;
  title: string;
  color: string;
  taskIds: string[];
}

export interface TodoSettings {
  darkMode: boolean;
  viewMode: 'kanban' | 'list';
  kanbanColumns: TodoColumn[];
  listGroupBy: 'date' | 'priority' | 'status' | 'labels';
  listSortBy: 'createdAt' | 'dueDate' | 'priority' | 'title';
  listSortOrder: 'asc' | 'desc';
  availableLabels: string[];
  labelColors: Record<string, string>;
}

export interface TodoState {
  tasks: Record<string, Task>;
  settings: TodoSettings;
  searchQuery: string;
  selectedLabels: string[];
  selectedPriority: string[];
  selectedStatus: string[];
}

export interface ExternalConfig {
  initialTasks?: Task[];
  settings?: Partial<TodoSettings>;
  theme?: {
    darkMode?: boolean;
    primaryColor?: string;
  };
}
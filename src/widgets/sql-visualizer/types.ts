export interface SQLTable {
  id: string;
  name: string;
  alias?: string;
  columns: string[];
  position: { x: number; y: number };
}

export interface SQLJoin {
  id: string;
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'CROSS';
  leftTable: string;
  rightTable: string;
  condition: string;
  position: { x: number; y: number };
}

export interface SQLFilter {
  id: string;
  table: string;
  condition: string;
  position: { x: number; y: number };
}

export interface SQLProjection {
  id: string;
  column: string;
  table?: string;
  alias?: string;
  aggregation?: string;
  position: { x: number; y: number };
}

export interface SQLParsedQuery {
  tables: SQLTable[];
  joins: SQLJoin[];
  filters: SQLFilter[];
  projections: SQLProjection[];
  rawQuery: string;
}

export interface VisualizerSettings {
  darkMode: boolean;
  autoLayout: boolean;
  showTableColumns: boolean;
  nodeSpacing: number;
  theme: 'light' | 'dark' | 'auto';
}

export interface PostMessageConfig {
  initialQuery?: string;
  settings?: Partial<VisualizerSettings>;
}

export interface SQLVisualizerState {
  query: string;
  parsedQuery: SQLParsedQuery | null;
  settings: VisualizerSettings;
  showSettings: boolean;
  isEditing: boolean;
  error: string | null;
  selectedNode: string | null;
}
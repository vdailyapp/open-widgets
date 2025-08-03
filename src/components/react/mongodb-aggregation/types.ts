// MongoDB Aggregation Pipeline Types

export interface AggregationStage {
  id: string;
  type: StageType;
  config: Record<string, any>;
  position: { x: number; y: number };
}

export type StageType = 
  | '$match'
  | '$group' 
  | '$project'
  | '$sort'
  | '$limit'
  | '$skip'
  | '$unwind'
  | '$lookup'
  | '$addFields'
  | '$replaceRoot'
  | '$count'
  | '$facet'
  | '$bucket'
  | '$sample';

export interface Pipeline {
  id: string;
  name: string;
  stages: AggregationStage[];
  connections: Connection[];
}

export interface Connection {
  id: string;
  source: string;
  target: string;
}

export interface Settings {
  theme: 'light' | 'dark';
  showJson: boolean;
  autoFormat: boolean;
  showStageHelp: boolean;
  sampleDataEnabled: boolean;
}

export interface PostMessageConfig {
  initialPipeline?: Pipeline;
  settings?: Partial<Settings>;
  sampleData?: any[];
}

export interface StageConfig {
  type: StageType;
  title: string;
  description: string;
  icon: string;
  defaultConfig: Record<string, any>;
  configSchema: ConfigField[];
}

export interface ConfigField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'object' | 'array' | 'select';
  required?: boolean;
  placeholder?: string;
  options?: string[];
  description?: string;
}

export interface SampleData {
  name: string;
  data: any[];
  description: string;
}
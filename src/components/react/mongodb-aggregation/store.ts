import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  AggregationStage, 
  Pipeline, 
  Connection, 
  Settings, 
  PostMessageConfig,
  StageType 
} from './types';
import { generateStageId, getStageConfig } from './utils';

interface MongoDBAggregationStore {
  // State
  pipeline: Pipeline;
  settings: Settings;
  selectedStage: string | null;
  isAddingStage: boolean;
  showSettings: boolean;
  jsonPreview: string;
  isJsonMode: boolean;
  sampleData: any[];
  
  // Actions
  addStage: (type: StageType, position: { x: number; y: number }) => void;
  updateStage: (id: string, config: Record<string, any>) => void;
  deleteStage: (id: string) => void;
  addConnection: (source: string, target: string) => void;
  removeConnection: (id: string) => void;
  setSelectedStage: (id: string | null) => void;
  setIsAddingStage: (adding: boolean) => void;
  setShowSettings: (show: boolean) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  setJsonMode: (enabled: boolean) => void;
  updateJsonPreview: (json: string) => void;
  syncFromJson: () => void;
  setSampleData: (data: any[]) => void;
  exportPipeline: () => string;
  importPipeline: (json: string) => void;
  resetPipeline: () => void;
  handlePostMessage: (config: PostMessageConfig) => void;
  updateStagePosition: (id: string, position: { x: number; y: number }) => void;
}

const defaultSettings: Settings = {
  theme: 'light',
  showJson: true,
  autoFormat: true,
  showStageHelp: true,
  sampleDataEnabled: false,
};

const defaultPipeline: Pipeline = {
  id: 'default',
  name: 'New Pipeline',
  stages: [],
  connections: [],
};

const defaultSampleData = [
  { _id: 1, name: 'John Doe', age: 30, city: 'New York', salary: 50000 },
  { _id: 2, name: 'Jane Smith', age: 25, city: 'San Francisco', salary: 60000 },
  { _id: 3, name: 'Bob Johnson', age: 35, city: 'Chicago', salary: 55000 },
  { _id: 4, name: 'Alice Brown', age: 28, city: 'New York', salary: 58000 },
  { _id: 5, name: 'Charlie Davis', age: 32, city: 'San Francisco', salary: 65000 },
];

export const useMongoDBAggregationStore = create<MongoDBAggregationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      pipeline: defaultPipeline,
      settings: defaultSettings,
      selectedStage: null,
      isAddingStage: false,
      showSettings: false,
      jsonPreview: '[]',
      isJsonMode: false,
      sampleData: defaultSampleData,

      // Actions
      addStage: (type, position) => {
        const stage: AggregationStage = {
          id: generateStageId(),
          type,
          config: getStageConfig(type).defaultConfig,
          position,
        };
        
        set((state) => ({
          pipeline: {
            ...state.pipeline,
            stages: [...state.pipeline.stages, stage],
          },
          selectedStage: stage.id,
        }));
        
        get().updateJsonPreview(get().exportPipeline());
      },

      updateStage: (id, config) => {
        set((state) => ({
          pipeline: {
            ...state.pipeline,
            stages: state.pipeline.stages.map((stage) =>
              stage.id === id ? { ...stage, config } : stage
            ),
          },
        }));
        
        get().updateJsonPreview(get().exportPipeline());
      },

      deleteStage: (id) => {
        set((state) => ({
          pipeline: {
            ...state.pipeline,
            stages: state.pipeline.stages.filter((stage) => stage.id !== id),
            connections: state.pipeline.connections.filter(
              (conn) => conn.source !== id && conn.target !== id
            ),
          },
          selectedStage: state.selectedStage === id ? null : state.selectedStage,
        }));
        
        get().updateJsonPreview(get().exportPipeline());
      },

      addConnection: (source, target) => {
        const connectionId = `${source}-${target}`;
        set((state) => ({
          pipeline: {
            ...state.pipeline,
            connections: [
              ...state.pipeline.connections.filter(
                (conn) => conn.target !== target
              ),
              { id: connectionId, source, target },
            ],
          },
        }));
      },

      removeConnection: (id) => {
        set((state) => ({
          pipeline: {
            ...state.pipeline,
            connections: state.pipeline.connections.filter((conn) => conn.id !== id),
          },
        }));
      },

      setSelectedStage: (id) => set({ selectedStage: id }),
      setIsAddingStage: (adding) => set({ isAddingStage: adding }),
      setShowSettings: (show) => set({ showSettings: show }),

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      setJsonMode: (enabled) => set({ isJsonMode: enabled }),

      updateJsonPreview: (json) => set({ jsonPreview: json }),

      syncFromJson: () => {
        try {
          const { jsonPreview } = get();
          const parsed = JSON.parse(jsonPreview);
          
          if (Array.isArray(parsed)) {
            const stages: AggregationStage[] = parsed.map((stage, index) => ({
              id: generateStageId(),
              type: Object.keys(stage)[0] as StageType,
              config: stage,
              position: { x: 200 + index * 250, y: 100 },
            }));
            
            set((state) => ({
              pipeline: {
                ...state.pipeline,
                stages,
                connections: stages.length > 1 ? stages.slice(1).map((stage, index) => ({
                  id: `${stages[index].id}-${stage.id}`,
                  source: stages[index].id,
                  target: stage.id,
                })) : [],
              },
            }));
          }
        } catch (error) {
          console.error('Failed to parse JSON:', error);
        }
      },

      setSampleData: (data) => set({ sampleData: data }),

      exportPipeline: () => {
        const { pipeline } = get();
        const sortedStages = [...pipeline.stages].sort((a, b) => {
          // Simple position-based sorting - could be improved with actual flow logic
          return a.position.x - b.position.x;
        });
        
        const mongoQuery = sortedStages.map((stage) => stage.config);
        return JSON.stringify(mongoQuery, null, 2);
      },

      importPipeline: (json) => {
        set({ jsonPreview: json });
        get().syncFromJson();
      },

      resetPipeline: () => {
        set({
          pipeline: defaultPipeline,
          selectedStage: null,
          jsonPreview: '[]',
        });
      },

      handlePostMessage: (config) => {
        if (config.initialPipeline) {
          set({ pipeline: config.initialPipeline });
          get().updateJsonPreview(get().exportPipeline());
        }
        if (config.settings) {
          get().updateSettings(config.settings);
        }
        if (config.sampleData) {
          get().setSampleData(config.sampleData);
        }
      },

      updateStagePosition: (id, position) => {
        set((state) => ({
          pipeline: {
            ...state.pipeline,
            stages: state.pipeline.stages.map((stage) =>
              stage.id === id ? { ...stage, position } : stage
            ),
          },
        }));
      },
    }),
    {
      name: 'mongodb-aggregation-storage',
      partialize: (state) => ({
        pipeline: state.pipeline,
        settings: state.settings,
        sampleData: state.sampleData,
      }),
    }
  )
);
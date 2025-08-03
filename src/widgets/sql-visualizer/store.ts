import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SQLVisualizerState, VisualizerSettings, PostMessageConfig, SQLParsedQuery } from './types';
import { SQLParser } from './SQLParser';

interface SQLVisualizerStore extends SQLVisualizerState {
  // Actions
  setQuery: (query: string) => void;
  parseQuery: () => void;
  setSettings: (settings: Partial<VisualizerSettings>) => void;
  setShowSettings: (show: boolean) => void;
  setIsEditing: (editing: boolean) => void;
  setSelectedNode: (nodeId: string | null) => void;
  clearError: () => void;
  handlePostMessage: (config: PostMessageConfig) => void;
  resetToDefaults: () => void;
}

const defaultSettings: VisualizerSettings = {
  darkMode: false,
  autoLayout: true,
  showTableColumns: true,
  nodeSpacing: 250,
  theme: 'light'
};

const defaultQuery = `SELECT 
  u.id, 
  u.name, 
  u.email,
  p.title as post_title,
  COUNT(c.id) as comment_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
LEFT JOIN comments c ON p.id = c.post_id
WHERE u.active = 1 
  AND p.published = 1
GROUP BY u.id, p.id
ORDER BY u.name, p.created_at DESC`;

export const useSQLVisualizerStore = create<SQLVisualizerStore>()(
  persist(
    (set, get) => ({
      // Initial state
      query: defaultQuery,
      parsedQuery: null,
      settings: defaultSettings,
      showSettings: false,
      isEditing: false,
      error: null,
      selectedNode: null,

      // Actions
      setQuery: (query: string) => {
        set({ query, error: null });
        if (get().settings.autoLayout) {
          get().parseQuery();
        }
      },

      parseQuery: () => {
        const { query } = get();
        if (!query.trim()) {
          set({ parsedQuery: null, error: null });
          return;
        }

        try {
          const parsedQuery = SQLParser.parse(query);
          set({ parsedQuery, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
          set({ error: errorMessage, parsedQuery: null });
        }
      },

      setSettings: (newSettings: Partial<VisualizerSettings>) => {
        const currentSettings = get().settings;
        const updatedSettings = { ...currentSettings, ...newSettings };
        set({ settings: updatedSettings });
        
        // Re-parse if auto-layout changed
        if (newSettings.autoLayout !== undefined && newSettings.autoLayout) {
          get().parseQuery();
        }
      },

      setShowSettings: (show: boolean) => {
        set({ showSettings: show });
      },

      setIsEditing: (editing: boolean) => {
        set({ isEditing: editing });
      },

      setSelectedNode: (nodeId: string | null) => {
        set({ selectedNode: nodeId });
      },

      clearError: () => {
        set({ error: null });
      },

      handlePostMessage: (config: PostMessageConfig) => {
        if (config.initialQuery) {
          set({ query: config.initialQuery });
          get().parseQuery();
        }
        
        if (config.settings) {
          get().setSettings(config.settings);
        }
      },

      resetToDefaults: () => {
        set({
          query: defaultQuery,
          parsedQuery: null,
          settings: defaultSettings,
          showSettings: false,
          isEditing: false,
          error: null,
          selectedNode: null
        });
        get().parseQuery();
      }
    }),
    {
      name: 'sql-visualizer-storage',
      partialize: (state) => ({
        query: state.query,
        settings: state.settings
      })
    }
  )
);
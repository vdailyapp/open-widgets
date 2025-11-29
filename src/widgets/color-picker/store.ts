import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ColorPickerSettings, ExternalConfig, ColorData } from './types';
import { hexToRgb, rgbToHsl, rgbToHsv } from './utils';

interface ColorPickerStore {
  currentColor: string;
  colorHistory: string[];
  settings: ColorPickerSettings;
  
  setCurrentColor: (color: string) => void;
  addToHistory: (color: string) => void;
  clearHistory: () => void;
  toggleDarkMode: () => void;
  updateSettings: (settings: Partial<ColorPickerSettings>) => void;
  applyExternalConfig: (config: ExternalConfig) => void;
  getColorData: () => ColorData;
}

export const useColorPickerStore = create<ColorPickerStore>()(
  persist(
    (set, get) => ({
      currentColor: '#3b82f6',
      colorHistory: [],
      settings: {
        darkMode: false,
        defaultFormat: 'HEX',
        showHistory: true,
      },

      setCurrentColor: (color: string) => {
        set({ currentColor: color });
      },

      addToHistory: (color: string) => {
        const { colorHistory } = get();
        // Only add if not already in recent history
        if (!colorHistory.includes(color)) {
          const newHistory = [color, ...colorHistory].slice(0, 10);
          set({ colorHistory: newHistory });
        }
      },

      clearHistory: () => {
        set({ colorHistory: [] });
      },

      toggleDarkMode: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            darkMode: !state.settings.darkMode,
          },
        }));
      },

      updateSettings: (newSettings: Partial<ColorPickerSettings>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
          },
        }));
      },

      applyExternalConfig: (config: ExternalConfig) => {
        const updates: Partial<ColorPickerStore> = {};

        if (config.color) {
          updates.currentColor = config.color;
        }

        if (config.settings) {
          updates.settings = {
            ...get().settings,
            ...config.settings,
          };
        }

        if (config.theme?.darkMode !== undefined) {
          updates.settings = {
            ...get().settings,
            darkMode: config.theme.darkMode,
          };
        }

        set(updates);
      },

      getColorData: (): ColorData => {
        const hex = get().currentColor;
        const rgb = hexToRgb(hex);
        const hsl = rgbToHsl(rgb);
        const hsv = rgbToHsv(rgb);

        return {
          hex,
          rgb,
          hsl,
          hsv,
        };
      },
    }),
    {
      name: 'color-picker-storage',
    }
  )
);

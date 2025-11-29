// Color Picker Types
export type ColorFormat = 'HEX' | 'RGB' | 'HSL' | 'HSV';

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

export interface HSVColor {
  h: number;
  s: number;
  v: number;
}

export interface ColorData {
  hex: string;
  rgb: RGBColor;
  hsl: HSLColor;
  hsv: HSVColor;
}

export interface ColorPickerSettings {
  darkMode: boolean;
  defaultFormat: ColorFormat;
  showHistory: boolean;
}

export interface ExternalConfig {
  color?: string;
  settings?: Partial<ColorPickerSettings>;
  theme?: {
    darkMode?: boolean;
  };
}

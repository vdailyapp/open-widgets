import React, { useEffect, useState } from 'react';
import { Settings, Copy, Check, Moon, Sun, Palette } from 'lucide-react';
import { useColorPickerStore } from './store';
import SettingsModal from './SettingsModal';
import { formatColor, copyToClipboard, isValidHex, normalizeHex, hexToRgb, rgbToHex, hslToRgb, hsvToRgb } from './utils';
import type { ColorFormat, ExternalConfig } from './types';

const ColorPicker: React.FC = () => {
  const {
    currentColor,
    colorHistory,
    settings,
    setCurrentColor,
    addToHistory,
    toggleDarkMode,
    applyExternalConfig,
    getColorData,
  } = useColorPickerStore();

  const [showSettings, setShowSettings] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ColorFormat>(settings.defaultFormat);
  const [copiedFormat, setCopiedFormat] = useState<ColorFormat | null>(null);
  const [inputValue, setInputValue] = useState(currentColor);

  // Listen for external configuration via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'COLOR_PICKER_CONFIG') {
        const config: ExternalConfig = event.data.config;
        applyExternalConfig(config);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [applyExternalConfig]);

  // Update input value when current color changes
  useEffect(() => {
    setInputValue(currentColor);
  }, [currentColor]);

  const colorData = getColorData();

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCurrentColor(newColor);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Validate and update color
    if (isValidHex(value)) {
      const normalized = normalizeHex(value);
      setCurrentColor(normalized);
      addToHistory(normalized);
    }
  };

  const handleCopy = async (format: ColorFormat) => {
    const text = formatColor(format, colorData.hex, colorData.rgb, colorData.hsl, colorData.hsv);
    const success = await copyToClipboard(text);
    
    if (success) {
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);
    }
  };

  const handleHistoryClick = (color: string) => {
    setCurrentColor(color);
    setInputValue(color);
  };

  const handlePickFromScreen = () => {
    // This is a placeholder - actual implementation would require the EyeDropper API
    if ('EyeDropper' in window) {
      const eyeDropper = new (window as any).EyeDropper();
      eyeDropper.open().then((result: any) => {
        const color = result.sRGBHex;
        setCurrentColor(color);
        setInputValue(color);
        addToHistory(color);
      }).catch((err: any) => {
        console.error('Error picking color:', err);
      });
    }
  };

  const formats: ColorFormat[] = ['HEX', 'RGB', 'HSL', 'HSV'];

  return (
    <div className={`min-h-screen w-full ${settings.darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Palette className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold">Color Picker</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${
                settings.darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
              }`}
            >
              {settings.darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className={`p-2 rounded-lg transition-colors ${
                settings.darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Color Display */}
        <div className={`${settings.darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 mb-6`}>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Color Preview */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div
                  className="w-48 h-48 rounded-lg shadow-inner"
                  style={{ backgroundColor: currentColor }}
                />
                <input
                  type="color"
                  value={currentColor}
                  onChange={handleColorChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Color Input and Values */}
            <div className="flex-1 space-y-4">
              {/* HEX Input */}
              <div>
                <label className="block text-sm font-medium mb-2">HEX Color</label>
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg font-mono text-lg ${
                    settings.darkMode
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-gray-50 border-gray-300'
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="#000000"
                />
              </div>

              {/* Format Tabs */}
              <div className="flex gap-2 overflow-x-auto">
                {formats.map((format) => (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      selectedFormat === format
                        ? 'bg-blue-500 text-white'
                        : settings.darkMode
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {format}
                  </button>
                ))}
              </div>

              {/* Color Values */}
              <div className="space-y-2">
                {formats.map((format) => {
                  const value = formatColor(format, colorData.hex, colorData.rgb, colorData.hsl, colorData.hsv);
                  return (
                    <div
                      key={format}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        settings.darkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}
                    >
                      <div>
                        <div className="text-xs text-gray-500 mb-1">{format}</div>
                        <div className="font-mono">{value}</div>
                      </div>
                      <button
                        onClick={() => handleCopy(format)}
                        className={`p-2 rounded-lg transition-colors ${
                          copiedFormat === format
                            ? 'bg-green-500 text-white'
                            : settings.darkMode
                            ? 'bg-gray-600 hover:bg-gray-500'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {copiedFormat === format ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* EyeDropper Button (if supported) */}
              {'EyeDropper' in window && (
                <button
                  onClick={handlePickFromScreen}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    settings.darkMode
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
                >
                  Pick Color from Screen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Color History */}
        {settings.showHistory && colorHistory.length > 0 && (
          <div className={`${settings.darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <h2 className="text-xl font-bold mb-4">Recent Colors</h2>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {colorHistory.map((color, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(color)}
                  className={`aspect-square rounded-lg shadow-md hover:scale-110 transition-transform ${
                    color === currentColor ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Floating Settings Button (for mobile) */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed bottom-6 right-6 p-4 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors md:hidden"
      >
        <Settings className="w-6 h-6" />
      </button>
    </div>
  );
};

export default ColorPicker;

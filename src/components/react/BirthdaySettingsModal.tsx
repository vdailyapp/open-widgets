import React, { memo, useState } from 'react';
import { Settings, Heart, Sparkles, Palette, Type, Zap } from 'lucide-react';

interface BirthdayConfig {
  personName: string;
  message: string;
  theme: {
    background: string;
    primary: string;
    secondary: string;
    text: string;
  };
  font: string;
  animation: string;
  showConfetti: boolean;
}

interface BirthdaySettingsModalProps {
  config: BirthdayConfig;
  onSave: (config: BirthdayConfig) => void;
  onCancel: () => void;
}

const BirthdaySettingsModal = memo(({ config, onSave, onCancel }: BirthdaySettingsModalProps) => {
  const [tempConfig, setTempConfig] = useState(config);

  const themeOptions = [
    { name: 'Sunset', value: 'from-pink-400 via-purple-400 to-indigo-400' },
    { name: 'Ocean', value: 'from-blue-400 via-cyan-400 to-teal-400' },
    { name: 'Forest', value: 'from-green-400 via-emerald-400 to-cyan-400' },
    { name: 'Sunset Orange', value: 'from-orange-400 via-red-400 to-pink-400' },
    { name: 'Royal', value: 'from-purple-600 via-blue-600 to-indigo-600' },
    { name: 'Pastel', value: 'from-pink-200 via-purple-200 to-indigo-200' }
  ];

  const fontOptions = [
    { name: 'Serif', value: 'font-serif' },
    { name: 'Sans Serif', value: 'font-sans' },
    { name: 'Mono', value: 'font-mono' }
  ];

  const animationOptions = [
    { name: 'Bounce', value: 'animate-bounce' },
    { name: 'Pulse', value: 'animate-pulse' },
    { name: 'Ping', value: 'animate-ping' },
    { name: 'None', value: '' }
  ];

  const handleSave = () => {
    onSave(tempConfig);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md max-h-screen overflow-y-auto rounded-lg bg-white p-6">
        <h2 className="mb-4 flex items-center text-xl font-bold">
          <Settings className="mr-2" /> Birthday Settings
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-2 flex items-center font-medium">
              <Heart className="mr-2 h-4 w-4" /> Person's Name
            </label>
            <input
              type="text"
              value={tempConfig.personName}
              onChange={(e) => setTempConfig(prev => ({ ...prev, personName: e.target.value }))}
              className="w-full rounded border px-3 py-2 focus:border-blue-400 focus:outline-none"
              placeholder="Enter name..."
            />
          </div>

          <div>
            <label className="mb-2 flex items-center font-medium">
              <Sparkles className="mr-2 h-4 w-4" /> Birthday Message
            </label>
            <input
              type="text"
              value={tempConfig.message}
              onChange={(e) => setTempConfig(prev => ({ ...prev, message: e.target.value }))}
              className="w-full rounded border px-3 py-2 focus:border-blue-400 focus:outline-none"
              placeholder="Enter birthday message..."
            />
          </div>

          <div>
            <label className="mb-2 flex items-center font-medium">
              <Palette className="mr-2 h-4 w-4" /> Theme
            </label>
            <select
              value={tempConfig.theme.background}
              onChange={(e) => setTempConfig(prev => ({
                ...prev,
                theme: { ...prev.theme, background: e.target.value }
              }))}
              className="w-full rounded border px-3 py-2 focus:border-blue-400 focus:outline-none"
            >
              {themeOptions.map(theme => (
                <option key={theme.name} value={theme.value}>{theme.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 flex items-center font-medium">
              <Type className="mr-2 h-4 w-4" /> Font Style
            </label>
            <select
              value={tempConfig.font}
              onChange={(e) => setTempConfig(prev => ({ ...prev, font: e.target.value }))}
              className="w-full rounded border px-3 py-2 focus:border-blue-400 focus:outline-none"
            >
              {fontOptions.map(font => (
                <option key={font.name} value={font.value}>{font.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 flex items-center font-medium">
              <Zap className="mr-2 h-4 w-4" /> Animation
            </label>
            <select
              value={tempConfig.animation}
              onChange={(e) => setTempConfig(prev => ({ ...prev, animation: e.target.value }))}
              className="w-full rounded border px-3 py-2 focus:border-blue-400 focus:outline-none"
            >
              {animationOptions.map(animation => (
                <option key={animation.name} value={animation.value}>{animation.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={tempConfig.showConfetti}
                onChange={(e) => setTempConfig(prev => ({ ...prev, showConfetti: e.target.checked }))}
                className="mr-2"
              />
              Show Confetti Animation
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
});

BirthdaySettingsModal.displayName = 'BirthdaySettingsModal';

export default BirthdaySettingsModal;
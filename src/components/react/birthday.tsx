import React, { useState, useEffect, useRef } from 'react';
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

const BirthdayWidget = () => {
  const [config, setConfig] = useState<BirthdayConfig>({
    personName: 'Friend',
    message: 'Happy Birthday!',
    theme: {
      background: 'from-pink-400 via-purple-400 to-indigo-400',
      primary: 'text-white',
      secondary: 'text-yellow-300',
      text: 'text-white'
    },
    font: 'font-serif',
    animation: 'animate-bounce',
    showConfetti: true
  });

  const [showSettings, setShowSettings] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<Array<{id: number, x: number, y: number, color: string}>>([]);
  const confettiRef = useRef<number>(0);

  // Load configuration from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('birthday-widget-config');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (error) {
        console.error('Failed to parse saved config:', error);
      }
    }
  }, []);

  // Save configuration to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('birthday-widget-config', JSON.stringify(config));
  }, [config]);

  // Listen for postMessage API for iframe embedding
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'BIRTHDAY_CONFIG_UPDATE') {
        setConfig(prevConfig => ({
          ...prevConfig,
          ...event.data.config
        }));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Confetti animation
  useEffect(() => {
    if (!config.showConfetti) return;

    const createConfetti = () => {
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7'];
      const newPieces = Array.from({ length: 50 }, (_, i) => ({
        id: confettiRef.current + i,
        x: Math.random() * 100,
        y: -10,
        color: colors[Math.floor(Math.random() * colors.length)]
      }));
      
      confettiRef.current += 50;
      setConfettiPieces(prev => [...prev, ...newPieces]);

      // Remove confetti pieces after animation
      setTimeout(() => {
        setConfettiPieces(prev => prev.filter(piece => !newPieces.some(newPiece => newPiece.id === piece.id)));
      }, 3000);
    };

    createConfetti();
    const interval = setInterval(createConfetti, 2000);

    return () => clearInterval(interval);
  }, [config.showConfetti]);

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

  const SettingsModal = () => {
    const [tempConfig, setTempConfig] = useState(config);

    const handleSave = () => {
      setConfig(tempConfig);
      setShowSettings(false);
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
              onClick={() => setShowSettings(false)}
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
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${config.theme.background} relative overflow-hidden`}>
      {/* Confetti */}
      {config.showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {confettiPieces.map(piece => (
            <div
              key={piece.id}
              className="absolute w-2 h-2 animate-bounce"
              style={{
                left: `${piece.x}%`,
                top: `${piece.y}%`,
                backgroundColor: piece.color,
                animationDuration: '3s',
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && <SettingsModal />}

      {/* Main Content */}
      <div className="text-center p-8 max-w-4xl mx-auto relative z-10">
        <div className={`${config.animation} ${config.font}`}>
          <h1 className={`text-6xl md:text-8xl font-bold mb-4 ${config.theme.primary} drop-shadow-lg`}>
            {config.message}
          </h1>
          <h2 className={`text-4xl md:text-6xl font-semibold ${config.theme.secondary} drop-shadow-md`}>
            {config.personName}! 🎉
          </h2>
        </div>
        
        <div className="mt-8 space-y-4">
          <div className="text-2xl md:text-3xl">
            <span className="inline-block animate-spin text-4xl">🎂</span>
            <span className="mx-4 animate-pulse text-4xl">🎈</span>
            <span className="inline-block animate-bounce text-4xl">🎁</span>
          </div>
          <p className={`text-lg md:text-xl ${config.theme.text} opacity-90 max-w-2xl mx-auto`}>
            Wishing you a day filled with happiness and a year filled with joy!
          </p>
        </div>
      </div>

      {/* Floating Settings Button */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed bottom-6 right-6 bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
        aria-label="Open settings"
      >
        <Settings className="h-5 w-5" />
      </button>
    </div>
  );
};

export default BirthdayWidget;
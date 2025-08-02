import React, { useState, useEffect, useRef } from 'react';
import { Settings } from 'lucide-react';
import BirthdaySettingsModal from './BirthdaySettingsModal';
import CanvasBackground from './CanvasBackground';
import TypingAnimation from './TypingAnimation';

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

const DEFAULT_CONFIG: BirthdayConfig = {
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
};

const BirthdayWidget = () => {
  const [config, setConfig] = useState<BirthdayConfig>(DEFAULT_CONFIG);

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

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Canvas Background with Cake and Fireworks */}
      <CanvasBackground showFireworks={config.showConfetti} />
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
      {showSettings && (
        <BirthdaySettingsModal 
          config={config}
          onSave={(newConfig) => {
            setConfig(newConfig);
            setShowSettings(false);
          }}
          onCancel={() => setShowSettings(false)}
        />
      )}

      {/* Main Content */}
      <div className="text-center p-8 max-w-4xl mx-auto relative z-10">
        <div className={`${config.animation} ${config.font}`}>
          <h1 className={`text-6xl md:text-8xl font-bold mb-4 ${config.theme.primary} drop-shadow-lg transition-all duration-300 hover:scale-105 hover:text-yellow-300 cursor-default`}>
            <TypingAnimation text={config.message} speed={150} />
          </h1>
          <h2 className={`text-4xl md:text-6xl font-semibold ${config.theme.secondary} drop-shadow-md transition-all duration-300 hover:scale-110 hover:rotate-1 cursor-default`}>
            <TypingAnimation text={`${config.personName}!`} speed={100} /> 🎉
          </h2>
        </div>
        
        <div className="mt-8 space-y-4">
          <div className="text-2xl md:text-3xl">
            <span className="inline-block animate-spin text-4xl hover:animate-bounce cursor-pointer transition-all duration-300 hover:scale-125">🎂</span>
            <span className="mx-4 animate-pulse text-4xl hover:animate-spin cursor-pointer transition-all duration-300 hover:scale-125">🎈</span>
            <span className="inline-block animate-bounce text-4xl hover:animate-pulse cursor-pointer transition-all duration-300 hover:scale-125">🎁</span>
          </div>
          <p className={`text-lg md:text-xl ${config.theme.text} opacity-90 max-w-2xl mx-auto hover:opacity-100 transition-opacity duration-300`}>
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
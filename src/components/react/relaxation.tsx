import React, { useState, useEffect, useRef } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  Play, 
  Pause, 
  Settings, 
  Volume2, 
  VolumeX, 
  Moon, 
  Sun, 
  RotateCcw,
  Timer,
  Quote
} from 'lucide-react';

// Sound files (placeholder URLs - in production these would be actual audio files)
const SOUNDS = {
  ocean: '/sounds/ocean.mp3',
  rain: '/sounds/rain.mp3', 
  forest: '/sounds/forest.mp3',
  silence: null
};

const QUOTES = [
  "Breathe in peace, breathe out stress.",
  "In this moment, all is well.",
  "Let go of what you cannot control.",
  "Peace comes from within.",
  "Every breath is a new beginning.",
  "Relax your mind, calm your spirit.",
  "Find stillness in the present moment.",
  "You are exactly where you need to be."
];

// Zustand store for state management
interface RelaxationState {
  // Session settings
  sessionDuration: number; // in seconds
  currentSound: keyof typeof SOUNDS;
  volume: number;
  isDarkMode: boolean;
  
  // Session tracking
  isSessionActive: boolean;
  timeRemaining: number;
  sessionsCompletedToday: number;
  lastSessionDate: string;
  
  // UI preferences
  showQuotes: boolean;
  currentQuote: string;
  
  // Actions
  setSessionDuration: (duration: number) => void;
  setCurrentSound: (sound: keyof typeof SOUNDS) => void;
  setVolume: (volume: number) => void;
  toggleDarkMode: () => void;
  startSession: () => void;
  pauseSession: () => void;
  resetSession: () => void;
  completeSession: () => void;
  toggleQuotes: () => void;
  setCurrentQuote: (quote: string) => void;
  receiveConfigFromParent: (config: any) => void;
}

const useRelaxationStore = create<RelaxationState>()(
  persist(
    (set, get) => ({
      // Initial state
      sessionDuration: 180, // 3 minutes default
      currentSound: 'ocean',
      volume: 0.5,
      isDarkMode: false,
      isSessionActive: false,
      timeRemaining: 180,
      sessionsCompletedToday: 0,
      lastSessionDate: new Date().toDateString(),
      showQuotes: true,
      currentQuote: QUOTES[0],
      
      // Actions
      setSessionDuration: (duration) => set({ sessionDuration: duration, timeRemaining: duration }),
      setCurrentSound: (sound) => set({ currentSound: sound }),
      setVolume: (volume) => set({ volume }),
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      
      startSession: () => set({ isSessionActive: true }),
      pauseSession: () => set({ isSessionActive: false }),
      resetSession: () => {
        const { sessionDuration } = get();
        set({ isSessionActive: false, timeRemaining: sessionDuration });
      },
      
      completeSession: () => {
        const today = new Date().toDateString();
        const { lastSessionDate, sessionsCompletedToday } = get();
        
        const newCount = lastSessionDate === today ? sessionsCompletedToday + 1 : 1;
        
        set({
          isSessionActive: false,
          sessionsCompletedToday: newCount,
          lastSessionDate: today,
          timeRemaining: get().sessionDuration
        });
      },
      
      toggleQuotes: () => set((state) => ({ showQuotes: !state.showQuotes })),
      setCurrentQuote: (quote) => set({ currentQuote: quote }),
      
      receiveConfigFromParent: (config) => {
        if (config.sessionDuration) set({ sessionDuration: config.sessionDuration, timeRemaining: config.sessionDuration });
        if (config.sound) set({ currentSound: config.sound });
        if (config.volume !== undefined) set({ volume: config.volume });
        if (config.darkMode !== undefined) set({ isDarkMode: config.darkMode });
      }
    }),
    {
      name: 'relaxation-widget-storage',
    }
  )
);

const RelaxationWidget: React.FC = () => {
  const store = useRelaxationStore();
  const [showSettings, setShowSettings] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'exhale'>('inhale');
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const breathingRef = useRef<NodeJS.Timeout | null>(null);

  // Timer logic
  useEffect(() => {
    if (store.isSessionActive && store.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        store.setCurrentQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
        
        useRelaxationStore.setState((state) => {
          const newTime = state.timeRemaining - 1;
          if (newTime <= 0) {
            state.completeSession();
            return state;
          }
          return { ...state, timeRemaining: newTime };
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [store.isSessionActive, store.timeRemaining]);

  // Breathing animation logic
  useEffect(() => {
    if (store.isSessionActive) {
      const breathingCycle = () => {
        setBreathingPhase('inhale');
        setTimeout(() => setBreathingPhase('exhale'), 4000); // 4 seconds inhale
        // Total cycle: 4s inhale + 4s exhale = 8s
      };
      
      breathingCycle(); // Start immediately
      breathingRef.current = setInterval(breathingCycle, 8000);
    } else {
      if (breathingRef.current) {
        clearInterval(breathingRef.current);
        breathingRef.current = null;
      }
    }

    return () => {
      if (breathingRef.current) {
        clearInterval(breathingRef.current);
      }
    };
  }, [store.isSessionActive]);

  // Audio management
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = store.volume;
      
      if (store.isSessionActive && store.currentSound !== 'silence') {
        audioRef.current.play().catch((error) => {
          console.warn('Audio playback failed:', error.message);
          // Gracefully handle audio errors - widget continues without sound
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [store.isSessionActive, store.currentSound, store.volume]);

  // PostMessage API for iframe communication
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'RELAXATION_CONFIG') {
        store.receiveConfigFromParent(event.data.config);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sessionOptions = [
    { label: '1 min', value: 60 },
    { label: '3 min', value: 180 },
    { label: '5 min', value: 300 },
  ];

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      store.isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
        : 'bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100'
    }`}>
      {/* Background Audio */}
      {store.currentSound !== 'silence' && (
        <audio
          ref={audioRef}
          src={SOUNDS[store.currentSound]}
          loop
          preload="auto"
          onError={(e) => {
            console.warn(`Failed to load audio: ${SOUNDS[store.currentSound]}`);
          }}
        />
      )}

      <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center relative">
        
        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 rounded-full opacity-30 animate-pulse ${
                store.isDarkMode ? 'bg-white' : 'bg-purple-400'
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="text-center space-y-8 z-10">
          
          {/* Quote Display */}
          {store.showQuotes && (
            <div className={`max-w-md mx-auto p-4 rounded-lg backdrop-blur-sm ${
              store.isDarkMode ? 'bg-white/10 text-white' : 'bg-white/50 text-gray-800'
            }`}>
              <Quote className="w-6 h-6 mx-auto mb-2 opacity-60" />
              <p className="text-lg font-light italic">{store.currentQuote}</p>
            </div>
          )}

          {/* Breathing Circle */}
          <div className="relative">
            <div
              className={`
                w-64 h-64 rounded-full mx-auto transition-all duration-4000 ease-in-out
                ${breathingPhase === 'inhale' ? 'scale-110' : 'scale-90'}
                ${store.isDarkMode 
                  ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 border-2 border-purple-300/50' 
                  : 'bg-gradient-to-r from-blue-400/30 to-purple-400/30 border-2 border-blue-300/50'
                }
                shadow-2xl backdrop-blur-sm
              `}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`text-center ${store.isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                  <div className="text-2xl font-light mb-2">
                    {breathingPhase === 'inhale' ? 'Breathe In' : 'Breathe Out'}
                  </div>
                  <div className="text-4xl font-bold">
                    {formatTime(store.timeRemaining)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            {!store.isSessionActive ? (
              <button
                onClick={store.startSession}
                className={`
                  flex items-center space-x-2 px-6 py-3 rounded-full text-white font-medium
                  transition-all duration-200 hover:scale-105 backdrop-blur-sm
                  ${store.isDarkMode 
                    ? 'bg-purple-600/80 hover:bg-purple-500/90' 
                    : 'bg-blue-600/80 hover:bg-blue-500/90'
                  }
                `}
              >
                <Play className="w-5 h-5" />
                <span>Start Session</span>
              </button>
            ) : (
              <button
                onClick={store.pauseSession}
                className={`
                  flex items-center space-x-2 px-6 py-3 rounded-full text-white font-medium
                  transition-all duration-200 hover:scale-105 backdrop-blur-sm
                  ${store.isDarkMode 
                    ? 'bg-orange-600/80 hover:bg-orange-500/90' 
                    : 'bg-orange-600/80 hover:bg-orange-500/90'
                  }
                `}
              >
                <Pause className="w-5 h-5" />
                <span>Pause</span>
              </button>
            )}
            
            <button
              onClick={store.resetSession}
              className={`
                flex items-center space-x-2 px-6 py-3 rounded-full font-medium
                transition-all duration-200 hover:scale-105 backdrop-blur-sm
                ${store.isDarkMode 
                  ? 'bg-gray-600/80 hover:bg-gray-500/90 text-white' 
                  : 'bg-gray-600/80 hover:bg-gray-500/90 text-white'
                }
              `}
            >
              <RotateCcw className="w-5 h-5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Session Duration Selector */}
          {!store.isSessionActive && (
            <div className="flex justify-center space-x-2">
              {sessionOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => store.setSessionDuration(option.value)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                    backdrop-blur-sm
                    ${store.sessionDuration === option.value
                      ? store.isDarkMode 
                        ? 'bg-purple-600/80 text-white' 
                        : 'bg-blue-600/80 text-white'
                      : store.isDarkMode
                        ? 'bg-white/10 text-white hover:bg-white/20'
                        : 'bg-white/50 text-gray-700 hover:bg-white/70'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {/* Daily Progress */}
          <div className={`
            text-center p-4 rounded-lg backdrop-blur-sm
            ${store.isDarkMode ? 'bg-white/10 text-white' : 'bg-white/50 text-gray-700'}
          `}>
            <Timer className="w-5 h-5 mx-auto mb-1" />
            <p className="text-sm">
              Sessions completed today: <span className="font-bold">{store.sessionsCompletedToday}</span>
            </p>
          </div>
        </div>

        {/* Floating Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          className={`
            fixed bottom-6 right-6 p-4 rounded-full shadow-xl transition-all duration-200 
            hover:scale-110 backdrop-blur-sm
            ${store.isDarkMode 
              ? 'bg-purple-600/80 hover:bg-purple-500/90 text-white' 
              : 'bg-blue-600/80 hover:bg-blue-500/90 text-white'
            }
          `}
        >
          <Settings className="w-6 h-6" />
        </button>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`
              w-full max-w-md rounded-xl p-6 space-y-6
              ${store.isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
            `}>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Dark Mode Toggle */}
              <div className="flex justify-between items-center">
                <span>Dark Mode</span>
                <button
                  onClick={store.toggleDarkMode}
                  className={`
                    p-2 rounded-full transition-colors
                    ${store.isDarkMode ? 'text-yellow-400' : 'text-gray-600'}
                  `}
                >
                  {store.isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>

              {/* Background Sound */}
              <div>
                <label className="block text-sm font-medium mb-2">Background Sound</label>
                <select
                  value={store.currentSound}
                  onChange={(e) => store.setCurrentSound(e.target.value as keyof typeof SOUNDS)}
                  className={`
                    w-full p-2 rounded-lg border
                    ${store.isDarkMode 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-white border-gray-300'
                    }
                  `}
                >
                  <option value="silence">Silence</option>
                  <option value="ocean">Ocean Waves</option>
                  <option value="rain">Rain</option>
                  <option value="forest">Forest</option>
                </select>
              </div>

              {/* Volume Control */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Volume: {Math.round(store.volume * 100)}%
                </label>
                <div className="flex items-center space-x-2">
                  <VolumeX className="w-4 h-4" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={store.volume}
                    onChange={(e) => store.setVolume(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <Volume2 className="w-4 h-4" />
                </div>
              </div>

              {/* Show Quotes Toggle */}
              <div className="flex justify-between items-center">
                <span>Show Quotes</span>
                <button
                  onClick={store.toggleQuotes}
                  className={`
                    w-12 h-6 rounded-full transition-colors relative
                    ${store.showQuotes 
                      ? store.isDarkMode ? 'bg-purple-600' : 'bg-blue-600'
                      : 'bg-gray-400'
                    }
                  `}
                >
                  <div className={`
                    w-5 h-5 rounded-full bg-white transition-transform
                    ${store.showQuotes ? 'translate-x-6' : 'translate-x-0.5'}
                  `} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelaxationWidget;
import React, { useState, useEffect, useRef } from 'react';
import { Heart, Settings, Camera, Music, Download, Palette, Type, Calendar } from 'lucide-react';

interface LoveWidgetState {
  partner1Name: string;
  partner2Name: string;
  partner1Photo: string;
  partner2Photo: string;
  loveMessage: string;
  relationshipStart: string;
  theme: 'cute' | 'elegant' | 'minimal';
  backgroundColor: string;
  backgroundType: 'color' | 'gradient' | 'image';
  backgroundImage: string;
  fontFamily: string;
  fontColor: string;
  musicEnabled: boolean;
  musicUrl: string;
}

const DEFAULT_STATE: LoveWidgetState = {
  partner1Name: 'Partner 1',
  partner2Name: 'Partner 2',
  partner1Photo: '',
  partner2Photo: '',
  loveMessage: 'Together we make the perfect love story ❤️',
  relationshipStart: new Date().toISOString().split('T')[0],
  theme: 'cute',
  backgroundColor: '#ffb3d9',
  backgroundType: 'gradient',
  backgroundImage: '',
  fontFamily: 'Inter',
  fontColor: '#ffffff',
  musicEnabled: false,
  musicUrl: ''
};

const LoveWidget = () => {
  const [state, setState] = useState<LoveWidgetState>(DEFAULT_STATE);
  const [showSettings, setShowSettings] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [relationshipDays, setRelationshipDays] = useState(0);
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number; opacity: number }>>([]);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFor, setUploadingFor] = useState<'partner1' | 'partner2' | 'background' | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('love-widget-state');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setState(prev => ({ ...prev, ...parsedState }));
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }

    // Listen for postMessage configuration from parent iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'LOVE_WIDGET_CONFIG') {
        setState(prev => ({ ...prev, ...event.data.config }));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Save state to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('love-widget-state', JSON.stringify(state));
  }, [state]);

  // Calculate relationship duration
  useEffect(() => {
    const calculateDays = () => {
      const startDate = new Date(state.relationshipStart);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setRelationshipDays(diffDays);
    };

    calculateDays();
    const interval = setInterval(calculateDays, 1000 * 60 * 60); // Update every hour
    return () => clearInterval(interval);
  }, [state.relationshipStart]);

  // Animated hearts effect
  useEffect(() => {
    const createHeart = () => {
      const newHeart = {
        id: Date.now(),
        x: Math.random() * 100,
        y: 100,
        opacity: 1
      };
      setHearts(prev => [...prev, newHeart]);
    };

    const animateHearts = () => {
      setHearts(prev => prev.map(heart => ({
        ...heart,
        y: heart.y - 0.5,
        opacity: heart.opacity - 0.003
      })).filter(heart => heart.opacity > 0 && heart.y > -10));
    };

    const heartInterval = setInterval(createHeart, 2000);
    const animationInterval = setInterval(animateHearts, 50);

    return () => {
      clearInterval(heartInterval);
      clearInterval(animationInterval);
    };
  }, []);

  const updateState = (updates: Partial<LoveWidgetState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (uploadingFor === 'partner1') {
        updateState({ partner1Photo: result });
      } else if (uploadingFor === 'partner2') {
        updateState({ partner2Photo: result });
      } else if (uploadingFor === 'background') {
        updateState({ backgroundImage: result, backgroundType: 'image' });
      }
      setUploadingFor(null);
    };
    reader.readAsDataURL(file);
  };

  const getBackgroundStyle = () => {
    switch (state.backgroundType) {
      case 'color':
        return { backgroundColor: state.backgroundColor };
      case 'gradient':
        return { 
          background: `linear-gradient(135deg, ${state.backgroundColor}, ${adjustColor(state.backgroundColor, -30)})` 
        };
      case 'image':
        return state.backgroundImage ? {
          backgroundImage: `url(${state.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : { backgroundColor: state.backgroundColor };
      default:
        return { backgroundColor: state.backgroundColor };
    }
  };

  const adjustColor = (color: string, amount: number) => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * amount);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  const exportAsImage = async () => {
    try {
      // Create a temporary canvas to render the widget
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = 800;
      canvas.height = 600;

      // Get background style
      const bgStyle = getBackgroundStyle();
      
      // Fill background
      if (bgStyle.background) {
        // For gradients, create a simple linear gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, state.backgroundColor);
        gradient.addColorStop(1, adjustColor(state.backgroundColor, -30));
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = state.backgroundColor;
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Set text properties
      ctx.fillStyle = state.fontColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Draw partner names
      ctx.font = 'bold 32px Arial';
      ctx.fillText(state.partner1Name, 200, 200);
      ctx.fillText(state.partner2Name, 600, 200);

      // Draw heart between partners
      ctx.fillStyle = '#ff4757';
      ctx.font = '48px Arial';
      ctx.fillText('❤️', 400, 200);

      // Draw love message
      ctx.fillStyle = state.fontColor;
      ctx.font = '24px Arial';
      const words = state.loveMessage.split(' ');
      let line = '';
      let y = 320;
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > 700 && n > 0) {
          ctx.fillText(line, 400, y);
          line = words[n] + ' ';
          y += 30;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 400, y);

      // Draw relationship counter
      ctx.font = 'bold 48px Arial';
      ctx.fillText(relationshipDays.toString(), 400, 450);
      
      ctx.font = '20px Arial';
      ctx.fillText(`${relationshipDays === 1 ? 'Day' : 'Days'} Together`, 400, 480);
      ctx.fillText(`Since ${new Date(state.relationshipStart).toLocaleDateString()}`, 400, 510);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `love-widget-${state.partner1Name}-${state.partner2Name}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png');

    } catch (error) {
      console.error('Error exporting image:', error);
      alert('Error exporting image. Please try again.');
    }
  };

  const getThemeClasses = () => {
    switch (state.theme) {
      case 'cute':
        return 'font-rounded text-pink-100';
      case 'elegant':
        return 'font-serif text-white';
      case 'minimal':
        return 'font-sans text-gray-100';
      default:
        return 'font-sans text-white';
    }
  };

  return (
    <div 
      className={`relative w-full h-screen overflow-hidden ${getThemeClasses()}`}
      style={{
        ...getBackgroundStyle(),
        color: state.fontColor,
        fontFamily: state.fontFamily
      }}
    >
      {/* Animated Hearts Background */}
      <div className="absolute inset-0 pointer-events-none">
        {hearts.map(heart => (
          <Heart
            key={heart.id}
            className="absolute text-pink-200 animate-pulse"
            style={{
              left: `${heart.x}%`,
              top: `${heart.y}%`,
              opacity: heart.opacity,
              fontSize: Math.random() * 20 + 10
            }}
            fill="currentColor"
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
        {/* Partners Section */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-8">
          {/* Partner 1 */}
          <div className="text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-4 bg-white/20 flex items-center justify-center">
              {state.partner1Photo ? (
                <img 
                  src={state.partner1Photo} 
                  alt={state.partner1Name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold">{state.partner1Name}</h2>
          </div>

          {/* Heart Connector */}
          <div className="flex items-center order-first sm:order-none">
            <Heart className="w-8 h-8 sm:w-12 sm:h-12 text-red-400 animate-pulse" fill="currentColor" />
          </div>

          {/* Partner 2 */}
          <div className="text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-4 bg-white/20 flex items-center justify-center">
              {state.partner2Photo ? (
                <img 
                  src={state.partner2Photo} 
                  alt={state.partner2Name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold">{state.partner2Name}</h2>
          </div>
        </div>

        {/* Love Message */}
        <div className="text-center mb-8 px-4">
          {isEditing ? (
            <textarea
              value={state.loveMessage}
              onChange={(e) => updateState({ loveMessage: e.target.value })}
              onBlur={() => setIsEditing(false)}
              className="bg-transparent border-2 border-white/30 rounded-lg p-4 text-center text-lg sm:text-2xl resize-none w-full max-w-md"
              rows={3}
              autoFocus
            />
          ) : (
            <p 
              className="text-lg sm:text-2xl font-semibold cursor-pointer hover:opacity-80 transition-opacity max-w-md mx-auto"
              onClick={() => setIsEditing(true)}
            >
              {state.loveMessage}
            </p>
          )}
        </div>

        {/* Relationship Counter */}
        <div className="text-center bg-white/10 rounded-lg p-4 sm:p-6 backdrop-blur-sm mx-4">
          <div className="text-3xl sm:text-4xl font-bold mb-2">{relationshipDays}</div>
          <div className="text-base sm:text-lg opacity-80">
            {relationshipDays === 1 ? 'Day' : 'Days'} Together
          </div>
          <div className="text-xs sm:text-sm opacity-60 mt-2">
            Since {new Date(state.relationshipStart).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Floating Settings Button */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-pink-500 hover:bg-pink-600 rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
      >
        <Settings className="w-6 h-6 text-white" />
      </button>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Widget Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 text-gray-800">
              {/* Partner Names */}
              <div>
                <label className="block text-sm font-medium mb-2">Partner 1 Name</label>
                <input
                  type="text"
                  value={state.partner1Name}
                  onChange={(e) => updateState({ partner1Name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Partner 2 Name</label>
                <input
                  type="text"
                  value={state.partner2Name}
                  onChange={(e) => updateState({ partner2Name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              {/* Photo Uploads */}
              <div>
                <label className="block text-sm font-medium mb-2">Partner Photos</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setUploadingFor('partner1');
                      fileInputRef.current?.click();
                    }}
                    className="flex-1 p-2 bg-pink-100 text-pink-800 rounded-lg hover:bg-pink-200 transition-colors"
                  >
                    <Camera className="w-4 h-4 inline mr-2" />
                    Partner 1 Photo
                  </button>
                  <button
                    onClick={() => {
                      setUploadingFor('partner2');
                      fileInputRef.current?.click();
                    }}
                    className="flex-1 p-2 bg-pink-100 text-pink-800 rounded-lg hover:bg-pink-200 transition-colors"
                  >
                    <Camera className="w-4 h-4 inline mr-2" />
                    Partner 2 Photo
                  </button>
                </div>
              </div>

              {/* Relationship Start Date */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Together Since
                </label>
                <input
                  type="date"
                  value={state.relationshipStart}
                  onChange={(e) => updateState({ relationshipStart: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <select
                  value={state.theme}
                  onChange={(e) => updateState({ theme: e.target.value as any })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="cute">Cute</option>
                  <option value="elegant">Elegant</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>

              {/* Background Options */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Palette className="w-4 h-4 inline mr-2" />
                  Background
                </label>
                <div className="space-y-2">
                  <select
                    value={state.backgroundType}
                    onChange={(e) => updateState({ backgroundType: e.target.value as any })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="color">Solid Color</option>
                    <option value="gradient">Gradient</option>
                    <option value="image">Image</option>
                  </select>
                  
                  {state.backgroundType !== 'image' && (
                    <input
                      type="color"
                      value={state.backgroundColor}
                      onChange={(e) => updateState({ backgroundColor: e.target.value })}
                      className="w-full h-10 border rounded-lg"
                    />
                  )}
                  
                  {state.backgroundType === 'image' && (
                    <button
                      onClick={() => {
                        setUploadingFor('background');
                        fileInputRef.current?.click();
                      }}
                      className="w-full p-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Upload Background Image
                    </button>
                  )}
                </div>
              </div>

              {/* Font Options */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Type className="w-4 h-4 inline mr-2" />
                  Font Color
                </label>
                <input
                  type="color"
                  value={state.fontColor}
                  onChange={(e) => updateState({ fontColor: e.target.value })}
                  className="w-full h-10 border rounded-lg"
                />
              </div>

              {/* Music Options */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Music className="w-4 h-4 inline mr-2" />
                  Background Music
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={state.musicEnabled}
                      onChange={(e) => updateState({ musicEnabled: e.target.checked })}
                      className="mr-2"
                    />
                    Enable Background Music
                  </label>
                  {state.musicEnabled && (
                    <input
                      type="url"
                      value={state.musicUrl}
                      onChange={(e) => updateState({ musicUrl: e.target.value })}
                      placeholder="Enter music URL"
                      className="w-full p-2 border rounded-lg"
                    />
                  )}
                </div>
              </div>

              {/* Export Options */}
              <div>
                <button
                  onClick={exportAsImage}
                  className="w-full p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Export as Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Background Audio */}
      {state.musicEnabled && state.musicUrl && (
        <audio
          ref={audioRef}
          src={state.musicUrl}
          loop
          autoPlay
          className="hidden"
        />
      )}
    </div>
  );
};

export default LoveWidget;
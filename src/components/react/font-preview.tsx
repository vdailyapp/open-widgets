import React, { useState, useEffect, useRef } from 'react';
import { Upload, Link, Type, Settings, Palette, AlignLeft, AlignCenter, AlignRight, Sun, Moon, Download } from 'lucide-react';

interface FontStyle {
  fontSize: number;
  fontWeight: number;
  color: string;
  lineHeight: number;
  letterSpacing: number;
  textAlign: 'left' | 'center' | 'right';
}

interface FontConfig {
  fontFamily: string;
  fontUrl?: string;
  fontFile?: File;
}

const FontPreviewWidget = () => {
  // State management
  const [previewText, setPreviewText] = useState('The quick brown fox jumps over the lazy dog');
  const [fontConfig, setFontConfig] = useState<FontConfig>({ fontFamily: 'Arial, sans-serif' });
  const [fontStyle, setFontStyle] = useState<FontStyle>({
    fontSize: 24,
    fontWeight: 400,
    color: '#000000',
    lineHeight: 1.4,
    letterSpacing: 0,
    textAlign: 'left'
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [fontUrl, setFontUrl] = useState('');
  const [loadedFonts, setLoadedFonts] = useState<string[]>([]);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('font-preview-widget');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setPreviewText(parsed.previewText || previewText);
        setFontStyle(parsed.fontStyle || fontStyle);
        setIsDarkMode(parsed.isDarkMode || false);
        setFontConfig(parsed.fontConfig || fontConfig);
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    const stateToSave = {
      previewText,
      fontStyle,
      isDarkMode,
      fontConfig
    };
    localStorage.setItem('font-preview-widget', JSON.stringify(stateToSave));
  }, [previewText, fontStyle, isDarkMode, fontConfig]);

  // Listen for postMessage configuration
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'font-preview-config') {
        const config = event.data.config;
        if (config.previewText) setPreviewText(config.previewText);
        if (config.fontStyle) setFontStyle({ ...fontStyle, ...config.fontStyle });
        if (config.fontConfig) setFontConfig({ ...fontConfig, ...config.fontConfig });
        if (typeof config.isDarkMode === 'boolean') setIsDarkMode(config.isDarkMode);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fontStyle, fontConfig]);

  // Handle font file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'font/ttf' || file.type === 'font/otf' || file.name.endsWith('.ttf') || file.name.endsWith('.otf'))) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fontData = e.target?.result as ArrayBuffer;
        const fontBlob = new Blob([fontData], { type: file.type });
        const fontUrl = URL.createObjectURL(fontBlob);
        
        const fontName = file.name.replace(/\.[^/.]+$/, "");
        const fontFace = new FontFace(fontName, `url(${fontUrl})`);
        
        fontFace.load().then(() => {
          document.fonts.add(fontFace);
          setFontConfig({ fontFamily: fontName, fontFile: file });
          setLoadedFonts([...loadedFonts, fontName]);
        }).catch(error => {
          console.error('Error loading font:', error);
        });
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Handle font URL loading
  const handleFontUrlLoad = () => {
    if (fontUrl) {
      const link = document.createElement('link');
      link.href = fontUrl;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      
      // Extract font family name from Google Fonts URL or use a generic name
      let fontFamily = 'Custom Font';
      if (fontUrl.includes('fonts.googleapis.com')) {
        const match = fontUrl.match(/family=([^&:]+)/);
        if (match) {
          fontFamily = match[1].replace(/\+/g, ' ');
        }
      }
      
      setFontConfig({ fontFamily, fontUrl });
      setLoadedFonts([...loadedFonts, fontFamily]);
    }
  };

  // Export as PNG
  const exportAsPNG = () => {
    if (previewRef.current) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const element = previewRef.current;
      
      // Set canvas size
      canvas.width = element.offsetWidth;
      canvas.height = element.offsetHeight;
      
      if (ctx) {
        // Set background
        ctx.fillStyle = isDarkMode ? '#1f2937' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set font properties
        ctx.font = `${fontStyle.fontWeight} ${fontStyle.fontSize}px ${fontConfig.fontFamily}`;
        ctx.fillStyle = fontStyle.color;
        ctx.textAlign = fontStyle.textAlign as CanvasTextAlign;
        
        // Draw text
        const lines = previewText.split('\n');
        const lineHeight = fontStyle.fontSize * fontStyle.lineHeight;
        let y = fontStyle.fontSize;
        
        lines.forEach((line) => {
          let x = 0;
          if (fontStyle.textAlign === 'center') x = canvas.width / 2;
          else if (fontStyle.textAlign === 'right') x = canvas.width;
          
          ctx.fillText(line, x, y);
          y += lineHeight;
        });
        
        // Download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'font-preview.png';
            a.click();
            URL.revokeObjectURL(url);
          }
        });
      }
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Main Preview Area */}
      <div className="p-4">
        <div 
          ref={previewRef}
          className={`w-full min-h-64 p-8 rounded-lg shadow-lg transition-colors duration-200 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border-2`}
          style={{
            fontFamily: fontConfig.fontFamily,
            fontSize: `${fontStyle.fontSize}px`,
            fontWeight: fontStyle.fontWeight,
            color: fontStyle.color,
            lineHeight: fontStyle.lineHeight,
            letterSpacing: `${fontStyle.letterSpacing}px`,
            textAlign: fontStyle.textAlign,
          }}
        >
          {previewText}
        </div>
      </div>

      {/* Floating Settings Button */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${
          isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
        } text-white`}
      >
        <Settings size={24} />
      </button>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
            isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Font Preview Settings</h2>
                <div className="flex items-center gap-4">
                  {/* Dark Mode Toggle */}
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
                  
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Font Loading Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Type size={20} />
                    Load Font
                  </h3>
                  
                  <div className="space-y-4">
                    {/* File Upload */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Upload Font File (.ttf, .otf)</label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".ttf,.otf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full p-3 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center gap-2 ${
                          isDarkMode 
                            ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700' 
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        <Upload size={20} />
                        Click to upload font file
                      </button>
                    </div>

                    {/* URL Input */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Load Font from URL</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={fontUrl}
                          onChange={(e) => setFontUrl(e.target.value)}
                          placeholder="https://fonts.googleapis.com/css2?family=..."
                          className={`flex-1 p-2 rounded-lg border transition-colors ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                        <button
                          onClick={handleFontUrlLoad}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Link size={16} />
                          Load
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview Text */}
                <div>
                  <label className="block text-sm font-medium mb-2">Preview Text</label>
                  <textarea
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    rows={3}
                    className={`w-full p-3 rounded-lg border transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter your custom text here..."
                  />
                </div>

                {/* Style Controls */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Palette size={20} />
                    Style Controls
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Font Size */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Font Size: {fontStyle.fontSize}px</label>
                      <input
                        type="range"
                        min="8"
                        max="200"
                        value={fontStyle.fontSize}
                        onChange={(e) => setFontStyle({ ...fontStyle, fontSize: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    {/* Font Weight */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Font Weight</label>
                      <select
                        value={fontStyle.fontWeight}
                        onChange={(e) => setFontStyle({ ...fontStyle, fontWeight: parseInt(e.target.value) })}
                        className={`w-full p-2 rounded-lg border ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value={100}>Thin (100)</option>
                        <option value={200}>Extra Light (200)</option>
                        <option value={300}>Light (300)</option>
                        <option value={400}>Normal (400)</option>
                        <option value={500}>Medium (500)</option>
                        <option value={600}>Semi Bold (600)</option>
                        <option value={700}>Bold (700)</option>
                        <option value={800}>Extra Bold (800)</option>
                        <option value={900}>Black (900)</option>
                      </select>
                    </div>

                    {/* Color */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Color</label>
                      <input
                        type="color"
                        value={fontStyle.color}
                        onChange={(e) => setFontStyle({ ...fontStyle, color: e.target.value })}
                        className="w-full h-10 rounded-lg border cursor-pointer"
                      />
                    </div>

                    {/* Line Height */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Line Height: {fontStyle.lineHeight}</label>
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={fontStyle.lineHeight}
                        onChange={(e) => setFontStyle({ ...fontStyle, lineHeight: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    {/* Letter Spacing */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Letter Spacing: {fontStyle.letterSpacing}px</label>
                      <input
                        type="range"
                        min="-5"
                        max="20"
                        step="0.5"
                        value={fontStyle.letterSpacing}
                        onChange={(e) => setFontStyle({ ...fontStyle, letterSpacing: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    {/* Text Alignment */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Text Alignment</label>
                      <div className="flex gap-2">
                        {[
                          { align: 'left', icon: AlignLeft },
                          { align: 'center', icon: AlignCenter },
                          { align: 'right', icon: AlignRight }
                        ].map(({ align, icon: Icon }) => (
                          <button
                            key={align}
                            onClick={() => setFontStyle({ ...fontStyle, textAlign: align as 'left' | 'center' | 'right' })}
                            className={`flex-1 p-2 rounded-lg border transition-colors flex items-center justify-center ${
                              fontStyle.textAlign === align
                                ? isDarkMode 
                                  ? 'bg-blue-600 border-blue-500 text-white' 
                                  : 'bg-blue-500 border-blue-400 text-white'
                                : isDarkMode 
                                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                                  : 'bg-white border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <Icon size={16} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Export Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Download size={20} />
                    Export
                  </h3>
                  <button
                    onClick={exportAsPNG}
                    className="w-full p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={20} />
                    Export as PNG
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FontPreviewWidget;
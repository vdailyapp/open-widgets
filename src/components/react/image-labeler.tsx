import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Upload, 
  Download, 
  Settings, 
  Square, 
  Pentagon, 
  Trash2, 
  Save,
  Palette,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface BoundingBox {
  id: string;
  type: 'rectangle';
  startX: number;
  startY: number;
  width: number;
  height: number;
  label: string;
  color: string;
}

interface Polygon {
  id: string;
  type: 'polygon';
  points: Point[];
  label: string;
  color: string;
}

type Annotation = BoundingBox | Polygon;

interface LabelConfig {
  name: string;
  color: string;
  shortcut?: string;
}

interface Settings {
  labelConfigs: LabelConfig[];
  exportFormat: 'json' | 'coco' | 'yolo';
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

const ImageLabelerWidget = () => {
  // Core state
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  
  // Drawing state
  const [drawingMode, setDrawingMode] = useState<'select' | 'rectangle' | 'polygon'>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<Partial<Annotation> | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [currentLabel, setCurrentLabel] = useState('');
  
  // Settings
  const [settings, setSettings] = useState<Settings>({
    labelConfigs: [
      { name: 'Object', color: '#FF6B6B', shortcut: '1' },
      { name: 'Person', color: '#4ECDC4', shortcut: '2' },
      { name: 'Vehicle', color: '#45B7D1', shortcut: '3' },
    ],
    exportFormat: 'json',
    showGrid: false,
    snapToGrid: false,
    gridSize: 20,
  });

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('image-labeler-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.warn('Failed to load saved settings:', error);
      }
    }

    const savedAnnotations = localStorage.getItem('image-labeler-annotations');
    if (savedAnnotations) {
      try {
        setAnnotations(JSON.parse(savedAnnotations));
      } catch (error) {
        console.warn('Failed to load saved annotations:', error);
      }
    }

    // Listen for postMessage configuration
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'IMAGE_LABELER_CONFIG') {
        const config = event.data.config;
        if (config.labelConfigs) {
          setSettings(prev => ({ ...prev, labelConfigs: config.labelConfigs }));
        }
        if (config.imageUrl) {
          loadImageFromUrl(config.imageUrl);
        }
        if (config.settings) {
          setSettings(prev => ({ ...prev, ...config.settings }));
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = event.key;
      
      // Label shortcuts
      const labelConfig = settings.labelConfigs.find(config => config.shortcut === key);
      if (labelConfig) {
        setCurrentLabel(labelConfig.name);
        event.preventDefault();
        return;
      }

      // Drawing mode shortcuts
      switch (key) {
        case 'v':
        case 'V':
          setDrawingMode('select');
          event.preventDefault();
          break;
        case 'r':
        case 'R':
          setDrawingMode('rectangle');
          event.preventDefault();
          break;
        case 'p':
        case 'P':
          setDrawingMode('polygon');
          event.preventDefault();
          break;
        case 'Escape':
          if (drawingMode === 'polygon' && polygonPoints.length > 0) {
            setPolygonPoints([]);
          }
          setDrawingMode('select');
          event.preventDefault();
          break;
        case 'Enter':
          if (drawingMode === 'polygon' && polygonPoints.length >= 3) {
            completePolygon();
            event.preventDefault();
          }
          break;
        case 'Delete':
        case 'Backspace':
          if (selectedAnnotation) {
            setAnnotations(prev => prev.filter(a => a.id !== selectedAnnotation));
            setSelectedAnnotation(null);
            event.preventDefault();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.labelConfigs, drawingMode, polygonPoints, selectedAnnotation]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('image-labeler-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('image-labeler-annotations', JSON.stringify(annotations));
  }, [annotations]);

  // Load image from URL
  const loadImageFromUrl = (url: string) => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setImageUrl(url);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    img.src = url;
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      loadImageFromUrl(url);
    }
  };

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      loadImageFromUrl(url);
    }
  };

  // Canvas drawing logic
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    ctx.drawImage(image, 0, 0);

    // Draw grid if enabled
    if (settings.showGrid) {
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 0.5 / zoom;
      const gridSize = settings.gridSize;
      for (let x = 0; x < image.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, image.height);
        ctx.stroke();
      }
      for (let y = 0; y < image.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(image.width, y);
        ctx.stroke();
      }
    }

    // Draw annotations
    annotations.forEach(annotation => {
      const isSelected = annotation.id === selectedAnnotation;
      ctx.strokeStyle = isSelected ? '#000000' : annotation.color;
      ctx.fillStyle = (isSelected ? '#000000' : annotation.color) + '20';
      ctx.lineWidth = isSelected ? 3 / zoom : 2 / zoom;
      
      if (isSelected) {
        ctx.setLineDash([5 / zoom, 5 / zoom]);
      } else {
        ctx.setLineDash([]);
      }

      if (annotation.type === 'rectangle') {
        ctx.strokeRect(annotation.startX, annotation.startY, annotation.width, annotation.height);
        ctx.fillRect(annotation.startX, annotation.startY, annotation.width, annotation.height);
        
        // Draw label
        ctx.fillStyle = isSelected ? '#000000' : annotation.color;
        ctx.font = `${12 / zoom}px Arial`;
        ctx.fillText(annotation.label, annotation.startX, annotation.startY - 5 / zoom);
      } else if (annotation.type === 'polygon') {
        if (annotation.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
          annotation.points.forEach(point => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.closePath();
          ctx.stroke();
          ctx.fill();
          
          // Draw label
          ctx.fillStyle = isSelected ? '#000000' : annotation.color;
          ctx.font = `${12 / zoom}px Arial`;
          ctx.fillText(annotation.label, annotation.points[0].x, annotation.points[0].y - 5 / zoom);
        }
      }
    });
    
    // Reset line dash
    ctx.setLineDash([]);

    // Draw current drawing
    if (currentDrawing) {
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2 / zoom;
      
      if (currentDrawing.type === 'rectangle' && currentDrawing.width && currentDrawing.height) {
        ctx.strokeRect(currentDrawing.startX!, currentDrawing.startY!, currentDrawing.width, currentDrawing.height);
      }
    }

    // Draw polygon points while drawing
    if (drawingMode === 'polygon' && polygonPoints.length > 0) {
      ctx.strokeStyle = '#FF0000';
      ctx.fillStyle = '#FF0000';
      ctx.lineWidth = 2 / zoom;
      
      polygonPoints.forEach((point, index) => {
        // Draw points
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3 / zoom, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw lines
        if (index > 0) {
          ctx.beginPath();
          ctx.moveTo(polygonPoints[index - 1].x, polygonPoints[index - 1].y);
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
        }
      });
    }

    ctx.restore();
  }, [image, annotations, currentDrawing, polygonPoints, zoom, pan, settings.showGrid, settings.gridSize, drawingMode, selectedAnnotation]);

  // Redraw canvas when needed
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Mouse event handlers
  const getMousePos = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left - pan.x) / zoom);
    const y = ((event.clientY - rect.top - pan.y) / zoom);
    
    if (settings.snapToGrid) {
      const gridSize = settings.gridSize;
      return {
        x: Math.round(x / gridSize) * gridSize,
        y: Math.round(y / gridSize) * gridSize,
      };
    }
    
    return { x, y };
  };

  // Check if point is inside annotation
  const getAnnotationAtPoint = (x: number, y: number): string | null => {
    for (let i = annotations.length - 1; i >= 0; i--) {
      const annotation = annotations[i];
      
      if (annotation.type === 'rectangle') {
        const minX = Math.min(annotation.startX, annotation.startX + annotation.width);
        const maxX = Math.max(annotation.startX, annotation.startX + annotation.width);
        const minY = Math.min(annotation.startY, annotation.startY + annotation.height);
        const maxY = Math.max(annotation.startY, annotation.startY + annotation.height);
        
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          return annotation.id;
        }
      } else if (annotation.type === 'polygon') {
        // Simple point-in-polygon test
        let inside = false;
        const points = annotation.points;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          if (((points[i].y > y) !== (points[j].y > y)) &&
              (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
            inside = !inside;
          }
        }
        if (inside) {
          return annotation.id;
        }
      }
    }
    return null;
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(event);
    
    if (drawingMode === 'select') {
      const annotationId = getAnnotationAtPoint(pos.x, pos.y);
      setSelectedAnnotation(annotationId);
    } else if (drawingMode === 'rectangle') {
      if (!currentLabel) {
        alert('Please select a label before drawing');
        return;
      }
      setIsDrawing(true);
      setCurrentDrawing({
        type: 'rectangle',
        startX: pos.x,
        startY: pos.y,
        width: 0,
        height: 0,
      });
    } else if (drawingMode === 'polygon') {
      if (!currentLabel) {
        alert('Please select a label before drawing');
        return;
      }
      setPolygonPoints(prev => [...prev, pos]);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || drawingMode !== 'rectangle' || !currentDrawing) return;
    
    const pos = getMousePos(event);
    setCurrentDrawing(prev => ({
      ...prev,
      width: pos.x - (prev?.startX || 0),
      height: pos.y - (prev?.startY || 0),
    }));
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingMode === 'rectangle' && isDrawing && currentDrawing) {
      const pos = getMousePos(event);
      const width = pos.x - (currentDrawing.startX || 0);
      const height = pos.y - (currentDrawing.startY || 0);
      
      if (Math.abs(width) > 5 && Math.abs(height) > 5) {
        const newAnnotation: BoundingBox = {
          id: Date.now().toString(),
          type: 'rectangle',
          startX: currentDrawing.startX || 0,
          startY: currentDrawing.startY || 0,
          width,
          height,
          label: currentLabel || 'Unlabeled',
          color: settings.labelConfigs.find(l => l.name === currentLabel)?.color || '#FF6B6B',
        };
        
        setAnnotations(prev => [...prev, newAnnotation]);
      }
      
      setIsDrawing(false);
      setCurrentDrawing(null);
    }
  };

  // Complete polygon drawing
  const completePolygon = () => {
    if (polygonPoints.length >= 3) {
      const newAnnotation: Polygon = {
        id: Date.now().toString(),
        type: 'polygon',
        points: polygonPoints,
        label: currentLabel || 'Unlabeled',
        color: settings.labelConfigs.find(l => l.name === currentLabel)?.color || '#FF6B6B',
      };
      
      setAnnotations(prev => [...prev, newAnnotation]);
      setPolygonPoints([]);
    }
  };

  // Export annotations
  const exportAnnotations = () => {
    try {
      let data: any;
      
      switch (settings.exportFormat) {
        case 'coco':
          data = {
            info: {
              description: "Image annotations exported from Image Labeler Widget",
              version: "1.0",
              year: new Date().getFullYear(),
              date_created: new Date().toISOString()
            },
            images: [{
              id: 1,
              width: image?.width || 0,
              height: image?.height || 0,
              file_name: imageUrl.split('/').pop() || 'image.jpg'
            }],
            annotations: annotations.map((annotation, index) => ({
              id: index + 1,
              image_id: 1,
              category_id: settings.labelConfigs.findIndex(l => l.name === annotation.label) + 1,
              bbox: annotation.type === 'rectangle' 
                ? [annotation.startX, annotation.startY, annotation.width, annotation.height]
                : undefined,
              segmentation: annotation.type === 'polygon'
                ? [annotation.points.flatMap(p => [p.x, p.y])]
                : undefined,
              area: annotation.type === 'rectangle' 
                ? Math.abs(annotation.width * annotation.height)
                : 0,
              iscrowd: 0
            })),
            categories: settings.labelConfigs.map((config, index) => ({
              id: index + 1,
              name: config.name,
              supercategory: ""
            }))
          };
          break;
          
        case 'yolo':
          data = annotations.map(annotation => {
            if (annotation.type === 'rectangle' && image) {
              const centerX = (annotation.startX + annotation.width / 2) / image.width;
              const centerY = (annotation.startY + annotation.height / 2) / image.height;
              const width = Math.abs(annotation.width) / image.width;
              const height = Math.abs(annotation.height) / image.height;
              const classId = settings.labelConfigs.findIndex(l => l.name === annotation.label);
              return `${classId} ${centerX} ${centerY} ${width} ${height}`;
            }
            return null;
          }).filter(Boolean).join('\n');
          break;
          
        default: // json
          data = {
            image: {
              url: imageUrl,
              width: image?.width || 0,
              height: image?.height || 0
            },
            annotations: annotations.map(annotation => ({
              ...annotation,
              created_at: new Date().toISOString()
            })),
            labelConfigs: settings.labelConfigs,
            exportedAt: new Date().toISOString(),
            version: "1.0"
          };
      }
      
      const content = settings.exportFormat === 'yolo' ? data : JSON.stringify(data, null, 2);
      const mimeType = settings.exportFormat === 'yolo' ? 'text/plain' : 'application/json';
      const extension = settings.exportFormat === 'yolo' ? 'txt' : 'json';
      
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `annotations_${settings.exportFormat}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Send export event to parent window
      window.parent.postMessage({
        type: 'IMAGE_LABELER_EXPORT',
        data: {
          format: settings.exportFormat,
          annotations: annotations.length,
          timestamp: new Date().toISOString()
        }
      }, '*');
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  // Settings Modal Component
  const SettingsModal = () => {
    const [tempSettings, setTempSettings] = useState(settings);

    const handleSave = () => {
      setSettings(tempSettings);
      setShowSettings(false);
    };

    const addLabelConfig = () => {
      setTempSettings(prev => ({
        ...prev,
        labelConfigs: [
          ...prev.labelConfigs,
          { name: 'New Label', color: '#000000' }
        ]
      }));
    };

    const updateLabelConfig = (index: number, updates: Partial<LabelConfig>) => {
      setTempSettings(prev => ({
        ...prev,
        labelConfigs: prev.labelConfigs.map((config, i) =>
          i === index ? { ...config, ...updates } : config
        )
      }));
    };

    const removeLabelConfig = (index: number) => {
      setTempSettings(prev => ({
        ...prev,
        labelConfigs: prev.labelConfigs.filter((_, i) => i !== index)
      }));
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-96 max-h-[80vh] overflow-y-auto rounded-lg bg-white p-6">
          <h2 className="mb-4 flex items-center text-xl font-bold">
            <Settings className="mr-2" /> Labeler Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-semibold">Label Configurations</label>
              <div className="space-y-2">
                {tempSettings.labelConfigs.map((config, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={config.name}
                      onChange={(e) => updateLabelConfig(index, { name: e.target.value })}
                      className="flex-1 rounded border px-2 py-1"
                      placeholder="Label name"
                    />
                    <input
                      type="color"
                      value={config.color}
                      onChange={(e) => updateLabelConfig(index, { color: e.target.value })}
                      className="w-10 h-8 rounded border"
                    />
                    <input
                      type="text"
                      value={config.shortcut || ''}
                      onChange={(e) => updateLabelConfig(index, { shortcut: e.target.value })}
                      className="w-12 rounded border px-2 py-1"
                      placeholder="Key"
                      maxLength={1}
                    />
                    <button
                      onClick={() => removeLabelConfig(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addLabelConfig}
                  className="w-full rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
                >
                  Add Label
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block font-semibold">Export Format</label>
              <select
                value={tempSettings.exportFormat}
                onChange={(e) => setTempSettings(prev => ({ ...prev, exportFormat: e.target.value as any }))}
                className="w-full rounded border px-3 py-2"
              >
                <option value="json">JSON</option>
                <option value="coco">COCO</option>
                <option value="yolo">YOLO</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={tempSettings.showGrid}
                  onChange={(e) => setTempSettings(prev => ({ ...prev, showGrid: e.target.checked }))}
                  className="mr-2"
                />
                Show Grid
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={tempSettings.snapToGrid}
                  onChange={(e) => setTempSettings(prev => ({ ...prev, snapToGrid: e.target.checked }))}
                  className="mr-2"
                />
                Snap to Grid
              </label>
              
              <div>
                <label className="mb-1 block">Grid Size</label>
                <input
                  type="number"
                  value={tempSettings.gridSize}
                  onChange={(e) => setTempSettings(prev => ({ ...prev, gridSize: parseInt(e.target.value) }))}
                  className="w-full rounded border px-3 py-2"
                  min="5"
                  max="100"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-2">
            <button
              onClick={() => setShowSettings(false)}
              className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Resize canvas to fit container
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      drawCanvas();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [drawCanvas]);

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      {/* Settings Modal */}
      {showSettings && <SettingsModal />}

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white p-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            <Upload size={16} />
            <span>Upload Image</span>
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setDrawingMode('select')}
              className={`p-2 rounded ${drawingMode === 'select' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Select
            </button>
            <button
              onClick={() => setDrawingMode('rectangle')}
              className={`p-2 rounded ${drawingMode === 'rectangle' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              <Square size={16} />
            </button>
            <button
              onClick={() => setDrawingMode('polygon')}
              className={`p-2 rounded ${drawingMode === 'polygon' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              <Pentagon size={16} />
            </button>
          </div>

          {drawingMode === 'polygon' && polygonPoints.length >= 3 && (
            <button
              onClick={completePolygon}
              className="rounded bg-green-500 px-3 py-1 text-white hover:bg-green-600"
            >
              Complete
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={currentLabel}
            onChange={(e) => setCurrentLabel(e.target.value)}
            className="rounded border px-3 py-2"
          >
            <option value="">Select Label</option>
            {settings.labelConfigs.map(config => (
              <option key={config.name} value={config.name}>
                {config.name} {config.shortcut && `(${config.shortcut})`}
              </option>
            ))}
          </select>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoom(prev => Math.max(0.1, prev - 0.1))}
              className="p-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-sm">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(prev => Math.min(3, prev + 0.1))}
              className="p-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="p-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          <button
            onClick={exportAnnotations}
            className="flex items-center space-x-2 rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {!image ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Upload size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Upload an image or drag and drop</p>
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`${
              drawingMode === 'select' ? 'cursor-default' :
              drawingMode === 'rectangle' ? 'cursor-crosshair' :
              drawingMode === 'polygon' ? 'cursor-copy' : 'cursor-default'
            }`}
          />
        )}
      </div>

      {/* Annotation List */}
      {annotations.length > 0 && (
        <div className="bg-white border-t p-4 max-h-48 overflow-y-auto">
          <h3 className="font-semibold mb-2">Annotations ({annotations.length})</h3>
          <div className="space-y-2">
            {annotations.map(annotation => (
              <div 
                key={annotation.id} 
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                  annotation.id === selectedAnnotation ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => setSelectedAnnotation(annotation.id)}
              >
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: annotation.color }}
                  />
                  <span>{annotation.label}</span>
                  <span className="text-sm text-gray-500">({annotation.type})</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnnotations(prev => prev.filter(a => a.id !== annotation.id));
                    if (annotation.id === selectedAnnotation) {
                      setSelectedAnnotation(null);
                    }
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Panel */}
      <div className="bg-white border-t p-2 text-xs text-gray-600">
        <div className="flex flex-wrap gap-4">
          <div><strong>V:</strong> Select</div>
          <div><strong>R:</strong> Rectangle</div>
          <div><strong>P:</strong> Polygon</div>
          <div><strong>Enter:</strong> Complete polygon</div>
          <div><strong>Esc:</strong> Cancel</div>
          <div><strong>Del:</strong> Delete selected</div>
          {settings.labelConfigs.map(config => config.shortcut && (
            <div key={config.name}><strong>{config.shortcut}:</strong> {config.name}</div>
          ))}
        </div>
      </div>

      {/* Floating Settings Button */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed bottom-4 right-4 rounded-full bg-blue-500 p-3 text-white shadow-lg hover:bg-blue-600"
      >
        <Settings size={20} />
      </button>
    </div>
  );
};

export default ImageLabelerWidget;
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Settings, Plus, Trash2, MapPin, Search } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Pin {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
}

interface MapConfig {
  center: [number, number];
  zoom: number;
  pins: Pin[];
}

const defaultConfig: MapConfig = {
  center: [40.7128, -74.0060], // New York City
  zoom: 10,
  pins: [
    {
      id: '1',
      lat: 40.7128,
      lng: -74.0060,
      title: 'New York City',
      description: 'The Big Apple'
    },
    {
      id: '2',
      lat: 40.7589,
      lng: -73.9851,
      title: 'Times Square',
      description: 'The heart of NYC'
    }
  ]
};

const MapWidget = () => {
  const [config, setConfig] = useState<MapConfig>(defaultConfig);
  const [showSettings, setShowSettings] = useState(false);
  const [newPin, setNewPin] = useState({
    title: '',
    description: '',
    lat: '',
    lng: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef<L.Map | null>(null);

  // Load configuration from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('map-widget-config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
      } catch (error) {
        console.error('Error parsing saved config:', error);
      }
    }
  }, []);

  // Save configuration to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('map-widget-config', JSON.stringify(config));
  }, [config]);

  // Listen for postMessage from parent window (for iframe embedding)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'MAP_CONFIG') {
        const newConfig = event.data.config;
        if (newConfig) {
          setConfig(prev => ({ ...prev, ...newConfig }));
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Add a new pin
  const addPin = () => {
    if (!newPin.title || !newPin.lat || !newPin.lng) {
      alert('Please fill in all required fields');
      return;
    }

    const lat = parseFloat(newPin.lat);
    const lng = parseFloat(newPin.lng);

    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid coordinates');
      return;
    }

    const pin: Pin = {
      id: Date.now().toString(),
      lat,
      lng,
      title: newPin.title,
      description: newPin.description
    };

    setConfig(prev => ({
      ...prev,
      pins: [...prev.pins, pin]
    }));

    setNewPin({ title: '', description: '', lat: '', lng: '' });
  };

  // Remove a pin
  const removePin = (pinId: string) => {
    setConfig(prev => ({
      ...prev,
      pins: prev.pins.filter(pin => pin.id !== pinId)
    }));
  };

  // Center map on a specific pin
  const centerOnPin = (pin: Pin) => {
    setConfig(prev => ({
      ...prev,
      center: [pin.lat, pin.lng],
      zoom: 15
    }));
  };

  // Simple geocoding search (this is a basic implementation)
  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    try {
      // Using Nominatim API for free geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const location = data[0];
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lon);
        
        setConfig(prev => ({
          ...prev,
          center: [lat, lng],
          zoom: 13
        }));
        
        // Auto-fill the new pin form
        setNewPin(prev => ({
          ...prev,
          lat: lat.toString(),
          lng: lng.toString(),
          title: location.display_name.split(',')[0] || searchQuery
        }));
      } else {
        alert('Location not found');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    }
  };

  // Settings Modal Component
  const SettingsModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
        <h2 className="mb-4 flex items-center text-xl font-bold">
          <Settings className="mr-2" /> Map Settings
        </h2>

        {/* Search Location */}
        <div className="mb-6">
          <h3 className="mb-2 text-lg font-semibold">Search Location</h3>
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a location..."
              className="flex-1 rounded border px-3 py-2"
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
            />
            <button
              onClick={searchLocation}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Add New Pin */}
        <div className="mb-6">
          <h3 className="mb-2 text-lg font-semibold">Add New Pin</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newPin.title}
              onChange={(e) => setNewPin(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Pin title (required)"
              className="w-full rounded border px-3 py-2"
            />
            <input
              type="text"
              value={newPin.description}
              onChange={(e) => setNewPin(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Pin description"
              className="w-full rounded border px-3 py-2"
            />
            <div className="flex space-x-2">
              <input
                type="number"
                step="any"
                value={newPin.lat}
                onChange={(e) => setNewPin(prev => ({ ...prev, lat: e.target.value }))}
                placeholder="Latitude (required)"
                className="flex-1 rounded border px-3 py-2"
              />
              <input
                type="number"
                step="any"
                value={newPin.lng}
                onChange={(e) => setNewPin(prev => ({ ...prev, lng: e.target.value }))}
                placeholder="Longitude (required)"
                className="flex-1 rounded border px-3 py-2"
              />
            </div>
            <button
              onClick={addPin}
              className="flex items-center rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Pin
            </button>
          </div>
        </div>

        {/* Existing Pins */}
        <div className="mb-6">
          <h3 className="mb-2 text-lg font-semibold">Existing Pins ({config.pins.length})</h3>
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {config.pins.map((pin) => (
              <div key={pin.id} className="flex items-center justify-between rounded border p-3">
                <div className="flex-1">
                  <h4 className="font-semibold">{pin.title}</h4>
                  <p className="text-sm text-gray-600">{pin.description}</p>
                  <p className="text-xs text-gray-500">
                    {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => centerOnPin(pin)}
                    className="rounded bg-blue-500 p-2 text-white hover:bg-blue-600"
                    title="Center on pin"
                  >
                    <MapPin className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removePin(pin.id)}
                    className="rounded bg-red-500 p-2 text-white hover:bg-red-600"
                    title="Remove pin"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Center Controls */}
        <div className="mb-6">
          <h3 className="mb-2 text-lg font-semibold">Map Center</h3>
          <div className="flex space-x-2">
            <input
              type="number"
              step="any"
              value={config.center[0]}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                center: [parseFloat(e.target.value) || 0, prev.center[1]]
              }))}
              placeholder="Latitude"
              className="flex-1 rounded border px-3 py-2"
            />
            <input
              type="number"
              step="any"
              value={config.center[1]}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                center: [prev.center[0], parseFloat(e.target.value) || 0]
              }))}
              placeholder="Longitude"
              className="flex-1 rounded border px-3 py-2"
            />
            <input
              type="number"
              value={config.zoom}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                zoom: parseInt(e.target.value) || 1
              }))}
              placeholder="Zoom"
              min="1"
              max="18"
              className="w-20 rounded border px-3 py-2"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={() => setShowSettings(false)}
            className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative h-screen w-full">
      {/* Settings Modal */}
      {showSettings && <SettingsModal />}

      {/* Map Container */}
      <MapContainer
        center={config.center}
        zoom={config.zoom}
        className="h-full w-full"
        key={`${config.center[0]}-${config.center[1]}-${config.zoom}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Render Pins */}
        {config.pins.map((pin) => (
          <Marker key={pin.id} position={[pin.lat, pin.lng]}>
            <Popup>
              <div className="text-center">
                <h3 className="font-bold">{pin.title}</h3>
                {pin.description && <p className="text-sm">{pin.description}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Settings Button */}
      <button
        onClick={() => setShowSettings(true)}
        className="absolute bottom-4 right-4 z-10 rounded-full bg-blue-500 p-3 text-white shadow-lg transition-colors hover:bg-blue-600"
        title="Map Settings"
      >
        <Settings className="h-6 w-6" />
      </button>

      {/* Info Panel */}
      <div className="absolute left-4 top-4 z-10 rounded-lg bg-white p-3 shadow-lg">
        <h2 className="flex items-center text-lg font-bold">
          <MapPin className="mr-2 text-blue-500" />
          Interactive Map
        </h2>
        <p className="text-sm text-gray-600">
          {config.pins.length} pin{config.pins.length !== 1 ? 's' : ''} configured
        </p>
      </div>
    </div>
  );
};

export default MapWidget;
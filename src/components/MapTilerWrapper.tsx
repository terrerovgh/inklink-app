'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getMapConfig } from '@/config/map-config';

interface MapTilerWrapperProps {
  center: { lat: number; lng: number };
  zoom: number;
  mapStyle?: string;
  onLoad?: (map: maplibregl.Map) => void;
  onError?: (error: Error) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const MapTilerWrapper: React.FC<MapTilerWrapperProps> = ({
  center,
  zoom,
  mapStyle,
  onLoad,
  onError,
  className = '',
  style,
  children
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: Error) => {
    console.error('MapTiler error:', err);
    setError(err.message);
    onError?.(err);
  }, [onError]);

  const handleLoad = useCallback((map: maplibregl.Map) => {
    setIsLoaded(true);
    setError(null);
    onLoad?.(map);
  }, [onLoad]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      const config = getMapConfig('maptiler');
      
      if (!config.apiKey) {
        throw new Error('MapTiler API key is required');
      }

      // Initialize MapLibre GL JS with MapTiler style
      const styleUrl = mapStyle || config.style;
      // Check if the style URL already includes the API key
      const finalStyleUrl = styleUrl.includes('?key=') ? styleUrl : `${styleUrl}?key=${config.apiKey}`;
      
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: finalStyleUrl,
        center: [center.lng, center.lat],
        zoom: zoom,
        attributionControl: true
      });

      // Add navigation controls
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

      // Handle map load event
      map.current.on('load', () => {
        if (map.current) {
          handleLoad(map.current);
        }
      });

      // Handle map errors
      map.current.on('error', (e) => {
        handleError(new Error(e.error?.message || 'Map error occurred'));
      });

      // Handle style load errors
      map.current.on('styleimagemissing', (e) => {
        console.warn('Style image missing:', e.id);
      });

    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to initialize map'));
    }

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      setIsLoaded(false);
      setError(null);
    };
  }, [center.lat, center.lng, zoom, mapStyle, handleLoad, handleError]);

  // Update map center and zoom when props change
  useEffect(() => {
    if (map.current && isLoaded) {
      map.current.setCenter([center.lng, center.lat]);
      map.current.setZoom(zoom);
    }
  }, [center.lat, center.lng, zoom, isLoaded]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={style}>
        <div className="text-center p-4">
          <p className="text-red-600 font-medium mb-2">Error loading map</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={style}>
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ minHeight: '300px' }}
      />
      {isLoaded && children}
    </div>
  );
};

export default MapTilerWrapper;
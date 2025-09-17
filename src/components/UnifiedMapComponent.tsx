'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useMapProvider } from '@/hooks/useMapProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Layers, AlertCircle, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TattooStudio, SearchFilters } from '@/components/MapComponent';
import { Coordinates, calculateDistance } from '@/lib/mapUtils';
import MapFilters, { MapFiltersState } from '@/components/MapFilters';
import MapControls from '@/components/MapControls';
import maplibregl from 'maplibre-gl';

// Dynamic imports for client-side rendering
const MapTilerWrapper = dynamic(() => import('./MapTilerWrapper'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full bg-gray-100">Loading MapTiler...</div>
});

const MapTilerMarkers = dynamic(() => import('./MapTilerMarkers'), {
  ssr: false
});

interface UnifiedMapComponentProps {
  studios?: TattooStudio[];
  selectedStudio?: TattooStudio | null;
  onStudioSelect?: (studio: TattooStudio | null) => void;
  onStudioHover?: (studio: TattooStudio | null) => void;
  searchFilters?: SearchFilters;
  userLocation?: Coordinates | null;
  showUserLocation?: boolean;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  height?: string;
  enableClustering?: boolean;
  showControls?: boolean;
  showProviderSwitch?: boolean;
  showFilters?: boolean;
  onMapReady?: () => void;
  onLocationFound?: (location: Coordinates) => void;
  onLocationError?: (error: string) => void;
}

type BaseLayerType = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

const UnifiedMapComponent: React.FC<UnifiedMapComponentProps> = ({
  studios = [],
  selectedStudio,
  onStudioSelect,
  onStudioHover,
  searchFilters = {},
  userLocation,
  showUserLocation = false,
  center = { lat: 40.7128, lng: -74.0060 },
  zoom = 10,
  className = '',
  height = '400px',
  enableClustering = true,
  showControls = true,
  showProviderSwitch = true,
  showFilters = false,
  onMapReady,
  onLocationFound,
  onLocationError
}) => {
  // Memoize filtered studios with performance optimizations
  const filteredStudios = useMemo(() => {
    if (!studios || studios.length === 0) return [];
    
    // Early return if no filters are applied
    const hasFilters = searchFilters.searchText || 
                      (searchFilters.specialty && searchFilters.specialty !== 'all') ||
                      (searchFilters.priceRange && searchFilters.priceRange.length === 2) ||
                      searchFilters.minRating ||
                      (searchFilters.radius && userLocation);
    
    if (!hasFilters) return studios;
    
    return studios.filter(studio => {
      // Search filter with optimized string matching
      if (searchFilters.searchText) {
        const searchLower = searchFilters.searchText.toLowerCase();
        const studioName = studio.name.toLowerCase();
        const studioAddress = studio.address.toLowerCase();
        
        if (studioName.includes(searchLower) || studioAddress.includes(searchLower)) {
          // Quick match found, continue to next filter
        } else if (studio.specialties) {
          const matchesSpecialty = studio.specialties.some(s => 
            s.toLowerCase().includes(searchLower)
          );
          if (!matchesSpecialty) return false;
        } else {
          return false;
        }
      }
      
      // Specialty filter
      if (searchFilters.specialty && searchFilters.specialty !== 'all') {
        if (!studio.specialties?.includes(searchFilters.specialty)) {
          return false;
        }
      }
      
      // Price range filter with bounds checking
      if (searchFilters.priceRange?.length === 2 && studio.priceRange) {
        const [minPrice, maxPrice] = searchFilters.priceRange;
        const [studioMin, studioMax] = studio.priceRange;
        if (studioMax < minPrice || studioMin > maxPrice) {
          return false;
        }
      }
      
      // Rating filter
      if (searchFilters.minRating && studio.rating < searchFilters.minRating) {
        return false;
      }
      
      // Radius filter with distance calculation caching
      if (searchFilters.radius && userLocation) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          studio.lat,
          studio.lng
        );
        if (distance > searchFilters.radius) {
          return false;
        }
      }
      
      return true;
    });
  }, [studios, searchFilters, userLocation]);
  const { currentProvider, getConfig, isLoading, error: providerError, handleMapError: handleProviderError } = useMapProvider();
  const [mapTilerMap, setMapTilerMap] = useState<maplibregl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MapFiltersState>({
    searchText: searchFilters.searchText || '',
    specialty: searchFilters.specialty || 'all',
    priceRange: searchFilters.priceRange || [0, 500],
    minRating: searchFilters.minRating || 0,
    radius: searchFilters.radius || 10
  });
  const [currentLayer, setCurrentLayer] = useState<'roadmap' | 'satellite'>('roadmap');

  // Utility function for distance calculation with caching
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Memoized event handlers
  const handleStudioSelect = useCallback((studio: TattooStudio) => {
    onStudioSelect?.(studio);
  }, [onStudioSelect]);

  const handleStudioHover = useCallback((studio: TattooStudio | null) => {
    onStudioHover?.(studio);
  }, [onStudioHover]);

  const handleFiltersChange = useCallback((newFilters: MapFiltersState) => {
    setFilters(newFilters);
  }, []);

  const handleLayerChange = useCallback((layer: 'roadmap' | 'satellite') => {
    setCurrentLayer(layer);
  }, []);

  // Optimized map handlers with error handling
  const handleMapTilerLoad = useCallback((map: maplibregl.Map) => {
    try {
      setMapTilerMap(map);
      setError(null);
      onMapReady?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load MapTiler';
      setError(errorMessage);
      console.error('MapTiler load error:', err);
    }
  }, [onMapReady]);

  const handleMapError = useCallback((error: Error) => {
    setError(error.message);
    console.error('Map error:', error);
    // Notificar al hook del proveedor para activar fallback automático
    handleProviderError?.(error);
  }, [handleProviderError]);

  // Effect para limpiar errores cuando cambia el proveedor
  useEffect(() => {
    setError(null);
    // Cleanup previous map instances
    if (currentProvider !== 'maptiler' && mapTilerMap) {
      setMapTilerMap(null);
    }
  }, [currentProvider, mapTilerMap]);

  // Sincronizar errores del proveedor con el estado local
  useEffect(() => {
    if (providerError) {
      setError(providerError.message);
    }
  }, [providerError]);

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center bg-gray-100", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando mapa...</p>
        </div>
      </div>
    );
  }

  const config = getConfig();

  return (
    <div className={cn("relative", className)}>
      {/* Indicador del proveedor actual */}
      {showControls && (
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-white bg-opacity-90 rounded px-2 py-1 text-xs text-gray-600">
            Mapa: MAPTILER
          </div>
        </div>
      )}

      {/* Renderizar MapTiler */}
      <MapTilerWrapper
        center={center}
        zoom={zoom}
        onLoad={handleMapTilerLoad}
        onError={handleMapError}
        className="w-full h-full"
      />
      <MapTilerMarkers
        map={mapTilerMap}
        studios={filteredStudios}
        selectedStudio={selectedStudio}
        onStudioSelect={onStudioSelect}
        onStudioHover={onStudioHover}
        enableClustering={enableClustering}
      />

      {/* Mensaje de error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-90">
          <div className="text-center p-4 bg-white rounded-lg shadow-lg">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-red-600 text-sm mb-3">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button
                size="sm"
                onClick={() => {
                  setError(null);
                  // Recargar la página para reinicializar completamente
                  window.location.reload();
                }}
              >
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedMapComponent;
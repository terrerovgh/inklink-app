'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { MapPin, Navigation, Layers, RotateCcw, ZoomIn, ZoomOut, Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import MapTilerWrapper from './MapTilerWrapper';
import MapTilerMarkers from './MapTilerMarkers';
import { useGeolocation } from '@/hooks/useGeolocation';
import MapControls from '@/components/MapControls';
import MapFilters, { MapFiltersState } from '@/components/MapFilters';
import { calculateDistance, isWithinRadius, formatDistance, Coordinates } from '@/lib/mapUtils';
import { getMapConfig } from '@/config/map-config';
import maplibregl from 'maplibre-gl';

// Utilidades para logging
const mapLogger = {
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[MapTilerComponent] ${message}`, data || '');
    }
  },
  warn: (message: string, data?: any) => {
    console.warn(`[MapTilerComponent] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[MapTilerComponent] ${message}`, error || '');
  }
};

// ===== INTERFACES Y TIPOS =====
export interface TattooStudio {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  phone?: string;
  website?: string;
  instagram?: string;
  specialties?: string[];
  images?: string[];
  description?: string;
  priceRange?: string;
  openingHours?: {
    [key: string]: string;
  };
  verified?: boolean;
  featured?: boolean;
}

export interface SearchFilters {
  query?: string;
  specialty?: string;
  priceRange?: string;
  rating?: number;
  distance?: number;
  verified?: boolean;
  featured?: boolean;
}

export interface MapComponentProps {
  studios: TattooStudio[];
  selectedStudio?: TattooStudio | null;
  onStudioSelect?: (studio: TattooStudio | null) => void;
  onStudioHover?: (studio: TattooStudio | null) => void;
  searchFilters?: SearchFilters;
  userLocation?: Coordinates | null;
  showUserLocation?: boolean;
  baseLayer?: BaseLayerType;
  className?: string;
  height?: string;
  enableClustering?: boolean;
  showControls?: boolean;
  onMapReady?: () => void;
  onLocationFound?: (location: Coordinates) => void;
  onLocationError?: (error: string) => void;
}

// Función para obtener el estilo de mapa de MapTiler
const getMapTilerStyle = (mapType: string): string => {
  const config = getMapConfig('maptiler');
  const baseUrl = 'https://api.maptiler.com/maps';
  let styleUrl: string;
  
  switch (mapType) {
    case 'satellite':
      styleUrl = `${baseUrl}/satellite/style.json`;
      break;
    case 'hybrid':
      styleUrl = `${baseUrl}/hybrid/style.json`;
      break;
    case 'terrain':
      styleUrl = `${baseUrl}/outdoor-v2/style.json`;
      break;
    default:
      styleUrl = `${baseUrl}/streets-v2/style.json`;
      break;
  }
  
  return config.apiKey ? `${styleUrl}?key=${config.apiKey}` : styleUrl;
};

// Datos mock
const mockTattooStudios: TattooStudio[] = [
  {
    id: '1',
    name: 'Ink Masters Studio',
    address: '123 Main St, Albuquerque, NM',
    lat: 35.0844,
    lng: -106.6504,
    rating: 4.8,
    phone: '(505) 555-0123',
    website: 'https://inkmasters.com',
    instagram: '@inkmasters_abq',
    specialties: ['Traditional', 'Realism', 'Black & Grey'],
    images: ['https://example.com/studio1.jpg'],
    description: 'Premier tattoo studio with award-winning artists',
    priceRange: '$$$',
    openingHours: {
      'Monday': '10:00 AM - 8:00 PM',
      'Tuesday': '10:00 AM - 8:00 PM',
      'Wednesday': '10:00 AM - 8:00 PM',
      'Thursday': '10:00 AM - 8:00 PM',
      'Friday': '10:00 AM - 10:00 PM',
      'Saturday': '10:00 AM - 10:00 PM',
      'Sunday': 'Closed'
    },
    verified: true,
    featured: true
  },
  {
    id: '2',
    name: 'Desert Rose Tattoo',
    address: '456 Central Ave, Albuquerque, NM',
    lat: 35.0853,
    lng: -106.6506,
    rating: 4.6,
    phone: '(505) 555-0456',
    website: 'https://desertrosetattoo.com',
    instagram: '@desertrose_tattoo',
    specialties: ['Watercolor', 'Geometric', 'Fine Line'],
    images: ['https://example.com/studio2.jpg'],
    description: 'Artistic tattoos with a modern twist',
    priceRange: '$$',
    openingHours: {
      'Monday': 'Closed',
      'Tuesday': '11:00 AM - 7:00 PM',
      'Wednesday': '11:00 AM - 7:00 PM',
      'Thursday': '11:00 AM - 7:00 PM',
      'Friday': '11:00 AM - 9:00 PM',
      'Saturday': '11:00 AM - 9:00 PM',
      'Sunday': '12:00 PM - 6:00 PM'
    },
    verified: true,
    featured: false
  },
  {
    id: '3',
    name: 'Southwest Ink',
    address: '789 Fourth St, Albuquerque, NM',
    lat: 35.0835,
    lng: -106.6495,
    rating: 4.4,
    phone: '(505) 555-0789',
    specialties: ['Traditional', 'Neo-Traditional'],
    images: ['https://example.com/studio3.jpg'],
    description: 'Classic tattoo parlor with experienced artists',
    priceRange: '$$',
    openingHours: {
      'Monday': '12:00 PM - 8:00 PM',
      'Tuesday': '12:00 PM - 8:00 PM',
      'Wednesday': '12:00 PM - 8:00 PM',
      'Thursday': '12:00 PM - 8:00 PM',
      'Friday': '12:00 PM - 10:00 PM',
      'Saturday': '12:00 PM - 10:00 PM',
      'Sunday': 'Closed'
    },
    verified: false,
    featured: false
  }
];

// Tipo para las capas base del mapa
type BaseLayerType = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

// Componente principal del mapa con MapTiler
const MapTilerComponent: React.FC<{
  studios: TattooStudio[];
  selectedStudio?: TattooStudio | null;
  onStudioSelect?: (studio: TattooStudio | null) => void;
  onStudioHover?: (studio: TattooStudio | null) => void;
  searchFilters: SearchFilters;
  userLocation?: Coordinates | null;
  showUserLocation: boolean;
  baseLayer: BaseLayerType;
  enableClustering: boolean;
  showControls: boolean;
  onMapReady?: () => void;
  onLocationFound?: (location: Coordinates) => void;
  onLocationError?: (error: string) => void;
}> = ({
  studios,
  selectedStudio,
  onStudioSelect,
  onStudioHover,
  searchFilters,
  userLocation,
  showUserLocation,
  baseLayer,
  enableClustering,
  showControls,
  onMapReady,
  onLocationFound,
  onLocationError
}) => {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [filters, setFilters] = useState<MapFiltersState>({
    query: searchFilters.query || '',
    specialty: searchFilters.specialty || '',
    priceRange: searchFilters.priceRange || '',
    rating: searchFilters.rating || 0,
    distance: searchFilters.distance || 50,
    verified: searchFilters.verified || false,
    featured: searchFilters.featured || false
  });
  const [currentLayer, setCurrentLayer] = useState<BaseLayerType>(baseLayer);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  // Filtrar estudios basado en los filtros
  const filteredStudios = useMemo(() => {
    return studios.filter(studio => {
      // Filtro por texto
      if (filters.query && !studio.name.toLowerCase().includes(filters.query.toLowerCase()) &&
          !studio.address.toLowerCase().includes(filters.query.toLowerCase())) {
        return false;
      }

      // Filtro por especialidad
      if (filters.specialty && (!studio.specialties || !studio.specialties.includes(filters.specialty))) {
        return false;
      }

      // Filtro por rango de precios
      if (filters.priceRange && studio.priceRange !== filters.priceRange) {
        return false;
      }

      // Filtro por rating
      if (filters.rating > 0 && (!studio.rating || studio.rating < filters.rating)) {
        return false;
      }

      // Filtro por distancia
      if (userLocation && filters.distance > 0) {
        const distance = calculateDistance(userLocation, { lat: studio.lat, lng: studio.lng });
        if (distance > filters.distance) {
          return false;
        }
      }

      // Filtro por verificado
      if (filters.verified && !studio.verified) {
        return false;
      }

      // Filtro por destacado
      if (filters.featured && !studio.featured) {
        return false;
      }

      return true;
    });
  }, [studios, filters, userLocation]);

  // Callback cuando el mapa está listo
  const onMapLoad = useCallback((map: maplibregl.Map) => {
    mapRef.current = map;
    mapLogger.debug('MapTiler Map loaded successfully');
    onMapReady?.();
  }, [onMapReady]);

  return (
    <div className="relative w-full h-full">
      <MapTilerWrapper
        center={{ lat: 35.0844, lng: -106.6504 }}
        zoom={13}
        onLoad={onMapLoad}
        className="w-full h-full"
        mapStyle={getMapTilerStyle(currentLayer)}
      >
        {/* Marcadores */}
        <MapTilerMarkers
          map={mapRef.current}
          studios={filteredStudios}
          selectedStudio={selectedStudio}
          onStudioSelect={onStudioSelect}
          onStudioHover={onStudioHover}
          userLocation={userLocation}
          showClustering={enableClustering}
        />
      </MapTilerWrapper>
      
      {/* Controles del mapa */}
      {showControls && (
        <MapControls
          map={mapRef.current}
          currentLayer={currentLayer}
          onLayerChange={setCurrentLayer}
          onLocationFound={onLocationFound}
          onLocationError={onLocationError}
        />
      )}
      
      {/* Filtros */}
      <MapFilters
        filters={filters}
        onFiltersChange={setFilters}
        collapsed={filtersCollapsed}
        onToggleCollapse={() => setFiltersCollapsed(!filtersCollapsed)}
        studiosCount={filteredStudios.length}
        totalStudios={studios.length}
      />
    </div>
  );
};

// Componente principal
const MapComponent: React.FC<MapComponentProps> = ({
  studios = mockTattooStudios,
  selectedStudio,
  onStudioSelect,
  onStudioHover,
  searchFilters = {},
  userLocation,
  showUserLocation = true,
  baseLayer = 'roadmap',
  className,
  height = '400px',
  enableClustering = true,
  showControls = true,
  onMapReady,
  onLocationFound,
  onLocationError
}) => {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <MapTilerComponent
        studios={studios}
        selectedStudio={selectedStudio}
        onStudioSelect={onStudioSelect}
        onStudioHover={onStudioHover}
        searchFilters={searchFilters}
        userLocation={userLocation}
        showUserLocation={showUserLocation}
        baseLayer={baseLayer}
        enableClustering={enableClustering}
        showControls={showControls}
        onMapReady={onMapReady}
        onLocationFound={onLocationFound}
        onLocationError={onLocationError}
      />
    </div>
  );
};

export default MapComponent;
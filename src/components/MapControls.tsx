'use client';

import React, { useCallback, useState } from 'react';
import { Plus, Minus, RotateCcw, Layers, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Coordinates } from '@/lib/mapUtils';

type BaseLayerType = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

interface MapControlsProps {
  map: google.maps.Map | null;
  currentLayer: BaseLayerType;
  onLayerChange: (layer: BaseLayerType) => void;
  onLocationFound?: (location: Coordinates) => void;
  onLocationError?: (error: string) => void;
  className?: string;
}

const MapControls: React.FC<MapControlsProps> = ({
  map,
  currentLayer,
  onLayerChange,
  onLocationFound,
  onLocationError,
  className,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const { getCurrentPosition } = useGeolocation();

  const layers = [
    { id: 'roadmap' as BaseLayerType, name: 'Mapa', description: 'Vista de calles' },
    { id: 'satellite' as BaseLayerType, name: 'Satélite', description: 'Vista satelital' },
    { id: 'hybrid' as BaseLayerType, name: 'Híbrido', description: 'Satélite con etiquetas' },
    { id: 'terrain' as BaseLayerType, name: 'Terreno', description: 'Relieve y topografía' },
  ];

  // Controles de zoom
  const handleZoomIn = useCallback(() => {
    if (map) {
      const currentZoom = map.getZoom() || 10;
      map.setZoom(currentZoom + 1);
    }
  }, [map]);

  const handleZoomOut = useCallback(() => {
    if (map) {
      const currentZoom = map.getZoom() || 10;
      map.setZoom(Math.max(currentZoom - 1, 1));
    }
  }, [map]);

  // Reset de vista
  const handleResetView = useCallback(() => {
    if (map) {
      map.setCenter({ lat: 35.0844, lng: -106.6504 });
      map.setZoom(13);
    }
  }, [map]);

  // Geolocalización
  const handleLocateUser = useCallback(async () => {
    if (!map) return;
    
    setIsLocating(true);
    try {
      const position = await getCurrentPosition();
      map.setCenter(position);
      map.setZoom(15);
      onLocationFound?.(position);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de geolocalización';
      onLocationError?.(errorMessage);
    } finally {
      setIsLocating(false);
    }
  }, [map, getCurrentPosition, onLocationFound, onLocationError]);

  // Cambio de capa
  const handleLayerChange = useCallback((layerId: BaseLayerType) => {
    if (map) {
      const mapTypeId = {
        roadmap: google.maps.MapTypeId.ROADMAP,
        satellite: google.maps.MapTypeId.SATELLITE,
        hybrid: google.maps.MapTypeId.HYBRID,
        terrain: google.maps.MapTypeId.TERRAIN
      }[layerId];
      
      map.setMapTypeId(mapTypeId);
      onLayerChange(layerId);
    }
  }, [map, onLayerChange]);

  return (
    <div className={cn(
      "map-controls absolute top-4 right-4 z-[1000] flex flex-col gap-2",
      "md:top-4 md:right-4", // Desktop positioning
      "max-md:bottom-4 max-md:right-4 max-md:top-auto", // Mobile positioning
      className
    )}>
      {/* Controles de Zoom */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          className={cn(
            "w-10 h-10 p-0 rounded-none border-b border-gray-200 dark:border-gray-700",
            "hover:bg-gray-100 dark:hover:bg-gray-700",
            "active:scale-95 transition-transform duration-150",
            "touch-manipulation select-none",
            "max-md:w-11 max-md:h-11" // Larger on mobile
          )}
          title="Acercar"
        >
          <Plus className="w-4 h-4 max-md:w-5 max-md:h-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          className={cn(
            "w-10 h-10 p-0 rounded-none",
            "hover:bg-gray-100 dark:hover:bg-gray-700",
            "active:scale-95 transition-transform duration-150",
            "touch-manipulation select-none",
            "max-md:w-11 max-md:h-11" // Larger on mobile
          )}
          title="Alejar"
        >
          <Minus className="w-4 h-4 max-md:w-5 max-md:h-5" />
        </Button>
      </div>

      {/* Control de Capas */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-10 h-10 p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
              "hover:bg-gray-100 dark:hover:bg-gray-700",
              "active:scale-95 transition-transform duration-150",
              "touch-manipulation select-none",
              "max-md:w-11 max-md:h-11" // Larger on mobile
            )}
            title="Cambiar capa del mapa"
          >
            <Layers className="w-4 h-4 max-md:w-5 max-md:h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {layers.map((layer) => (
            <DropdownMenuItem
              key={layer.id}
              onClick={() => handleLayerChange(layer.id)}
              className={cn(
                "cursor-pointer",
                currentLayer === layer.id && "bg-gray-100 dark:bg-gray-700"
              )}
            >
              <div>
                <div className="font-medium">{layer.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {layer.description}
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Control de Geolocalización */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleLocateUser}
        disabled={isLocating}
        className={cn(
          "w-10 h-10 p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
          "hover:bg-gray-100 dark:hover:bg-gray-700",
          "active:scale-95 transition-transform duration-150",
          "touch-manipulation select-none",
          "max-md:w-11 max-md:h-11", // Larger on mobile
          isLocating && "animate-pulse"
        )}
        title="Mi ubicación"
      >
        <Navigation className={cn(
          "w-4 h-4 max-md:w-5 max-md:h-5",
          isLocating && "animate-spin"
        )} />
      </Button>

      {/* Control de Reset */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleResetView}
        className={cn(
          "w-10 h-10 p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
          "hover:bg-gray-100 dark:hover:bg-gray-700",
          "active:scale-95 transition-transform duration-150",
          "touch-manipulation select-none",
          "max-md:w-11 max-md:h-11" // Larger on mobile
        )}
        title="Restablecer vista"
      >
        <RotateCcw className="w-4 h-4 max-md:w-5 max-md:h-5" />
      </Button>
    </div>
  );
};

export default MapControls;
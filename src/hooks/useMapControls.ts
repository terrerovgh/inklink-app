'use client';

import { useCallback, useRef, useEffect } from 'react';
import { Map as LeafletMap } from 'leaflet';
import { throttle, debounce, Coordinates } from '@/lib/mapUtils';

interface UseMapControlsProps {
  map: LeafletMap | null;
  onZoomChange?: (zoom: number) => void;
  onCenterChange?: (center: [number, number]) => void;
  onBoundsChange?: (bounds: [[number, number], [number, number]]) => void;
}

interface MapControlsReturn {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  fitBounds: (bounds: [[number, number], [number, number]]) => void;
  getCurrentZoom: () => number;
  getCurrentCenter: () => [number, number] | null;
  enableInteraction: () => void;
  disableInteraction: () => void;
  toggleInteraction: () => void;
  isInteractionEnabled: () => boolean;
}

export const useMapControls = ({
  map,
  onZoomChange,
  onCenterChange,
  onBoundsChange
}: UseMapControlsProps): MapControlsReturn => {
  const interactionEnabledRef = useRef(true);
  const lastZoomRef = useRef<number>(13);
  const lastCenterRef = useRef<[number, number]>([35.0844, -106.6504]);

  // Throttled event handlers para optimizar rendimiento
  const throttledZoomHandler = useCallback(
    throttle((e: any) => {
      if (map && onZoomChange) {
        const zoom = map.getZoom();
        if (zoom !== lastZoomRef.current) {
          lastZoomRef.current = zoom;
          onZoomChange(zoom);
        }
      }
    }, 100),
    [map, onZoomChange]
  );

  const throttledMoveHandler = useCallback(
    throttle((e: any) => {
      if (map && onCenterChange) {
        const center = map.getCenter();
        const newCenter: [number, number] = [center.lat, center.lng];
        
        // Solo disparar si el centro cambió significativamente
        const [lastLat, lastLng] = lastCenterRef.current;
        const latDiff = Math.abs(newCenter[0] - lastLat);
        const lngDiff = Math.abs(newCenter[1] - lastLng);
        
        if (latDiff > 0.001 || lngDiff > 0.001) {
          lastCenterRef.current = newCenter;
          onCenterChange(newCenter);
        }
      }
    }, 150),
    [map, onCenterChange]
  );

  const debouncedBoundsHandler = useCallback(
    debounce((e: any) => {
      if (map && onBoundsChange) {
        const bounds = map.getBounds();
        const boundsArray: [[number, number], [number, number]] = [
          [bounds.getSouth(), bounds.getWest()],
          [bounds.getNorth(), bounds.getEast()]
        ];
        onBoundsChange(boundsArray);
      }
    }, 300),
    [map, onBoundsChange]
  );

  // Configurar event listeners
  useEffect(() => {
    if (!map) return;

    // Agregar event listeners
    map.on('zoomend', throttledZoomHandler);
    map.on('moveend', throttledMoveHandler);
    map.on('moveend', debouncedBoundsHandler);

    // Configurar controles táctiles y de teclado
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    map.dragging.enable();

    // Cleanup function para remover event listeners
    return () => {
      map.off('zoomend', throttledZoomHandler);
      map.off('moveend', throttledMoveHandler);
      map.off('moveend', debouncedBoundsHandler);
    };
  }, [map, throttledZoomHandler, throttledMoveHandler, debouncedBoundsHandler]);

  // Función para hacer zoom in
  const zoomIn = useCallback(() => {
    if (map && map.getZoom) {
      const currentZoom = map.getZoom();
      const maxZoom = map.getMaxZoom();
      if (currentZoom < maxZoom) {
        map.setZoom(Math.min(currentZoom + 1, maxZoom), {
          animate: true,
          duration: 0.25
        });
      }
    }
  }, [map]);

  // Función para hacer zoom out
  const zoomOut = useCallback(() => {
    if (map && map.getZoom) {
      const currentZoom = map.getZoom();
      const minZoom = map.getMinZoom();
      if (currentZoom > minZoom) {
        map.setZoom(Math.max(currentZoom - 1, minZoom), {
          animate: true,
          duration: 0.25
        });
      }
    }
  }, [map]);

  // Función para resetear la vista
  const resetView = useCallback(() => {
    if (map && map.setView) {
      map.setView([35.0844, -106.6504], 13, {
        animate: true,
        duration: 0.5
      });
    }
  }, [map]);

  // Función para volar a una ubicación específica
  const flyTo = useCallback((lat: number, lng: number, zoom: number = 15) => {
    if (map && map.flyTo && map.getZoom) {
      map.flyTo([lat, lng], zoom, {
        animate: true,
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [map]);

  // Función para ajustar a límites específicos
  const fitBounds = useCallback((bounds: [[number, number], [number, number]]) => {
    if (map && map.fitBounds) {
      map.fitBounds(bounds, {
        animate: true,
        duration: 0.5,
        padding: [20, 20],
        maxZoom: 16
      });
    }
  }, [map]);

  // Obtener zoom actual
  const getCurrentZoom = useCallback((): number => {
    return map ? map.getZoom() : 13;
  }, [map]);

  // Obtener centro actual
  const getCurrentCenter = useCallback((): [number, number] | null => {
    if (!map) return null;
    const center = map.getCenter();
    return [center.lat, center.lng];
  }, [map]);

  // Habilitar interacción
  const enableInteraction = useCallback(() => {
    if (map) {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      interactionEnabledRef.current = true;
    }
  }, [map]);

  // Deshabilitar interacción
  const disableInteraction = useCallback(() => {
    if (map) {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
      interactionEnabledRef.current = false;
    }
  }, [map]);

  // Alternar interacción
  const toggleInteraction = useCallback(() => {
    if (interactionEnabledRef.current) {
      disableInteraction();
    } else {
      enableInteraction();
    }
  }, [enableInteraction, disableInteraction]);

  // Verificar si la interacción está habilitada
  const isInteractionEnabled = useCallback((): boolean => {
    return interactionEnabledRef.current;
  }, []);

  return {
    zoomIn,
    zoomOut,
    resetView,
    flyTo,
    fitBounds,
    getCurrentZoom,
    getCurrentCenter,
    enableInteraction,
    disableInteraction,
    toggleInteraction,
    isInteractionEnabled
  };
};

export default useMapControls;
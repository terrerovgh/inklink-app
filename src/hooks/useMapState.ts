'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Map as LeafletMap } from 'leaflet';
import { Coordinates } from '@/lib/mapUtils';

interface MapState {
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  currentZoom: number;
  currentCenter: Coordinates;
  currentLayer: string;
  isLocating: boolean;
  loadingProgress: number;
  retryCount: number;
}

interface UseMapStateOptions {
  initialZoom?: number;
  initialCenter?: Coordinates;
  initialLayer?: string;
  maxRetries?: number;
}

interface UseMapStateReturn extends MapState {
  setLoading: (loading: boolean, message?: string) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  setZoom: (zoom: number) => void;
  setCenter: (center: Coordinates) => void;
  setLayer: (layer: string) => void;
  setLocating: (locating: boolean) => void;
  setProgress: (progress: number) => void;
  incrementRetry: () => boolean;
  resetRetries: () => void;
  reset: () => void;
  canRetry: boolean;
}

const defaultOptions: UseMapStateOptions = {
  initialZoom: 13,
  initialCenter: { lat: 35.0844, lng: -106.6504 },
  initialLayer: 'osm',
  maxRetries: 3
};

export const useMapState = (options: UseMapStateOptions = {}): UseMapStateReturn => {
  const opts = { ...defaultOptions, ...options };
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<MapState>({
    isLoading: false,
    error: null,
    isInitialized: false,
    currentZoom: opts.initialZoom!,
    currentCenter: opts.initialCenter!,
    currentLayer: opts.initialLayer!,
    isLocating: false,
    loadingProgress: 0,
    retryCount: 0
  });

  // Función para actualizar el estado de carga
  const setLoading = useCallback((loading: boolean, message?: string) => {
    setState(prev => ({ ...prev, isLoading: loading }));
    
    if (loading) {
      // Simular progreso de carga
      let progress = 0;
      progressIntervalRef.current = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 90) {
          progress = 90;
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
        }
        setState(prev => ({ ...prev, loadingProgress: Math.min(progress, 90) }));
      }, 200);
      
      // Timeout de seguridad para evitar carga infinita
      loadingTimeoutRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Tiempo de espera agotado. Por favor, intenta de nuevo.',
          loadingProgress: 0
        }));
      }, 30000); // 30 segundos
    } else {
      // Limpiar intervalos y timeouts
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      setState(prev => ({ ...prev, loadingProgress: loading ? prev.loadingProgress : 0 }));
    }
  }, []);

  // Función para establecer error
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ 
      ...prev, 
      error,
      isLoading: false,
      loadingProgress: 0
    }));
    
    // Limpiar timeouts si hay error
    if (error) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  }, []);

  // Función para establecer si está inicializado
  const setInitialized = useCallback((initialized: boolean) => {
    setState(prev => ({ 
      ...prev, 
      isInitialized: initialized,
      loadingProgress: initialized ? 100 : prev.loadingProgress
    }));
    
    if (initialized) {
      // Completar progreso y limpiar loading después de un breve delay
      setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          loadingProgress: 0
        }));
      }, 500);
    }
  }, []);

  // Función para establecer zoom
  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, currentZoom: zoom }));
  }, []);

  // Función para establecer centro
  const setCenter = useCallback((center: Coordinates) => {
    setState(prev => ({ ...prev, currentCenter: center }));
  }, []);

  // Función para establecer capa
  const setLayer = useCallback((layer: string) => {
    setState(prev => ({ ...prev, currentLayer: layer }));
  }, []);

  // Función para establecer estado de localización
  const setLocating = useCallback((locating: boolean) => {
    setState(prev => ({ ...prev, isLocating: locating }));
  }, []);

  // Función para establecer progreso
  const setProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, loadingProgress: Math.max(0, Math.min(100, progress)) }));
  }, [setState]);

  // Función para incrementar contador de reintentos
  const incrementRetry = useCallback((): boolean => {
    setState(prev => {
      const newRetryCount = prev.retryCount + 1;
      return { ...prev, retryCount: newRetryCount };
    });
    return state.retryCount + 1 < opts.maxRetries!;
  }, [state.retryCount, opts.maxRetries, setState]);

  // Función para resetear reintentos
  const resetRetries = useCallback(() => {
    setState(prev => ({ ...prev, retryCount: 0 }));
  }, []);

  // Función para resetear todo el estado
  const reset = useCallback(() => {
    // Limpiar timeouts e intervalos
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    
    setState({
      isLoading: false,
      error: null,
      isInitialized: false,
      currentZoom: opts.initialZoom!,
      currentCenter: opts.initialCenter!,
      currentLayer: opts.initialLayer!,
      isLocating: false,
      loadingProgress: 0,
      retryCount: 0
    });
  }, [opts, setState]);

  // Verificar si se puede reintentar
  const canRetry = state.retryCount < opts.maxRetries!;

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    setLoading,
    setError,
    setInitialized,
    setZoom,
    setCenter,
    setLayer,
    setLocating,
    setProgress,
    incrementRetry,
    resetRetries,
    reset,
    canRetry
  };
};

export default useMapState;
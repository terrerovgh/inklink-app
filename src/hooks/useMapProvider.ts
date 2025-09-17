'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  MapProvider, 
  getMapConfig, 
  getAvailableProviders, 
  getProviderWithFallback,
  isProviderAvailable,
  DEFAULT_MAP_PROVIDER,
  FALLBACK_MAP_PROVIDER
} from '@/config/map-config';

const MAP_PROVIDER_STORAGE_KEY = 'inklink-map-provider';

export function useMapProvider() {
  const [currentProvider, setCurrentProvider] = useState<MapProvider>(DEFAULT_MAP_PROVIDER);
  const [availableProviders, setAvailableProviders] = useState<MapProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para manejar errores de carga del mapa
  const handleMapError = useCallback((failedProvider: MapProvider, errorMessage: string) => {
    console.warn(`Map provider ${failedProvider} failed:`, errorMessage);
    setError(`Error con ${failedProvider}: ${errorMessage}`);
    
    // Intentar fallback automático
    const config = getMapConfig(failedProvider);
    if (config.fallback && isProviderAvailable(config.fallback)) {
      console.log(`Switching to fallback provider: ${config.fallback}`);
      setCurrentProvider(config.fallback);
      localStorage.setItem(MAP_PROVIDER_STORAGE_KEY, config.fallback);
      setError(null);
    } else {
      // Buscar cualquier proveedor disponible
      const available = getAvailableProviders();
      const alternativeProvider = available.find(p => p !== failedProvider);
      if (alternativeProvider) {
        console.log(`Switching to alternative provider: ${alternativeProvider}`);
        setCurrentProvider(alternativeProvider);
        localStorage.setItem(MAP_PROVIDER_STORAGE_KEY, alternativeProvider);
        setError(null);
      }
    }
  }, []);

  useEffect(() => {
    try {
      // Obtener proveedores disponibles
      const providers = getAvailableProviders();
      setAvailableProviders(providers);
      
      // Cargar el proveedor guardado en localStorage
      const savedProvider = localStorage.getItem(MAP_PROVIDER_STORAGE_KEY) as MapProvider;
      
      let selectedProvider: MapProvider;
      
      if (savedProvider && providers.includes(savedProvider) && isProviderAvailable(savedProvider)) {
        selectedProvider = savedProvider;
      } else {
        // Usar el proveedor con fallback automático
        selectedProvider = getProviderWithFallback();
      }
      
      setCurrentProvider(selectedProvider);
      setError(null);
    } catch (err) {
      console.error('Error initializing map provider:', err);
      setError('Error al inicializar el proveedor de mapas');
      // Fallback a OSM como último recurso
      setCurrentProvider(FALLBACK_MAP_PROVIDER);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchProvider = useCallback((provider: MapProvider) => {
    if (availableProviders.includes(provider) && isProviderAvailable(provider)) {
      setCurrentProvider(provider);
      localStorage.setItem(MAP_PROVIDER_STORAGE_KEY, provider);
      setError(null);
    } else {
      console.warn(`Provider ${provider} is not available`);
    }
  }, [availableProviders]);

  const getConfig = useCallback(() => getMapConfig(currentProvider), [currentProvider]);

  return {
    currentProvider,
    availableProviders,
    isLoading,
    error,
    switchProvider,
    getConfig,
    handleMapError,
    canSwitch: availableProviders.length > 1
  };
}
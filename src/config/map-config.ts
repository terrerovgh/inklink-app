export type MapProvider = 'maptiler';

export interface MapConfig {
  provider: MapProvider;
  apiKey?: string;
  style?: string;
  attribution?: string;
  priority?: number;
}

export const MAP_PROVIDERS = {
  maptiler: {
    provider: 'maptiler' as const,
    apiKey: process.env.NEXT_PUBLIC_MAPTILER_API_KEY,
    style: 'https://api.maptiler.com/maps/streets-v2/style.json',
    attribution: '© MapTiler © OpenStreetMap contributors',
    priority: 1
  }
} as const;

// MapTiler como único proveedor
export const DEFAULT_MAP_PROVIDER: MapProvider = 'maptiler';
export const FALLBACK_MAP_PROVIDER: MapProvider = 'maptiler';

// Función para obtener la configuración del mapa con fallback automático
export function getMapConfig(provider?: MapProvider): MapConfig {
  const selectedProvider = provider || DEFAULT_MAP_PROVIDER;
  return MAP_PROVIDERS[selectedProvider];
}

// Función para validar si un proveedor está disponible
export function isProviderAvailable(provider: MapProvider): boolean {
  const config = MAP_PROVIDERS[provider];
  
  switch (provider) {
    case 'maptiler':
      return !!config.apiKey;
    default:
      return false;
  }
}

// Lista de proveedores disponibles (solo Maptiler)
export function getAvailableProviders(): MapProvider[] {
  return (['maptiler'] as MapProvider[])
    .filter(provider => isProviderAvailable(provider));
}

// Función para obtener el proveedor (siempre Maptiler)
export function getProviderWithFallback(): MapProvider {
  return DEFAULT_MAP_PROVIDER;
}
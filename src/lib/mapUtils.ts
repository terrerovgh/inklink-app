// Utilidades para manejo de mapas y geolocalización

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeolocationResult {
  coordinates: Coordinates;
  accuracy?: number;
  source: 'gps' | 'ip' | 'fallback';
}

// Función para obtener la ubicación del usuario
export const getUserLocation = async (): Promise<GeolocationResult> => {
  // Intentar geolocalización GPS primero
  if ('geolocation' in navigator) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 8000, // Reducido para mejor compatibilidad
            maximumAge: 300000 // 5 minutos
          }
        );
      });

      return {
        coordinates: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        },
        accuracy: position.coords.accuracy,
        source: 'gps'
      };
    } catch (error) {
      console.warn('GPS geolocation failed:', error);
    }
  }

  // Fallback a geolocalización por IP
  try {
    const response = await fetch('https://ipapi.co/json/', {
      timeout: 5000
    } as RequestInit);
    
    if (response.ok) {
      const data = await response.json();
      if (data.latitude && data.longitude) {
        return {
          coordinates: {
            lat: parseFloat(data.latitude),
            lng: parseFloat(data.longitude)
          },
          source: 'ip'
        };
      }
    }
  } catch (error) {
    console.warn('IP geolocation failed:', error);
  }

  // Fallback final a ubicación por defecto (Albuquerque, NM)
  return {
    coordinates: {
      lat: 35.0844,
      lng: -106.6504
    },
    source: 'fallback'
  };
};

// Calcular distancia entre dos puntos usando la fórmula de Haversine
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Convertir grados a radianes
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Verificar si un punto está dentro de un radio específico
export const isWithinRadius = (
  center: Coordinates,
  point: Coordinates,
  radiusKm: number
): boolean => {
  const distance = calculateDistance(center.lat, center.lng, point.lat, point.lng);
  return distance <= radiusKm;
};

// Obtener los límites (bounds) para un punto y radio
export const getBoundsForRadius = (
  center: Coordinates,
  radiusKm: number
): [[number, number], [number, number]] => {
  const latDelta = radiusKm / 111; // Aproximadamente 111 km por grado de latitud
  const lngDelta = radiusKm / (111 * Math.cos(toRadians(center.lat)));
  
  return [
    [center.lat - latDelta, center.lng - lngDelta], // Southwest
    [center.lat + latDelta, center.lng + lngDelta]  // Northeast
  ];
};

// Formatear distancia para mostrar al usuario
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  } else {
    return `${Math.round(distanceKm)} km`;
  }
};

// Validar coordenadas
export const isValidCoordinates = (coords: Coordinates): boolean => {
  return (
    typeof coords.lat === 'number' &&
    typeof coords.lng === 'number' &&
    coords.lat >= -90 &&
    coords.lat <= 90 &&
    coords.lng >= -180 &&
    coords.lng <= 180 &&
    !isNaN(coords.lat) &&
    !isNaN(coords.lng)
  );
};

// Generar coordenadas aleatorias dentro de un radio (para testing)
export const generateRandomCoordinatesInRadius = (
  center: Coordinates,
  radiusKm: number,
  count: number = 1
): Coordinates[] => {
  const coordinates: Coordinates[] = [];
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusKm;
    
    const latDelta = (distance * Math.cos(angle)) / 111;
    const lngDelta = (distance * Math.sin(angle)) / (111 * Math.cos(toRadians(center.lat)));
    
    coordinates.push({
      lat: center.lat + latDelta,
      lng: center.lng + lngDelta
    });
  }
  
  return coordinates;
};

// Obtener el centro de un conjunto de coordenadas
export const getCenterOfCoordinates = (coordinates: Coordinates[]): Coordinates => {
  if (coordinates.length === 0) {
    throw new Error('No coordinates provided');
  }
  
  if (coordinates.length === 1) {
    return coordinates[0];
  }
  
  const sum = coordinates.reduce(
    (acc, coord) => ({
      lat: acc.lat + coord.lat,
      lng: acc.lng + coord.lng
    }),
    { lat: 0, lng: 0 }
  );
  
  return {
    lat: sum.lat / coordinates.length,
    lng: sum.lng / coordinates.length
  };
};

// Debounce function para optimizar búsquedas
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};



// Función para manejar errores de carga de tiles
export const handleTileError = (error: Event, retryCount: number = 0): void => {
  console.warn(`Tile loading error (attempt ${retryCount + 1}):`, error);
  
  if (retryCount < 3) {
    // Reintentar después de un delay
    setTimeout(() => {
      const target = error.target as HTMLImageElement;
      if (target && target.src) {
        target.src = target.src + '?retry=' + (retryCount + 1);
      }
    }, Math.pow(2, retryCount) * 1000); // Backoff exponencial
  }
};

// Función para optimizar el rendimiento del mapa
export const optimizeMapPerformance = (map: any) => {
  if (!map) return;
  
  // Configurar opciones de rendimiento
  map.options.preferCanvas = true;
  map.options.updateWhenIdle = true;
  map.options.updateWhenZooming = false;
  
  // Limpiar listeners innecesarios en zoom alto
  map.on('zoomend', () => {
    const zoom = map.getZoom();
    if (zoom > 16) {
      map.options.updateWhenZooming = false;
    } else {
      map.options.updateWhenZooming = true;
    }
  });
};
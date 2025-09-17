// Servicio de geolocalización por IP y ubicación del usuario
import { useState } from 'react';

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
  accuracy?: 'ip' | 'gps';
}

export interface IPLocationResponse {
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  country_name: string;
  error?: boolean;
}

// Función para obtener ubicación por IP usando ip-api.com (gratuita)
export const getLocationByIP = async (): Promise<LocationData | null> => {
  try {
    console.log('🌐 Intentando obtener ubicación por IP...');
    const response = await fetch('https://ipapi.co/json/');
    
    if (!response.ok) {
      throw new Error('Error al obtener ubicación por IP');
    }
    
    const data: IPLocationResponse = await response.json();
    console.log('📍 Respuesta de geolocalización IP:', data);
    
    if (!data.error && data.latitude && data.longitude) {
      console.log('✅ Ubicación por IP obtenida exitosamente');
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        region: data.region,
        country: data.country_name,
        accuracy: 'ip'
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo ubicación por IP:', error);
    console.log('🏜️ Usando ubicación fallback: Albuquerque');
    // Fallback a Albuquerque para desarrollo/pruebas
    return {
      latitude: 35.0844,
      longitude: -106.6504,
      city: 'Albuquerque',
      region: 'New Mexico',
      country: 'United States',
      accuracy: 'ip'
    };
  }
};

// Función para obtener ubicación GPS del usuario (requiere permiso)
export const getUserLocation = (): Promise<LocationData | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocalización no soportada por el navegador');
      resolve(null);
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 8000, // Reducido a 8 segundos
      maximumAge: 300000 // 5 minutos
    };

    // Timeout adicional como salvaguarda
    const timeoutId = setTimeout(() => {
      console.warn('⏰ Timeout de geolocalización alcanzado');
      resolve(null);
    }, 10000); // 10 segundos como máximo

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        console.log('✅ Ubicación GPS obtenida exitosamente');
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: 'gps'
        });
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error('❌ Error obteniendo ubicación GPS:', error.message);
        
        // Manejar diferentes tipos de errores
        switch (error.code) {
          case error.PERMISSION_DENIED:
            console.log('🚫 Permiso de geolocalización denegado por el usuario');
            break;
          case error.POSITION_UNAVAILABLE:
            console.log('📍 Ubicación no disponible');
            break;
          case error.TIMEOUT:
            console.log('⏰ Timeout al obtener ubicación');
            break;
          default:
            console.log('❓ Error desconocido de geolocalización');
            break;
        }
        
        resolve(null);
      },
      options
    );
  });
};

// Función para calcular distancia entre dos puntos (fórmula de Haversine)
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Función para formatear dirección
export const formatAddress = (location: LocationData): string => {
  const parts = [];
  if (location.city) parts.push(location.city);
  if (location.region) parts.push(location.region);
  if (location.country) parts.push(location.country);
  return parts.join(', ');
};

// Función para determinar el nivel de zoom apropiado según la ubicación
export const getOptimalZoom = (location: LocationData): number => {
  if (location.accuracy === 'gps') {
    return 14; // Zoom más cercano para ubicación GPS precisa
  }
  
  if (location.accuracy === 'ip') {
    // Zoom basado en el tipo de ciudad/región
    if (location.city) {
      // Ciudades grandes conocidas requieren menos zoom
      const majorCities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
      if (majorCities.some(city => location.city?.toLowerCase().includes(city.toLowerCase()))) {
        return 10; // Zoom más alejado para ciudades grandes
      }
      return 12; // Zoom medio para ciudades normales
    }
    return 8; // Zoom alejado si solo tenemos región/país
  }
  
  return 6; // Zoom por defecto muy alejado
};

// Función para obtener ubicación con zoom automático
export const getLocationWithZoom = async (): Promise<{ location: LocationData; zoom: number } | null> => {
  try {
    // Primero intentar geolocalización por IP (más rápida)
    const ipLocation = await getLocationByIP();
    if (ipLocation) {
      const zoom = getOptimalZoom(ipLocation);
      console.log(`🎯 Ubicación por IP obtenida: ${formatAddress(ipLocation)} (zoom: ${zoom})`);
      return { location: ipLocation, zoom };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo ubicación con zoom:', error);
    return null;
  }
};

// Hook personalizado para manejar geolocalización
export const useGeolocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getIPLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const ipLocation = await getLocationByIP();
      setLocation(ipLocation);
    } catch (err) {
      setError('Error obteniendo ubicación por IP');
    } finally {
      setLoading(false);
    }
  };

  const requestUserLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const userLocation = await getUserLocation();
      if (userLocation) {
        setLocation(userLocation);
      } else {
        setError('No se pudo obtener la ubicación del usuario');
      }
    } catch (err) {
      setError('Error obteniendo ubicación GPS');
    } finally {
      setLoading(false);
    }
  };

  return {
    location,
    loading,
    error,
    getIPLocation,
    requestUserLocation
  };
};
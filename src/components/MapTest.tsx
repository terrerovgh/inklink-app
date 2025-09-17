'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Settings, Eye, EyeOff } from 'lucide-react';
import { BaseLayerType } from '@/lib/mapLayers';
import { TattooStudio } from '@/types/map';

// Importación dinámica del MapComponent para evitar problemas de SSR
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-gray-600">Cargando mapa...</p>
      </div>
    </div>
  )
});

// Datos de prueba para estudios de tatuajes
const mockStudios: TattooStudio[] = [
  {
    id: '1',
    name: 'Ink Masters Studio',
    address: 'Calle Principal 123, Madrid',
    latitude: 40.4168,
    longitude: -3.7038,
    rating: 4.8,
    reviewCount: 156,
    specialties: ['Realismo', 'Tradicional', 'Blackwork'],
    priceRange: '€€€',
    isOpen: true,
    phone: '+34 91 123 4567',
    website: 'https://inkmasters.es',
    images: ['/api/placeholder/300/200'],
    artists: [
      {
        id: 'a1',
        name: 'Carlos Mendez',
        specialties: ['Realismo', 'Retratos'],
        experience: 8,
        rating: 4.9,
        avatar: '/api/placeholder/100/100'
      }
    ]
  },
  {
    id: '2',
    name: 'Urban Tattoo',
    address: 'Avenida de la Libertad 45, Barcelona',
    latitude: 41.3851,
    longitude: 2.1734,
    rating: 4.6,
    reviewCount: 89,
    specialties: ['Neo-tradicional', 'Acuarela', 'Minimalista'],
    priceRange: '€€',
    isOpen: false,
    phone: '+34 93 987 6543',
    website: 'https://urbantattoo.cat',
    images: ['/api/placeholder/300/200'],
    artists: [
      {
        id: 'a2',
        name: 'Ana Rodriguez',
        specialties: ['Acuarela', 'Floral'],
        experience: 5,
        rating: 4.7,
        avatar: '/api/placeholder/100/100'
      }
    ]
  },
  {
    id: '3',
    name: 'Black Rose Tattoo',
    address: 'Plaza del Sol 8, Valencia',
    latitude: 39.4699,
    longitude: -0.3763,
    rating: 4.9,
    reviewCount: 203,
    specialties: ['Blackwork', 'Dotwork', 'Geométrico'],
    priceRange: '€€€€',
    isOpen: true,
    phone: '+34 96 555 1234',
    website: 'https://blackrose.es',
    images: ['/api/placeholder/300/200'],
    artists: [
      {
        id: 'a3',
        name: 'Miguel Santos',
        specialties: ['Blackwork', 'Tribal'],
        experience: 12,
        rating: 4.9,
        avatar: '/api/placeholder/100/100'
      }
    ]
  }
];

export default function MapTest() {
  const [baseLayer, setBaseLayer] = useState<BaseLayerType>('openstreetmap');
  const [enableClustering, setEnableClustering] = useState(true);
  const [enableGeolocation, setEnableGeolocation] = useState(true);
  const [showLayerSelector, setShowLayerSelector] = useState(true);
  const [showDeviceInfo, setShowDeviceInfo] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [maxClusterRadius, setMaxClusterRadius] = useState(50);

  const handleMarkerClick = (studio: TattooStudio) => {
    console.log('Studio seleccionado:', studio);
  };

  const handleBaseLayerChange = (layer: BaseLayerType) => {
    setBaseLayer(layer);
    console.log('Capa base cambiada a:', layer);
  };

  const handleDeviceChange = (deviceInfo: any) => {
    console.log('Información del dispositivo:', deviceInfo);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Prueba del Sistema de Mapas InkLink
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Panel de controles */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Configuración
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Capa base */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Capa Base</label>
                    <select 
                      value={baseLayer} 
                      onChange={(e) => setBaseLayer(e.target.value as BaseLayerType)}
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      <option value="openstreetmap">OpenStreetMap</option>
                      <option value="satellite">Satélite</option>
                      <option value="terrain">Terreno</option>
                      <option value="dark">Oscuro</option>
                    </select>
                  </div>

                  {/* Clustering */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Clustering</label>
                    <Button
                      variant={enableClustering ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEnableClustering(!enableClustering)}
                    >
                      {enableClustering ? 'ON' : 'OFF'}
                    </Button>
                  </div>

                  {/* Radio de clustering */}
                  {enableClustering && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Radio de Clustering: {maxClusterRadius}px
                      </label>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={maxClusterRadius}
                        onChange={(e) => setMaxClusterRadius(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Geolocalización */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Geolocalización</label>
                    <Button
                      variant={enableGeolocation ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEnableGeolocation(!enableGeolocation)}
                    >
                      {enableGeolocation ? 'ON' : 'OFF'}
                    </Button>
                  </div>

                  {/* Selector de capas */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Selector de Capas</label>
                    <Button
                      variant={showLayerSelector ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowLayerSelector(!showLayerSelector)}
                    >
                      {showLayerSelector ? 'ON' : 'OFF'}
                    </Button>
                  </div>

                  {/* Info del dispositivo */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Info Dispositivo</label>
                    <Button
                      variant={showDeviceInfo ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowDeviceInfo(!showDeviceInfo)}
                    >
                      {showDeviceInfo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* Tema */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tema</label>
                    <select 
                      value={theme} 
                      onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      <option value="light">Claro</option>
                      <option value="dark">Oscuro</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Estadísticas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Estadísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Estudios:</span>
                      <Badge variant="secondary">{mockStudios.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Capa Actual:</span>
                      <Badge variant="outline">{baseLayer}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Clustering:</span>
                      <Badge variant={enableClustering ? "default" : "secondary"}>
                        {enableClustering ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mapa */}
            <div className="lg:col-span-3">
              <div className="h-96 lg:h-[600px] rounded-lg overflow-hidden border">
                <MapComponent
                  center={[40.4168, -3.7038]} // Madrid
                  zoom={6}
                  studios={mockStudios}
                  onMarkerClick={handleMarkerClick}
                  enableClustering={enableClustering}
                  enableGeolocation={enableGeolocation}
                  baseLayer={baseLayer}
                  onBaseLayerChange={handleBaseLayerChange}
                  showLayerSelector={showLayerSelector}
                  maxClusterRadius={maxClusterRadius}
                  theme={theme}
                  showDeviceInfo={showDeviceInfo}
                  onDeviceChange={handleDeviceChange}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Funcionalidades Implementadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✅ Completado</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Conexión con OpenStreetMap</li>
                <li>• Controles de zoom y arrastre</li>
                <li>• Sistema de marcadores personalizables</li>
                <li>• Capas base configurables</li>
                <li>• Clustering de marcadores</li>
                <li>• Geolocalización</li>
                <li>• Estados de carga y error</li>
                <li>• Compatibilidad responsive</li>
                <li>• Detección de dispositivos</li>
                <li>• Optimizaciones de rendimiento</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">🔧 Características</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Soporte táctil completo</li>
                <li>• Adaptación automática a pantalla</li>
                <li>• Múltiples estilos de mapa</li>
                <li>• Popups informativos</li>
                <li>• Filtros y controles</li>
                <li>• Tema claro/oscuro</li>
                <li>• Advertencias de orientación</li>
                <li>• Detección de conexión lenta</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-purple-600">📱 Compatibilidad</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Navegadores modernos</li>
                <li>• Dispositivos móviles</li>
                <li>• Tablets</li>
                <li>• Desktop</li>
                <li>• Diferentes resoluciones</li>
                <li>• Orientación portrait/landscape</li>
                <li>• Dispositivos con notch</li>
                <li>• Accesibilidad básica</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
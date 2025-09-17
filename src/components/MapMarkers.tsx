import React, { useEffect, useMemo, useState } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { LatLngExpression, DivIcon } from 'leaflet';
import { MapPin, Star, Users, Calendar, Award } from 'lucide-react';
import { MarkerType, createCustomIcon, getStudioIcon } from '@/lib/mapLayers';
import { TattooStudio } from '@/types/map';

interface MapMarkersProps {
  studios: TattooStudio[];
  userLocation?: LatLngExpression;
  selectedStudio?: string;
  onStudioSelect?: (studio: TattooStudio) => void;
  onStudioHover?: (studio: TattooStudio | null) => void;
  showClustering?: boolean;
  maxClusterRadius?: number;
}

// Componente para tooltip personalizado
const StudioTooltip: React.FC<{ studio: TattooStudio }> = ({ studio }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-3 min-w-[200px] max-w-[300px] border">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
          <MapPin className="w-6 h-6 text-black" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{studio.name}</h3>
          <p className="text-sm text-gray-600 mb-2">{studio.address}</p>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-white fill-current" />
              <span className="text-sm font-medium">{studio.rating}</span>
            </div>
            <span className="text-xs text-gray-400">•</span>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-600">{studio.artistCount} artistas</span>
            </div>
          </div>
          
          {studio.specialties && studio.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {studio.specialties.slice(0, 3).map((specialty, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-white text-black text-xs rounded-full"
                >
                  {specialty}
                </span>
              ))}
              {studio.specialties.length > 3 && (
                <span className="text-xs text-gray-500">+{studio.specialties.length - 3} más</span>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {studio.isPremium && (
                <Award className="w-4 h-4 text-white" />
              )}
              {studio.hasEvents && (
                <Calendar className="w-4 h-4 text-white" />
              )}
            </div>
            <span className="text-xs text-gray-500">
              {studio.distance ? `${studio.distance.toFixed(1)} km` : ''}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100">
        <button className="w-full bg-white text-black text-sm font-medium py-2 px-3 rounded-md hover:bg-white/90 transition-colors">
          Ver detalles
        </button>
      </div>
    </div>
  );
};

// Componente para cluster personalizado
const createClusterCustomIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  let size = 'small';
  let color = 'bg-white';
  
  if (count >= 100) {
    size = 'large';
    color = 'bg-black';
  } else if (count >= 10) {
    size = 'medium';
    color = 'bg-white/80';
  }
  
  const sizeClasses = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-10 h-10 text-sm',
    large: 'w-12 h-12 text-base'
  };
  
  return new DivIcon({
    html: `
      <div class="${sizeClasses[size]} ${color} text-white rounded-full flex items-center justify-center font-bold shadow-lg border-2 border-white">
        ${count}
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

const MapMarkers: React.FC<MapMarkersProps> = ({
  studios,
  userLocation,
  selectedStudio,
  onStudioSelect,
  onStudioHover,
  showClustering = true,
  maxClusterRadius = 80
}) => {
  const map = useMap();
  const [hoveredStudio, setHoveredStudio] = useState<string | null>(null);
  
  // Memoizar marcadores para optimizar rendimiento
  const studioMarkers = useMemo(() => {
    return studios.map((studio) => {
      const isSelected = selectedStudio === studio.id;
      const isHovered = hoveredStudio === studio.id;
      
      // Determinar tipo de marcador basado en las propiedades del estudio
      let markerType: 'basic' | 'premium' | 'featured' = 'basic';
      if (studio.isFeatured) {
        markerType = 'featured';
      } else if (studio.isPremium) {
        markerType = 'premium';
      }
      
      const icon = getStudioIcon(markerType, isSelected);
      
      return (
        <Marker
          key={studio.id}
          position={[studio.lat, studio.lng]}
          icon={icon}
          eventHandlers={{
            click: () => {
              onStudioSelect?.(studio);
            },
            mouseover: () => {
              setHoveredStudio(studio.id);
              onStudioHover?.(studio);
            },
            mouseout: () => {
              setHoveredStudio(null);
              onStudioHover?.(null);
            }
          }}
        >
          <Popup
            closeButton={false}
            className="custom-popup"
            maxWidth={320}
            minWidth={250}
          >
            <StudioTooltip studio={studio} />
          </Popup>
        </Marker>
      );
    });
  }, [studios, selectedStudio, hoveredStudio, onStudioSelect, onStudioHover]);
  
  // Marcador de ubicación del usuario
  const userMarker = useMemo(() => {
    if (!userLocation) return null;
    
    const userIcon = createCustomIcon(MarkerType.USER);
    
    return (
      <Marker
        position={userLocation}
        icon={userIcon}
        zIndexOffset={1000}
      >
        <Popup closeButton={false}>
          <div className="text-center p-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
              <MapPin className="w-4 h-4 text-black" />
            </div>
            <p className="font-medium text-gray-900">Tu ubicación</p>
            <p className="text-sm text-gray-600">Ubicación actual</p>
          </div>
        </Popup>
      </Marker>
    );
  }, [userLocation]);
  
  // Efecto para centrar el mapa en el estudio seleccionado
  useEffect(() => {
    if (selectedStudio && map) {
      const studio = studios.find(s => s.id === selectedStudio);
      if (studio) {
        map.flyTo([studio.lat, studio.lng], 16, {
          duration: 1.5,
          easeLinearity: 0.25
        });
      }
    }
  }, [selectedStudio, studios, map]);
  
  if (showClustering) {
    return (
      <>
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={maxClusterRadius}
          iconCreateFunction={createClusterCustomIcon}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
          spiderfyOnMaxZoom={true}
          removeOutsideVisibleBounds={true}
          animate={true}
          animateAddingMarkers={true}
        >
          {studioMarkers}
        </MarkerClusterGroup>
        {userMarker}
      </>
    );
  }
  
  return (
    <>
      {studioMarkers}
      {userMarker}
    </>
  );
};

export default MapMarkers;

// Estilos CSS personalizados para los popups
export const mapMarkersStyles = `
  .custom-popup .leaflet-popup-content-wrapper {
    padding: 0;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }
  
  .custom-popup .leaflet-popup-content {
    margin: 0;
    padding: 0;
  }
  
  .custom-popup .leaflet-popup-tip {
    background: white;
  }
  
  .custom-cluster-icon {
    background: transparent !important;
    border: none !important;
  }
  
  .leaflet-marker-icon {
    transition: transform 0.2s ease;
  }
  
  .leaflet-marker-icon:hover {
    transform: scale(1.1);
    z-index: 1000;
  }
`;
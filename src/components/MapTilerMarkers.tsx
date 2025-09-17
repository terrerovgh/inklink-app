'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { TattooStudio } from '@/types';
import { createRoot } from 'react-dom/client';
import { MapPin, Star, Users, Calendar, Award } from 'lucide-react';

interface MapTilerMarkersProps {
  map: maplibregl.Map | null;
  studios: TattooStudio[];
  selectedStudio?: TattooStudio | null;
  onStudioSelect?: (studio: TattooStudio) => void;
  onStudioHover?: (studio: TattooStudio | null) => void;
  enableClustering?: boolean;
}

interface MarkerData {
  marker: maplibregl.Marker;
  studio: TattooStudio;
  element: HTMLElement;
}

const MapTilerMarkers: React.FC<MapTilerMarkersProps> = ({
  map,
  studios,
  selectedStudio,
  onStudioSelect,
  onStudioHover,
  enableClustering = true
}) => {
  const markersRef = useRef<MarkerData[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);

  // Check if map is ready
  useEffect(() => {
    if (!map) {
      setIsMapReady(false);
      return;
    }

    const checkMapReady = () => {
      if (map.isStyleLoaded()) {
        setIsMapReady(true);
      } else {
        map.once('styledata', () => setIsMapReady(true));
      }
    };

    checkMapReady();
  }, [map]);

  // Create custom marker element
  const createMarkerElement = (studio: TattooStudio, isSelected: boolean = false) => {
    const el = document.createElement('div');
    el.className = `custom-marker ${isSelected ? 'selected' : ''}`;
    el.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: ${isSelected ? '#ef4444' : '#3b82f6'};
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      position: relative;
    `;

    // Add icon
    const iconEl = document.createElement('div');
    iconEl.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    `;
    el.appendChild(iconEl);

    // Add hover effects
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.1)';
      el.style.zIndex = '1000';
      onStudioHover?.(studio);
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)';
      el.style.zIndex = '1';
      onStudioHover?.(null);
    });

    // Add click handler
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onStudioSelect?.(studio);
    });

    return el;
  };

  // Create popup content
  const createPopupContent = (studio: TattooStudio) => {
    const popupEl = document.createElement('div');
    popupEl.className = 'custom-popup';
    
    const root = createRoot(popupEl);
    root.render(
      <div className="p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{studio.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{studio.address}</p>
            
            <div className="flex items-center gap-4 mt-2">
              {studio.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">{studio.rating}</span>
                </div>
              )}
              
              {studio.reviewCount && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{studio.reviewCount}</span>
                </div>
              )}
            </div>
            
            {studio.specialties && studio.specialties.length > 0 && (
              <div className="mt-2">
                <div className="flex flex-wrap gap-1">
                  {studio.specialties.slice(0, 3).map((specialty, index) => (
                    <span 
                      key={index}
                      className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                  {studio.specialties.length > 3 && (
                    <span className="text-xs text-gray-500">+{studio.specialties.length - 3} more</span>
                  )}
                </div>
              </div>
            )}
            
            {studio.priceRange && (
              <div className="mt-2 text-sm text-gray-600">
                Price: ${studio.priceRange[0]} - ${studio.priceRange[1]}
              </div>
            )}
          </div>
        </div>
      </div>
    );
    
    return popupEl;
  };

  // Clear all markers
  const clearMarkers = () => {
    markersRef.current.forEach(({ marker }) => {
      marker.remove();
    });
    markersRef.current = [];
  };

  // Add markers to map
  useEffect(() => {
    if (!map || !isMapReady || !studios.length) {
      clearMarkers();
      return;
    }

    // Clear existing markers
    clearMarkers();

    // Add new markers
    studios.forEach((studio) => {
      const isSelected = selectedStudio?.id === studio.id;
      const markerElement = createMarkerElement(studio, isSelected);
      
      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: 'bottom'
      })
        .setLngLat([studio.lng, studio.lat])
        .addTo(map);

      // Add popup
      const popup = new maplibregl.Popup({
        offset: [0, -40],
        closeButton: true,
        closeOnClick: false,
        className: 'custom-popup-container'
      }).setDOMContent(createPopupContent(studio));

      marker.setPopup(popup);

      // Store marker data
      markersRef.current.push({
        marker,
        studio,
        element: markerElement
      });
    });

    // Cleanup function
    return () => {
      clearMarkers();
    };
  }, [map, isMapReady, studios, selectedStudio, onStudioSelect, onStudioHover]);

  // Update selected marker styling
  useEffect(() => {
    markersRef.current.forEach(({ marker, studio, element }) => {
      const isSelected = selectedStudio?.id === studio.id;
      element.style.background = isSelected ? '#ef4444' : '#3b82f6';
      element.className = `custom-marker ${isSelected ? 'selected' : ''}`;
    });
  }, [selectedStudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearMarkers();
    };
  }, []);

  return null;
};

export default MapTilerMarkers;
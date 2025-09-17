'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Phone } from 'lucide-react';
import { TattooStudio } from '@/lib/mockData';

interface MarkerTooltipProps {
  studio: TattooStudio;
  position: { x: number; y: number };
  onClose: () => void;
}

const MarkerTooltip: React.FC<MarkerTooltipProps> = ({ studio, position, onClose }) => {
  // Calcular posición del tooltip para evitar que se salga de la pantalla
  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x + 10, window.innerWidth - 280),
    top: Math.max(position.y - 10, 10),
    zIndex: 2000,
    pointerEvents: 'none',
    maxWidth: '260px',
  };

  return (
    <div style={tooltipStyle}>
      <Card className="bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 animate-in fade-in-0 zoom-in-95 duration-200">
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white pr-2">
                {studio.name}
              </h4>
              <div className="flex items-center">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="ml-1 text-xs text-gray-600 dark:text-gray-300">
                  {studio.rating}
                </span>
              </div>
            </div>
            
            <div className="flex items-start text-xs text-gray-600 dark:text-gray-400">
              <MapPin className="w-3 h-3 mr-1 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">{studio.address}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {studio.priceRange}
              </Badge>
              {studio.specialties.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {studio.specialties[0]}
                </Badge>
              )}
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Haz clic para más detalles
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarkerTooltip;
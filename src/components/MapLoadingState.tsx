'use client';

import React from 'react';
import { Loader2, MapPin, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MapLoadingStateProps {
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  className?: string;
  loadingMessage?: string;
  showProgress?: boolean;
  progress?: number;
}

const MapLoadingState: React.FC<MapLoadingStateProps> = ({
  isLoading,
  error,
  onRetry,
  className,
  loadingMessage = 'Cargando mapa...',
  showProgress = false,
  progress = 0
}) => {
  if (!isLoading && !error) {
    return null;
  }

  return (
    <div className={cn(
      "absolute inset-0 z-[1000] flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm",
      className
    )}>
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardContent className="p-6">
          {isLoading && !error && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <MapPin className="w-12 h-12 text-blue-500" />
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin absolute -top-1 -right-1" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {loadingMessage}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configurando tu experiencia de mapa personalizada
                </p>
              </div>

              {showProgress && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(progress)}% completado
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Conectando con OpenStreetMap</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {error.toLowerCase().includes('conexión') || error.toLowerCase().includes('network') ? (
                  <WifiOff className="w-12 h-12 text-red-500" />
                ) : (
                  <AlertCircle className="w-12 h-12 text-red-500" />
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Error al cargar el mapa
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {error}
                </p>
              </div>

              <div className="space-y-3">
                {onRetry && (
                  <Button 
                    onClick={onRetry}
                    className="w-full"
                    variant="default"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reintentar
                  </Button>
                )}
                
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>Posibles soluciones:</p>
                  <ul className="list-disc list-inside space-y-1 text-left">
                    <li>Verifica tu conexión a internet</li>
                    <li>Recarga la página</li>
                    <li>Intenta más tarde</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MapLoadingState;
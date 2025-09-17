'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, MapPin, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MapErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

interface MapErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
  showDetails?: boolean;
  className?: string;
}

class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<MapErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Llamar callback de error si existe
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log del error para debugging
    console.error('MapErrorBoundary caught an error:', error, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      return;
    }

    this.setState({ 
      isRetrying: true,
      retryCount: retryCount + 1
    });

    // Simular delay de reintento
    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false
      });
    }, 1000);
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    });
  };

  getErrorType = (error: Error): string => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('leaflet') || message.includes('map')) {
      return 'map';
    }
    if (message.includes('geolocation') || message.includes('location')) {
      return 'geolocation';
    }
    return 'unknown';
  };

  getErrorIcon = (errorType: string) => {
    switch (errorType) {
      case 'network':
        return <Wifi className="w-8 h-8 text-red-500" />;
      case 'map':
        return <MapPin className="w-8 h-8 text-red-500" />;
      case 'geolocation':
        return <MapPin className="w-8 h-8 text-orange-500" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
    }
  };

  getErrorMessage = (errorType: string, error: Error): string => {
    switch (errorType) {
      case 'network':
        return 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.';
      case 'map':
        return 'Error al cargar el mapa. Los servicios de mapas pueden estar temporalmente no disponibles.';
      case 'geolocation':
        return 'Error al obtener tu ubicación. Verifica los permisos de geolocalización.';
      default:
        return `Error inesperado: ${error.message}`;
    }
  };

  getSuggestions = (errorType: string): string[] => {
    switch (errorType) {
      case 'network':
        return [
          'Verifica tu conexión a internet',
          'Intenta recargar la página',
          'Verifica si hay restricciones de firewall'
        ];
      case 'map':
        return [
          'Intenta cambiar la capa del mapa',
          'Verifica si OpenStreetMap está disponible',
          'Intenta más tarde'
        ];
      case 'geolocation':
        return [
          'Permite el acceso a la ubicación en tu navegador',
          'Verifica la configuración de privacidad',
          'Intenta usar HTTPS si estás en HTTP'
        ];
      default:
        return [
          'Recarga la página',
          'Limpia la caché del navegador',
          'Intenta en modo incógnito'
        ];
    }
  };

  render() {
    const { children, fallback, maxRetries = 3, showDetails = false, className } = this.props;
    const { hasError, error, errorInfo, retryCount, isRetrying } = this.state;

    if (hasError && error) {
      if (fallback) {
        return fallback;
      }

      const errorType = this.getErrorType(error);
      const canRetry = retryCount < maxRetries;

      return (
        <div className={`flex items-center justify-center min-h-[400px] p-4 ${className || ''}`}>
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {this.getErrorIcon(errorType)}
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                Error en el Mapa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {this.getErrorMessage(errorType, error)}
                </AlertDescription>
              </Alert>

              {showDetails && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                    Detalles técnicos
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded text-xs font-mono">
                    <p><strong>Error:</strong> {error.message}</p>
                    {errorInfo && (
                      <p><strong>Stack:</strong> {errorInfo.componentStack}</p>
                    )}
                  </div>
                </details>
              )}

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Posibles soluciones:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {this.getSuggestions(errorType).map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {canRetry && (
                  <Button 
                    onClick={this.handleRetry}
                    disabled={isRetrying}
                    className="flex-1"
                    variant="default"
                  >
                    {isRetrying ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    {isRetrying ? 'Reintentando...' : `Reintentar (${retryCount}/${maxRetries})`}
                  </Button>
                )}
                
                <Button 
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  Restablecer
                </Button>
              </div>

              {!canRetry && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Se alcanzó el límite de reintentos. Por favor, recarga la página o contacta soporte.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

export default MapErrorBoundary;
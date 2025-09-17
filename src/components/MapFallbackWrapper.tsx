import React, { useState, useCallback, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MapFallbackWrapperProps {
  children: React.ReactNode;
  onRetry?: () => void;
  maxRetries?: number;
  retryDelay?: number;
}

interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

interface MapFallbackState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

const MapFallbackWrapper: React.FC<MapFallbackWrapperProps> = ({
  children,
  onRetry,
  maxRetries = 3,
  retryDelay = 2000
}) => {
  const [state, setState] = useState<MapFallbackState>({
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0,
    isRetrying: false
  });

  const [key, setKey] = useState(0);

  // Reset error state when children change
  useEffect(() => {
    if (state.hasError) {
      setState(prev => ({
        ...prev,
        hasError: false,
        error: null,
        errorInfo: null
      }));
    }
  }, [children]);

  const handleRetry = useCallback(async () => {
    if (state.retryCount >= maxRetries) {
      return;
    }

    setState(prev => ({
      ...prev,
      isRetrying: true
    }));

    // Call external retry handler if provided
    if (onRetry) {
      try {
        await onRetry();
      } catch (error) {
        console.error('External retry handler failed:', error);
      }
    }

    // Wait for retry delay
    await new Promise(resolve => setTimeout(resolve, retryDelay));

    // Force component re-mount with new key
    setKey(prev => prev + 1);
    
    setState(prev => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prev.retryCount + 1,
      isRetrying: false
    }));
  }, [state.retryCount, maxRetries, onRetry, retryDelay]);

  const handleReset = useCallback(() => {
    setKey(prev => prev + 1);
    setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    });
  }, []);

  // Error boundary functionality
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Check if error is related to map initialization
      if (event.error?.message?.includes('Map container is already initialized') ||
          event.error?.message?.includes('Leaflet') ||
          event.error?.message?.includes('map')) {
        
        setState({
          hasError: true,
          error: event.error,
          errorInfo: {
            componentStack: event.error?.stack || 'No stack trace available'
          },
          retryCount: state.retryCount,
          isRetrying: false
        });
        
        event.preventDefault();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('Map container is already initialized') ||
          event.reason?.message?.includes('Leaflet') ||
          event.reason?.message?.includes('map')) {
        
        setState({
          hasError: true,
          error: event.reason,
          errorInfo: {
            componentStack: event.reason?.stack || 'No stack trace available'
          },
          retryCount: state.retryCount,
          isRetrying: false
        });
        
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [state.retryCount]);

  if (state.hasError) {
    const canRetry = state.retryCount < maxRetries;
    
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md mx-auto p-6">
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">
                  Error al cargar el mapa
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {state.error?.message || 'Ha ocurrido un error inesperado'}
                </p>
                {state.retryCount > 0 && (
                  <p className="text-xs text-gray-500">
                    Intentos: {state.retryCount}/{maxRetries}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2 justify-center">
            {canRetry && (
              <Button
                onClick={handleRetry}
                disabled={state.isRetrying}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${state.isRetrying ? 'animate-spin' : ''}`} />
                {state.isRetrying ? 'Reintentando...' : 'Reintentar'}
              </Button>
            )}
            
            <Button
              onClick={handleReset}
              variant="default"
              size="sm"
            >
              Reiniciar
            </Button>
          </div>
          
          {!canRetry && (
            <p className="text-xs text-center text-gray-500 mt-4">
              Se han agotado los intentos automáticos. 
              Usa "Reiniciar" para intentar nuevamente.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div key={key} className="w-full h-full">
      {children}
    </div>
  );
};

export default MapFallbackWrapper;
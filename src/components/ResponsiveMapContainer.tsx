import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, RotateCcw, Maximize, Minimize, Smartphone, Monitor, Tablet } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import useDeviceDetection from '../hooks/useDeviceDetection';
import '../styles/map-responsive.css';

interface ResponsiveMapContainerProps {
  children: React.ReactNode;
  className?: string;
  showDeviceInfo?: boolean;
  enableFullscreen?: boolean;
  onDeviceChange?: (info: {
    deviceType: string;
    isTouchDevice: boolean;
    orientation: string;
    screenSize: { width: number; height: number };
    performanceLevel: string;
  }) => void;
}



const ResponsiveMapContainer: React.FC<ResponsiveMapContainerProps> = ({
  children,
  className = '',
  showDeviceInfo = false,
  enableFullscreen = true,
  onDeviceChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    deviceInfo,
    performanceSettings,
    getCSSVariables,
    getDeviceClasses,
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    isPortrait,
    hasSlowConnection
  } = useDeviceDetection();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOrientationWarning, setShowOrientationWarning] = useState(false);

  // Notificar cambios de dispositivo al componente padre
  useEffect(() => {
    if (onDeviceChange) {
      onDeviceChange({
        deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
        isTouchDevice,
        orientation: isPortrait ? 'portrait' : 'landscape',
        screenSize: { width: deviceInfo.screenWidth, height: deviceInfo.screenHeight },
        performanceLevel: performanceSettings.qualityLevel
      });
    }
  }, [deviceInfo, performanceSettings, onDeviceChange, isMobile, isTablet, isTouchDevice, isPortrait]);

  // Mostrar advertencia de orientación en móvil portrait
  useEffect(() => {
    if (isMobile && isPortrait) {
      setShowOrientationWarning(true);
    } else {
      setShowOrientationWarning(false);
    }
  }, [isMobile, isPortrait]);



  // Función para alternar pantalla completa
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.warn('Fullscreen no soportado:', error);
    }
  };

  // Efecto para manejar cambios de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);



  return (
    <div 
      ref={containerRef}
      className={`map-container ${getDeviceClasses()} ${className}`}
      style={{
        ...getCSSVariables(),
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {children}
      
      {/* Información del dispositivo */}
      {showDeviceInfo && (
        <Card className="absolute top-4 left-4 z-50 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              {isMobile && <Smartphone className="w-4 h-4" />}
              {isTablet && <Monitor className="w-4 h-4" />}
              {isDesktop && <Monitor className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {isMobile ? 'Móvil' : isTablet ? 'Tablet' : 'Desktop'}
              </span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Resolución: {deviceInfo.screenWidth}×{deviceInfo.screenHeight}</div>
              <div>Orientación: {deviceInfo.orientation}</div>
              <div>Pixel Ratio: {deviceInfo.pixelRatio}x</div>
              <div>Touch: {isTouchDevice ? 'Sí' : 'No'}</div>
              <div>Conexión: {deviceInfo.connectionType}</div>
              <div>Calidad: {performanceSettings.qualityLevel}</div>
              <div>Max Marcadores: {performanceSettings.maxMarkers}</div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Advertencia de orientación */}
      {showOrientationWarning && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-sm">
            <CardContent className="p-6 text-center">
              <RotateCcw className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <h3 className="text-lg font-semibold mb-2">Mejor experiencia</h3>
              <p className="text-gray-600 mb-4">
                Para una mejor experiencia del mapa, te recomendamos rotar tu dispositivo a modo horizontal.
              </p>
              <Button 
                onClick={() => setShowOrientationWarning(false)}
                className="w-full"
              >
                Continuar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Advertencia de conexión lenta */}
      {hasSlowConnection && (
        <Alert className="absolute top-4 right-4 z-50 max-w-xs">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Conexión lenta detectada. Algunas funciones pueden estar limitadas.
          </AlertDescription>
        </Alert>
      )}

      {/* Estilos CSS personalizados */}
      <style jsx>{`
        .portrait-mode {
          --map-controls-position: bottom;
          --map-controls-size: large;
        }
        
        .landscape-mode {
          --map-controls-position: right;
          --map-controls-size: medium;
        }
        
        @media (max-width: 768px) {
          .touch-pan-x {
            touch-action: pan-x;
          }
          
          .touch-pan-y {
            touch-action: pan-y;
          }
        }
        
        @media (orientation: landscape) and (max-height: 500px) {
          /* Ajustes para pantallas muy anchas */
          .landscape-mode {
            --map-controls-size: small;
          }
        }
      `}</style>
    </div>
  );
};

export default ResponsiveMapContainer;
export type { ViewportInfo, DeviceType };
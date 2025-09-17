import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
  hasNotch: boolean;
  supportsHover: boolean;
  connectionType: 'slow' | 'fast' | 'unknown';
}

export interface PerformanceSettings {
  enableClustering: boolean;
  maxMarkers: number;
  animationDuration: number;
  tileLoadTimeout: number;
  enablePreloading: boolean;
  qualityLevel: 'low' | 'medium' | 'high';
}

const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    screenWidth: 1920,
    screenHeight: 1080,
    orientation: 'landscape',
    pixelRatio: 1,
    hasNotch: false,
    supportsHover: true,
    connectionType: 'unknown'
  });

  const [performanceSettings, setPerformanceSettings] = useState<PerformanceSettings>({
    enableClustering: true,
    maxMarkers: 1000,
    animationDuration: 300,
    tileLoadTimeout: 10000,
    enablePreloading: true,
    qualityLevel: 'high'
  });

  // Detectar tipo de dispositivo
  const detectDeviceType = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const userAgent = navigator.userAgent.toLowerCase();
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Detectar móvil
    const isMobile = width <= 768 || /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    // Detectar tablet
    const isTablet = !isMobile && (width <= 1024 || /ipad|android/i.test(userAgent));
    
    // Detectar desktop
    const isDesktop = !isMobile && !isTablet;
    
    // Detectar orientación
    const orientation = width > height ? 'landscape' : 'portrait';
    
    // Detectar notch (aproximación)
    const hasNotch = CSS.supports('padding-top: env(safe-area-inset-top)');
    
    // Detectar soporte hover
    const supportsHover = window.matchMedia('(hover: hover)').matches;
    
    // Detectar tipo de conexión
    let connectionType: 'slow' | 'fast' | 'unknown' = 'unknown';
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        connectionType = ['slow-2g', '2g', '3g'].includes(effectiveType) ? 'slow' : 'fast';
      }
    }
    
    return {
      isMobile,
      isTablet,
      isDesktop,
      isTouchDevice,
      screenWidth: width,
      screenHeight: height,
      orientation,
      pixelRatio: window.devicePixelRatio || 1,
      hasNotch,
      supportsHover,
      connectionType
    };
  };

  // Calcular configuraciones de rendimiento basadas en el dispositivo
  const calculatePerformanceSettings = (device: DeviceInfo): PerformanceSettings => {
    let settings: PerformanceSettings = {
      enableClustering: true,
      maxMarkers: 1000,
      animationDuration: 300,
      tileLoadTimeout: 10000,
      enablePreloading: true,
      qualityLevel: 'high'
    };

    // Ajustes para móviles
    if (device.isMobile) {
      settings = {
        enableClustering: true,
        maxMarkers: device.connectionType === 'slow' ? 200 : 500,
        animationDuration: device.connectionType === 'slow' ? 150 : 250,
        tileLoadTimeout: device.connectionType === 'slow' ? 15000 : 8000,
        enablePreloading: device.connectionType !== 'slow',
        qualityLevel: device.connectionType === 'slow' ? 'low' : 'medium'
      };
    }
    
    // Ajustes para tablets
    else if (device.isTablet) {
      settings = {
        enableClustering: true,
        maxMarkers: 750,
        animationDuration: 275,
        tileLoadTimeout: 9000,
        enablePreloading: true,
        qualityLevel: 'medium'
      };
    }
    
    // Ajustes adicionales para conexiones lentas
    if (device.connectionType === 'slow') {
      settings.maxMarkers = Math.min(settings.maxMarkers, 100);
      settings.animationDuration = Math.min(settings.animationDuration, 150);
      settings.enablePreloading = false;
      settings.qualityLevel = 'low';
    }
    
    // Ajustes para dispositivos de alta densidad de píxeles
    if (device.pixelRatio > 2) {
      settings.qualityLevel = settings.qualityLevel === 'high' ? 'medium' : 'low';
    }

    return settings;
  };

  // Detectar cambios en el tamaño de pantalla y orientación
  useEffect(() => {
    const handleResize = () => {
      const newDeviceInfo = detectDeviceType();
      setDeviceInfo(newDeviceInfo);
      setPerformanceSettings(calculatePerformanceSettings(newDeviceInfo));
    };

    const handleOrientationChange = () => {
      // Pequeño delay para que el navegador actualice las dimensiones
      setTimeout(handleResize, 100);
    };

    // Detección inicial
    handleResize();

    // Event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Listener para cambios de conexión
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.addEventListener('change', handleResize);
      }
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          connection.removeEventListener('change', handleResize);
        }
      }
    };
  }, []);

  // Función para forzar recálculo
  const recalculate = () => {
    const newDeviceInfo = detectDeviceType();
    setDeviceInfo(newDeviceInfo);
    setPerformanceSettings(calculatePerformanceSettings(newDeviceInfo));
  };

  // Función para obtener configuraciones CSS personalizadas
  const getCSSVariables = () => {
    return {
      '--screen-width': `${deviceInfo.screenWidth}px`,
      '--screen-height': `${deviceInfo.screenHeight}px`,
      '--pixel-ratio': deviceInfo.pixelRatio.toString(),
      '--animation-duration': `${performanceSettings.animationDuration}ms`,
      '--device-type': deviceInfo.isMobile ? 'mobile' : deviceInfo.isTablet ? 'tablet' : 'desktop'
    };
  };

  // Función para obtener clases CSS condicionales
  const getDeviceClasses = () => {
    const classes = [];
    
    if (deviceInfo.isMobile) classes.push('device-mobile');
    if (deviceInfo.isTablet) classes.push('device-tablet');
    if (deviceInfo.isDesktop) classes.push('device-desktop');
    if (deviceInfo.isTouchDevice) classes.push('touch-device');
    if (deviceInfo.hasNotch) classes.push('has-notch');
    if (!deviceInfo.supportsHover) classes.push('no-hover');
    if (deviceInfo.orientation === 'portrait') classes.push('portrait');
    if (deviceInfo.orientation === 'landscape') classes.push('landscape');
    if (deviceInfo.connectionType === 'slow') classes.push('slow-connection');
    
    return classes.join(' ');
  };

  return {
    deviceInfo,
    performanceSettings,
    recalculate,
    getCSSVariables,
    getDeviceClasses,
    
    // Helpers de conveniencia
    isMobile: deviceInfo.isMobile,
    isTablet: deviceInfo.isTablet,
    isDesktop: deviceInfo.isDesktop,
    isTouchDevice: deviceInfo.isTouchDevice,
    isPortrait: deviceInfo.orientation === 'portrait',
    isLandscape: deviceInfo.orientation === 'landscape',
    hasSlowConnection: deviceInfo.connectionType === 'slow',
    shouldUseClustering: performanceSettings.enableClustering,
    maxMarkersToShow: performanceSettings.maxMarkers
  };
};

export default useDeviceDetection;
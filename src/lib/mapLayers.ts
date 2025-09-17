import { Icon } from 'leaflet';

// Configuración de capas base para el mapa
export interface MapLayer {
  id: string;
  name: string;
  description: string;
  url: string;
  attribution: string;
  maxZoom: number;
  minZoom?: number;
  subdomains?: string[];
}

// Tipos de capas base
export enum BaseLayerType {
  OPENSTREETMAP = 'openstreetmap',
  SATELLITE = 'satellite',
  TERRAIN = 'terrain',
  DARK = 'dark',
  LIGHT = 'light',
  WATERCOLOR = 'watercolor',
  TONER = 'toner',
  OUTDOORS = 'outdoors'
}

// Configuración de capas base
export const baseLayers = {
  [BaseLayerType.OPENSTREETMAP]: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
    description: 'Mapa estándar con calles y puntos de interés',
    preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=openstreetmap%20style%20city%20map%20with%20streets%20and%20buildings&image_size=square'
  },
  [BaseLayerType.SATELLITE]: {
    name: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
    maxZoom: 18,
    description: 'Vista satelital de alta resolución',
    preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=satellite%20aerial%20view%20of%20city%20from%20above&image_size=square'
  },
  [BaseLayerType.TERRAIN]: {
    name: 'Terreno',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap (CC-BY-SA)',
    maxZoom: 17,
    description: 'Mapa topográfico con relieve y elevación',
    preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=topographic%20terrain%20map%20with%20elevation%20lines%20and%20mountains&image_size=square'
  },
  [BaseLayerType.DARK]: {
    name: 'Oscuro',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© CARTO',
    maxZoom: 19,
    description: 'Tema oscuro ideal para visualización nocturna',
    preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=dark%20theme%20city%20map%20with%20black%20background%20and%20white%20streets&image_size=square'
  },
  [BaseLayerType.LIGHT]: {
    name: 'Claro',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© CARTO',
    maxZoom: 19,
    description: 'Tema claro y minimalista',
    preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=light%20minimalist%20city%20map%20with%20clean%20white%20background&image_size=square'
  },
  [BaseLayerType.WATERCOLOR]: {
    name: 'Acuarela',
    url: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg',
    attribution: '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    maxZoom: 16,
    description: 'Estilo artístico tipo acuarela',
    preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=watercolor%20artistic%20map%20with%20painted%20style%20and%20soft%20colors&image_size=square',
    requiresApiKey: false
  },
  [BaseLayerType.TONER]: {
    name: 'Tóner',
    url: 'https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    maxZoom: 18,
    description: 'Estilo en blanco y negro tipo tóner',
    preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=black%20and%20white%20toner%20style%20map%20with%20high%20contrast&image_size=square',
    requiresApiKey: false
  },
  [BaseLayerType.OUTDOORS]: {
    name: 'Exterior',
    url: 'https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey={apikey}',
    attribution: '© Thunderforest, © OpenStreetMap contributors',
    maxZoom: 18,
    description: 'Optimizado para actividades al aire libre',
    preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=outdoor%20hiking%20map%20with%20trails%20and%20nature%20features&image_size=square',
    requiresApiKey: true
  }
};

// Función para obtener capa base por tipo con manejo de errores
export const getBaseLayer = (type: BaseLayerType = BaseLayerType.OPENSTREETMAP) => {
  const config = baseLayers[type];
  if (!config) {
    console.warn(`Layer type ${type} not found, falling back to OpenStreetMap`);
    return baseLayers[BaseLayerType.OPENSTREETMAP];
  }
  
  // Verificar si la capa requiere API key y no está disponible
  if (config.requiresApiKey && !checkApiKeyAvailable(type)) {
    console.warn(`API key required for ${type}, falling back to OpenStreetMap`);
    return baseLayers[BaseLayerType.OPENSTREETMAP];
  }
  
  return config;
};

// Función para verificar disponibilidad de API key
const checkApiKeyAvailable = (layerType: BaseLayerType): boolean => {
  // Aquí se puede implementar la lógica para verificar API keys
  // Por ahora retornamos true para capas que no requieren API key
  const config = baseLayers[layerType];
  return !config.requiresApiKey;
};

// Función para obtener todas las capas disponibles
export const getAvailableBaseLayers = () => {
  return Object.entries(baseLayers).map(([key, layer]) => ({
    id: key,
    ...layer
  }));
};

// Función para validar si una capa requiere API key
export const layerRequiresApiKey = (type: BaseLayerType): boolean => {
  return baseLayers[type]?.requiresApiKey || false;
};

// Capas base disponibles (legacy)
export const mapLayers: Record<string, MapLayer> = {
  osm: {
    id: 'osm',
    name: 'OpenStreetMap',
    description: 'Mapa estándar colaborativo',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    minZoom: 1,
    subdomains: ['a', 'b', 'c']
  },
  
  satellite: {
    id: 'satellite',
    name: 'Satélite',
    description: 'Vista satelital de alta resolución',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© <a href="https://www.esri.com/">Esri</a>, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
    maxZoom: 18,
    minZoom: 1
  },
  
  terrain: {
    id: 'terrain',
    name: 'Terreno',
    description: 'Mapa topográfico con relieve',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    maxZoom: 17,
    minZoom: 1,
    subdomains: ['a', 'b', 'c']
  },
  
  dark: {
    id: 'dark',
    name: 'Oscuro',
    description: 'Tema oscuro para mejor visualización nocturna',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
    minZoom: 1,
    subdomains: ['a', 'b', 'c', 'd']
  },
  
  light: {
    id: 'light',
    name: 'Claro',
    description: 'Tema claro minimalista',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
    minZoom: 1,
    subdomains: ['a', 'b', 'c', 'd']
  }
};

// Función para obtener la capa por defecto según el tema
export const getDefaultLayer = (theme: 'light' | 'dark' = 'light'): MapLayer => {
  return theme === 'dark' ? mapLayers.dark : mapLayers.osm;
};

// Función para validar si una capa existe
export const isValidLayer = (layerId: string): boolean => {
  return layerId in mapLayers;
};

// Función para validar capa (alias para compatibilidad)
export const validateLayer = (layerId: string): boolean => {
  return isValidLayer(layerId);
};

// Función para obtener todas las capas disponibles
export const getAvailableLayers = (): MapLayer[] => {
  return Object.values(mapLayers);
};

// Configuración de clustering
export const clusterConfig = {
  maxClusterRadius: 80,
  disableClusteringAtZoom: 15,
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
  animate: true,
  animateAddingMarkers: true,
  chunkedLoading: true,
  chunkInterval: 200,
  chunkDelay: 50
};

// Función para manejar errores de carga de tiles
export const handleTileLoadError = (error: Event, layerType: BaseLayerType): void => {
  console.error(`Error loading tiles for ${layerType}:`, error);
  
  // Intentar cargar tile de error personalizado si está disponible
  const config = baseLayers[layerType];
  if (config && error.target) {
    const target = error.target as HTMLImageElement;
    // Fallback a una imagen de error genérica
    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE0cHgiIGZpbGw9IiM5OTkiPkVycm9yPC90ZXh0Pjwvc3ZnPg==';
  }
};

// Función para validar consistencia entre enum y object
export const validateLayerConsistency = (): boolean => {
  const enumKeys = Object.values(BaseLayerType);
  const objectKeys = Object.keys(baseLayers) as BaseLayerType[];
  
  const missingInObject = enumKeys.filter(key => !objectKeys.includes(key));
  const missingInEnum = objectKeys.filter(key => !enumKeys.includes(key));
  
  if (missingInObject.length > 0) {
    console.error('Missing layer configurations:', missingInObject);
  }
  
  if (missingInEnum.length > 0) {
    console.error('Extra layer configurations:', missingInEnum);
  }
  
  return missingInObject.length === 0 && missingInEnum.length === 0;
};

// Tipos de marcadores
export enum MarkerType {
  STUDIO = 'studio',
  ARTIST = 'artist',
  USER = 'user',
  SELECTED = 'selected',
  FEATURED = 'featured',
  PREMIUM = 'premium',
  EVENT = 'event',
  CUSTOM = 'custom'
}

// Configuración de estilos de marcadores
export const markerStyles = {
  [MarkerType.STUDIO]: {
    color: '#8B5CF6',
    size: [32, 32],
    icon: 'studio',
    shadow: true,
    pulse: false
  },
  [MarkerType.ARTIST]: {
    color: '#10B981',
    size: [28, 28],
    icon: 'artist',
    shadow: true,
    pulse: false
  },
  [MarkerType.USER]: {
    color: '#3B82F6',
    size: [24, 24],
    icon: 'user',
    shadow: false,
    pulse: true
  },
  [MarkerType.SELECTED]: {
    color: '#EF4444',
    size: [36, 36],
    icon: 'selected',
    shadow: true,
    pulse: true
  },
  [MarkerType.FEATURED]: {
    color: '#F59E0B',
    size: [34, 34],
    icon: 'featured',
    shadow: true,
    pulse: false
  },
  [MarkerType.PREMIUM]: {
    color: '#7C3AED',
    size: [30, 30],
    icon: 'premium',
    shadow: true,
    pulse: false
  },
  [MarkerType.EVENT]: {
    color: '#EC4899',
    size: [26, 26],
    icon: 'event',
    shadow: true,
    pulse: false
  },
  [MarkerType.CUSTOM]: {
    color: '#6B7280',
    size: [28, 28],
    icon: 'custom',
    shadow: true,
    pulse: false
  }
};

// Función para crear SVG de marcador personalizado
const createMarkerSVG = (type: MarkerType, isHovered = false, isSelected = false): string => {
  const style = markerStyles[type];
  const color = isSelected ? markerStyles[MarkerType.SELECTED].color : style.color;
  const size = isSelected ? markerStyles[MarkerType.SELECTED].size : style.size;
  const scale = isHovered ? 1.1 : 1;
  
  const iconSVGs = {
    studio: `<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>`,
    artist: `<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2"/>`,
    user: `<circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="white"/>`,
    selected: `<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2" fill="white"/>`,
    featured: `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>`,
    premium: `<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><path d="M12 6l1.5 3h3l-2.5 2 1 3-3-2-3 2 1-3-2.5-2h3L12 6z" fill="white"/>`,
    event: `<path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>`,
    custom: `<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>`
  };
  
  const pulseAnimation = style.pulse ? `
    <style>
      .pulse { animation: pulse 2s infinite; }
      @keyframes pulse {
        0% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.1); }
        100% { opacity: 1; transform: scale(1); }
      }
    </style>
  ` : '';
  
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size[0] * scale}" height="${size[1] * scale}">
      ${pulseAnimation}
      <g class="${style.pulse ? 'pulse' : ''}" fill="${color}" stroke="white" stroke-width="1.5">
        ${iconSVGs[style.icon] || iconSVGs.custom}
      </g>
    </svg>
  `;
};

// Función para crear iconos personalizados
export const createCustomIcon = (type: MarkerType, options: {
  isHovered?: boolean;
  isSelected?: boolean;
  customColor?: string;
  customSize?: [number, number];
} = {}): Icon => {
  const { isHovered = false, isSelected = false, customColor, customSize } = options;
  const style = markerStyles[type];
  const finalSize = customSize || (isSelected ? markerStyles[MarkerType.SELECTED].size : style.size);
  
  // Aplicar color personalizado si se proporciona
  if (customColor) {
    const customStyle = { ...style, color: customColor };
    markerStyles[type] = customStyle;
  }
  
  const svgString = createMarkerSVG(type, isHovered, isSelected);
  
  return new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(svgString),
    iconSize: finalSize,
    iconAnchor: [finalSize[0] / 2, finalSize[1]],
    popupAnchor: [0, -finalSize[1]],
    shadowUrl: style.shadow ? 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png' : undefined,
    shadowSize: style.shadow ? [41, 41] : undefined,
    shadowAnchor: style.shadow ? [12, 41] : undefined
  });
};

// Iconos predefinidos para uso rápido
export const customIcons = {
  studio: createCustomIcon(MarkerType.STUDIO),
  artist: createCustomIcon(MarkerType.ARTIST),
  user: createCustomIcon(MarkerType.USER),
  selected: createCustomIcon(MarkerType.SELECTED),
  featured: createCustomIcon(MarkerType.FEATURED),
  premium: createCustomIcon(MarkerType.PREMIUM),
  event: createCustomIcon(MarkerType.EVENT),
  custom: createCustomIcon(MarkerType.CUSTOM)
};

// Función para obtener icono por tipo de estudio
export const getStudioIcon = (studioType: 'basic' | 'premium' | 'featured' = 'basic', isSelected = false): Icon => {
  const typeMap = {
    basic: MarkerType.STUDIO,
    premium: MarkerType.PREMIUM,
    featured: MarkerType.FEATURED
  };
  
  return createCustomIcon(typeMap[studioType], { isSelected });
};

// Configuración de iconos personalizados (legacy)
export const iconConfig = {
  default: {
    iconUrl: '/icons/marker-default.png',
    shadowUrl: '/icons/marker-shadow.png',
    iconSize: [25, 41] as [number, number],
    iconAnchor: [12, 41] as [number, number],
    popupAnchor: [1, -34] as [number, number],
    shadowSize: [41, 41] as [number, number]
  },
  studio: {
    iconUrl: '/icons/marker-studio.png',
    shadowUrl: '/icons/marker-shadow.png',
    iconSize: [30, 45] as [number, number],
    iconAnchor: [15, 45] as [number, number],
    popupAnchor: [1, -34] as [number, number],
    shadowSize: [45, 45] as [number, number]
  },
  user: {
    iconUrl: '/icons/marker-user.png',
    shadowUrl: '/icons/marker-shadow.png',
    iconSize: [20, 35] as [number, number],
    iconAnchor: [10, 35] as [number, number],
    popupAnchor: [1, -34] as [number, number],
    shadowSize: [35, 35] as [number, number]
  }
};

// Configuración de zoom y límites
export const mapConfig = {
  defaultZoom: 13,
  minZoom: 3,
  maxZoom: 19,
  defaultCenter: [35.0844, -106.6504] as [number, number], // Albuquerque, NM
  maxBounds: [
    [-90, -180], // Southwest corner
    [90, 180]    // Northeast corner
  ] as [[number, number], [number, number]],
  zoomControl: false, // Usaremos controles personalizados
  attributionControl: true,
  scrollWheelZoom: true,
  doubleClickZoom: true,
  dragging: true,
  touchZoom: true,
  boxZoom: true,
  keyboard: true
};
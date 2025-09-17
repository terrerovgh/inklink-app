// Datos de prueba para estudios de tatuaje en Albuquerque, NM

export interface TattooStudio {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  specialties: string[];
  phone: string;
  website?: string;
  description: string;
  priceRange: '$' | '$$' | '$$$';
  openHours: string;
  image?: string;
}

// Coordenadas de Albuquerque, NM: 35.0844° N, 106.6504° W
export const ALBUQUERQUE_CENTER = {
  lat: 35.0844,
  lng: -106.6504
};

export const mockTattooStudios: TattooStudio[] = [
  {
    id: '1',
    name: 'Desert Rose Tattoo',
    address: '2301 Central Ave NE, Albuquerque, NM 87106',
    latitude: 35.0781,
    longitude: -106.6198,
    rating: 4.8,
    reviewCount: 127,
    specialties: ['Traditional', 'Neo-Traditional', 'Color Work'],
    phone: '(505) 555-0101',
    website: 'https://desertrosetattoo.com',
    description: 'Estudio especializado en tatuajes tradicionales y neo-tradicionales con más de 15 años de experiencia.',
    priceRange: '$$',
    openHours: 'Lun-Sáb 12:00-20:00, Dom Cerrado'
  },
  {
    id: '2',
    name: 'Turquoise Ink Studio',
    address: '4410 Wyoming Blvd NE, Albuquerque, NM 87111',
    latitude: 35.1156,
    longitude: -106.5642,
    rating: 4.6,
    reviewCount: 89,
    specialties: ['Realistic', 'Portrait', 'Black & Grey'],
    phone: '(505) 555-0102',
    description: 'Especialistas en retratos realistas y trabajo en blanco y negro de alta calidad.',
    priceRange: '$$$',
    openHours: 'Mar-Sáb 13:00-19:00, Lun-Dom Cerrado'
  },
  {
    id: '3',
    name: 'Old Town Tattoo Parlor',
    address: '303 Romero St NW, Albuquerque, NM 87104',
    latitude: 35.0946,
    longitude: -106.6713,
    rating: 4.4,
    reviewCount: 156,
    specialties: ['Traditional American', 'Sailor Jerry', 'Flash'],
    phone: '(505) 555-0103',
    website: 'https://oldtowntattoo.com',
    description: 'Auténtico parlor de tatuajes en el corazón del Old Town con diseños clásicos americanos.',
    priceRange: '$',
    openHours: 'Lun-Dom 11:00-21:00'
  },
  {
    id: '4',
    name: 'Sandia Peak Ink',
    address: '6600 Menaul Blvd NE, Albuquerque, NM 87110',
    latitude: 35.1078,
    longitude: -106.5234,
    rating: 4.9,
    reviewCount: 203,
    specialties: ['Japanese', 'Geometric', 'Mandala'],
    phone: '(505) 555-0104',
    description: 'Estudio premium especializado en arte japonés tradicional y diseños geométricos complejos.',
    priceRange: '$$$',
    openHours: 'Mié-Dom 14:00-20:00, Lun-Mar Cerrado'
  },
  {
    id: '5',
    name: 'Rio Grande Tattoo Co.',
    address: '1512 Lomas Blvd NW, Albuquerque, NM 87104',
    latitude: 35.0789,
    longitude: -106.6456,
    rating: 4.3,
    reviewCount: 94,
    specialties: ['Chicano', 'Script', 'Religious'],
    phone: '(505) 555-0105',
    website: 'https://riograndetattoo.com',
    description: 'Especialistas en arte chicano, lettering y diseños religiosos con raíces culturales profundas.',
    priceRange: '$$',
    openHours: 'Lun-Sáb 12:00-19:00, Dom 13:00-17:00'
  },
  {
    id: '6',
    name: 'Electric Cactus Tattoo',
    address: '3200 Coors Blvd NW, Albuquerque, NM 87120',
    latitude: 35.0923,
    longitude: -106.7234,
    rating: 4.7,
    reviewCount: 112,
    specialties: ['Watercolor', 'Abstract', 'Fine Line'],
    phone: '(505) 555-0106',
    description: 'Estudio moderno especializado en técnicas de acuarela y líneas finas con diseños únicos.',
    priceRange: '$$',
    openHours: 'Mar-Sáb 13:00-20:00, Lun-Dom Cerrado'
  },
  {
    id: '7',
    name: 'Breaking Bad Ink',
    address: '9500 Montgomery Blvd NE, Albuquerque, NM 87111',
    latitude: 35.1345,
    longitude: -106.5123,
    rating: 4.5,
    reviewCount: 178,
    specialties: ['Pop Culture', 'TV/Movie', 'Custom Design'],
    phone: '(505) 555-0107',
    website: 'https://breakingbadink.com',
    description: 'Inspirado en la cultura pop y series de TV, especializado en diseños personalizados únicos.',
    priceRange: '$$',
    openHours: 'Lun-Sáb 11:00-20:00, Dom 12:00-18:00'
  },
  {
    id: '8',
    name: 'Zia Sun Tattoo Studio',
    address: '5500 Academy Rd NE, Albuquerque, NM 87109',
    latitude: 35.1234,
    longitude: -106.5456,
    rating: 4.2,
    reviewCount: 67,
    specialties: ['Native American', 'Southwestern', 'Tribal'],
    phone: '(505) 555-0108',
    description: 'Honrando las tradiciones nativas americanas y el arte del suroeste con respeto cultural.',
    priceRange: '$',
    openHours: 'Jue-Lun 14:00-19:00, Mar-Mié Cerrado'
  },
  {
    id: '9',
    name: 'Balloon Fiesta Tattoos',
    address: '2200 Louisiana Blvd NE, Albuquerque, NM 87110',
    latitude: 35.0967,
    longitude: -106.5789,
    rating: 4.6,
    reviewCount: 145,
    specialties: ['Colorful', 'Whimsical', 'Cover-ups'],
    phone: '(505) 555-0109',
    website: 'https://balloonfiestattoos.com',
    description: 'Especialistas en diseños coloridos y caprichosos, expertos en cover-ups y restauraciones.',
    priceRange: '$$',
    openHours: 'Lun-Sáb 10:00-19:00, Dom 12:00-17:00'
  },
  {
    id: '10',
    name: 'High Desert Ink',
    address: '7200 Montgomery Blvd NE, Albuquerque, NM 87109',
    latitude: 35.1289,
    longitude: -106.5678,
    rating: 4.8,
    reviewCount: 234,
    specialties: ['Biomechanical', 'Horror', 'Dark Art'],
    phone: '(505) 555-0110',
    description: 'Estudio especializado en arte oscuro, biomecánico y horror con técnicas avanzadas.',
    priceRange: '$$$',
    openHours: 'Mié-Dom 15:00-21:00, Lun-Mar Cerrado'
  }
];

// Función para obtener estudios por área geográfica
export const getStudiosInRadius = (
  centerLat: number,
  centerLng: number,
  radiusKm: number
): TattooStudio[] => {
  return mockTattooStudios.filter(studio => {
    const distance = calculateDistance(
      centerLat,
      centerLng,
      studio.latitude,
      studio.longitude
    );
    return distance <= radiusKm;
  });
};

// Función para cargar datos mock (simula una llamada async)
export const loadMockStudios = async (): Promise<TattooStudio[]> => {
  // Simular delay de carga
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockTattooStudios;
};

// Función para calcular distancia entre dos puntos (fórmula de Haversine)
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
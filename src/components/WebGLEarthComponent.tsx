'use client'

import { useEffect, useRef, useState, useMemo } from 'react'

// Declaración de tipos para WebGL Earth
declare global {
  interface Window {
    WE: {
      map: (containerId: string) => WebGLEarthMap
      tileLayer: (url: string, options: TileLayerOptions) => TileLayer
    }
  }
}

interface WebGLEarthMap {
  setView: (coords: [number, number], zoom: number) => void
  on: (event: string, callback: () => void) => void
  getContainer: () => HTMLElement
}

interface TileLayer {
  addTo: (map: WebGLEarthMap) => void
}

interface TileLayerOptions {
  tileSize: number
  bounds: [[number, number], [number, number]]
  minZoom: number
  maxZoom: number
  attribution: string
  tms: boolean
}

interface Artist {
  id: string
  name: string
  specialties: string[]
  rating: number
  latitude: number
  longitude: number
  avatar?: string
  verified?: boolean
}

interface WebGLEarthComponentProps {
  artists?: Artist[]
  onArtistClick?: (artist: Artist) => void
  className?: string
}

const WebGLEarthComponent: React.FC<WebGLEarthComponentProps> = ({
  artists = [],
  onArtistClick,
  className = ''
}) => {
  const earthContainer = useRef<HTMLDivElement>(null)
  const earth = useRef<WebGLEarthMap | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const markersRef = useRef<HTMLElement[]>([])

  // Mock artists data (same as GlobeMapComponent)
  const mockArtists: Artist[] = [
    {
      id: '1',
      name: 'Carlos Mendoza',
      specialties: ['Realismo', 'Blackwork'],
      rating: 4.8,
      latitude: 19.4326,
      longitude: -99.1332,
      verified: true
    },
    {
      id: '2',
      name: 'Ana García',
      specialties: ['Acuarela', 'Minimalista'],
      rating: 4.9,
      latitude: 40.7128,
      longitude: -74.0060,
      verified: true
    },
    {
      id: '3',
      name: 'Miguel Torres',
      specialties: ['Tradicional', 'Neo-tradicional'],
      rating: 4.7,
      latitude: 51.5074,
      longitude: -0.1278,
      verified: false
    },
    {
      id: '4',
      name: 'Sofia Rodriguez',
      specialties: ['Geometrico', 'Dotwork'],
      rating: 4.9,
      latitude: 35.6762,
      longitude: 139.6503,
      verified: true
    },
    {
      id: '5',
      name: 'David Kim',
      specialties: ['Biomecánico', 'Cyberpunk'],
      rating: 4.6,
      latitude: -33.8688,
      longitude: 151.2093,
      verified: true
    }
  ]

  const displayArtists = useMemo(() => {
    return artists.length > 0 ? artists : mockArtists
  }, [artists])

  // Load WebGL Earth script
  useEffect(() => {
    if (typeof window === 'undefined') return

    const loadScript = () => {
      if (window.WE) {
        setScriptLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://www.webglearth.com/v2/api.js'
      script.async = true
      script.onload = () => {
        setScriptLoaded(true)
      }
      script.onerror = () => {
        setError('Error al cargar WebGL Earth API')
        setIsLoading(false)
      }
      document.head.appendChild(script)
    }

    loadScript()
  }, [])

  // Initialize WebGL Earth
  useEffect(() => {
    if (!scriptLoaded || !earthContainer.current || earth.current) return

    try {
      // Create unique container ID
      const containerId = `earth_${Date.now()}`
      earthContainer.current.id = containerId

      // Initialize WebGL Earth
      earth.current = new window.WE.map(containerId)
      earth.current.setView([20.0, 0.0], 2)

      // Add tile layer with fallback to OpenStreetMap
      const tileLayer = window.WE.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        tileSize: 256,
        bounds: [[-85, -180], [85, 180]],
        minZoom: 0,
        maxZoom: 18,
        attribution: 'WebGL Earth - OpenStreetMap',
        tms: false
      })
      
      tileLayer.addTo(earth.current)

      // Add artists markers after a short delay to ensure map is ready
      setTimeout(() => {
        addArtistMarkers()
        setIsLoading(false)
      }, 1000)

    } catch (err) {
      console.error('Error initializing WebGL Earth:', err)
      setError('Error al inicializar el globo 3D')
      setIsLoading(false)
    }
  }, [scriptLoaded])

  const addArtistMarkers = () => {
    if (!earth.current || !earthContainer.current) return

    const container = earth.current.getContainer()
    
    displayArtists.forEach((artist) => {
      // Create marker element
      const markerElement = document.createElement('div')
      markerElement.className = 'webgl-artist-marker'
      
      const verifiedGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      const unverifiedGradient = 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)'
      
      markerElement.style.cssText = `
        position: absolute;
        width: 40px;
        height: 40px;
        background: ${artist.verified ? verifiedGradient : unverifiedGradient};
        border: 3px solid ${artist.verified ? '#ffffff' : '#a0aec0'};
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        color: white;
        font-size: 14px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.4), 0 0 0 0 ${artist.verified ? 'rgba(102, 126, 234, 0.4)' : 'rgba(74, 85, 104, 0.4)'};
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1000;
        transform: translate(-50%, -50%);
      `
      
      // Add glow effect for verified artists
      if (artist.verified) {
        markerElement.style.filter = 'drop-shadow(0 0 8px rgba(102, 126, 234, 0.6))'
      }
      
      markerElement.textContent = artist.name.charAt(0)
      
      // Create popup element
      const popupElement = document.createElement('div')
      popupElement.className = 'webgl-artist-popup'
      popupElement.style.cssText = `
        position: absolute;
        display: none;
        z-index: 2000;
        transform: translate(-50%, -120%);
        pointer-events: none;
      `
      
      popupElement.innerHTML = `
        <div class="p-4 bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-2xl min-w-[220px] border border-gray-700/50 backdrop-blur-sm">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-full ${artist.verified ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gradient-to-r from-gray-600 to-gray-700'} flex items-center justify-center text-white font-bold text-sm shadow-lg">
              ${artist.name.charAt(0)}
            </div>
            <div class="flex-1">
              <h3 class="font-bold text-white text-lg leading-tight">${artist.name}</h3>
              ${artist.verified ? '<div class="flex items-center gap-1 mt-1"><span class="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-0.5 rounded-full font-medium">✓ Verificado</span></div>' : ''}
            </div>
          </div>
          
          <div class="flex items-center gap-2 mb-3">
            <div class="flex items-center gap-1">
              <span class="text-white text-lg">★</span>
              <span class="text-white font-semibold">${artist.rating}</span>
              <span class="text-gray-400 text-sm">/5.0</span>
            </div>
          </div>
          
          <div class="mb-4">
            <p class="text-gray-300 text-xs font-medium mb-2 uppercase tracking-wide">Especialidades</p>
            <div class="flex flex-wrap gap-1.5">
              ${artist.specialties.map(specialty => 
                `<span class="text-xs bg-gray-800/80 text-gray-200 px-2.5 py-1 rounded-full border border-gray-600/50 font-medium">${specialty}</span>`
              ).join('')}
            </div>
          </div>
          
          <button class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]">
            Ver Perfil Completo
          </button>
        </div>
      `
      
      // Enhanced hover effects
      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'translate(-50%, -50%) scale(1.3) translateY(-2px)'
        markerElement.style.boxShadow = `0 12px 35px rgba(0,0,0,0.5), 0 0 0 8px ${artist.verified ? 'rgba(102, 126, 234, 0.2)' : 'rgba(74, 85, 104, 0.2)'}`
        if (artist.verified) {
          markerElement.style.filter = 'drop-shadow(0 0 15px rgba(102, 126, 234, 0.8))'
        }
        popupElement.style.display = 'block'
      })
      
      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'translate(-50%, -50%) scale(1) translateY(0)'
        markerElement.style.boxShadow = `0 8px 25px rgba(0,0,0,0.4), 0 0 0 0 ${artist.verified ? 'rgba(102, 126, 234, 0.4)' : 'rgba(74, 85, 104, 0.4)'}`
        if (artist.verified) {
          markerElement.style.filter = 'drop-shadow(0 0 8px rgba(102, 126, 234, 0.6))'
        }
        popupElement.style.display = 'none'
      })

      // Add click event
      markerElement.addEventListener('click', (e) => {
        e.stopPropagation()
        if (onArtistClick) {
          onArtistClick(artist)
        }
      })
      
      // Position markers (simplified positioning for WebGL Earth)
      const x = ((artist.longitude + 180) / 360) * container.offsetWidth
      const y = ((90 - artist.latitude) / 180) * container.offsetHeight
      
      markerElement.style.left = `${x}px`
      markerElement.style.top = `${y}px`
      
      popupElement.style.left = `${x}px`
      popupElement.style.top = `${y}px`
      
      container.appendChild(markerElement)
      container.appendChild(popupElement)
      
      markersRef.current.push(markerElement, popupElement)
    })
  }

  // Cleanup
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => {
        if (marker.parentNode) {
          marker.parentNode.removeChild(marker)
        }
      })
      markersRef.current = []
    }
  }, [])

  if (error) {
    return (
      <div className={`h-[400px] flex items-center justify-center bg-gradient-to-br from-gray-900 to-black rounded-lg ${className}`}>
        <div className="text-center p-8 rounded-xl bg-black/20 backdrop-blur-md border border-white/50">
          <div className="text-white text-5xl mb-4 animate-pulse">⚠️</div>
          <p className="text-white font-semibold text-lg mb-2">Error al cargar el globo 3D</p>
          <p className="text-white text-sm bg-black/30 p-3 rounded-lg border border-white/30">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-6 py-2 bg-white hover:bg-white/90 text-black rounded-lg transition-colors duration-200 font-medium"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative h-[400px] rounded-lg overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center z-10">
          <div className="text-center p-8 rounded-xl bg-gray-800/50 backdrop-blur-md border border-gray-700/50">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-600 border-t-blue-500 mx-auto"></div>
              <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse"></div>
            </div>
            <p className="text-gray-200 font-medium text-lg">Cargando globo 3D...</p>
            <p className="text-gray-400 text-sm mt-2">Inicializando WebGL Earth</p>
          </div>
        </div>
      )}
      
      <div 
        ref={earthContainer}
        className="w-full h-full"
        style={{ 
          background: 'linear-gradient(to top, rgb(26,26,26) 0%, rgb(26,26,26) 15%, rgb(45,45,45) 53%, rgb(26,26,26) 56%, rgb(26,26,26) 100%)'
        }}
      />
      
      {/* Modern Legend */}
      <div className="absolute bottom-6 left-6 bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-gray-700/50 z-20">
        <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wide">Artistas</h4>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-600 border-2 border-white rounded-full shadow-lg" style={{filter: 'drop-shadow(0 0 4px rgba(102, 126, 234, 0.6))'}}></div>
            <span className="text-gray-200 font-medium">Verificado</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-5 h-5 bg-gradient-to-r from-gray-600 to-gray-700 border-2 border-gray-400 rounded-full shadow-lg"></div>
            <span className="text-gray-300 font-medium">No verificado</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <p className="text-xs text-gray-400 font-medium">
            {displayArtists.length} artistas disponibles
          </p>
        </div>
      </div>
      
      {/* WebGL Earth Attribution */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-black/50 px-2 py-1 rounded">
        WebGL Earth
      </div>
    </div>
  )
}

export default WebGLEarthComponent
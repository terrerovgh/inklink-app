'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

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

interface GlobeMapComponentProps {
  artists?: Artist[]
  onArtistClick?: (artist: Artist) => void
  className?: string
}

const GlobeMapComponent: React.FC<GlobeMapComponentProps> = ({
  artists = [],
  onArtistClick,
  className = ''
}) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mock artists data if none provided
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

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    try {
      // Initialize the map with a basic style configuration
      const basicStyle = {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: {
              'background-color': '#1a1a1a'
            }
          },
          {
            id: 'simple-tiles',
            type: 'raster',
            source: 'raster-tiles',
            paint: {
              'raster-opacity': 0.8,
              'raster-brightness-min': 0.1,
              'raster-brightness-max': 0.3,
              'raster-contrast': 0.2,
              'raster-saturation': -0.5
            }
          }
        ]
      }

      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: basicStyle,
        center: [0, 0],
        zoom: 2
      })

      // Add navigation controls
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

      // Handle missing style images
      map.current.on('styleimagemissing', (e) => {
        console.log('Missing image:', e.id)
        // Create a simple placeholder image
        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = 1
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = 'transparent'
          ctx.fillRect(0, 0, 1, 1)
          map.current?.addImage(e.id, canvas)
        }
      })

      map.current.on('load', () => {
        console.log('Map loaded successfully')
        setIsLoading(false)
        
        // Add artists markers with modern design
        displayArtists.forEach((artist) => {
          // Create custom marker element
          const markerElement = document.createElement('div')
          markerElement.className = 'artist-marker'
          
          const verifiedGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          const unverifiedGradient = 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)'
          
          markerElement.style.cssText = `
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
            position: relative;
            z-index: 1;
          `
          
          // Add glow effect for verified artists
          if (artist.verified) {
            markerElement.style.filter = 'drop-shadow(0 0 8px rgba(102, 126, 234, 0.6))'
          }
          
          markerElement.textContent = artist.name.charAt(0)
          
          // Enhanced hover effects
          markerElement.addEventListener('mouseenter', () => {
            markerElement.style.transform = 'scale(1.3) translateY(-2px)'
            markerElement.style.boxShadow = `0 12px 35px rgba(0,0,0,0.5), 0 0 0 8px ${artist.verified ? 'rgba(102, 126, 234, 0.2)' : 'rgba(74, 85, 104, 0.2)'}`
            if (artist.verified) {
              markerElement.style.filter = 'drop-shadow(0 0 15px rgba(102, 126, 234, 0.8))'
            }
          })
          
          markerElement.addEventListener('mouseleave', () => {
            markerElement.style.transform = 'scale(1) translateY(0)'
            markerElement.style.boxShadow = `0 8px 25px rgba(0,0,0,0.4), 0 0 0 0 ${artist.verified ? 'rgba(102, 126, 234, 0.4)' : 'rgba(74, 85, 104, 0.4)'}`
            if (artist.verified) {
              markerElement.style.filter = 'drop-shadow(0 0 8px rgba(102, 126, 234, 0.6))'
            }
          })

          // Create marker
          const marker = new maplibregl.Marker(markerElement)
            .setLngLat([artist.longitude, artist.latitude])
            .addTo(map.current!)

          // Create elegant dark popup
          const popup = new maplibregl.Popup({
            offset: 30,
            closeButton: false,
            className: 'artist-popup-dark'
          }).setHTML(`
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
                  <span class="text-yellow-400 text-lg">★</span>
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
          `)

          // Add click event
          markerElement.addEventListener('click', (e) => {
            e.stopPropagation()
            if (onArtistClick) {
              onArtistClick(artist)
            }
          })

          // Show popup on hover
          markerElement.addEventListener('mouseenter', () => {
            marker.setPopup(popup)
            popup.addTo(map.current!)
          })

          markerElement.addEventListener('mouseleave', () => {
            popup.remove()
          })
        })
      })

      map.current.on('error', (e) => {
        console.error('Map error:', e)
        setError('Error al cargar el mapa')
        setIsLoading(false)
      })

      // Add debug logging
      map.current.on('styledata', () => {
        console.log('Map style loaded successfully')
      })

      map.current.on('sourcedataloading', (e) => {
        console.log('Loading source:', e.sourceId)
      })

      map.current.on('sourcedata', (e) => {
        console.log('Source loaded:', e.sourceId)
      })

    } catch (err) {
      console.error('Error initializing map:', err)
      setError('Error al inicializar el mapa')
      setIsLoading(false)
    }

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [])

  if (error) {
    return (
      <div className={`h-[400px] flex items-center justify-center bg-gradient-to-br from-gray-900 to-black rounded-lg ${className}`}>
        <div className="text-center p-8 rounded-xl bg-red-900/20 backdrop-blur-md border border-red-700/50">
          <div className="text-red-400 text-5xl mb-4 animate-pulse">⚠️</div>
          <p className="text-red-300 font-semibold text-lg mb-2">Error al cargar el mapa</p>
          <p className="text-red-400 text-sm bg-red-900/30 p-3 rounded-lg border border-red-700/30">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium"
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
              <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse"></div>
            </div>
            <p className="text-gray-200 font-medium text-lg">Cargando mapa del globo...</p>
            <p className="text-gray-400 text-sm mt-2">Preparando la experiencia interactiva</p>
          </div>
        </div>
      )}
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ 
          background: 'linear-gradient(to bottom, #1a1a1a, #000)' 
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
    </div>
  )
}

export default GlobeMapComponent
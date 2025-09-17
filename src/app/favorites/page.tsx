'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Heart,
  MapPin,
  Star,
  MessageCircle,
  Calendar,
  Filter,
  Grid,
  List,
  Search
} from 'lucide-react'

interface FavoriteItem {
  id: string
  type: 'artist' | 'studio'
  name: string
  location: string
  rating: number
  reviewCount: number
  specialties: string[]
  image: string
  price: string
  availability: string
  addedDate: string
}

export default function FavoritesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<'all' | 'artist' | 'studio'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  // Load favorites (mock data for now)
  useEffect(() => {
    if (user) {
      // Simulate API call
      setTimeout(() => {
        setFavorites([
          {
            id: '1',
            type: 'artist',
            name: 'Carlos Mendoza',
            location: 'Madrid, España',
            rating: 4.8,
            reviewCount: 127,
            specialties: ['Realismo', 'Retratos'],
            image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20tattoo%20artist%20portrait%20realistic%20style&image_size=square',
            price: '€80-150/hora',
            availability: 'Disponible en 2 semanas',
            addedDate: '2024-01-15'
          },
          {
            id: '2',
            type: 'studio',
            name: 'Ink Masters Studio',
            location: 'Barcelona, España',
            rating: 4.9,
            reviewCount: 89,
            specialties: ['Tradicional', 'Neo-tradicional', 'Blackwork'],
            image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20tattoo%20studio%20interior%20clean%20professional&image_size=square',
            price: '€60-120/hora',
            availability: 'Disponible esta semana',
            addedDate: '2024-01-10'
          }
        ])
        setIsLoading(false)
      }, 1000)
    }
  }, [user])

  const handleRemoveFavorite = (id: string) => {
    setFavorites(prev => prev.filter(item => item.id !== id))
  }

  const handleContact = (id: string) => {
    router.push(`/messages?contact=${id}`)
  }

  const handleBookAppointment = (id: string) => {
    router.push(`/booking?provider=${id}`)
  }

  const filteredFavorites = favorites.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.specialties.some(specialty => 
        specialty.toLowerCase().includes(searchQuery.toLowerCase())
      )
    return matchesType && matchesSearch
  })

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Mis Favoritos</h1>
          <p className="text-white/60">
            Artistas y estudios que has guardado para más tarde
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar en favoritos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-white/60" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <option value="all">Todos</option>
              <option value="artist">Artistas</option>
              <option value="studio">Estudios</option>
            </select>
          </div>

          {/* View Mode */}
          <div className="flex items-center space-x-1 bg-white/10 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-white/40 mb-4">
              <Heart className="w-16 h-16 mx-auto mb-4" />
            </div>
            <p className="text-white/60">Cargando favoritos...</p>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-white/40 mb-4">
              <Heart className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {searchQuery || filterType !== 'all' ? 'No se encontraron favoritos' : 'Aún no tienes favoritos'}
            </h3>
            <p className="text-white/60 text-sm mb-6">
              {searchQuery || filterType !== 'all' 
                ? 'Intenta ajustar tus filtros de búsqueda'
                : 'Explora artistas y estudios para agregar a tus favoritos'
              }
            </p>
            {!searchQuery && filterType === 'all' && (
              <Button
                onClick={() => router.push('/search')}
                className="bg-white text-black hover:bg-white/90"
              >
                Explorar Artistas
              </Button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {filteredFavorites.map((item) => (
              <Card key={item.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                <CardContent className="p-6">
                  <div className={viewMode === 'list' ? 'flex items-center space-x-4' : ''}>
                    {/* Image */}
                    <div className={viewMode === 'list' ? 'w-20 h-20 flex-shrink-0' : 'w-full h-48 mb-4'}>
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>

                    {/* Content */}
                    <div className={viewMode === 'list' ? 'flex-1' : ''}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-white font-semibold">{item.name}</h3>
                          <p className="text-white/60 text-sm flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {item.location}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFavorite(item.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </Button>
                      </div>

                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                          <span className="text-white text-sm">{item.rating}</span>
                          <span className="text-white/60 text-sm ml-1">({item.reviewCount})</span>
                        </div>
                        <span className="text-white/60 text-sm">{item.price}</span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.specialties.slice(0, 3).map((specialty) => (
                          <span
                            key={specialty}
                            className="bg-white/10 text-white/80 px-2 py-1 rounded text-xs"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>

                      <p className="text-white/60 text-sm mb-4">{item.availability}</p>

                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleContact(item.id)}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-white/30 text-white hover:bg-white/10"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Contactar
                        </Button>
                        <Button
                          onClick={() => handleBookAppointment(item.id)}
                          size="sm"
                          className="flex-1 bg-white text-black hover:bg-white/90"
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          Reservar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
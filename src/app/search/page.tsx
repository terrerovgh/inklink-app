'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Search, MapPin, Star, Clock, DollarSign, Filter, X, Map, List, Menu, Heart, MessageCircle, Phone, Mail, User, LogIn, Grid } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Importar el componente de mapa dinámicamente para evitar problemas de SSR
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Cargando mapa...</p>
      </div>
    </div>
  )
})

interface SearchResult {
  id: string
  full_name?: string
  name?: string
  bio?: string
  description?: string
  avatar_url?: string
  location?: string
  specialties?: string[]
  services?: string[]
  rating?: number
  total_reviews?: number
  hourly_rate?: number
  availability?: boolean
  type: 'artist' | 'studio'
  distance?: number
}

const TATTOO_STYLES = [
  'Realismo', 'Traditional', 'Neo-traditional', 'Blackwork', 'Dotwork',
  'Watercolor', 'Geometric', 'Minimalist', 'Japanese', 'Tribal',
  'Biomecánico', 'Surrealismo', 'Lettering', 'Ornamental', 'Fine Line'
]

const STUDIO_SERVICES = [
  'Tatuajes personalizados', 'Flash tattoos', 'Cover-ups', 'Restauración',
  'Piercings', 'Microdermal', 'Consultas de diseño', 'Tatuajes temporales'
]

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user, profile, loading: authLoading } = useAuth()
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [searchType, setSearchType] = useState<'all' | 'artist' | 'studio'>(searchParams.get('type') as any || 'all')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [showSidebar, setShowSidebar] = useState(true)
  const [filters, setFilters] = useState({
    specialty: '',
    services: '',
    minRating: '',
    maxPrice: '',
    availability: '',
    location: '',
    radius: '10'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    if (searchQuery) {
      handleSearch()
    }
  }, [searchQuery, searchType])

  // Load user favorites if authenticated
  useEffect(() => {
    if (user) {
      loadUserFavorites()
    }
  }, [user])

  const loadUserFavorites = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('profile_id')
        .eq('user_id', user.id)
      
      if (error) throw error
      
      setFavorites(data?.map(fav => fav.profile_id) || [])
    } catch (error) {
      console.error('Error loading favorites:', error)
    }
  }

  const toggleFavorite = async (profileId: string) => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    try {
      const isFavorite = favorites.includes(profileId)
      
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('profile_id', profileId)
        
        if (error) throw error
        setFavorites(prev => prev.filter(id => id !== profileId))
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            profile_id: profileId
          })
        
        if (error) throw error
        setFavorites(prev => [...prev, profileId])
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type: searchType,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      })

      const response = await fetch(`/api/search?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setResults(data.results)
      }
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setFilters({
      specialty: '',
      services: '',
      minRating: '',
      maxPrice: '',
      availability: '',
      location: '',
      radius: '10'
    })
  }

  const filteredResults = results.filter(result => {
    if (filters.specialty && result.specialties && !result.specialties.includes(filters.specialty)) return false
    if (filters.minRating && result.rating && result.rating < parseFloat(filters.minRating)) return false
    if (filters.maxPrice && result.hourly_rate && result.hourly_rate > parseFloat(filters.maxPrice)) return false
    if (filters.availability === 'true' && !result.availability) return false
    return true
  })

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar)
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Header con controles de búsqueda */}
      <div className="bg-black border-b border-white/10 p-4 z-20 relative">
        {/* User Status Banner for non-authenticated users */}
        {!authLoading && !user && (
          <div className="bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-white/80" />
                <div>
                  <p className="text-sm font-medium text-white">¿Buscas el tatuaje perfecto?</p>
                  <p className="text-xs text-white/70">Inicia sesión para guardar favoritos y contactar artistas directamente</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/auth/login')}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  Iniciar Sesión
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push('/auth/register')}
                  className="bg-white text-black hover:bg-white/90"
                >
                  Registrarse
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Welcome message for authenticated users */}
        {user && profile && (
          <div className="bg-gradient-to-r from-green-500/20 to-green-400/10 border border-green-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    ¡Hola, {profile.fullName || user.user_metadata?.full_name || 'Usuario'}!
                  </p>
                  <p className="text-xs text-white/70">
                    {profile.userType === 'client' && 'Encuentra el artista perfecto para tu próximo tatuaje'}
                    {profile.userType === 'artist' && 'Descubre otros artistas y estudios en tu área'}
                    {profile.userType === 'studio' && 'Explora la comunidad de tatuadores'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/profile')}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                Mi Perfil
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-4">
          {/* Toggle Sidebar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="text-white hover:bg-white/10 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
            <Input
              placeholder="Buscar artistas y estudios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          {/* Type Filter */}
          <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
            <SelectTrigger className="w-32 bg-white/5 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black border-white/20">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="artist">Artistas</SelectItem>
              <SelectItem value="studio">Estudios</SelectItem>
            </SelectContent>
          </Select>
          
          {/* View Toggle */}
          <div className="hidden sm:flex bg-white/5 rounded-md p-1">
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('map')}
              className={viewMode === 'map' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}
            >
              <Map className="w-4 h-4" />
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

        {/* Filters Toggle */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="ghost"
            onClick={() => setShowFilters(!showFilters)}
            className="text-white hover:bg-white/10"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros {showFilters ? '▲' : '▼'}
          </Button>
          {Object.values(filters).some(v => v) && (
            <Button variant="ghost" onClick={clearFilters} className="text-white hover:bg-white/10">
              <X className="w-4 h-4 mr-2" />
              Limpiar Filtros
            </Button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tattoo Style */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Estilo de Tatuaje
                </label>
                <Select
                  value={filters.specialty}
                  onValueChange={(value) => setFilters({...filters, specialty: value})}
                >
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Seleccionar estilo" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20">
                    <SelectItem value="">Todos los estilos</SelectItem>
                    {TATTOO_STYLES.map(style => (
                      <SelectItem key={style} value={style}>{style}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Studio Services */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Servicios del Estudio
                </label>
                <Select
                  value={filters.services}
                  onValueChange={(value) => setFilters({...filters, services: value})}
                >
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Seleccionar servicio" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20">
                    <SelectItem value="">Todos los servicios</SelectItem>
                    {STUDIO_SERVICES.map(service => (
                      <SelectItem key={service} value={service}>{service}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Minimum Rating */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Calificación Mínima
                </label>
                <Select
                  value={filters.minRating}
                  onValueChange={(value) => setFilters({...filters, minRating: value})}
                >
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Cualquier calificación" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20">
                    <SelectItem value="">Cualquier calificación</SelectItem>
                    <SelectItem value="4">4+ estrellas</SelectItem>
                    <SelectItem value="4.5">4.5+ estrellas</SelectItem>
                    <SelectItem value="5">5 estrellas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Maximum Price */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Precio Máximo por Hora
                </label>
                <Input
                  type="number"
                  placeholder="Sin límite"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
                />
              </div>

              {/* Radio de búsqueda */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Radio de búsqueda
                </label>
                <Select
                  value={filters.radius}
                  onValueChange={(value) => setFilters({...filters, radius: value})}
                >
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Seleccionar radio" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20">
                    <SelectItem value="5">5 km</SelectItem>
                    <SelectItem value="10">10 km</SelectItem>
                    <SelectItem value="25">25 km</SelectItem>
                    <SelectItem value="50">50 km</SelectItem>
                    <SelectItem value="100">100 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Ubicación
                </label>
                <Input
                  placeholder="Ciudad, estado o código postal"
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
                />
              </div>
            </div>
          </div>
        )}
        </div>

      {/* Main Content - Map and Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`${
          showSidebar ? 'w-96' : 'w-0'
        } transition-all duration-300 bg-black border-r border-white/10 overflow-hidden lg:w-96 lg:block`}>
          <div className="h-full overflow-y-auto p-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span className="ml-3 text-white/80">Buscando...</span>
              </div>
            ) : filteredResults.length > 0 ? (
              <div className="space-y-4">
                {/* Results Header with User-specific Actions */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    {filteredResults.length} resultados encontrados
                  </h3>
                  {user && (
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/favorites')}
                        className="text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        Favoritos
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/messages')}
                        className="text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Mensajes
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Personalized Recommendations for authenticated users */}
                {user && profile && searchQuery && (
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center mb-2">
                      <Star className="h-4 w-4 text-blue-400 mr-2" />
                      <h4 className="text-sm font-medium text-white">Recomendado para ti</h4>
                    </div>
                    <p className="text-xs text-white/70 mb-2">
                      {profile.userType === 'client' && 'Basado en tu ubicación y preferencias'}
                      {profile.userType === 'artist' && 'Artistas y estudios similares en tu área'}
                      {profile.userType === 'studio' && 'Colaboradores potenciales cerca de ti'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {filteredResults.slice(0, 2).map((result) => (
                        <Badge key={result.id} variant="outline" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30">
                          {result.full_name || result.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {filteredResults.map((result) => (
                  <div 
                    key={result.id} 
                    className={`bg-white/5 border border-white/10 rounded-lg p-4 cursor-pointer transition-all hover:bg-white/10 ${
                      selectedResult?.id === result.id ? 'ring-2 ring-white/40' : ''
                    }`}
                    onClick={() => setSelectedResult(result)}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={result.avatar_url} />
                        <AvatarFallback className="bg-white/10 text-white">
                          {(result.full_name || result.name || '').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">
                          {result.full_name || result.name}
                        </h4>
                        <p className="text-white/60 text-sm mb-1">
                          {result.type === 'artist' ? 'Artista' : 'Estudio'} • {result.location}
                        </p>
                        
                        {/* Rating */}
                        {result.rating && (
                          <div className="flex items-center mb-2">
                            <div className="flex items-center">
                              <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                              <span className="text-xs text-white/60">
                                {result.rating.toFixed(1)} ({result.total_reviews})
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Price and Availability */}
                        <div className="flex items-center justify-between">
                          {result.hourly_rate && (
                            <span className="text-white text-sm font-medium">
                              €{result.hourly_rate}/hora
                            </span>
                          )}
                          {result.availability !== undefined && (
                            <div className={`w-2 h-2 rounded-full ${
                              result.availability ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                          )}
                        </div>
                        
                        {/* Specialties */}
                        {(result.specialties || result.services) && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {(result.specialties || result.services || []).slice(0, 2).map((item) => (
                                <Badge key={item} variant="outline" className="text-xs bg-white/10 text-white/80 border-white/20">
                                  {item}
                                </Badge>
                              ))}
                              {(result.specialties || result.services || []).length > 2 && (
                                <Badge variant="outline" className="text-xs bg-white/5 text-white/60 border-white/20">
                                  +{(result.specialties || result.services || []).length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Action Buttons - Different for authenticated vs non-authenticated users */}
                        <div className="mt-3 flex items-center justify-between">
                          {user ? (
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleFavorite(result.id)
                                }}
                                className={`p-1 h-8 w-8 ${favorites.includes(result.id) ? 'text-red-400 hover:text-red-300' : 'text-white/60 hover:text-white'}`}
                              >
                                <Heart className={`h-4 w-4 ${favorites.includes(result.id) ? 'fill-current' : ''}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/messages/new?to=${result.id}`)
                                }}
                                className="p-1 h-8 w-8 text-white/60 hover:text-white"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push('/auth/login')
                                }}
                                className="text-xs text-white/60 hover:text-white p-1 h-6"
                              >
                                <LogIn className="h-3 w-3 mr-1" />
                                Iniciar sesión para contactar
                              </Button>
                            </div>
                          )}
                          <Link href={`/profile/${result.type}/${result.id}`} onClick={(e) => e.stopPropagation()}>
                            <Button variant="outline" size="sm" className="text-xs border-white/20 text-white hover:bg-white/10">
                              Ver perfil
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-white/40 mb-4">
                  <Search className="w-16 h-16 mx-auto mb-4" />
                </div>
                {searchQuery ? (
                  <>
                    <h3 className="text-lg font-medium text-white mb-2">
                      No se encontraron resultados
                    </h3>
                    <p className="text-white/60 text-sm mb-4">
                      Intenta ajustar tus filtros de búsqueda o busca en una ubicación diferente.
                    </p>
                    {!user && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4 mt-6 max-w-sm mx-auto">
                        <p className="text-white/80 text-sm mb-3">
                          ¿No encuentras lo que buscas?
                        </p>
                        <p className="text-white/60 text-xs mb-4">
                          Regístrate para acceder a más artistas y recibir recomendaciones personalizadas
                        </p>
                        <Button
                          onClick={() => router.push('/auth/register')}
                          className="w-full bg-white text-black hover:bg-white/90"
                          size="sm"
                        >
                          Crear cuenta gratis
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium text-white mb-2">
                      {user ? 'Comienza tu búsqueda' : 'Descubre artistas increíbles'}
                    </h3>
                    <p className="text-white/60 text-sm mb-6">
                      {user 
                        ? 'Busca artistas y estudios de tatuajes en tu área'
                        : 'Encuentra el artista perfecto para tu próximo tatuaje'
                      }
                    </p>
                    {!user && (
                      <div className="space-y-4 max-w-sm mx-auto">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <h4 className="text-white font-medium text-sm mb-2">¿Eres artista o tienes un estudio?</h4>
                          <p className="text-white/60 text-xs mb-3">
                            Únete a InkLink y conecta con clientes que buscan tu estilo
                          </p>
                          <Button
                            onClick={() => router.push('/auth/register?type=artist')}
                            variant="outline"
                            className="w-full border-white/30 text-white hover:bg-white/10"
                            size="sm"
                          >
                            Registrarse como artista
                          </Button>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <h4 className="text-white font-medium text-sm mb-2">¿Buscas un tatuaje?</h4>
                          <p className="text-white/60 text-xs mb-3">
                            Explora artistas, guarda favoritos y contacta directamente
                          </p>
                          <Button
                            onClick={() => router.push('/auth/register?type=client')}
                            className="w-full bg-white text-black hover:bg-white/90"
                            size="sm"
                          >
                            Empezar búsqueda
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          {viewMode === 'map' ? (
            <MapComponent 
              className="w-full h-full"
              results={filteredResults}
              selectedResult={selectedResult}
              onResultSelect={setSelectedResult}
            />
          ) : (
            <div className="h-full overflow-y-auto p-6 bg-black">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredResults.map((result) => (
                  <div key={result.id} className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={result.avatar_url} />
                        <AvatarFallback className="bg-white/10 text-white">
                          {(result.full_name || result.name || '').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {result.full_name || result.name}
                        </h3>
                        <p className="text-sm text-white/60 mb-2">
                          {result.type === 'artist' ? 'Artista' : 'Estudio'} • {result.location}
                        </p>
                        
                        {/* Rating */}
                        {result.rating && (
                          <div className="flex items-center mb-2">
                            <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                            <span className="text-sm text-white/60">
                              {result.rating.toFixed(1)} ({result.total_reviews} reseñas)
                            </span>
                          </div>
                        )}
                        
                        {/* Price */}
                        {result.hourly_rate && (
                          <p className="text-sm text-white/60 mb-2">
                            <span className="font-medium text-white">€{result.hourly_rate}/hora</span>
                          </p>
                        )}
                        
                        {/* Availability */}
                        {result.availability !== undefined && (
                          <div className="flex items-center mb-3">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              result.availability ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span className={`text-sm ${
                              result.availability ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {result.availability ? 'Disponible' : 'No disponible'}
                            </span>
                          </div>
                        )}
                        
                        {/* Specialties */}
                        {(result.specialties || result.services) && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {(result.specialties || result.services || []).slice(0, 3).map((item) => (
                                <Badge key={item} variant="outline" className="text-xs bg-white/10 text-white/80 border-white/20">
                                  {item}
                                </Badge>
                              ))}
                              {(result.specialties || result.services || []).length > 3 && (
                                <Badge variant="outline" className="text-xs bg-white/5 text-white/60 border-white/20">
                                  +{(result.specialties || result.services || []).length - 3} más
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <Button asChild className="w-full bg-white text-black hover:bg-white/90" size="sm">
                          <Link href={`/profile/${result.type}/${result.id}`}>
                            Ver Perfil
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
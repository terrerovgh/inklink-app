'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Euro, Clock, MessageCircle, Search, Filter, Eye, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'

interface TattooOffer {
  id: string
  message: string
  price: number
  estimated_duration: string
  status: string
  created_at: string
  tattoo_requests: {
    id: string
    title: string
    description: string
    style: string
    size: string
    placement: string
    budget_min: number | null
    budget_max: number | null
    status: string
    profiles: {
      id: string
      full_name: string
      avatar_url: string
    }
  }
}

interface UserProfile {
  id: string
  full_name: string
  avatar_url: string
  user_type: string
}

export default function OffersPage() {
  const router = useRouter()
  const supabase = createClient()
  const [offers, setOffers] = useState<TattooOffer[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profileData || profileData.user_type === 'client') {
        toast.error('Solo artistas y estudios pueden ver ofertas')
        router.push('/dashboard')
        return
      }

      setUserProfile(profileData)

      // Fetch offers
      const { data: offersData, error } = await supabase
        .from('tattoo_offers')
        .select(`
          *,
          tattoo_requests!tattoo_offers_request_id_fkey (
            id,
            title,
            description,
            style,
            size,
            placement,
            budget_min,
            budget_max,
            status,
            profiles!tattoo_requests_user_id_fkey (
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching offers:', error)
        toast.error('Error al cargar las ofertas')
        return
      }

      setOffers(offersData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta oferta?')) {
      return
    }

    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error deleting offer')
      }

      setOffers(prev => prev.filter(offer => offer.id !== offerId))
      toast.success('Oferta eliminada exitosamente')
    } catch (error) {
      console.error('Error deleting offer:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar la oferta')
    }
  }

  // Monochromatic palette - using only grayscale colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-200 text-gray-800'
      case 'accepted':
        return 'bg-gray-600 text-gray-100'
      case 'rejected':
        return 'bg-gray-400 text-gray-900'
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'accepted':
        return 'Aceptada'
      case 'rejected':
        return 'Rechazada'
      case 'withdrawn':
        return 'Retirada'
      default:
        return status
    }
  }

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Presupuesto abierto'
    if (min && max) return `€${min} - €${max}`
    if (min) return `Desde €${min}`
    if (max) return `Hasta €${max}`
    return 'Presupuesto abierto'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filter and sort offers
  const filteredOffers = offers
    .filter(offer => {
      const matchesSearch = offer.tattoo_requests.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           offer.tattoo_requests.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           offer.tattoo_requests.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || offer.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'price_high':
          return b.price - a.price
        case 'price_low':
          return a.price - b.price
        default:
          return 0
      }
    })

  const getOfferStats = () => {
    const total = offers.length
    const pending = offers.filter(o => o.status === 'pending').length
    const accepted = offers.filter(o => o.status === 'accepted').length
    const rejected = offers.filter(o => o.status === 'rejected').length
    
    return { total, pending, accepted, rejected }
  }

  const stats = getOfferStats()

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Ofertas</h1>
          <p className="text-gray-600 mt-1">
            Gestiona todas las ofertas que has enviado
          </p>
        </div>
        <Button onClick={() => router.push('/requests')}>
          Ver Solicitudes
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total de ofertas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            {/* Monochromatic palette - using grayscale for pending */}
            <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pendientes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            {/* Monochromatic palette - using darker gray for accepted */}
            <div className="text-2xl font-bold text-gray-800">{stats.accepted}</div>
            <div className="text-sm text-gray-600">Aceptadas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            {/* Monochromatic palette - using medium gray for rejected */}
            <div className="text-2xl font-bold text-gray-700">{stats.rejected}</div>
            <div className="text-sm text-gray-600">Rechazadas</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por título, descripción o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="accepted">Aceptadas</SelectItem>
                <SelectItem value="rejected">Rechazadas</SelectItem>
                <SelectItem value="withdrawn">Retiradas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Más recientes</SelectItem>
                <SelectItem value="oldest">Más antiguos</SelectItem>
                <SelectItem value="price_high">Precio mayor</SelectItem>
                <SelectItem value="price_low">Precio menor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Offers List */}
      {filteredOffers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {offers.length === 0 ? 'No has enviado ofertas aún' : 'No se encontraron ofertas'}
            </h3>
            <p className="text-gray-600 mb-4">
              {offers.length === 0 
                ? 'Explora las solicitudes de tatuajes y envía tu primera oferta.'
                : 'Intenta ajustar los filtros de búsqueda.'
              }
            </p>
            <Button onClick={() => router.push('/requests')}>
              Ver Solicitudes
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOffers.map((offer) => (
            <Card key={offer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Main Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {offer.tattoo_requests.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {offer.tattoo_requests.description}
                        </p>
                      </div>
                      <Badge className={getStatusColor(offer.status)}>
                        {getStatusText(offer.status)}
                      </Badge>
                    </div>

                    {/* Request Details */}
                    <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                      <span>Estilo: <strong>{offer.tattoo_requests.style}</strong></span>
                      <span>Tamaño: <strong>{offer.tattoo_requests.size}</strong></span>
                      <span>Ubicación: <strong>{offer.tattoo_requests.placement}</strong></span>
                      <span>Presupuesto: <strong>{formatBudget(offer.tattoo_requests.budget_min, offer.tattoo_requests.budget_max)}</strong></span>
                    </div>

                    {/* Client */}
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={offer.tattoo_requests.profiles.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {offer.tattoo_requests.profiles.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{offer.tattoo_requests.profiles.full_name}</p>
                        <p className="text-xs text-gray-500">Cliente</p>
                      </div>
                    </div>

                    {/* Offer Message */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-700 line-clamp-3">{offer.message}</p>
                    </div>

                    {/* Offer Details */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Euro className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">€{offer.price}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{offer.estimated_duration}</span>
                      </div>
                      <div className="text-gray-500">
                        Enviada el {formatDate(offer.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/requests/${offer.tattoo_requests.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Solicitud
                    </Button>
                    
                    {offer.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Retirar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Plus, MapPin, Calendar, Euro, Eye, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface TattooRequest {
  id: string
  title: string
  description: string
  style: string
  size: string
  placement: string
  budget_min: number | null
  budget_max: number | null
  preferred_date: string | null
  status: string
  created_at: string
  reference_images: string[]
  profiles: {
    id: string
    full_name: string
    avatar_url: string
  }
  _count?: {
    offers: number
  }
}

const STATUS_COLORS = {
  open: 'bg-white text-black',
    in_progress: 'bg-black text-white',
    completed: 'bg-white text-black',
    cancelled: 'bg-black text-white'
}

const STATUS_LABELS = {
  open: 'Abierta',
  in_progress: 'En Progreso',
  completed: 'Completada',
  cancelled: 'Cancelada'
}

const TATTOO_STYLES = [
  'Realismo', 'Traditional', 'Neo-traditional', 'Blackwork', 'Dotwork',
  'Watercolor', 'Geometric', 'Minimalist', 'Japanese', 'Tribal',
  'Biomecánico', 'Surrealismo', 'Lettering', 'Ornamental'
]

export default function RequestsPage() {
  const supabase = createClient()
  const [requests, setRequests] = useState<TattooRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [styleFilter, setStyleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    getCurrentUser()
    fetchRequests()
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [searchQuery, styleFilter, statusFilter])

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const fetchRequests = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('tattoo_requests')
        .select(`
          *,
          profiles!tattoo_requests_user_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }
      
      if (styleFilter) {
        query = query.eq('style', styleFilter)
      }
      
      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching requests:', error)
        toast.error('Error al cargar las solicitudes')
        return
      }

      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast.error('Error al cargar las solicitudes')
    } finally {
      setLoading(false)
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
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: es
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Solicitudes de Tatuajes</h1>
          <p className="text-gray-600">Explora ideas de tatuajes y conecta con clientes</p>
        </div>
        {currentUser && (
          <Link href="/requests/create">
            <Button className="mt-4 md:mt-0">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Solicitud
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar solicitudes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={styleFilter} onValueChange={setStyleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estilos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los estilos</SelectItem>
                {TATTOO_STYLES.map((style) => (
                  <SelectItem key={style} value={style}>{style}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los estados</SelectItem>
                <SelectItem value="open">Abiertas</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('')
                setStyleFilter('')
                setStatusFilter('')
              }}
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Search className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron solicitudes
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || styleFilter || statusFilter
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Sé el primero en crear una solicitud de tatuaje'
                }
              </p>
              {currentUser && !searchQuery && !styleFilter && !statusFilter && (
                <Link href="/requests/create">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primera Solicitud
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Main Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Link href={`/requests/${request.id}`}>
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-white cursor-pointer">
                            {request.title}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={request.profiles.avatar_url} />
                            <AvatarFallback>
                              {request.profiles.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-600">
                            {request.profiles.full_name}
                          </span>
                          <span className="text-sm text-gray-400">•</span>
                          <span className="text-sm text-gray-500">
                            {formatDate(request.created_at)}
                          </span>
                        </div>
                      </div>
                      <Badge className={STATUS_COLORS[request.status as keyof typeof STATUS_COLORS]}>
                        {STATUS_LABELS[request.status as keyof typeof STATUS_LABELS]}
                      </Badge>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {request.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary">{request.style}</Badge>
                      <Badge variant="outline">{request.size}</Badge>
                      <Badge variant="outline">
                        <MapPin className="w-3 h-3 mr-1" />
                        {request.placement}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Euro className="w-4 h-4" />
                        {formatBudget(request.budget_min, request.budget_max)}
                      </div>
                      
                      {request.preferred_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(request.preferred_date).toLocaleDateString('es-ES')}
                        </div>
                      )}
                      
                      {request._count?.offers && (
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {request._count.offers} ofertas
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reference Images */}
                  {request.reference_images && request.reference_images.length > 0 && (
                    <div className="flex-shrink-0">
                      <div className="grid grid-cols-2 gap-2 w-24">
                        {request.reference_images.slice(0, 4).map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Reference ${index + 1}`}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ))}
                        {request.reference_images.length > 4 && (
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-600">
                            +{request.reference_images.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <Link href={`/requests/${request.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </Link>
                  
                  {currentUser && request.status === 'open' && (
                    <Link href={`/requests/${request.id}/offer`}>
                      <Button size="sm">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Hacer Oferta
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More */}
      {requests.length > 0 && requests.length % 20 === 0 && (
        <div className="text-center mt-8">
          <Button variant="outline" onClick={fetchRequests}>
            Cargar Más
          </Button>
        </div>
      )}
    </div>
  )
}
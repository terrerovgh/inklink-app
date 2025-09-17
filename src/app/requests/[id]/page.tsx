'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { 
  MapPin, Calendar, Euro, MessageCircle, Edit, Trash2, 
  ArrowLeft, Star, Clock, User, Palette, Ruler, Eye
} from 'lucide-react'
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
  updated_at: string
  reference_images: string[]
  user_id: string
  artist_id: string | null
  studio_id: string | null
  profiles: {
    id: string
    full_name: string
    avatar_url: string
    bio: string
    user_type: string
  }
  artist?: {
    id: string
    full_name: string
    avatar_url: string
    specialties: string[]
  }
  studio?: {
    id: string
    full_name: string
    avatar_url: string
    services: string[]
  }
}

interface Offer {
  id: string
  message: string
  price: number
  estimated_duration: string
  status: string
  created_at: string
  profiles: {
    id: string
    full_name: string
    avatar_url: string
    user_type: string
    specialties?: string[]
    services?: string[]
  }
}

const STATUS_COLORS = {
  open: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
}

const STATUS_LABELS = {
  open: 'Abierta',
  in_progress: 'En Progreso',
  completed: 'Completada',
  cancelled: 'Cancelada'
}

const OFFER_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800'
}

const OFFER_STATUS_LABELS = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  withdrawn: 'Retirada'
}

export default function RequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [request, setRequest] = useState<TattooRequest | null>(null)
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    getCurrentUser()
    fetchRequest()
    fetchOffers()
  }, [params.id])

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const fetchRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('tattoo_requests')
        .select(`
          *,
          profiles!tattoo_requests_user_id_fkey (
            id,
            full_name,
            avatar_url,
            bio,
            user_type
          ),
          artist:profiles!tattoo_requests_artist_id_fkey (
            id,
            full_name,
            avatar_url,
            specialties
          ),
          studio:profiles!tattoo_requests_studio_id_fkey (
            id,
            full_name,
            avatar_url,
            services
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Error fetching request:', error)
        toast.error('Error al cargar la solicitud')
        return
      }

      setRequest(data)
    } catch (error) {
      console.error('Error fetching request:', error)
      toast.error('Error al cargar la solicitud')
    }
  }

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('tattoo_offers')
        .select(`
          *,
          profiles!tattoo_offers_artist_id_fkey (
            id,
            full_name,
            avatar_url,
            user_type,
            specialties,
            services
          )
        `)
        .eq('request_id', params.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching offers:', error)
        return
      }

      setOffers(data || [])
    } catch (error) {
      console.error('Error fetching offers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRequest = async () => {
    if (!request || !currentUser || request.user_id !== currentUser.id) return

    if (!confirm('¿Estás seguro de que quieres eliminar esta solicitud?')) return

    try {
      const response = await fetch(`/api/requests/${request.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error deleting request')
      }

      toast.success('Solicitud eliminada exitosamente')
      router.push('/requests')
    } catch (error) {
      console.error('Error deleting request:', error)
      toast.error('Error al eliminar la solicitud')
    }
  }

  const handleOfferAction = async (offerId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: action === 'accept' ? 'accepted' : 'rejected' })
      })

      if (!response.ok) {
        throw new Error('Error updating offer')
      }

      toast.success(`Oferta ${action === 'accept' ? 'aceptada' : 'rechazada'} exitosamente`)
      fetchOffers()
      fetchRequest()
    } catch (error) {
      console.error('Error updating offer:', error)
      toast.error('Error al actualizar la oferta')
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
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <Card>
            <CardContent className="p-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Solicitud no encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              La solicitud que buscas no existe o ha sido eliminada.
            </p>
            <Link href="/requests">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Solicitudes
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOwner = currentUser && request.user_id === currentUser.id
  const canEdit = isOwner && request.status === 'open'
  const canMakeOffer = currentUser && !isOwner && request.status === 'open'

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
          <p className="text-gray-600">Solicitud de tatuaje</p>
        </div>
        <Badge className={STATUS_COLORS[request.status as keyof typeof STATUS_COLORS]}>
          {STATUS_LABELS[request.status as keyof typeof STATUS_LABELS]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Detalles de la Solicitud</CardTitle>
                {canEdit && (
                  <div className="flex gap-2">
                    <Link href={`/requests/${request.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={handleDeleteRequest}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Descripción</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{request.description}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Estilo</p>
                    <p className="font-medium">{request.style}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Tamaño</p>
                    <p className="font-medium">{request.size}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Ubicación</p>
                    <p className="font-medium">{request.placement}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Euro className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Presupuesto</p>
                    <p className="font-medium">{formatBudget(request.budget_min, request.budget_max)}</p>
                  </div>
                </div>
                
                {request.preferred_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Fecha Preferida</p>
                      <p className="font-medium">
                        {new Date(request.preferred_date).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Preferred Artist/Studio */}
              {(request.artist || request.studio) && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">
                      {request.artist ? 'Artista Preferido' : 'Estudio Preferido'}
                    </h3>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={(request.artist || request.studio)?.avatar_url} />
                        <AvatarFallback>
                          {(request.artist || request.studio)?.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{(request.artist || request.studio)?.full_name}</p>
                        {request.artist?.specialties && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {request.artist.specialties.slice(0, 3).map((specialty, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {request.studio?.services && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {request.studio.services.slice(0, 3).map((service, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Reference Images */}
          {request.reference_images && request.reference_images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Imágenes de Referencia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {request.reference_images.map((image, index) => (
                    <Dialog key={index}>
                      <DialogTrigger asChild>
                        <div className="relative cursor-pointer group">
                          <img
                            src={image}
                            alt={`Reference ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg group-hover:opacity-75 transition-opacity"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <img
                          src={image}
                          alt={`Reference ${index + 1}`}
                          className="w-full h-auto max-h-[80vh] object-contain"
                        />
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Offers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Ofertas ({offers.length})
                </CardTitle>
                {canMakeOffer && (
                  <Link href={`/requests/${request.id}/offer`}>
                    <Button>
                      Hacer Oferta
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {offers.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay ofertas aún
                  </h3>
                  <p className="text-gray-600">
                    {canMakeOffer
                      ? 'Sé el primero en hacer una oferta para esta solicitud'
                      : 'Los artistas y estudios podrán hacer ofertas para esta solicitud'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {offers.map((offer) => (
                    <div key={offer.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={offer.profiles.avatar_url} />
                            <AvatarFallback>
                              {offer.profiles.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{offer.profiles.full_name}</p>
                            <p className="text-sm text-gray-500 capitalize">
                              {offer.profiles.user_type}
                            </p>
                            {(offer.profiles.specialties || offer.profiles.services) && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(offer.profiles.specialties || offer.profiles.services)?.slice(0, 2).map((item, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={OFFER_STATUS_COLORS[offer.status as keyof typeof OFFER_STATUS_COLORS]}>
                            {OFFER_STATUS_LABELS[offer.status as keyof typeof OFFER_STATUS_LABELS]}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(offer.created_at)}
                          </p>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-3">{offer.message}</p>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Euro className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">€{offer.price}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{offer.estimated_duration}</span>
                        </div>
                      </div>

                      {isOwner && offer.status === 'pending' && (
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            onClick={() => handleOfferAction(offer.id, 'accept')}
                          >
                            Aceptar Oferta
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOfferAction(offer.id, 'reject')}
                          >
                            Rechazar
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <Avatar>
                  <AvatarImage src={request.profiles.avatar_url} />
                  <AvatarFallback>
                    {request.profiles.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{request.profiles.full_name}</p>
                  <p className="text-sm text-gray-500 capitalize">
                    {request.profiles.user_type}
                  </p>
                </div>
              </div>
              {request.profiles.bio && (
                <p className="text-sm text-gray-600">{request.profiles.bio}</p>
              )}
            </CardContent>
          </Card>

          {/* Request Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Creada</p>
                  <p className="font-medium">{formatDate(request.created_at)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <MessageCircle className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Ofertas</p>
                  <p className="font-medium">{offers.length}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Estado</p>
                  <p className="font-medium">
                    {STATUS_LABELS[request.status as keyof typeof STATUS_LABELS]}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
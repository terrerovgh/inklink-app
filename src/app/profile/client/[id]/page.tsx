'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Star, Calendar, MessageCircle, Heart, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ClientProfile {
  id: string
  user_id: string
  bio?: string
  preferences: string[]
  budget_range?: string
  user: {
    id: string
    full_name: string
    avatar_url?: string
    location?: string
    created_at: string
  }
  requests: {
    id: string
    title: string
    description: string
    style: string
    budget: number
    status: string
    created_at: string
    offers_count: number
  }[]
  reviews_given: {
    id: string
    rating: number
    comment: string
    created_at: string
    artist: {
      user: {
        full_name: string
        avatar_url?: string
      }
    }
  }[]
  favorite_artists: {
    id: string
    user: {
      full_name: string
      avatar_url?: string
    }
    specialties: string[]
  }[]
}

export default function ClientProfilePage() {
  const params = useParams()
  const [client, setClient] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClientProfile = async () => {
      try {
        const response = await fetch(`/api/profiles?user_id=${params.id}&type=client`)
        const data = await response.json()

        if (data.success && data.data.type === 'client') {
          setClient(data.data.profile)
        } else {
          setError('Perfil de cliente no encontrado')
        }
      } catch (err) {
        console.error('Error fetching client profile:', err)
        setError('Error al cargar el perfil')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchClientProfile()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Perfil no encontrado</h1>
          <p className="text-gray-600 mb-6">{error || 'El perfil que buscas no existe'}</p>
          <Link href="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </div>
    )
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-gray-600 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activa'
      case 'completed':
        return 'Completada'
      case 'cancelled':
        return 'Cancelada'
      default:
        return 'Pendiente'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={client.user.avatar_url} alt={client.user.full_name} />
              <AvatarFallback className="text-2xl">
                {client.user.full_name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{client.user.full_name}</h1>
              
              {client.user.location && (
                <div className="flex items-center gap-1 text-gray-600 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{client.user.location}</span>
                </div>
              )}
              
              {client.preferences.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {client.preferences.map((preference, index) => (
                    <Badge key={index} variant="secondary">{preference}</Badge>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Miembro desde {new Date(client.user.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long'
                  })}</span>
                </div>
                
                {client.budget_range && (
                  <div className="flex items-center gap-1">
                    <span>Presupuesto: {client.budget_range}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                <MessageCircle className="w-4 h-4 mr-2" />
                Enviar Mensaje
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="about">Acerca de</TabsTrigger>
            <TabsTrigger value="requests">Solicitudes</TabsTrigger>
            <TabsTrigger value="reviews">Reseñas Dadas</TabsTrigger>
            <TabsTrigger value="favorites">Favoritos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>Acerca del Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {client.bio || 'Este cliente aún no ha agregado una biografía.'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="requests">
            <div className="space-y-6">
              {client.requests.length > 0 ? (
                client.requests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{request.title}</h3>
                          <p className="text-gray-600 mb-3">{request.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <Badge variant="outline">{request.style}</Badge>
                            <span>Presupuesto: ${request.budget}</span>
                            <span>{request.offers_count} ofertas</span>
                            <span>{new Date(request.created_at).toLocaleDateString('es-ES')}</span>
                          </div>
                        </div>
                        
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          getStatusColor(request.status)
                        }`}>
                          {getStatusText(request.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Este cliente aún no ha creado solicitudes de tatuaje.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="reviews">
            <div className="space-y-6">
              {client.reviews_given.length > 0 ? (
                client.reviews_given.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={review.artist.user.avatar_url} alt={review.artist.user.full_name} />
                          <AvatarFallback>
                            {review.artist.user.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">Reseña para {review.artist.user.full_name}</h4>
                            <div className="flex items-center gap-1">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          
                          <p className="text-gray-700 mb-2">{review.comment}</p>
                          
                          <p className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Este cliente aún no ha dado reseñas.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="favorites">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {client.favorite_artists.length > 0 ? (
                client.favorite_artists.map((artist) => (
                  <Card key={artist.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar>
                          <AvatarImage src={artist.user.avatar_url} alt={artist.user.full_name} />
                          <AvatarFallback>
                            {artist.user.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{artist.user.full_name}</h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {artist.specialties.slice(0, 2).map((specialty, index) => (
                              <Badge key={index} variant="outline" className="text-xs">{specialty}</Badge>
                            ))}
                          </div>
                        </div>
                        
                        <Heart className="w-5 h-5 text-red-500 fill-current" />
                      </div>
                      
                      <Link href={`/profile/artist/${artist.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          Ver Perfil
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">Este cliente aún no ha marcado artistas como favoritos.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
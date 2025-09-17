'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Star, Clock, Phone, Mail, Instagram, Globe, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface StudioProfile {
  id: string
  user_id: string
  name: string
  description: string
  services: string[]
  opening_hours: Record<string, string>
  contact_phone?: string
  contact_email?: string
  instagram_url?: string
  website_url?: string
  rating: number
  total_reviews: number
  user: {
    id: string
    full_name: string
    avatar_url?: string
    location?: string
    created_at: string
  }
  portfolio_items: {
    id: string
    title: string
    description?: string
    image_url: string
    style: string
    created_at: string
  }[]
  reviews: {
    id: string
    rating: number
    comment: string
    created_at: string
    user: {
      full_name: string
      avatar_url?: string
    }
  }[]
}

const DAYS_OF_WEEK = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
}

export default function StudioProfilePage() {
  const params = useParams()
  const [studio, setStudio] = useState<StudioProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStudioProfile = async () => {
      try {
        const response = await fetch(`/api/profiles?user_id=${params.id}&type=studio`)
        const data = await response.json()

        if (data.success && data.data.type === 'studio') {
          setStudio(data.data.profile)
        } else {
          setError('Perfil de estudio no encontrado')
        }
      } catch (err) {
        console.error('Error fetching studio profile:', err)
        setError('Error al cargar el perfil')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchStudioProfile()
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

  if (error || !studio) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={studio.user.avatar_url} alt={studio.name} />
              <AvatarFallback className="text-2xl">
                {studio.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{studio.name}</h1>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {renderStars(studio.rating)}
                  <span className="text-sm text-gray-600 ml-1">
                    {studio.rating.toFixed(1)} ({studio.total_reviews} reseñas)
                  </span>
                </div>
                
                {studio.user.location && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{studio.user.location}</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {studio.services.map((service, index) => (
                  <Badge key={index} variant="secondary">{service}</Badge>
                ))}
              </div>
              
              <div className="flex items-center gap-6 text-sm text-gray-600">
                {studio.contact_phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    <span>{studio.contact_phone}</span>
                  </div>
                )}
                
                {studio.contact_email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>{studio.contact_email}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                Contactar Estudio
              </Button>
              
              <div className="flex gap-2">
                {studio.instagram_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={studio.instagram_url} target="_blank" rel="noopener noreferrer">
                      <Instagram className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                
                {studio.website_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={studio.website_url} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="about">Acerca de</TabsTrigger>
            <TabsTrigger value="portfolio">Galería</TabsTrigger>
            <TabsTrigger value="hours">Horarios</TabsTrigger>
            <TabsTrigger value="reviews">Reseñas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>Acerca del Estudio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {studio.description || 'Este estudio aún no ha agregado una descripción.'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="portfolio">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studio.portfolio_items.length > 0 ? (
                studio.portfolio_items.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="aspect-square relative">
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      <Badge variant="outline" className="text-xs">{item.style}</Badge>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">Este estudio aún no ha subido trabajos a su galería.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="hours">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Horarios de Atención
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(DAYS_OF_WEEK).map(([key, day]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <span className="font-medium text-gray-900">{day}</span>
                      <span className="text-gray-600">
                        {studio.opening_hours[key] || 'Cerrado'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviews">
            <div className="space-y-6">
              {studio.reviews.length > 0 ? (
                studio.reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={review.user.avatar_url} alt={review.user.full_name} />
                          <AvatarFallback>
                            {review.user.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{review.user.full_name}</h4>
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
                  <p className="text-gray-500">Este estudio aún no tiene reseñas.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
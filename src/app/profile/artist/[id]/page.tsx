'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Star, Clock, DollarSign, Instagram, Globe, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ArtistProfile {
  id: string
  user_id: string
  bio: string
  specialties: string[]
  experience_years: number
  hourly_rate: number
  availability: boolean
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

export default function ArtistProfilePage() {
  const params = useParams()
  const [artist, setArtist] = useState<ArtistProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchArtistProfile = async () => {
      try {
        const response = await fetch(`/api/profiles?user_id=${params.id}&type=artist`)
        const data = await response.json()

        if (data.success && data.data.type === 'artist') {
          setArtist(data.data.profile)
        } else {
          setError('Perfil de artista no encontrado')
        }
      } catch (err) {
        console.error('Error fetching artist profile:', err)
        setError('Error al cargar el perfil')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchArtistProfile()
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

  if (error || !artist) {
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
              <AvatarImage src={artist.user.avatar_url} alt={artist.user.full_name} />
              <AvatarFallback className="text-2xl">
                {artist.user.full_name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{artist.user.full_name}</h1>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {renderStars(artist.rating)}
                  <span className="text-sm text-gray-600 ml-1">
                    {artist.rating.toFixed(1)} ({artist.total_reviews} reseñas)
                  </span>
                </div>
                
                {artist.user.location && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{artist.user.location}</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {artist.specialties.map((specialty, index) => (
                  <Badge key={index} variant="secondary">{specialty}</Badge>
                ))}
              </div>
              
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{artist.experience_years} años de experiencia</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span>${artist.hourly_rate}/hora</span>
                </div>
                
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  artist.availability 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {artist.availability ? 'Disponible' : 'No disponible'}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                Contactar Artista
              </Button>
              
              <div className="flex gap-2">
                {artist.instagram_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={artist.instagram_url} target="_blank" rel="noopener noreferrer">
                      <Instagram className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                
                {artist.website_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={artist.website_url} target="_blank" rel="noopener noreferrer">
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="about">Acerca de</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="reviews">Reseñas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>Acerca del Artista</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {artist.bio || 'Este artista aún no ha agregado una biografía.'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="portfolio">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artist.portfolio_items.length > 0 ? (
                artist.portfolio_items.map((item) => (
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
                  <p className="text-gray-500">Este artista aún no ha subido trabajos a su portfolio.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="reviews">
            <div className="space-y-6">
              {artist.reviews.length > 0 ? (
                artist.reviews.map((review) => (
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
                  <p className="text-gray-500">Este artista aún no tiene reseñas.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
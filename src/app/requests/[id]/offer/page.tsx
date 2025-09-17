'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Euro, Clock, MessageCircle, MapPin, Palette, Ruler } from 'lucide-react'
import { toast } from 'sonner'

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
  reference_images: string[]
  profiles: {
    id: string
    full_name: string
    avatar_url: string
  }
}

interface UserProfile {
  id: string
  full_name: string
  avatar_url: string
  user_type: string
  specialties?: string[]
  services?: string[]
  bio?: string
}

export default function MakeOfferPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [request, setRequest] = useState<TattooRequest | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    message: '',
    price: '',
    estimated_duration: ''
  })

  useEffect(() => {
    fetchData()
  }, [params.id])

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
        toast.error('Solo artistas y estudios pueden hacer ofertas')
        router.back()
        return
      }

      setUserProfile(profileData)

      // Fetch request
      const { data: requestData, error } = await supabase
        .from('tattoo_requests')
        .select(`
          *,
          profiles!tattoo_requests_user_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Error fetching request:', error)
        toast.error('Error al cargar la solicitud')
        router.back()
        return
      }

      if (requestData.status !== 'open') {
        toast.error('Esta solicitud ya no está abierta para ofertas')
        router.back()
        return
      }

      if (requestData.user_id === user.id) {
        toast.error('No puedes hacer ofertas en tus propias solicitudes')
        router.back()
        return
      }

      // Check if user already made an offer
      const { data: existingOffer } = await supabase
        .from('tattoo_offers')
        .select('id')
        .eq('request_id', params.id)
        .eq('artist_id', user.id)
        .single()

      if (existingOffer) {
        toast.error('Ya has hecho una oferta para esta solicitud')
        router.back()
        return
      }

      setRequest(requestData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar los datos')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.message || !formData.price || !formData.estimated_duration) {
      toast.error('Por favor completa todos los campos')
      return
    }

    const price = parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      toast.error('Por favor ingresa un precio válido')
      return
    }

    setSubmitting(true)
    
    try {
      const offerData = {
        request_id: params.id,
        message: formData.message,
        price: price,
        estimated_duration: formData.estimated_duration
      }

      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(offerData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error creating offer')
      }

      const { offer } = await response.json()
      toast.success('Oferta enviada exitosamente')
      router.push(`/requests/${params.id}`)
    } catch (error) {
      console.error('Error creating offer:', error)
      toast.error(error instanceof Error ? error.message : 'Error al enviar la oferta')
    } finally {
      setSubmitting(false)
    }
  }

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Presupuesto abierto'
    if (min && max) return `€${min} - €${max}`
    if (min) return `Desde €${min}`
    if (max) return `Hasta €${max}`
    return 'Presupuesto abierto'
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

  if (!request || !userProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se puede hacer la oferta
            </h3>
            <p className="text-gray-600 mb-4">
              La solicitud no existe o no tienes permisos para hacer ofertas.
            </p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hacer Oferta</h1>
          <p className="text-gray-600">Envía tu propuesta para esta solicitud de tatuaje</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tu Oferta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="message">Mensaje de la oferta *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Describe tu propuesta, experiencia con este tipo de tatuajes, proceso de trabajo, etc."
                    rows={6}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Explica por qué eres la mejor opción para este proyecto
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Precio (€) *</Label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="500"
                        className="pl-10"
                        min="1"
                        step="0.01"
                        required
                      />
                    </div>
                    {request.budget_min && request.budget_max && (
                      <p className="text-sm text-gray-500 mt-1">
                        Presupuesto del cliente: €{request.budget_min} - €{request.budget_max}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="estimated_duration">Duración estimada *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="estimated_duration"
                        value={formData.estimated_duration}
                        onChange={(e) => handleInputChange('estimated_duration', e.target.value)}
                        placeholder="2-3 sesiones de 4 horas"
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Ej: "1 sesión de 3 horas" o "2-3 sesiones de 4 horas cada una"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tu Perfil</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={userProfile.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {userProfile.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{userProfile.full_name}</h3>
                    <p className="text-gray-600 capitalize">{userProfile.user_type}</p>
                  </div>
                </div>

                {(userProfile.specialties || userProfile.services) && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {userProfile.user_type === 'artist' ? 'Especialidades' : 'Servicios'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(userProfile.specialties || userProfile.services)?.map((item, index) => (
                        <Badge key={index} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {userProfile.bio && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Biografía</p>
                    <p className="text-sm text-gray-600">{userProfile.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? 'Enviando...' : 'Enviar Oferta'}
              </Button>
            </div>
          </form>
        </div>

        {/* Request Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Solicitud</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">{request.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-3">{request.description}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Palette className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Estilo:</span>
                  <Badge variant="secondary">{request.style}</Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Ruler className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Tamaño:</span>
                  <Badge variant="outline">{request.size}</Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Ubicación:</span>
                  <Badge variant="outline">{request.placement}</Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Euro className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Presupuesto:</span>
                  <span className="font-medium">
                    {formatBudget(request.budget_min, request.budget_max)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={request.profiles.avatar_url} />
                  <AvatarFallback>
                    {request.profiles.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{request.profiles.full_name}</p>
                  <p className="text-sm text-gray-500">Cliente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {request.reference_images && request.reference_images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Referencias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {request.reference_images.slice(0, 4).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Reference ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                  ))}
                  {request.reference_images.length > 4 && (
                    <div className="w-full h-20 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-600">
                      +{request.reference_images.length - 4} más
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
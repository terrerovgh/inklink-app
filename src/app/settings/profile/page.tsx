'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Camera, X, Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface UserProfile {
  id: string
  user_id: string
  user_type: 'client' | 'artist' | 'studio'
  full_name: string
  email: string
  bio?: string
  location?: string
  avatar_url?: string
  specialties?: string[]
  services?: string[]
  contact_phone?: string
  contact_email?: string
  instagram_url?: string
  website_url?: string
  opening_hours?: Record<string, string>
}

const TATTOO_STYLES = [
  'Realismo', 'Traditional', 'Neo-traditional', 'Blackwork', 'Dotwork',
  'Watercolor', 'Geometric', 'Minimalist', 'Japanese', 'Tribal',
  'Biomecánico', 'Surrealismo', 'Lettering', 'Ornamental', 'Fine Line'
]

const STUDIO_SERVICES = [
  'Tatuajes personalizados', 'Flash tattoos', 'Cover-ups', 'Restauración',
  'Piercings', 'Microdermal', 'Consultas de diseño', 'Tatuajes temporales',
  'Eliminación láser', 'Cuidado post-tatuaje'
]

const DAYS_OF_WEEK = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
}

export default function ProfileSettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newSpecialty, setNewSpecialty] = useState('')
  const [newService, setNewService] = useState('')
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
      await fetchUserProfile(user.id)
    }

    getUser()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select(`
          *,
          artist_profiles(*),
          studio_profiles(*)
        `)
        .eq('id', userId)
        .single()

      if (userData) {
        const userType = userData.artist_profiles ? 'artist' : 
                        userData.studio_profiles ? 'studio' : 'client'
        
        const profileInfo = userData.artist_profiles || userData.studio_profiles
        
        setProfile({
          id: profileInfo?.id || '',
          user_id: userId,
          user_type: userType,
          full_name: userData.full_name,
          email: userData.email,
          bio: profileInfo?.bio,
          location: userData.location,
          avatar_url: userData.avatar_url,
          specialties: profileInfo?.specialties || [],
          services: profileInfo?.services || [],
          contact_phone: profileInfo?.contact_phone,
          contact_email: profileInfo?.contact_email,
          instagram_url: profileInfo?.instagram_url,
          website_url: profileInfo?.website_url,
          opening_hours: profileInfo?.opening_hours || {}
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Error al cargar el perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    if (!profile) return
    setProfile({ ...profile, [field]: value })
  }

  const handleOpeningHoursChange = (day: string, hours: string) => {
    if (!profile) return
    setProfile({
      ...profile,
      opening_hours: {
        ...profile.opening_hours,
        [day]: hours
      }
    })
  }

  const addSpecialty = () => {
    if (!profile || !newSpecialty.trim()) return
    
    const specialties = profile.specialties || []
    if (!specialties.includes(newSpecialty.trim())) {
      setProfile({
        ...profile,
        specialties: [...specialties, newSpecialty.trim()]
      })
    }
    setNewSpecialty('')
  }

  const removeSpecialty = (specialty: string) => {
    if (!profile) return
    setProfile({
      ...profile,
      specialties: (profile.specialties || []).filter(s => s !== specialty)
    })
  }

  const addService = () => {
    if (!profile || !newService.trim()) return
    
    const services = profile.services || []
    if (!services.includes(newService.trim())) {
      setProfile({
        ...profile,
        services: [...services, newService.trim()]
      })
    }
    setNewService('')
  }

  const removeService = (service: string) => {
    if (!profile) return
    setProfile({
      ...profile,
      services: (profile.services || []).filter(s => s !== service)
    })
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    try {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no puede ser mayor a 5MB')
        return
      }

      const { uploadFile } = await import('@/lib/supabase/client')
      const avatarUrl = await uploadFile(file, 'avatars')

      handleInputChange('avatar_url', avatarUrl)
      toast.success('Avatar subido correctamente')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Error al subir el avatar')
    }
  }

  const handleSave = async () => {
    if (!profile || !user) return

    setSaving(true)
    try {
      // Update user table
      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name: profile.full_name,
          location: profile.location,
          avatar_url: profile.avatar_url
        })
        .eq('id', user.id)

      if (userError) throw userError

      // Update profile table based on user type
      if (profile.user_type === 'artist' && profile.id) {
        const { error: profileError } = await supabase
          .from('artist_profiles')
          .update({
            bio: profile.bio,
            specialties: profile.specialties,
            contact_phone: profile.contact_phone,
            contact_email: profile.contact_email,
            instagram_url: profile.instagram_url,
            website_url: profile.website_url
          })
          .eq('id', profile.id)

        if (profileError) throw profileError
      } else if (profile.user_type === 'studio' && profile.id) {
        const { error: profileError } = await supabase
          .from('studio_profiles')
          .update({
            bio: profile.bio,
            services: profile.services,
            opening_hours: profile.opening_hours,
            contact_phone: profile.contact_phone,
            contact_email: profile.contact_email,
            instagram_url: profile.instagram_url,
            website_url: profile.website_url
          })
          .eq('id', profile.id)

        if (profileError) throw profileError
      }

      toast.success('Perfil actualizado correctamente')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Error al guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Perfil no encontrado</h1>
          <Button onClick={() => router.push('/dashboard')}>Volver al Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Link>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Configuración del Perfil</h1>
            </div>
            
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                  <AvatarFallback className="text-2xl">
                    {profile.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                      <Camera className="w-4 h-4" />
                      Cambiar Avatar
                    </div>
                  </Label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <p className="text-sm text-gray-500 mt-1">JPG, PNG o GIF. Máximo 5MB.</p>
                </div>
              </div>
              
              {/* Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Nombre Completo</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Tu nombre completo"
                  />
                </div>
                
                <div>
                  <Label htmlFor="location">Ubicación</Label>
                  <Input
                    id="location"
                    value={profile.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Ciudad, País"
                  />
                </div>
              </div>
              
              {/* Bio */}
              <div>
                <Label htmlFor="bio">Biografía</Label>
                <Textarea
                  id="bio"
                  value={profile.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Cuéntanos sobre ti..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_phone">Teléfono</Label>
                  <Input
                    id="contact_phone"
                    value={profile.contact_phone || ''}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                
                <div>
                  <Label htmlFor="contact_email">Email de Contacto</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={profile.contact_email || ''}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="contacto@ejemplo.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="instagram_url">Instagram</Label>
                  <Input
                    id="instagram_url"
                    value={profile.instagram_url || ''}
                    onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                    placeholder="https://instagram.com/tu_usuario"
                  />
                </div>
                
                <div>
                  <Label htmlFor="website_url">Sitio Web</Label>
                  <Input
                    id="website_url"
                    value={profile.website_url || ''}
                    onChange={(e) => handleInputChange('website_url', e.target.value)}
                    placeholder="https://tu-sitio.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Artist Specialties */}
          {profile.user_type === 'artist' && (
            <Card>
              <CardHeader>
                <CardTitle>Especialidades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(profile.specialties || []).map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {specialty}
                      <button
                        onClick={() => removeSpecialty(specialty)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Select value={newSpecialty} onValueChange={setNewSpecialty}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar especialidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {TATTOO_STYLES.filter(style => !(profile.specialties || []).includes(style)).map((style) => (
                        <SelectItem key={style} value={style}>{style}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={addSpecialty} disabled={!newSpecialty}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Studio Services */}
          {profile.user_type === 'studio' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Servicios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {(profile.services || []).map((service, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {service}
                        <button
                          onClick={() => removeService(service)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Select value={newService} onValueChange={setNewService}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {STUDIO_SERVICES.filter(service => !(profile.services || []).includes(service)).map((service) => (
                          <SelectItem key={service} value={service}>{service}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={addService} disabled={!newService}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Opening Hours */}
              <Card>
                <CardHeader>
                  <CardTitle>Horarios de Atención</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(DAYS_OF_WEEK).map(([key, day]) => (
                    <div key={key} className="flex items-center gap-4">
                      <div className="w-24">
                        <Label>{day}</Label>
                      </div>
                      <Input
                        value={profile.opening_hours?.[key] || ''}
                        onChange={(e) => handleOpeningHoursChange(key, e.target.value)}
                        placeholder="09:00 - 18:00 o 'Cerrado'"
                        className="flex-1"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
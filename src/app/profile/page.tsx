'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ErrorMessage } from '@/components/auth/ErrorMessage'
import { 
  ArrowLeft,
  Save,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Star,
  Camera,
  Edit3
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  fullName: string
  email: string
  phone: string
  location: string
  bio: string
  userType: 'client' | 'artist' | 'studio'
  avatar?: string
  createdAt: string
  specialties?: string[]
  experience?: string
  portfolio?: string[]
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [editData, setEditData] = useState({
    fullName: '',
    phone: '',
    location: '',
    bio: '',
    specialties: [] as string[],
    experience: ''
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }
    
    if (user) {
      const userProfile: UserProfile = {
        id: user.id,
        fullName: user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        location: user.user_metadata?.location || '',
        bio: user.user_metadata?.bio || '',
        userType: user.user_metadata?.user_type || 'client',
        createdAt: user.created_at || '',
        specialties: user.user_metadata?.specialties || [],
        experience: user.user_metadata?.experience || '',
        portfolio: user.user_metadata?.portfolio || []
      }
      
      setProfile(userProfile)
      setEditData({
        fullName: userProfile.fullName,
        phone: userProfile.phone,
        location: userProfile.location,
        bio: userProfile.bio,
        specialties: userProfile.specialties || [],
        experience: userProfile.experience || ''
      })
    }
  }, [user, loading, router])

  const handleSave = async () => {
    setError(null)
    setSuccess(null)
    setSaving(true)
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: editData.fullName,
          phone: editData.phone,
          location: editData.location,
          bio: editData.bio,
          specialties: editData.specialties,
          experience: editData.experience
        }
      })
      
      if (updateError) throw updateError
      
      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          fullName: editData.fullName,
          phone: editData.phone,
          location: editData.location,
          bio: editData.bio,
          specialties: editData.specialties,
          experience: editData.experience
        })
      }
      
      setEditing(false)
      setSuccess('Perfil actualizado correctamente')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setError('Error al actualizar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setEditData({
        fullName: profile.fullName,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
        specialties: profile.specialties || [],
        experience: profile.experience || ''
      })
    }
    setEditing(false)
    setError(null)
  }

  const addSpecialty = (specialty: string) => {
    if (specialty.trim() && !editData.specialties.includes(specialty.trim())) {
      setEditData(prev => ({
        ...prev,
        specialties: [...prev.specialties, specialty.trim()]
      }))
    }
  }

  const removeSpecialty = (specialty: string) => {
    setEditData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-black">Mi Perfil</h1>
                <p className="text-gray-600">Gestiona tu información personal</p>
              </div>
            </div>
            
            {!editing ? (
              <Button onClick={() => setEditing(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Editar perfil
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Success/Error Messages */}
          {error && <ErrorMessage message={error} />}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                    {profile.avatar ? (
                      <img 
                        src={profile.avatar} 
                        alt={profile.fullName}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-gray-600" />
                    )}
                  </div>
                  {editing && (
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {/* Basic Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold text-black">{profile.fullName}</h2>
                    <Badge variant="outline" className="capitalize">
                      {profile.userType}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-gray-600">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {profile.email}
                    </div>
                    
                    {profile.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        {profile.phone}
                      </div>
                    )}
                    
                    {profile.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {profile.location}
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Miembro desde {new Date(profile.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div>
                      <Label htmlFor="fullName">Nombre completo</Label>
                      <Input
                        id="fullName"
                        value={editData.fullName}
                        onChange={(e) => setEditData(prev => ({ ...prev, fullName: e.target.value }))}
                        className="border-gray-300 focus:border-black focus:ring-black"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={editData.phone}
                        onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                        className="border-gray-300 focus:border-black focus:ring-black"
                        placeholder="+34 600 000 000"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="location">Ubicación</Label>
                      <Input
                        id="location"
                        value={editData.location}
                        onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                        className="border-gray-300 focus:border-black focus:ring-black"
                        placeholder="Ciudad, País"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label>Nombre completo</Label>
                      <p className="text-gray-900">{profile.fullName || 'No especificado'}</p>
                    </div>
                    
                    <div>
                      <Label>Teléfono</Label>
                      <p className="text-gray-900">{profile.phone || 'No especificado'}</p>
                    </div>
                    
                    <div>
                      <Label>Ubicación</Label>
                      <p className="text-gray-900">{profile.location || 'No especificado'}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Bio & Specialties */}
            <Card>
              <CardHeader>
                <CardTitle>Sobre mí</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div>
                      <Label htmlFor="bio">Biografía</Label>
                      <Textarea
                        id="bio"
                        value={editData.bio}
                        onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                        className="border-gray-300 focus:border-black focus:ring-black"
                        placeholder="Cuéntanos sobre ti..."
                        rows={4}
                      />
                    </div>
                    
                    {profile.userType === 'artist' && (
                      <>
                        <div>
                          <Label htmlFor="experience">Experiencia</Label>
                          <Input
                            id="experience"
                            value={editData.experience}
                            onChange={(e) => setEditData(prev => ({ ...prev, experience: e.target.value }))}
                            className="border-gray-300 focus:border-black focus:ring-black"
                            placeholder="Ej: 5 años de experiencia"
                          />
                        </div>
                        
                        <div>
                          <Label>Especialidades</Label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {editData.specialties.map((specialty, index) => (
                              <Badge 
                                key={index} 
                                variant="secondary" 
                                className="cursor-pointer"
                                onClick={() => removeSpecialty(specialty)}
                              >
                                {specialty} ×
                              </Badge>
                            ))}
                          </div>
                          <Input
                            placeholder="Agregar especialidad (presiona Enter)"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                addSpecialty(e.currentTarget.value)
                                e.currentTarget.value = ''
                              }
                            }}
                            className="border-gray-300 focus:border-black focus:ring-black"
                          />
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <Label>Biografía</Label>
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {profile.bio || 'No hay biografía disponible'}
                      </p>
                    </div>
                    
                    {profile.userType === 'artist' && (
                      <>
                        {profile.experience && (
                          <div>
                            <Label>Experiencia</Label>
                            <p className="text-gray-900">{profile.experience}</p>
                          </div>
                        )}
                        
                        {profile.specialties && profile.specialties.length > 0 && (
                          <div>
                            <Label>Especialidades</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {profile.specialties.map((specialty, index) => (
                                <Badge key={index} variant="secondary">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { User, MapPin } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

type UserType = 'client' | 'artist' | 'studio'

export default function CompleteProfilePage() {
  const [formData, setFormData] = useState({
    fullName: '',
    userType: 'client' as UserType,
    location: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
    
    // Pre-fill name from OAuth if available
    if (user?.user_metadata?.full_name) {
      setFormData(prev => ({
        ...prev,
        fullName: user.user_metadata.full_name
      }))
    }
  }, [user, loading, router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName) {
      newErrors.fullName = 'El nombre completo es requerido'
    }

    if (!formData.location) {
      newErrors.location = 'La ubicación es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !user) {
      return
    }

    setIsLoading(true)

    try {
      // Create user profile in the database
      const { error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: formData.fullName,
          user_type: formData.userType,
          location: formData.location,
          avatar_url: user.user_metadata?.avatar_url || null
        })

      if (error) {
        console.error('Profile creation error:', error)
        toast.error('Error al crear el perfil')
        return
      }

      toast.success('¡Perfil completado exitosamente!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('Error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  const userTypes = [
    { value: 'client', label: 'Cliente', description: 'Busco artistas para mis tatuajes' },
    { value: 'artist', label: 'Artista', description: 'Soy un tatuador independiente' },
    { value: 'studio', label: 'Estudio', description: 'Represento un estudio de tatuajes' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Completa tu perfil
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Solo necesitamos algunos datos más para configurar tu cuenta
          </p>
        </div>

        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>Información del perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Type Selection */}
              <div>
                <Label>Tipo de usuario</Label>
                <div className="mt-2 space-y-2">
                  {userTypes.map((type) => (
                    <div
                      key={type.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.userType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleInputChange('userType', type.value)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="userType"
                              value={type.value}
                              checked={formData.userType === type.value}
                              onChange={() => handleInputChange('userType', type.value)}
                              className="text-blue-600"
                            />
                            <span className="font-medium text-gray-900">{type.label}</span>
                          </div>
                          <p className="text-sm text-gray-600 ml-6">{type.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <Label htmlFor="fullName">Nombre completo</Label>
                <div className="mt-1 relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    className={`pl-10 ${errors.fullName ? 'border-red-500' : ''}`}
                    placeholder="Tu nombre completo"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">Ubicación</Label>
                <div className="mt-1 relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    required
                    className={`pl-10 ${errors.location ? 'border-red-500' : ''}`}
                    placeholder="Ciudad, País"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                </div>
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Completando perfil...' : 'Completar perfil'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ErrorMessage } from '@/components/auth/ErrorMessage'
import { 
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Bell,
  Shield,
  Trash2
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface ProfileData {
  fullName: string
  email: string
  phone: string
  location: string
  bio: string
  userType: 'client' | 'artist' | 'studio'
}

interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
}

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    userType: 'client'
  })
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }
    
    if (user) {
      setProfileData({
        fullName: user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        location: user.user_metadata?.location || '',
        bio: user.user_metadata?.bio || '',
        userType: user.user_metadata?.user_type || 'client'
      })
    }
  }, [user, loading, router])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.fullName,
          phone: profileData.phone,
          location: profileData.location,
          bio: profileData.bio,
          user_type: profileData.userType
        }
      })
      
      if (updateError) throw updateError
      
      setSuccess('Perfil actualizado correctamente')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setError('Error al actualizar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordReset = async () => {
    setError(null)
    setSuccess(null)
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user?.email || '')
      if (error) throw error
      
      setSuccess('Se ha enviado un enlace de restablecimiento a tu email')
    } catch (error: any) {
      console.error('Error sending password reset:', error)
      setError('Error al enviar el enlace de restablecimiento')
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
      return
    }
    
    setError('La eliminación de cuenta debe ser implementada en el backend')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
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
              <h1 className="text-2xl font-bold text-black">Configuración</h1>
              <p className="text-gray-600">Gestiona tu perfil y preferencias</p>
            </div>
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

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Información del perfil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="fullName">Nombre completo</Label>
                    <Input
                      id="fullName"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="border-gray-300 focus:border-black focus:ring-black"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="border-gray-300 bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">El email no se puede cambiar</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      className="border-gray-300 focus:border-black focus:ring-black"
                      placeholder="+34 600 000 000"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="location">Ubicación</Label>
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                      className="border-gray-300 focus:border-black focus:ring-black"
                      placeholder="Ciudad, País"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="userType">Tipo de usuario</Label>
                    <Select
                      value={profileData.userType}
                      onValueChange={(value: 'client' | 'artist' | 'studio') => 
                        setProfileData(prev => ({ ...prev, userType: value }))
                      }
                    >
                      <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Cliente</SelectItem>
                        <SelectItem value="artist">Artista</SelectItem>
                        <SelectItem value="studio">Estudio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="bio">Biografía</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    className="border-gray-300 focus:border-black focus:ring-black"
                    placeholder="Cuéntanos sobre ti..."
                    rows={4}
                  />
                </div>
                
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificaciones por email</Label>
                  <p className="text-sm text-gray-600">Recibe notificaciones importantes por email</p>
                </div>
                <Switch
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificaciones push</Label>
                  <p className="text-sm text-gray-600">Recibe notificaciones en tiempo real</p>
                </div>
                <Switch
                  checked={notifications.pushNotifications}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, pushNotifications: checked }))
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Emails de marketing</Label>
                  <p className="text-sm text-gray-600">Recibe ofertas y novedades</p>
                </div>
                <Switch
                  checked={notifications.marketingEmails}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, marketingEmails: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Cambiar contraseña</Label>
                <p className="text-sm text-gray-600 mb-3">
                  Te enviaremos un enlace para restablecer tu contraseña
                </p>
                <Button variant="outline" onClick={handlePasswordReset}>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar enlace de restablecimiento
                </Button>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-red-600">Zona de peligro</Label>
                <p className="text-sm text-gray-600 mb-3">
                  Eliminar tu cuenta de forma permanente
                </p>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar cuenta
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
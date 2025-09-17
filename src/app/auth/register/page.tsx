'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { ErrorMessage, formatAuthError } from '@/components/auth/ErrorMessage'
import { validateRegisterForm, validateField, type RegisterFormData } from '@/lib/validation/auth'
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Chrome, Facebook } from 'lucide-react'

type UserType = 'client' | 'artist' | 'studio'

export default function RegisterPage() {
  const router = useRouter()
  const { signUp, signInWithGoogle, signInWithFacebook } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    userType: 'client',
    phone: '',
    location: ''
  })

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    
    // Real-time validation for certain fields
    if (field === 'email' || field === 'password' || field === 'confirmPassword') {
      const fieldError = validateField(field, value, formData)
      if (fieldError) {
        setFieldErrors(prev => ({ ...prev, [field]: fieldError }))
      }
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    
    // Validate form
    const validation = validateRegisterForm(formData)
    if (!validation.isValid) {
      setFieldErrors(validation.errors)
      return
    }
    
    setLoading(true)
    
    try {
      await signUp(
        formData.email,
        formData.password,
        {
          full_name: formData.fullName,
          user_type: formData.userType,
          phone: formData.phone,
          location: formData.location
        }
      )
      
      // Redirect to dashboard or show success message
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Registration error:', error)
      setError(formatAuthError(error))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    setError(null)
    setLoading(true)
    
    try {
      await signInWithGoogle()
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Google registration error:', error)
      setError(formatAuthError(error))
    } finally {
      setLoading(false)
    }
  }

  const handleFacebookRegister = async () => {
    setError(null)
    setLoading(true)
    
    try {
      await signInWithFacebook()
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Facebook registration error:', error)
      setError(formatAuthError(error))
    } finally {
      setLoading(false)
    }
  }

  const userTypes = [
    { value: 'client', label: 'Cliente', description: 'Busco artistas para mis tatuajes' },
    { value: 'artist', label: 'Artista', description: 'Soy un tatuador independiente' },
    { value: 'studio', label: 'Estudio', description: 'Represento un estudio de tatuajes' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            InkLink
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Crea tu cuenta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="font-medium text-white dark:text-white hover:text-black dark:hover:text-black">
              Inicia sesión aquí
            </Link>
          </p>
        </div>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Registro</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <ErrorMessage message={error} />}
            
            <form onSubmit={handleRegister} className="space-y-6">
              {/* User Type Selection */}
              <div>
                <Label className="text-black font-medium">Tipo de usuario</Label>
                <div className="mt-2 space-y-2">
                  {userTypes.map((type) => (
                    <div
                      key={type.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.userType === type.value
                          ? 'border-black bg-gray-50'
                          : 'border-gray-300 hover:border-black'
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
                              className="text-black focus:ring-black"
                            />
                            <span className="font-medium text-black">{type.label}</span>
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
                <Label htmlFor="fullName" className="text-black font-medium">Nombre completo</Label>
                <div className="mt-2 relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    className={`pl-10 border-gray-300 focus:border-black focus:ring-black ${fieldErrors.fullName ? 'border-red-500' : ''}`}
                    placeholder="Tu nombre completo"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                  />
                </div>
                {fieldErrors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-black font-medium">Correo electrónico</Label>
                <div className="mt-2 relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`pl-10 border-gray-300 focus:border-black focus:ring-black ${fieldErrors.email ? 'border-red-500' : ''}`}
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location" className="text-black font-medium">Ubicación</Label>
                <div className="mt-2 relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    required
                    className={`pl-10 border-gray-300 focus:border-black focus:ring-black ${fieldErrors.location ? 'border-red-500' : ''}`}
                    placeholder="Ciudad, País"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                </div>
                {fieldErrors.location && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.location}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password" className="text-black font-medium">Contraseña</Label>
                <div className="mt-2 relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className={`pl-10 pr-10 border-gray-300 focus:border-black focus:ring-black ${fieldErrors.password ? 'border-red-500' : ''}`}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword" className="text-black font-medium">Confirmar contraseña</Label>
                <div className="mt-2 relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className={`pl-10 pr-10 border-gray-300 focus:border-black focus:ring-black ${fieldErrors.confirmPassword ? 'border-red-500' : ''}`}
                    placeholder="Repite tu contraseña"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-black">
                  Acepto los{' '}
                  <Link href="/terms" className="text-black hover:text-gray-600 underline transition-colors">
                    términos y condiciones
                  </Link>{' '}
                  y la{' '}
                  <Link href="/privacy" className="text-black hover:text-gray-600 underline transition-colors">
                    política de privacidad
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </form>

            {/* Social Registration */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">O regístrate con</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleRegister}
                  className="w-full border-gray-300 hover:bg-gray-50"
                  disabled={loading}
                >
                  <Chrome className="mr-2 h-4 w-4" />
                  {loading ? 'Conectando...' : 'Continuar con Google'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFacebookRegister}
                  className="w-full border-gray-300 hover:bg-gray-50"
                  disabled={loading}
                >
                  <Facebook className="mr-2 h-4 w-4" />
                  {loading ? 'Conectando...' : 'Continuar con Facebook'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
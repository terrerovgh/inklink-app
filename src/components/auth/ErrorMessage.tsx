'use client'

import { AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ErrorMessageProps {
  error: string | null
  onDismiss?: () => void
  className?: string
}

export function ErrorMessage({ error, onDismiss, className = '' }: ErrorMessageProps) {
  if (!error) return null

  return (
    <Alert className={`border-red-200 bg-red-50 text-red-800 ${className}`}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-auto p-0 text-red-600 hover:text-red-800 hover:bg-transparent"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

// Helper function to format auth errors
export function formatAuthError(error: any): string {
  if (typeof error === 'string') return error
  
  if (error?.message) {
    const message = error.message.toLowerCase()
    
    // Common Supabase Auth errors
    if (message.includes('invalid login credentials')) {
      return 'Credenciales inválidas. Verifica tu email y contraseña.'
    }
    if (message.includes('email not confirmed')) {
      return 'Por favor confirma tu email antes de iniciar sesión.'
    }
    if (message.includes('user already registered')) {
      return 'Este email ya está registrado. Intenta iniciar sesión.'
    }
    if (message.includes('password should be at least')) {
      return 'La contraseña debe tener al menos 6 caracteres.'
    }
    if (message.includes('invalid email')) {
      return 'Por favor ingresa un email válido.'
    }
    if (message.includes('signup is disabled')) {
      return 'El registro está temporalmente deshabilitado.'
    }
    if (message.includes('email rate limit exceeded')) {
      return 'Demasiados intentos. Espera unos minutos antes de intentar nuevamente.'
    }
    
    return error.message
  }
  
  return 'Ha ocurrido un error inesperado. Intenta nuevamente.'
}
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  User,
  Settings,
  LogOut,
  Search,
  Heart,
  MessageCircle,
  Menu,
  X
} from 'lucide-react'

export default function Navigation() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getUserDisplayName = () => {
    if (!user) return ''
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'
  }

  const getUserType = () => {
    if (!user) return ''
    return user.user_metadata?.user_type || 'client'
  }

  return (
    <nav className="bg-black border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-sm">IL</span>
            </div>
            <span className="text-white font-bold text-xl">InkLink</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/search"
              className="text-white/80 hover:text-white transition-colors flex items-center space-x-1"
            >
              <Search className="w-4 h-4" />
              <span>Buscar</span>
            </Link>

            {user ? (
              <>
                {/* Authenticated User Menu */}
                <Link
                  href="/dashboard"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>

                <Link
                  href="/favorites"
                  className="text-white/80 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <Heart className="w-4 h-4" />
                  <span>Favoritos</span>
                </Link>

                <Link
                  href="/messages"
                  className="text-white/80 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Mensajes</span>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-white hover:bg-white/10 flex items-center space-x-2"
                    >
                      <User className="w-4 h-4" />
                      <span>{getUserDisplayName()}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-black border-white/20">
                    <div className="px-3 py-2 border-b border-white/10">
                      <p className="text-white font-medium">{getUserDisplayName()}</p>
                      <p className="text-white/60 text-sm capitalize">
                        {getUserType() === 'client' ? 'Cliente' : 
                         getUserType() === 'artist' ? 'Artista' : 'Estudio'}
                      </p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="text-white hover:bg-white/10 cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Mi Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="text-white hover:bg-white/10 cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        Configuración
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Non-authenticated User Menu */}
                <Link
                  href="/auth/login"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Button
                  onClick={() => router.push('/auth/register')}
                  className="bg-white text-black hover:bg-white/90"
                  size="sm"
                >
                  Registrarse
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:bg-white/10"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/search"
                className="text-white/80 hover:text-white block px-3 py-2 text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Buscar
              </Link>

              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-white/80 hover:text-white block px-3 py-2 text-base font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/favorites"
                    className="text-white/80 hover:text-white block px-3 py-2 text-base font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Favoritos
                  </Link>
                  <Link
                    href="/messages"
                    className="text-white/80 hover:text-white block px-3 py-2 text-base font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Mensajes
                  </Link>
                  <Link
                    href="/profile"
                    className="text-white/80 hover:text-white block px-3 py-2 text-base font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Mi Perfil
                  </Link>
                  <Link
                    href="/settings"
                    className="text-white/80 hover:text-white block px-3 py-2 text-base font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Configuración
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsMobileMenuOpen(false)
                    }}
                    className="text-red-400 hover:text-red-300 block px-3 py-2 text-base font-medium w-full text-left"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-white/80 hover:text-white block px-3 py-2 text-base font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-white text-black hover:bg-white/90 block px-3 py-2 text-base font-medium rounded-md mx-3 mt-2 text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
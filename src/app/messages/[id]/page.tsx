'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ChatSystem from '@/components/ChatSystem'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Phone, Video, Info, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Chat {
  id: string
  participant1_id: string
  participant2_id: string
  last_message_at: string
  participant1_profile: {
    id: string
    full_name: string
    avatar_url: string
    user_type: string
    bio?: string
    location?: string
  }
  participant2_profile: {
    id: string
    full_name: string
    avatar_url: string
    user_type: string
    bio?: string
    location?: string
  }
}

export default function ChatPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [chat, setChat] = useState<Chat | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchChat()
    }
  }, [user, params.id])

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/auth/login')
    }
  }

  const fetchChat = async () => {
    try {
      const response = await fetch(`/api/chats/${params.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar el chat')
      }

      setChat(data.chat)
    } catch (error) {
      console.error('Error fetching chat:', error)
      toast.error('Error al cargar el chat')
      router.push('/messages')
    } finally {
      setLoading(false)
    }
  }

  const getOtherParticipant = () => {
    if (!chat || !user) return null
    return chat.participant1_id === user.id 
      ? chat.participant2_profile 
      : chat.participant1_profile
  }

  const handleDeleteChat = async () => {
    if (!chat) return

    if (!confirm('¿Estás seguro de que quieres eliminar esta conversación?')) {
      return
    }

    try {
      const response = await fetch(`/api/chats/${chat.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al eliminar el chat')
      }

      toast.success('Conversación eliminada')
      router.push('/messages')
    } catch (error) {
      console.error('Error deleting chat:', error)
      toast.error('Error al eliminar la conversación')
    }
  }

  const otherParticipant = getOtherParticipant()

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!chat || !otherParticipant || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Chat no encontrado</h1>
          <Button onClick={() => router.push('/messages')}>
            Volver a Mensajes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/messages')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={otherParticipant.avatar_url} />
                <AvatarFallback>
                  {otherParticipant.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold">{otherParticipant.full_name}</h1>
                <Badge variant="secondary" className="text-xs capitalize">
                  {otherParticipant.user_type}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowInfo(!showInfo)}
            >
              <Info className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDeleteChat}>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat System */}
          <div className={`${showInfo ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
            <ChatSystem 
              userId={user.id}
              chatId={chat.id}
            />
          </div>

          {/* User Info Sidebar */}
          {showInfo && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información del Usuario</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <Avatar className="w-20 h-20 mx-auto mb-3">
                      <AvatarImage src={otherParticipant.avatar_url} />
                      <AvatarFallback className="text-2xl">
                        {otherParticipant.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg">{otherParticipant.full_name}</h3>
                    <Badge variant="secondary" className="capitalize">
                      {otherParticipant.user_type}
                    </Badge>
                  </div>

                  {otherParticipant.bio && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-600 mb-1">Biografía</h4>
                      <p className="text-sm">{otherParticipant.bio}</p>
                    </div>
                  )}

                  {otherParticipant.location && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-600 mb-1">Ubicación</h4>
                      <p className="text-sm">{otherParticipant.location}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t space-y-2">
                    <Link 
                      href={`/profile/${otherParticipant.id}`}
                      className="block"
                    >
                      <Button variant="outline" className="w-full">
                        Ver Perfil Completo
                      </Button>
                    </Link>
                    
                    {otherParticipant.user_type === 'artist' && (
                      <Link 
                        href={`/artists/${otherParticipant.id}`}
                        className="block"
                      >
                        <Button variant="outline" className="w-full">
                          Ver Portfolio
                        </Button>
                      </Link>
                    )}
                    
                    {otherParticipant.user_type === 'studio' && (
                      <Link 
                        href={`/studios/${otherParticipant.id}`}
                        className="block"
                      >
                        <Button variant="outline" className="w-full">
                          Ver Estudio
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
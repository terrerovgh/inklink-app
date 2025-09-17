'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  MessageCircle,
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  Image,
  Paperclip,
  Smile
} from 'lucide-react'

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: string
  read: boolean
  type: 'text' | 'image' | 'file'
}

interface Conversation {
  id: string
  participantId: string
  participantName: string
  participantType: 'artist' | 'studio' | 'client'
  participantAvatar: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  online: boolean
}

export default function MessagesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  // Load conversations (mock data for now)
  useEffect(() => {
    if (user) {
      setTimeout(() => {
        setConversations([
          {
            id: '1',
            participantId: 'artist-1',
            participantName: 'Carlos Mendoza',
            participantType: 'artist',
            participantAvatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20tattoo%20artist%20portrait&image_size=square',
            lastMessage: 'Perfecto, podemos agendar para la próxima semana',
            lastMessageTime: '10:30',
            unreadCount: 2,
            online: true
          },
          {
            id: '2',
            participantId: 'studio-1',
            participantName: 'Ink Masters Studio',
            participantType: 'studio',
            participantAvatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20tattoo%20studio%20logo&image_size=square',
            lastMessage: 'Gracias por tu interés, te envío el presupuesto',
            lastMessageTime: 'Ayer',
            unreadCount: 0,
            online: false
          },
          {
            id: '3',
            participantId: 'artist-2',
            participantName: 'Ana García',
            participantType: 'artist',
            participantAvatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=female%20tattoo%20artist%20portrait%20professional&image_size=square',
            lastMessage: '¡Me encanta tu idea! Podemos trabajar en ese diseño',
            lastMessageTime: '2 días',
            unreadCount: 1,
            online: true
          }
        ])
        setIsLoading(false)
      }, 1000)
    }
  }, [user])

  // Load messages for selected conversation
  useEffect(() => {
    if (selectedConversation) {
      // Mock messages
      setMessages([
        {
          id: '1',
          senderId: 'user-1',
          receiverId: 'artist-1',
          content: 'Hola, me interesa tu trabajo. ¿Podrías hacer un tatuaje de estilo realista?',
          timestamp: '09:15',
          read: true,
          type: 'text'
        },
        {
          id: '2',
          senderId: 'artist-1',
          receiverId: 'user-1',
          content: 'Hola! Claro, el realismo es mi especialidad. ¿Tienes alguna referencia o idea específica?',
          timestamp: '09:18',
          read: true,
          type: 'text'
        },
        {
          id: '3',
          senderId: 'user-1',
          receiverId: 'artist-1',
          content: 'Sí, me gustaría un retrato de mi mascota. ¿Cuánto costaría aproximadamente?',
          timestamp: '09:20',
          read: true,
          type: 'text'
        },
        {
          id: '4',
          senderId: 'artist-1',
          receiverId: 'user-1',
          content: 'Perfecto, podemos agendar para la próxima semana',
          timestamp: '10:30',
          read: false,
          type: 'text'
        }
      ])
    }
  }, [selectedConversation])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return

    const message: Message = {
      id: Date.now().toString(),
      senderId: user?.id || 'user-1',
      receiverId: selectedConversation,
      content: newMessage,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type: 'text'
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')

    // Update conversation last message
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation 
        ? { ...conv, lastMessage: newMessage, lastMessageTime: 'Ahora' }
        : conv
    ))
  }

  const filteredConversations = conversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedConv = conversations.find(conv => conv.id === selectedConversation)

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="bg-white/5 border-white/10 h-full">
              <CardContent className="p-0 h-full flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-white/10">
                  <h2 className="text-xl font-semibold text-white mb-4">Mensajes</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar conversaciones..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                  </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-4 text-center text-white/60">Cargando conversaciones...</div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-4 text-center">
                      <MessageCircle className="w-12 h-12 text-white/40 mx-auto mb-2" />
                      <p className="text-white/60 text-sm">
                        {searchQuery ? 'No se encontraron conversaciones' : 'No tienes conversaciones aún'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredConversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv.id)}
                          className={`p-4 cursor-pointer hover:bg-white/5 transition-colors ${
                            selectedConversation === conv.id ? 'bg-white/10' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <img
                                src={conv.participantAvatar}
                                alt={conv.participantName}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                              {conv.online && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="text-white font-medium truncate">{conv.participantName}</h3>
                                <span className="text-white/60 text-xs">{conv.lastMessageTime}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-white/60 text-sm truncate">{conv.lastMessage}</p>
                                {conv.unreadCount > 0 && (
                                  <span className="bg-white text-black text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                    {conv.unreadCount}
                                  </span>
                                )}
                              </div>
                              <span className="text-white/40 text-xs capitalize">{conv.participantType}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="bg-white/5 border-white/10 h-full">
              <CardContent className="p-0 h-full flex flex-col">
                {selectedConv ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={selectedConv.participantAvatar}
                            alt={selectedConv.participantName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          {selectedConv.online && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{selectedConv.participantName}</h3>
                          <p className="text-white/60 text-sm">
                            {selectedConv.online ? 'En línea' : 'Desconectado'} • {selectedConv.participantType}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                          <Video className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.senderId === user?.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.senderId === user?.id
                                ? 'bg-white text-black'
                                : 'bg-white/10 text-white'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.senderId === user?.id ? 'text-black/60' : 'text-white/60'
                              }`}
                            >
                              {message.timestamp}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-white/10">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                          <Paperclip className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                          <Image className="w-4 h-4" />
                        </Button>
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            placeholder="Escribe un mensaje..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 pr-10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/10"
                          >
                            <Smile className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                          className="bg-white text-black hover:bg-white/90 disabled:opacity-50"
                          size="sm"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 text-white/40 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">Selecciona una conversación</h3>
                      <p className="text-white/60 text-sm">
                        Elige una conversación de la lista para comenzar a chatear
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
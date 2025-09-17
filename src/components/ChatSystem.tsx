'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Phone, Video, MoreVertical, Image, Paperclip } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  message_type: 'text' | 'image' | 'file'
  file_url?: string
  file_name?: string
  sender_profile: {
    id: string
    full_name: string
    avatar_url: string
  }
}

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
  }
  participant2_profile: {
    id: string
    full_name: string
    avatar_url: string
    user_type: string
  }
}

interface ChatSystemProps {
  userId: string
  chatId?: string
  recipientId?: string
}

export default function ChatSystem({ userId, chatId, recipientId }: ChatSystemProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (chatId) {
      fetchChatAndMessages(chatId)
    } else if (recipientId) {
      findOrCreateChat(recipientId)
    }
  }, [chatId, recipientId])

  useEffect(() => {
    if (currentChat) {
      setupRealtimeSubscription()
    }
    return () => {
      supabase.removeAllChannels()
    }
  }, [currentChat])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchChatAndMessages = async (chatId: string) => {
    try {
      // Fetch chat details
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select(`
          *,
          participant1_profile:profiles!chats_participant1_id_fkey (
            id,
            full_name,
            avatar_url,
            user_type
          ),
          participant2_profile:profiles!chats_participant2_id_fkey (
            id,
            full_name,
            avatar_url,
            user_type
          )
        `)
        .eq('id', chatId)
        .single()

      if (chatError) {
        console.error('Error fetching chat:', chatError)
        toast.error('Error al cargar el chat')
        return
      }

      // Check if user is participant
      if (chatData.participant1_id !== userId && chatData.participant2_id !== userId) {
        toast.error('No tienes acceso a este chat')
        return
      }

      setCurrentChat(chatData)

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (messagesError) {
        console.error('Error fetching messages:', messagesError)
        toast.error('Error al cargar los mensajes')
        return
      }

      setMessages(messagesData || [])
    } catch (error) {
      console.error('Error fetching chat and messages:', error)
      toast.error('Error al cargar el chat')
    } finally {
      setLoading(false)
    }
  }

  const findOrCreateChat = async (recipientId: string) => {
    try {
      // Check if chat already exists
      const { data: existingChat, error: searchError } = await supabase
        .from('chats')
        .select(`
          *,
          participant1_profile:profiles!chats_participant1_id_fkey (
            id,
            full_name,
            avatar_url,
            user_type
          ),
          participant2_profile:profiles!chats_participant2_id_fkey (
            id,
            full_name,
            avatar_url,
            user_type
          )
        `)
        .or(`and(participant1_id.eq.${userId},participant2_id.eq.${recipientId}),and(participant1_id.eq.${recipientId},participant2_id.eq.${userId})`)
        .single()

      if (existingChat) {
        setCurrentChat(existingChat)
        fetchChatAndMessages(existingChat.id)
        return
      }

      // Create new chat
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert({
          participant1_id: userId,
          participant2_id: recipientId
        })
        .select(`
          *,
          participant1_profile:profiles!chats_participant1_id_fkey (
            id,
            full_name,
            avatar_url,
            user_type
          ),
          participant2_profile:profiles!chats_participant2_id_fkey (
            id,
            full_name,
            avatar_url,
            user_type
          )
        `)
        .single()

      if (createError) {
        console.error('Error creating chat:', createError)
        toast.error('Error al crear el chat')
        return
      }

      setCurrentChat(newChat)
      setMessages([])
    } catch (error) {
      console.error('Error finding or creating chat:', error)
      toast.error('Error al inicializar el chat')
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!currentChat) return

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${currentChat.id}`
        },
        async (payload) => {
          const newMessage = payload.new as Message
          
          // Fetch sender profile
          const { data: senderData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', newMessage.sender_id)
            .single()
          
          if (senderData) {
            newMessage.sender_profile = senderData
          }

          setMessages(prev => [...prev, newMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const sendMessage = async (content: string, messageType: 'text' | 'image' | 'file' = 'text', fileUrl?: string, fileName?: string) => {
    if (!currentChat || !content.trim()) return

    setSending(true)
    try {
      const messageData = {
        chat_id: currentChat.id,
        sender_id: userId,
        content: content.trim(),
        message_type: messageType,
        file_url: fileUrl,
        file_name: fileName
      }

      const { data: message, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .single()

      if (error) {
        console.error('Error sending message:', error)
        toast.error('Error al enviar el mensaje')
        return
      }

      // Update chat's last_message_at
      await supabase
        .from('chats')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', currentChat.id)

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Error al enviar el mensaje')
    } finally {
      setSending(false)
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim()) {
      sendMessage(newMessage)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!currentChat) return

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `chat-files/${currentChat.id}/${fileName}`

      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file)

      if (error) {
        console.error('Error uploading file:', error)
        toast.error('Error al subir el archivo')
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath)

      const messageType = file.type.startsWith('image/') ? 'image' : 'file'
      await sendMessage(file.name, messageType, publicUrl, file.name)
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Error al subir el archivo')
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer'
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
      })
    }
  }

  const getOtherParticipant = () => {
    if (!currentChat) return null
    return currentChat.participant1_id === userId 
      ? currentChat.participant2_profile 
      : currentChat.participant1_profile
  }

  const otherParticipant = getOtherParticipant()

  if (loading) {
    return (
      <Card className="h-96">
        <CardContent className="p-6 flex items-center justify-center h-full">
          <div className="animate-pulse text-gray-500 dark:text-white">Cargando chat...</div>
        </CardContent>
      </Card>
    )
  }

  if (!currentChat || !otherParticipant) {
    return (
      <Card className="h-96">
        <CardContent className="p-6 flex items-center justify-center h-full">
          <div className="text-gray-500 dark:text-white">No se pudo cargar el chat</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-96 flex flex-col">
      {/* Chat Header */}
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={otherParticipant.avatar_url} />
              <AvatarFallback>
                {otherParticipant.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{otherParticipant.full_name}</h3>
              <Badge variant="secondary" className="text-xs capitalize">
                {otherParticipant.user_type}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => {
            const isOwnMessage = message.sender_id === userId
            const showDate = index === 0 || 
              formatDate(messages[index - 1].created_at) !== formatDate(message.created_at)

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="text-center text-xs text-gray-500 dark:text-white my-4">
                    {formatDate(message.created_at)}
                  </div>
                )}
                <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-end gap-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                    {!isOwnMessage && (
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={message.sender_profile.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {message.sender_profile.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`rounded-lg px-3 py-2 ${
                      isOwnMessage 
                        ? 'bg-white text-black dark:bg-black dark:text-white' 
                        : 'bg-gray-100 text-gray-900 dark:bg-black dark:text-white dark:border dark:border-white'
                    }`}>
                      {message.message_type === 'image' && message.file_url && (
                        <img 
                          src={message.file_url} 
                          alt="Imagen" 
                          className="max-w-full h-auto rounded mb-1"
                        />
                      )}
                      {message.message_type === 'file' && message.file_url && (
                        <div className="flex items-center gap-2 mb-1">
                          <Paperclip className="w-4 h-4" />
                          <a 
                            href={message.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm underline"
                          >
                            {message.file_name || 'Archivo'}
                          </a>
                        </div>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-black dark:text-white' : 'text-gray-500 dark:text-white'
                      }`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                handleFileUpload(file)
              }
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              fileInputRef.current?.setAttribute('accept', 'image/*')
              fileInputRef.current?.click()
            }}
          >
            <Image className="w-4 h-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1"
            disabled={sending}
          />
          <Button type="submit" size="sm" disabled={sending || !newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </Card>
  )
}
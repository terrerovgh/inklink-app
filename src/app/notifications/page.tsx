'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bell, Check, X, MessageCircle, HandHeart, Star, Calendar, Euro, Trash2, MarkAsRead } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: any
  read: boolean
  created_at: string
  sender_profile?: {
    id: string
    full_name: string
    avatar_url: string
  }
}

interface UserProfile {
  id: string
  user_type: 'client' | 'artist' | 'studio'
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
    fetchNotifications()
  }, [filter])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, user_type')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchNotifications = async (pageNum = 1, append = false) => {
    try {
      setLoading(pageNum === 1)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('notifications')
        .select(`
          *,
          sender_profile:profiles!notifications_sender_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range((pageNum - 1) * 20, pageNum * 20 - 1)

      if (filter === 'unread') {
        query = query.eq('read', false)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching notifications:', error)
        toast.error('Error al cargar las notificaciones')
        return
      }

      if (data) {
        if (append) {
          setNotifications(prev => [...prev, ...data])
        } else {
          setNotifications(data)
        }
        setHasMore(data.length === 20)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Error al cargar las notificaciones')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        return
      }

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        toast.error('Error al marcar todas como leídas')
        return
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      toast.success('Todas las notificaciones marcadas como leídas')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Error al marcar todas como leídas')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) {
        console.error('Error deleting notification:', error)
        toast.error('Error al eliminar la notificación')
        return
      }

      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      toast.success('Notificación eliminada')
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Error al eliminar la notificación')
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'new_offer':
        if (notification.data?.request_id) {
          router.push(`/requests/${notification.data.request_id}`)
        }
        break
      case 'offer_accepted':
      case 'offer_rejected':
        if (notification.data?.offer_id) {
          router.push('/offers')
        }
        break
      case 'new_message':
        if (notification.data?.chat_id) {
          router.push(`/messages/${notification.data.chat_id}`)
        }
        break
      case 'new_review':
        router.push('/profile')
        break
      case 'payment_received':
      case 'payment_sent':
        router.push('/payments')
        break
      default:
        break
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_offer':
        return <HandHeart className="w-5 h-5 text-blue-500" />
      case 'offer_accepted':
        return <Check className="w-5 h-5 text-green-500" />
      case 'offer_rejected':
        return <X className="w-5 h-5 text-red-500" />
      case 'new_message':
        return <MessageCircle className="w-5 h-5 text-purple-500" />
      case 'new_review':
        return <Star className="w-5 h-5 text-yellow-500" />
      case 'payment_received':
      case 'payment_sent':
        return <Euro className="w-5 h-5 text-green-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return 'Hace un momento'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `Hace ${days} día${days > 1 ? 's' : ''}`
    }
  }

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchNotifications(nextPage, true)
  }

  const filteredNotifications = notifications
  const unreadCount = notifications.filter(n => !n.read).length

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? `${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} sin leer` : 'Todas las notificaciones están leídas'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline" className="flex items-center gap-2">
                <MarkAsRead className="w-4 h-4" />
                Marcar todas como leídas
              </Button>
            )}
          </div>

          {/* Filter Tabs */}
          <Tabs value={filter} onValueChange={(value) => {
            setFilter(value as 'all' | 'unread')
            setPage(1)
          }}>
            <TabsList>
              <TabsTrigger value="all">Todas ({notifications.length})</TabsTrigger>
              <TabsTrigger value="unread">Sin leer ({unreadCount})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading && page === 1 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando notificaciones...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filter === 'unread' ? 'No hay notificaciones sin leer' : 'No hay notificaciones'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {filter === 'unread' 
                    ? 'Todas tus notificaciones están marcadas como leídas.'
                    : 'Cuando recibas notificaciones, aparecerán aquí.'
                  }
                </p>
                <Link href="/dashboard">
                  <Button>Ir al Dashboard</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {notification.sender_profile ? (
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={notification.sender_profile.avatar_url} />
                          <AvatarFallback className="text-sm">
                            {notification.sender_profile.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-400">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {!notification.read && (
                              <Badge variant="secondary" className="text-xs">
                                Nuevo
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 ml-4">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                              title="Marcar como leída"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                            title="Eliminar notificación"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Load More Button */}
          {hasMore && filteredNotifications.length > 0 && (
            <div className="text-center pt-6">
              <Button 
                onClick={loadMore} 
                variant="outline" 
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    Cargando...
                  </div>
                ) : (
                  'Cargar más'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
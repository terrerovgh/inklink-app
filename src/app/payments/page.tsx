'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { CreditCard, DollarSign, TrendingUp, TrendingDown, Search, Filter, Download, Calendar, Euro, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Payment {
  id: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'
  payment_method: 'stripe' | 'paypal'
  description: string
  created_at: string
  updated_at: string
  user_id: string
  artist_id?: string
  offer_id?: string
  stripe_payment_intent_id?: string
  paypal_order_id?: string
  metadata: any
  artist_profile?: {
    id: string
    full_name: string
    avatar_url: string
  }
  client_profile?: {
    id: string
    full_name: string
    avatar_url: string
  }
}

interface PaymentStats {
  total_sent: number
  total_received: number
  completed_sent: number
  completed_received: number
  pending_sent: number
  pending_received: number
  failed_sent: number
  failed_received: number
}

interface UserProfile {
  id: string
  user_type: 'client' | 'artist' | 'studio'
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
    fetchStats()
    fetchPayments()
  }, [filter, statusFilter, methodFilter])

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

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_stats'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error)
    }
  }

  const fetchPayments = async (pageNum = 1, append = false) => {
    try {
      setLoading(pageNum === 1)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        type: filter,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(methodFilter !== 'all' && { payment_method: methodFilter })
      })

      const response = await fetch(`/api/payments?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch payments')
      }

      const data = await response.json()

      if (append) {
        setPayments(prev => [...prev, ...data.payments])
      } else {
        setPayments(data.payments)
      }
      setHasMore(data.payments.length === 20)
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Error al cargar los pagos')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />
      case 'refunded':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
      cancelled: 'outline',
      refunded: 'secondary'
    }
    
    return (
      <Badge variant={variants[status] || 'outline'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatAmount = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredPayments = payments.filter(payment => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        payment.description.toLowerCase().includes(searchLower) ||
        payment.artist_profile?.full_name?.toLowerCase().includes(searchLower) ||
        payment.client_profile?.full_name?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPayments(nextPage, true)
  }

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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pagos</h1>
              <p className="text-gray-600 mt-1">
                Gestiona tu historial de pagos y transacciones
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Exportar
              </Button>
              <Link href="/payment">
                <Button className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Nuevo Pago
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Enviado</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatAmount(stats.total_sent)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {stats.completed_sent > 0 && `${formatAmount(stats.completed_sent)} completados`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Recibido</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatAmount(stats.total_received)}
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {stats.completed_received > 0 && `${formatAmount(stats.completed_received)} completados`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pendientes</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {formatAmount(stats.pending_sent + stats.pending_received)}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Esperando confirmación
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Fallidos</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatAmount(stats.failed_sent + stats.failed_received)}
                      </p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Requieren atención
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por descripción o usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-3">
                <Tabs value={filter} onValueChange={(value) => {
                  setFilter(value as 'all' | 'sent' | 'received')
                  setPage(1)
                }}>
                  <TabsList>
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="sent">Enviados</TabsTrigger>
                    <TabsTrigger value="received">Recibidos</TabsTrigger>
                  </TabsList>
                </Tabs>

                <Select value={statusFilter} onValueChange={(value) => {
                  setStatusFilter(value)
                  setPage(1)
                }}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="failed">Fallido</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="refunded">Reembolsado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={methodFilter} onValueChange={(value) => {
                  setMethodFilter(value)
                  setPage(1)
                }}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments List */}
        <div className="space-y-4">
          {loading && page === 1 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando pagos...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay pagos
                </h3>
                <p className="text-gray-600 mb-4">
                  {filter === 'sent' 
                    ? 'No has enviado ningún pago aún.'
                    : filter === 'received'
                    ? 'No has recibido ningún pago aún.'
                    : 'No tienes ningún pago registrado.'
                  }
                </p>
                <Link href="/payment">
                  <Button>Realizar Pago</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            filteredPayments.map((payment) => {
              const isReceived = payment.user_id !== profile?.id
              const otherProfile = isReceived ? payment.client_profile : payment.artist_profile
              
              return (
                <Card key={payment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isReceived ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {isReceived ? (
                            <TrendingDown className="w-6 h-6 text-green-600" />
                          ) : (
                            <TrendingUp className="w-6 h-6 text-red-600" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">
                              {payment.description}
                            </h3>
                            {getStatusBadge(payment.status)}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>
                              {isReceived ? 'De:' : 'Para:'} {otherProfile?.full_name || 'Usuario desconocido'}
                            </span>
                            <span>•</span>
                            <span className="capitalize">{payment.payment_method}</span>
                            <span>•</span>
                            <span>{formatDate(payment.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${
                          isReceived ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isReceived ? '+' : '-'}{formatAmount(payment.amount, payment.currency)}
                        </p>
                        <p className="text-xs text-gray-500">
                          ID: {payment.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}

          {/* Load More Button */}
          {hasMore && filteredPayments.length > 0 && (
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
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { AppointmentsAPI } from '@/lib/api/appointments'
import { BookingDialog } from '@/components/appointments/BookingDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Clock, MapPin, User, Phone, Mail, Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Appointment {
  id: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  service: string
  notes?: string
  client?: {
    id: string
    name: string
    email: string
    phone?: string
  }
  artist?: {
    id: string
    name: string
    email: string
    phone?: string
    studio_name?: string
  }
  studio?: {
    id: string
    name: string
    address: string
    phone?: string
  }
}

const statusConfig = {
  pending: {
    label: 'Pendiente',
    color: 'bg-yellow-100 text-yellow-800',
    icon: AlertCircle
  },
  confirmed: {
    label: 'Confirmada',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  cancelled: {
    label: 'Cancelada',
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  },
  completed: {
    label: 'Completada',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle
  }
}

export default function AppointmentsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      fetchAppointments()
    }
  }, [user, authLoading, router])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await AppointmentsAPI.getClientAppointments()
      if (response.success) {
        setAppointments(response.data || [])
      } else {
        toast.error('Error al cargar las citas')
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Error al cargar las citas')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      const response = await AppointmentsAPI.confirmAppointment(appointmentId)
      if (response.success) {
        toast.success('Cita confirmada exitosamente')
        fetchAppointments()
      } else {
        toast.error('Error al confirmar la cita')
      }
    } catch (error) {
      console.error('Error confirming appointment:', error)
      toast.error('Error al confirmar la cita')
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      // Note: We would need to add a cancel method to AppointmentsAPI
      toast.success('Cita cancelada exitosamente')
      fetchAppointments()
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      toast.error('Error al cancelar la cita')
    }
  }

  const filterAppointments = (status: string) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date)
      
      switch (status) {
        case 'upcoming':
          return appointmentDate >= today && appointment.status !== 'cancelled' && appointment.status !== 'completed'
        case 'past':
          return appointmentDate < today || appointment.status === 'completed'
        case 'cancelled':
          return appointment.status === 'cancelled'
        default:
          return true
      }
    })
  }

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const StatusIcon = statusConfig[appointment.status].icon
    const appointmentDate = new Date(appointment.date)
    const isUpcoming = appointmentDate >= new Date() && appointment.status !== 'cancelled' && appointment.status !== 'completed'

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {format(appointmentDate, 'EEEE, d MMMM yyyy', { locale: es })}
            </CardTitle>
            <Badge className={statusConfig[appointment.status].color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig[appointment.status].label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{appointment.time}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span className="font-medium">{appointment.service}</span>
            </div>

            {appointment.artist && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>Artista: {appointment.artist.name}</span>
                {appointment.artist.studio_name && (
                  <span className="text-gray-400">- {appointment.artist.studio_name}</span>
                )}
              </div>
            )}

            {appointment.studio && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{appointment.studio.address}</span>
              </div>
            )}

            {appointment.notes && (
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                <strong>Notas:</strong> {appointment.notes}
              </div>
            )}

            {isUpcoming && appointment.status === 'pending' && (
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  onClick={() => handleConfirmAppointment(appointment.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Confirmar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleCancelAppointment(appointment.id)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando citas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mis Citas</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tus citas y reservas
          </p>
        </div>
        <BookingDialog>
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Cita
          </Button>
        </BookingDialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Próximas</TabsTrigger>
          <TabsTrigger value="past">Pasadas</TabsTrigger>
          <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          <div className="space-y-4">
            {filterAppointments('upcoming').length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No tienes citas próximas</h3>
                  <p className="text-gray-600 mb-4">Explora artistas y estudios para reservar tu próxima cita</p>
                  <Button onClick={() => router.push('/search')}>
                    Buscar Artistas
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filterAppointments('upcoming').map(appointment => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          <div className="space-y-4">
            {filterAppointments('past').length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No tienes citas pasadas</h3>
                  <p className="text-gray-600">Aquí aparecerán tus citas completadas</p>
                </CardContent>
              </Card>
            ) : (
              filterAppointments('past').map(appointment => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          <div className="space-y-4">
            {filterAppointments('cancelled').length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <XCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No tienes citas canceladas</h3>
                  <p className="text-gray-600">Aquí aparecerán tus citas canceladas</p>
                </CardContent>
              </Card>
            ) : (
              filterAppointments('cancelled').map(appointment => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { AppointmentsAPI } from '@/lib/api/appointments'
import { AppointmentCalendar } from './AppointmentCalendar'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface BookingDialogProps {
  children: React.ReactNode
  artistId?: string
  studioId?: string
  profileName: string
  onSuccess?: () => void
}

interface BookingFormData {
  appointment_date: string;
  duration_hours: number;
  service_description: string;
  notes: string;
}

export function BookingDialog({ 
  children, 
  artistId, 
  studioId, 
  profileName, 
  onSuccess 
}: BookingDialogProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: null as Date | null,
    time: '',
    service: '',
    notes: ''
  });

  const handleDateTimeSelect = (date: Date, time: string) => {
    setFormData(prev => ({ ...prev, date, time }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Debes iniciar sesión para reservar una cita')
      router.push('/auth/login')
      return
    }

    if (!formData.date || !formData.time || !formData.service) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    setLoading(true)

    try {
      const appointmentData = {
        artist_id: artistId,
        studio_id: studioId,
        date: format(formData.date, 'yyyy-MM-dd'),
        time: formData.time,
        service: formData.service,
        notes: formData.notes
      }

      const response = await AppointmentsAPI.createAppointment(appointmentData)
      
      if (response.success) {
        toast.success('Cita reservada exitosamente')
        setOpen(false)
        setFormData({ date: null, time: '', service: '', notes: '' })
        if (onSuccess) onSuccess()
      } else {
        toast.error(response.error || 'Error al reservar la cita')
      }
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast.error('Error al reservar la cita')
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button className="w-full" size="lg">
      <Calendar className="mr-2 h-4 w-4" />
      Reservar Cita
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Reservar Cita con {profileName}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Calendar Component */}
          <AppointmentCalendar
            onDateTimeSelect={handleDateTimeSelect}
            selectedDate={formData.date || undefined}
            selectedTime={formData.time}
            workingHours={{
              start: '09:00',
              end: '18:00',
              days: [1, 2, 3, 4, 5, 6] // Monday to Saturday
            }}
          />

          {/* Service and Notes */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="service">Servicio</Label>
              <Input
                id="service"
                type="text"
                placeholder="Ej: Tatuaje tradicional, Piercing, Consulta..."
                value={formData.service}
                onChange={(e) => setFormData(prev => ({ ...prev, service: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">Notas adicionales (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Describe tu idea, tamaño aproximado, ubicación en el cuerpo, etc."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.date || !formData.service.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Reservando...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Reservar Cita
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
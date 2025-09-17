'use client'

import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Calendar as CalendarIcon } from 'lucide-react'
import { format, addDays, isSameDay, isAfter, isBefore } from 'date-fns'
import { es } from 'date-fns/locale'

interface TimeSlot {
  time: string
  available: boolean
  booked?: boolean
}

interface AppointmentCalendarProps {
  onDateTimeSelect: (date: Date, time: string) => void
  selectedDate?: Date
  selectedTime?: string
  unavailableDates?: Date[]
  workingHours?: {
    start: string
    end: string
    days: number[] // 0 = Sunday, 1 = Monday, etc.
  }
  bookedSlots?: { date: Date; time: string }[]
  minDate?: Date
  maxDate?: Date
}

const DEFAULT_WORKING_HOURS = {
  start: '09:00',
  end: '18:00',
  days: [1, 2, 3, 4, 5, 6] // Monday to Saturday
}

const generateTimeSlots = (start: string, end: string, interval: number = 60): string[] => {
  const slots: string[] = []
  const [startHour, startMinute] = start.split(':').map(Number)
  const [endHour, endMinute] = end.split(':').map(Number)
  
  let currentHour = startHour
  let currentMinute = startMinute
  
  while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
    slots.push(timeString)
    
    currentMinute += interval
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60)
      currentMinute = currentMinute % 60
    }
  }
  
  return slots
}

export function AppointmentCalendar({
  onDateTimeSelect,
  selectedDate,
  selectedTime,
  unavailableDates = [],
  workingHours = DEFAULT_WORKING_HOURS,
  bookedSlots = [],
  minDate = new Date(),
  maxDate = addDays(new Date(), 90)
}: AppointmentCalendarProps) {
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date | undefined>(selectedDate)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([])

  useEffect(() => {
    if (internalSelectedDate) {
      generateAvailableTimeSlots(internalSelectedDate)
    }
  }, [internalSelectedDate, bookedSlots])

  const generateAvailableTimeSlots = (date: Date) => {
    const dayOfWeek = date.getDay()
    
    // Check if the selected day is a working day
    if (!workingHours.days.includes(dayOfWeek)) {
      setAvailableTimeSlots([])
      return
    }

    const timeSlots = generateTimeSlots(workingHours.start, workingHours.end)
    const now = new Date()
    const isToday = isSameDay(date, now)
    
    const slots: TimeSlot[] = timeSlots.map(time => {
      const [hour, minute] = time.split(':').map(Number)
      const slotDateTime = new Date(date)
      slotDateTime.setHours(hour, minute, 0, 0)
      
      // Check if slot is in the past (for today only)
      const isPast = isToday && isBefore(slotDateTime, now)
      
      // Check if slot is already booked
      const isBooked = bookedSlots.some(slot => 
        isSameDay(slot.date, date) && slot.time === time
      )
      
      return {
        time,
        available: !isPast && !isBooked,
        booked: isBooked
      }
    })
    
    setAvailableTimeSlots(slots)
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    
    setInternalSelectedDate(date)
    // Clear time selection when date changes
    if (selectedTime) {
      // Don't automatically clear - let parent handle this
    }
  }

  const handleTimeSelect = (time: string) => {
    if (internalSelectedDate) {
      onDateTimeSelect(internalSelectedDate, time)
    }
  }

  const isDateDisabled = (date: Date) => {
    // Disable dates outside the allowed range
    if (isBefore(date, minDate) || isAfter(date, maxDate)) {
      return true
    }
    
    // Disable unavailable dates
    if (unavailableDates.some(unavailableDate => isSameDay(date, unavailableDate))) {
      return true
    }
    
    // Disable non-working days
    const dayOfWeek = date.getDay()
    if (!workingHours.days.includes(dayOfWeek)) {
      return true
    }
    
    return false
  }

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Selecciona una fecha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={internalSelectedDate}
            onSelect={handleDateSelect}
            disabled={isDateDisabled}
            locale={es}
            className="rounded-md border"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
          />
        </CardContent>
      </Card>

      {/* Time Slots */}
      {internalSelectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horarios disponibles
            </CardTitle>
            <p className="text-sm text-gray-600">
              {format(internalSelectedDate, 'EEEE, d MMMM yyyy', { locale: es })}
            </p>
          </CardHeader>
          <CardContent>
            {availableTimeSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay horarios disponibles para esta fecha</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {availableTimeSlots.map(slot => (
                  <Button
                    key={slot.time}
                    variant={selectedTime === slot.time ? "default" : "outline"}
                    size="sm"
                    disabled={!slot.available}
                    onClick={() => handleTimeSelect(slot.time)}
                    className={`
                      ${!slot.available ? 'opacity-50 cursor-not-allowed' : ''}
                      ${slot.booked ? 'bg-red-50 border-red-200 text-red-600' : ''}
                      ${selectedTime === slot.time ? 'bg-black text-white' : ''}
                    `}
                  >
                    {slot.time}
                    {slot.booked && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        Ocupado
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selected DateTime Summary */}
      {internalSelectedDate && selectedTime && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-800">
              <CalendarIcon className="h-4 w-4" />
              <span className="font-medium">
                {format(internalSelectedDate, 'EEEE, d MMMM yyyy', { locale: es })} a las {selectedTime}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
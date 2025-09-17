import { supabase } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/server';
import { 
  Appointment, 
  CreateAppointmentRequest, 
  UpdateAppointmentRequest,
  AppointmentWithRelations,
  AppointmentSearchFilters,
  PaginationParams,
  PaginatedResponse
} from '@/types/database';

export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface AvailabilityRequest {
  profile_id: string;
  date: string; // YYYY-MM-DD format
  duration_hours?: number;
}

export interface CreateAppointmentData {
  profile_id: string;
  client_id: string;
  appointment_date: string; // ISO datetime
  duration_hours: number;
  service_description: string;
  estimated_price?: number;
  notes?: string;
}

export interface UpdateAppointmentData {
  appointment_date?: string;
  duration_hours?: number;
  service_description?: string;
  estimated_price?: number;
  notes?: string;
  status?: AppointmentStatus;
}

export class AppointmentsAPI {
  /**
   * Create a new appointment
   */
  static async createAppointment(data: CreateAppointmentData): Promise<AppointmentWithRelations> {
    try {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          profile_id: data.profile_id,
          client_id: data.client_id,
          appointment_date: data.appointment_date,
          duration_hours: data.duration_hours,
          service_description: data.service_description,
          estimated_price: data.estimated_price,
          notes: data.notes,
          status: 'pending'
        })
        .select(`
          *,
          profiles!appointments_profile_id_fkey (
            id,
            name,
            avatar_url,
            profile_type,
            location,
            hourly_rate
          ),
          users!appointments_client_id_fkey (
            id,
            email,
            user_profiles (
              full_name,
              avatar_url,
              phone
            )
          )
        `)
        .single();

      if (error) throw error;
      return appointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw new Error('Failed to create appointment');
    }
  }

  /**
   * Get appointment by ID
   */
  static async getAppointment(id: string): Promise<AppointmentWithRelations> {
    try {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select(`
          *,
          profiles!appointments_profile_id_fkey (
            id,
            name,
            avatar_url,
            profile_type,
            location,
            hourly_rate,
            phone,
            email
          ),
          users!appointments_client_id_fkey (
            id,
            email,
            user_profiles (
              full_name,
              avatar_url,
              phone
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!appointment) throw new Error('Appointment not found');
      
      return appointment;
    } catch (error) {
      console.error('Error fetching appointment:', error);
      throw new Error('Failed to fetch appointment');
    }
  }

  /**
   * Update appointment
   */
  static async updateAppointment(
    id: string, 
    data: UpdateAppointmentData
  ): Promise<AppointmentWithRelations> {
    try {
      const updateData: any = {
        ...data,
        updated_at: new Date().toISOString()
      };

      const { data: appointment, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          profiles!appointments_profile_id_fkey (
            id,
            name,
            avatar_url,
            profile_type,
            location,
            hourly_rate
          ),
          users!appointments_client_id_fkey (
            id,
            email,
            user_profiles (
              full_name,
              avatar_url,
              phone
            )
          )
        `)
        .single();

      if (error) throw error;
      return appointment;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw new Error('Failed to update appointment');
    }
  }

  /**
   * Cancel appointment
   */
  static async cancelAppointment(id: string, reason?: string): Promise<AppointmentWithRelations> {
    try {
      const updateData: any = {
        status: 'cancelled',
        updated_at: new Date().toISOString()
      };

      if (reason) {
        updateData.notes = reason;
      }

      const { data: appointment, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          profiles!appointments_profile_id_fkey (
            id,
            name,
            avatar_url,
            profile_type
          ),
          users!appointments_client_id_fkey (
            id,
            email,
            user_profiles (
              full_name,
              avatar_url
            )
          )
        `)
        .single();

      if (error) throw error;
      return appointment;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw new Error('Failed to cancel appointment');
    }
  }

  /**
   * Confirm appointment
   */
  static async confirmAppointment(id: string): Promise<AppointmentWithRelations> {
    return this.updateAppointment(id, { status: 'confirmed' });
  }

  /**
   * Mark appointment as completed
   */
  static async completeAppointment(id: string): Promise<AppointmentWithRelations> {
    return this.updateAppointment(id, { status: 'completed' });
  }

  /**
   * Get appointments for a profile (artist/studio)
   */
  static async getProfileAppointments(
    profileId: string,
    filters?: {
      status?: AppointmentStatus;
      date_from?: string;
      date_to?: string;
    },
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<AppointmentWithRelations>> {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          profiles!appointments_profile_id_fkey (
            id,
            name,
            avatar_url,
            profile_type
          ),
          users!appointments_client_id_fkey (
            id,
            email,
            user_profiles (
              full_name,
              avatar_url,
              phone
            )
          )
        `, { count: 'exact' })
        .eq('profile_id', profileId);

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.date_from) {
        query = query.gte('appointment_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('appointment_date', filters.date_to);
      }

      // Apply pagination and sorting
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const offset = (page - 1) * limit;

      query = query
        .order('appointment_date', { ascending: true })
        .range(offset, offset + limit - 1);

      const { data: appointments, error, count } = await query;

      if (error) throw error;

      return {
        data: appointments || [],
        count: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching profile appointments:', error);
      throw new Error('Failed to fetch appointments');
    }
  }

  /**
   * Get appointments for a client
   */
  static async getClientAppointments(
    clientId: string,
    filters?: {
      status?: AppointmentStatus;
      date_from?: string;
      date_to?: string;
    },
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<AppointmentWithRelations>> {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          profiles!appointments_profile_id_fkey (
            id,
            name,
            avatar_url,
            profile_type,
            location,
            hourly_rate
          ),
          users!appointments_client_id_fkey (
            id,
            email,
            user_profiles (
              full_name,
              avatar_url
            )
          )
        `, { count: 'exact' })
        .eq('client_id', clientId);

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.date_from) {
        query = query.gte('appointment_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('appointment_date', filters.date_to);
      }

      // Apply pagination and sorting
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const offset = (page - 1) * limit;

      query = query
        .order('appointment_date', { ascending: true })
        .range(offset, offset + limit - 1);

      const { data: appointments, error, count } = await query;

      if (error) throw error;

      return {
        data: appointments || [],
        count: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching client appointments:', error);
      throw new Error('Failed to fetch appointments');
    }
  }

  /**
   * Check availability for a profile on a specific date
   */
  static async checkAvailability(
    profileId: string,
    date: string,
    durationHours: number = 2
  ): Promise<TimeSlot[]> {
    try {
      // Get existing appointments for the date
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_date, duration_hours')
        .eq('profile_id', profileId)
        .gte('appointment_date', `${date}T00:00:00`)
        .lt('appointment_date', `${date}T23:59:59`)
        .in('status', ['confirmed', 'in_progress'])
        .order('appointment_date');

      if (error) throw error;

      // Generate time slots (9 AM to 6 PM, 1-hour intervals)
      const slots: TimeSlot[] = [];
      const startHour = 9;
      const endHour = 18;

      for (let hour = startHour; hour <= endHour - durationHours; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + durationHours).toString().padStart(2, '0')}:00`;
        
        // Check if this slot conflicts with existing appointments
        const slotStart = new Date(`${date}T${startTime}:00`);
        const slotEnd = new Date(`${date}T${endTime}:00`);
        
        const hasConflict = appointments?.some(apt => {
          const aptStart = new Date(apt.appointment_date);
          const aptEnd = new Date(aptStart.getTime() + (apt.duration_hours * 60 * 60 * 1000));
          
          return (
            (slotStart >= aptStart && slotStart < aptEnd) ||
            (slotEnd > aptStart && slotEnd <= aptEnd) ||
            (slotStart <= aptStart && slotEnd >= aptEnd)
          );
        });

        slots.push({
          start_time: startTime,
          end_time: endTime,
          is_available: !hasConflict
        });
      }

      return slots;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw new Error('Failed to check availability');
    }
  }

  /**
   * Get upcoming appointments (next 7 days)
   */
  static async getUpcomingAppointments(
    profileId?: string,
    clientId?: string
  ): Promise<AppointmentWithRelations[]> {
    try {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      let query = supabase
        .from('appointments')
        .select(`
          *,
          profiles!appointments_profile_id_fkey (
            id,
            name,
            avatar_url,
            profile_type,
            location
          ),
          users!appointments_client_id_fkey (
            id,
            email,
            user_profiles (
              full_name,
              avatar_url,
              phone
            )
          )
        `)
        .gte('appointment_date', now.toISOString())
        .lte('appointment_date', nextWeek.toISOString())
        .in('status', ['confirmed', 'pending'])
        .order('appointment_date', { ascending: true })
        .limit(10);

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }
      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data: appointments, error } = await query;

      if (error) throw error;
      return appointments || [];
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      throw new Error('Failed to fetch upcoming appointments');
    }
  }

  /**
   * Search appointments with filters
   */
  static async searchAppointments(
    filters: AppointmentSearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<AppointmentWithRelations>> {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          profiles!appointments_profile_id_fkey (
            id,
            name,
            avatar_url,
            profile_type,
            location
          ),
          users!appointments_client_id_fkey (
            id,
            email,
            user_profiles (
              full_name,
              avatar_url
            )
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.profile_id) {
        query = query.eq('profile_id', filters.profile_id);
      }
      if (filters.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.date_from) {
        query = query.gte('appointment_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('appointment_date', filters.date_to);
      }
      if (filters.service_description) {
        query = query.ilike('service_description', `%${filters.service_description}%`);
      }

      // Apply pagination and sorting
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const offset = (page - 1) * limit;
      const sortBy = pagination?.sort_by || 'appointment_date';
      const sortOrder = pagination?.sort_order || 'asc';

      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data: appointments, error, count } = await query;

      if (error) throw error;

      return {
        data: appointments || [],
        count: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error searching appointments:', error);
      throw new Error('Failed to search appointments');
    }
  }

  /**
   * Get appointment statistics for a profile
   */
  static async getAppointmentStats(profileId: string): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    this_month: number;
    revenue_this_month: number;
  }> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get all appointments for the profile
      const { data: allAppointments, error: allError } = await supabase
        .from('appointments')
        .select('status, estimated_price, appointment_date')
        .eq('profile_id', profileId);

      if (allError) throw allError;

      // Get this month's appointments
      const { data: monthAppointments, error: monthError } = await supabase
        .from('appointments')
        .select('estimated_price')
        .eq('profile_id', profileId)
        .gte('appointment_date', startOfMonth.toISOString())
        .lte('appointment_date', endOfMonth.toISOString())
        .eq('status', 'completed');

      if (monthError) throw monthError;

      const stats = {
        total: allAppointments?.length || 0,
        pending: allAppointments?.filter(apt => apt.status === 'pending').length || 0,
        confirmed: allAppointments?.filter(apt => apt.status === 'confirmed').length || 0,
        completed: allAppointments?.filter(apt => apt.status === 'completed').length || 0,
        cancelled: allAppointments?.filter(apt => apt.status === 'cancelled').length || 0,
        this_month: monthAppointments?.length || 0,
        revenue_this_month: monthAppointments?.reduce((sum, apt) => sum + (apt.estimated_price || 0), 0) || 0
      };

      return stats;
    } catch (error) {
      console.error('Error fetching appointment stats:', error);
      throw new Error('Failed to fetch appointment statistics');
    }
  }
}
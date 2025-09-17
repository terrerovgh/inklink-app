import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UpdateAppointmentRequest } from '@/shared/types/profiles';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointmentId = params.id;

    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        profile:profiles(id, display_name, business_name, type, avatar_url, phone, email),
        client:user_profiles(id, full_name, avatar_url, phone, email)
      `)
      .eq('id', appointmentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Appointment not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching appointment:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Unexpected error in appointment fetch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointmentId = params.id;
    const body: UpdateAppointmentRequest = await request.json();
    const {
      appointment_date,
      duration_hours,
      service_type,
      description,
      estimated_price,
      status,
      notes
    } = body;

    // First, get the current appointment to check permissions and conflicts
    const { data: currentAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Appointment not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching appointment for update:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch appointment' },
        { status: 500 }
      );
    }

    // Validate status transitions
    const validStatusTransitions: Record<string, string[]> = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['completed', 'cancelled', 'no_show'],
      'cancelled': [], // Cannot change from cancelled
      'completed': [], // Cannot change from completed
      'no_show': [] // Cannot change from no_show
    };

    if (status && status !== currentAppointment.status) {
      const allowedTransitions = validStatusTransitions[currentAppointment.status] || [];
      if (!allowedTransitions.includes(status)) {
        return NextResponse.json(
          { error: `Cannot change status from ${currentAppointment.status} to ${status}` },
          { status: 400 }
        );
      }
    }

    // If updating appointment time, check for conflicts
    if (appointment_date && appointment_date !== currentAppointment.appointment_date) {
      const newDateTime = new Date(appointment_date);
      const now = new Date();
      
      if (newDateTime <= now) {
        return NextResponse.json(
          { error: 'Appointment date must be in the future' },
          { status: 400 }
        );
      }

      const newDuration = duration_hours || currentAppointment.duration_hours;
      const endTime = new Date(newDateTime.getTime() + (newDuration * 60 * 60 * 1000));
      
      const { data: conflictingAppointments } = await supabase
        .from('appointments')
        .select('id')
        .eq('profile_id', currentAppointment.profile_id)
        .neq('id', appointmentId) // Exclude current appointment
        .in('status', ['confirmed', 'pending'])
        .or(`and(appointment_date.lte.${appointment_date},appointment_end.gt.${appointment_date}),and(appointment_date.lt.${endTime.toISOString()},appointment_end.gte.${endTime.toISOString()})`);

      if (conflictingAppointments && conflictingAppointments.length > 0) {
        return NextResponse.json(
          { error: 'Time slot is not available' },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (appointment_date !== undefined) {
      updateData.appointment_date = appointment_date;
      const newDuration = duration_hours || currentAppointment.duration_hours;
      updateData.appointment_end = new Date(
        new Date(appointment_date).getTime() + (newDuration * 60 * 60 * 1000)
      ).toISOString();
    }
    
    if (duration_hours !== undefined) {
      updateData.duration_hours = duration_hours;
      const appointmentDateTime = new Date(appointment_date || currentAppointment.appointment_date);
      updateData.appointment_end = new Date(
        appointmentDateTime.getTime() + (duration_hours * 60 * 60 * 1000)
      ).toISOString();
    }
    
    if (service_type !== undefined) updateData.service_type = service_type;
    if (description !== undefined) updateData.description = description;
    if (estimated_price !== undefined) updateData.estimated_price = estimated_price;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    
    updateData.updated_at = new Date().toISOString();

    // Update the appointment
    const { data: appointment, error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .select(`
        *,
        profile:profiles(id, display_name, business_name, type, avatar_url, phone, email),
        client:user_profiles(id, full_name, avatar_url, phone, email)
      `)
      .single();

    if (updateError) {
      console.error('Error updating appointment:', updateError);
      return NextResponse.json(
        { error: 'Failed to update appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Unexpected error in appointment update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointmentId = params.id;

    // First, get the appointment to check if it can be deleted
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('status, appointment_date')
      .eq('id', appointmentId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Appointment not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching appointment for deletion:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch appointment' },
        { status: 500 }
      );
    }

    // Check if appointment can be deleted
    if (appointment.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot delete completed appointments' },
        { status: 400 }
      );
    }

    // Check if appointment is in the past
    const appointmentDate = new Date(appointment.appointment_date);
    const now = new Date();
    if (appointmentDate < now && appointment.status !== 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot delete past appointments that are not cancelled' },
        { status: 400 }
      );
    }

    // Delete the appointment
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);

    if (deleteError) {
      console.error('Error deleting appointment:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Appointment deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in appointment deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
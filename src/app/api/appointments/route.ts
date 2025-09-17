import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Appointment, AppointmentsResponse, CreateAppointmentRequest } from '@/shared/types/profiles';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profile_id');
    const clientId = searchParams.get('client_id');
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('appointments')
      .select(`
        *,
        profile:profiles(id, display_name, business_name, type, avatar_url),
        client:user_profiles(id, full_name, avatar_url)
      `)
      .order('appointment_date', { ascending: true });

    // Apply filters
    if (profileId) {
      query = query.eq('profile_id', profileId);
    }

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('appointment_date', startDate);
    }

    if (endDate) {
      query = query.lte('appointment_date', endDate);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: appointments, error, count } = await query;

    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let totalCount = count;
    if (totalCount === null) {
      const { count: totalCountResult } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });
      totalCount = totalCountResult || 0;
    }

    const response: AppointmentsResponse = {
      appointments: appointments || [],
      total: totalCount,
      page: Math.floor(offset / limit) + 1,
      limit,
      hasMore: (offset + limit) < totalCount
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in appointments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateAppointmentRequest = await request.json();
    const {
      profile_id,
      client_id,
      appointment_date,
      duration_hours,
      service_type,
      description,
      estimated_price
    } = body;

    // Validate required fields
    if (!profile_id || !client_id || !appointment_date || !duration_hours) {
      return NextResponse.json(
        { error: 'Missing required fields: profile_id, client_id, appointment_date, duration_hours' },
        { status: 400 }
      );
    }

    // Validate appointment date is in the future
    const appointmentDateTime = new Date(appointment_date);
    const now = new Date();
    if (appointmentDateTime <= now) {
      return NextResponse.json(
        { error: 'Appointment date must be in the future' },
        { status: 400 }
      );
    }

    // Check if profile exists and is active
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, is_active')
      .eq('id', profile_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (!profile.is_active) {
      return NextResponse.json(
        { error: 'Profile is not accepting appointments' },
        { status: 400 }
      );
    }

    // Check for scheduling conflicts
    const endTime = new Date(appointmentDateTime.getTime() + (duration_hours * 60 * 60 * 1000));
    
    const { data: conflictingAppointments } = await supabase
      .from('appointments')
      .select('id')
      .eq('profile_id', profile_id)
      .in('status', ['confirmed', 'pending'])
      .or(`and(appointment_date.lte.${appointment_date},appointment_end.gt.${appointment_date}),and(appointment_date.lt.${endTime.toISOString()},appointment_end.gte.${endTime.toISOString()})`);

    if (conflictingAppointments && conflictingAppointments.length > 0) {
      return NextResponse.json(
        { error: 'Time slot is not available' },
        { status: 409 }
      );
    }

    // Create the appointment
    const { data: appointment, error: createError } = await supabase
      .from('appointments')
      .insert({
        profile_id,
        client_id,
        appointment_date,
        appointment_end: endTime.toISOString(),
        duration_hours,
        service_type: service_type || null,
        description: description || null,
        estimated_price: estimated_price || null,
        status: 'pending'
      })
      .select(`
        *,
        profile:profiles(id, display_name, business_name, type, avatar_url),
        client:user_profiles(id, full_name, avatar_url)
      `)
      .single();

    if (createError) {
      console.error('Error creating appointment:', createError);
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in appointment creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // In a real app, you would get the user ID from the session/JWT token
    // For now, we'll use a header or query parameter
    const userId = request.headers.get('x-user-id') || request.nextUrl.searchParams.get('user_id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    // First, get the user profile to get the profile_id
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('profile_id')
      .eq('id', userId)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching user profile:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    if (!userProfile.profile_id) {
      return NextResponse.json(
        { error: 'No professional profile found' },
        { status: 404 }
      );
    }

    // Get the professional profile with all related data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        specialties:profile_specialties(
          specialty:specialties(id, name, category)
        ),
        portfolio_images(
          id,
          image_url,
          title,
          description,
          tags,
          display_order,
          created_at
        )
      `)
      .eq('id', userProfile.profile_id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Professional profile not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching professional profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch professional profile' },
        { status: 500 }
      );
    }

    // Transform the data to match our Profile type
    const transformedProfile = {
      ...profile,
      specialties: profile.specialties?.map((ps: any) => ps.specialty) || [],
      portfolio_images: profile.portfolio_images || []
    };

    return NextResponse.json({ profile: transformedProfile });
  } catch (error) {
    console.error('Unexpected error in profile fetch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // In a real app, you would get the user ID from the session/JWT token
    const userId = request.headers.get('x-user-id') || request.nextUrl.searchParams.get('user_id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      display_name,
      business_name,
      bio,
      phone,
      email,
      website,
      instagram,
      address,
      city,
      state,
      zip_code,
      country,
      latitude,
      longitude,
      specialties,
      years_experience,
      hourly_rate_min,
      hourly_rate_max,
      is_mobile,
      accepts_walk_ins,
      consultation_required,
      min_age_requirement,
      portfolio_highlights,
      certifications,
      awards,
      working_hours,
      amenities,
      is_active
    } = body;

    // Get the user's profile ID
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('profile_id')
      .eq('id', userId)
      .single();

    if (userError || !userProfile.profile_id) {
      return NextResponse.json(
        { error: 'Professional profile not found' },
        { status: 404 }
      );
    }

    // Update the profile
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name,
        business_name,
        bio,
        phone,
        email,
        website,
        instagram,
        address,
        city,
        state,
        zip_code,
        country,
        latitude,
        longitude,
        years_experience,
        hourly_rate_min,
        hourly_rate_max,
        is_mobile,
        accepts_walk_ins,
        consultation_required,
        min_age_requirement,
        portfolio_highlights,
        certifications,
        awards,
        working_hours,
        amenities,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', userProfile.profile_id)
      .select(`
        *,
        specialties:profile_specialties(
          specialty:specialties(id, name, category)
        ),
        portfolio_images(
          id,
          image_url,
          title,
          description,
          tags,
          display_order,
          created_at
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Update specialties if provided
    if (specialties && Array.isArray(specialties)) {
      // Delete existing specialties
      await supabase
        .from('profile_specialties')
        .delete()
        .eq('profile_id', userProfile.profile_id);

      // Insert new specialties
      if (specialties.length > 0) {
        const specialtyInserts = specialties.map(specialtyId => ({
          profile_id: userProfile.profile_id,
          specialty_id: specialtyId
        }));

        await supabase
          .from('profile_specialties')
          .insert(specialtyInserts);
      }

      // Fetch updated profile with specialties
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select(`
          *,
          specialties:profile_specialties(
            specialty:specialties(id, name, category)
          ),
          portfolio_images(
            id,
            image_url,
            title,
            description,
            tags,
            display_order,
            created_at
          )
        `)
        .eq('id', userProfile.profile_id)
        .single();

      if (updatedProfile) {
        const transformedProfile = {
          ...updatedProfile,
          specialties: updatedProfile.specialties?.map((ps: any) => ps.specialty) || [],
          portfolio_images: updatedProfile.portfolio_images || []
        };
        return NextResponse.json({ profile: transformedProfile });
      }
    }

    // Transform the data to match our Profile type
    const transformedProfile = {
      ...profile,
      specialties: profile.specialties?.map((ps: any) => ps.specialty) || [],
      portfolio_images: profile.portfolio_images || []
    };

    return NextResponse.json({ profile: transformedProfile });
  } catch (error) {
    console.error('Unexpected error in profile update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
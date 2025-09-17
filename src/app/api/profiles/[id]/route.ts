import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UpdateProfileRequest } from '@/shared/types/profiles';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/profiles/[id] - Get a specific profile
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createClient();
    const { id } = params;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_profile:user_profiles(*),
        portfolio_images(*),
        specialties:profile_specialties(
          proficiency_level,
          specialty:specialties(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Profile not found' }, success: false },
          { status: 404 }
        );
      }
      console.error('Error fetching profile:', error);
      return NextResponse.json(
        { error: { code: 'FETCH_ERROR', message: 'Failed to fetch profile' }, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: profile, success: true });
  } catch (error) {
    console.error('Unexpected error in GET /api/profiles/[id]:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, success: false },
      { status: 500 }
    );
  }
}

// PUT /api/profiles/[id] - Update a specific profile
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createClient();
    const { id } = params;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' }, success: false },
        { status: 401 }
      );
    }

    const body: UpdateProfileRequest = await request.json();

    // Check if the user owns this profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        *,
        user_profile:user_profiles!inner(user_id)
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Profile not found' }, success: false },
          { status: 404 }
        );
      }
      console.error('Error fetching profile for update:', fetchError);
      return NextResponse.json(
        { error: { code: 'FETCH_ERROR', message: 'Failed to fetch profile' }, success: false },
        { status: 500 }
      );
    }

    // Check ownership
    if (existingProfile.user_profile.user_id !== user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You can only update your own profile' }, success: false },
        { status: 403 }
      );
    }

    // Update user profile if needed
    if (body.display_name || body.bio || body.social_links || body.contact_info) {
      const userProfileUpdates: any = {};
      if (body.display_name) userProfileUpdates.display_name = body.display_name;
      if (body.bio !== undefined) userProfileUpdates.bio = body.bio;
      if (body.social_links) userProfileUpdates.social_links = body.social_links;
      if (body.contact_info) userProfileUpdates.contact_info = body.contact_info;

      const { error: userProfileError } = await supabase
        .from('user_profiles')
        .update(userProfileUpdates)
        .eq('id', existingProfile.user_profile_id);

      if (userProfileError) {
        console.error('Error updating user profile:', userProfileError);
        return NextResponse.json(
          { error: { code: 'UPDATE_ERROR', message: 'Failed to update user profile' }, success: false },
          { status: 500 }
        );
      }
    }

    // Prepare profile updates
    const profileUpdates: any = {};
    
    // Common fields
    if (body.name) profileUpdates.name = body.name;
    if (body.description !== undefined) profileUpdates.description = body.description;
    if (body.location !== undefined) profileUpdates.location = body.location;
    if (body.phone !== undefined) profileUpdates.phone = body.phone;
    if (body.email !== undefined) profileUpdates.email = body.email;
    if (body.website !== undefined) profileUpdates.website = body.website;
    if (body.instagram !== undefined) profileUpdates.instagram = body.instagram;

    // Handle coordinates
    if (body.coordinates) {
      profileUpdates.coordinates = `POINT(${body.coordinates[0]} ${body.coordinates[1]})`;
    }

    // Type-specific fields
    if (existingProfile.profile_type === 'artist') {
      if (body.experience_years !== undefined) profileUpdates.experience_years = body.experience_years;
      if (body.hourly_rate !== undefined) profileUpdates.hourly_rate = body.hourly_rate;
      if (body.studio_affiliation !== undefined) profileUpdates.studio_affiliation = body.studio_affiliation;
    } else if (existingProfile.profile_type === 'studio') {
      if (body.address !== undefined) profileUpdates.address = body.address;
      if (body.opening_hours !== undefined) profileUpdates.opening_hours = body.opening_hours;
      if (body.amenities !== undefined) profileUpdates.amenities = body.amenities;
      if (body.capacity !== undefined) profileUpdates.capacity = body.capacity;
    }

    // Update the profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', id)
      .select(`
        *,
        user_profile:user_profiles(*),
        portfolio_images(*),
        specialties:profile_specialties(
          proficiency_level,
          specialty:specialties(*)
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: { code: 'UPDATE_ERROR', message: 'Failed to update profile' }, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updatedProfile, success: true });
  } catch (error) {
    console.error('Unexpected error in PUT /api/profiles/[id]:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, success: false },
      { status: 500 }
    );
  }
}

// DELETE /api/profiles/[id] - Delete a specific profile
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createClient();
    const { id } = params;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' }, success: false },
        { status: 401 }
      );
    }

    // Check if the user owns this profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        *,
        user_profile:user_profiles!inner(user_id)
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Profile not found' }, success: false },
          { status: 404 }
        );
      }
      console.error('Error fetching profile for deletion:', fetchError);
      return NextResponse.json(
        { error: { code: 'FETCH_ERROR', message: 'Failed to fetch profile' }, success: false },
        { status: 500 }
      );
    }

    // Check ownership
    if (existingProfile.user_profile.user_id !== user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You can only delete your own profile' }, success: false },
        { status: 403 }
      );
    }

    // Delete the profile (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting profile:', deleteError);
      return NextResponse.json(
        { error: { code: 'DELETE_ERROR', message: 'Failed to delete profile' }, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/profiles/[id]:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, success: false },
      { status: 500 }
    );
  }
}
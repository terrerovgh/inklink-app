import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  CreateProfileRequest, 
  ProfileSearchFilters, 
  ProfileSearchResult,
  ProfileWithRelations 
} from '@/shared/types/profiles';

// GET /api/profiles - Search and list profiles
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const query = searchParams.get('q') || '';
    const profileType = searchParams.get('type') || 'all';
    const location = searchParams.get('location') || '';
    const specialtiesParam = searchParams.get('specialties') || '';
    const minRating = parseFloat(searchParams.get('rating') || '0');
    const maxDistance = parseFloat(searchParams.get('distance') || '50');
    const priceRange = searchParams.get('price')?.split('-').map(Number) || [0, 500];
    const experienceRange = searchParams.get('experience')?.split('-').map(Number) || [0, 20];
    const availability = searchParams.get('availability') || 'all';
    const amenitiesParam = searchParams.get('amenities') || '';
    const sortBy = searchParams.get('sort') || 'relevance';
    const sortOrder = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    
    // Advanced search parameters
    const isAdvanced = searchParams.get('advanced') === 'true';
    const specialtyOperator = searchParams.get('specialty_op') || 'OR';
    const servicesParam = searchParams.get('services') || '';
    const servicesOperator = searchParams.get('services_op') || 'OR';
    const amenitiesOperator = searchParams.get('amenities_op') || 'OR';
    const availabilityDays = searchParams.get('availability_days')?.split(',').filter(Boolean) || [];
    const availabilityTime = searchParams.get('availability_time') || 'any';
    const includeInactive = searchParams.get('include_inactive') === 'true';
    const verifiedOnly = searchParams.get('verified_only') === 'true';
    const hasPortfolio = searchParams.get('has_portfolio') === 'true';
    const acceptsNewClients = searchParams.get('accepts_new_clients') === 'true';

    // Parse search filters from query parameters
    const filters: ProfileSearchFilters = {
      profile_type: profileType as 'artist' | 'studio' || undefined,
      location: location || undefined,
      coordinates: searchParams.get('coordinates') ? 
        JSON.parse(searchParams.get('coordinates')!) : undefined,
      radius: maxDistance,
      specialties: specialtiesParam ? specialtiesParam.split(',') : undefined,
      min_rating: minRating,
      max_price: priceRange[1],
      search_query: query || undefined,
      sort_by: sortBy as any || 'rating',
      sort_order: sortOrder as 'asc' | 'desc' || 'desc',
      page: page,
      limit: limit,
    };

    // Build the query
    let query = supabase
      .from('profiles')
      .select(`
        *,
        user_profile:user_profiles(*),
        portfolio_images(*),
        specialties:profile_specialties(
          proficiency_level,
          specialty:specialties(*)
        )
      `);

    // Apply filters
    if (filters.profile_type) {
      query = query.eq('profile_type', filters.profile_type);
    }

    if (filters.search_query) {
      query = query.or(`name.ilike.%${filters.search_query}%,description.ilike.%${filters.search_query}%`);
    }

    if (filters.min_rating) {
      query = query.gte('rating', filters.min_rating);
    }

    if (filters.max_price) {
      query = query.lte('hourly_rate', filters.max_price);
    }

    // Apply location-based filtering if coordinates and radius are provided
    if (filters.coordinates && filters.radius) {
      const [lng, lat] = filters.coordinates;
      query = query.rpc('profiles_within_radius', {
        center_lat: lat,
        center_lng: lng,
        radius_km: filters.radius
      });
    }

    // Apply specialties filter with logical operators
    if (filters.specialties && filters.specialties.length > 0) {
      if (isAdvanced && specialtyOperator === 'AND') {
        // For AND operation, all specialties must be present
        for (const specialty of filters.specialties) {
          query = query.in('id', 
            supabase
              .from('profile_specialties')
              .select('profile_id')
              .in('specialty_id', 
                supabase
                  .from('specialties')
                  .select('id')
                  .eq('name', specialty)
              )
          );
        }
      } else {
        // For OR operation (default), any specialty can match
        query = query.in('id', 
          supabase
            .from('profile_specialties')
            .select('profile_id')
            .in('specialty_id', 
              supabase
                .from('specialties')
                .select('id')
                .in('name', filters.specialties)
            )
        );
      }
    }
    
    // Apply services filter (advanced mode only)
    if (isAdvanced && servicesParam) {
      const services = servicesParam.split(',').filter(Boolean);
      if (services.length > 0) {
        if (servicesOperator === 'AND') {
          for (const service of services) {
            query = query.contains('services', [service]);
          }
        } else {
          query = query.or(
            services.map(service => `services.cs.{"${service}"}`).join(',')
          );
        }
      }
    }

    // Apply amenities filter with logical operators
    const amenities = amenitiesParam.split(',').filter(Boolean);
    if (amenities.length > 0) {
      if (isAdvanced && amenitiesOperator === 'AND') {
        // For AND operation, all amenities must be present
        for (const amenity of amenities) {
          query = query.contains('amenities', [amenity]);
        }
      } else {
        // For OR operation (default), any amenity can match
        query = query.or(
          amenities.map(amenity => `amenities.cs.{"${amenity}"}`).join(',')
        );
      }
    }
    
    // Apply advanced availability filters
    if (isAdvanced && availability === 'custom') {
      if (availabilityDays.length > 0) {
        query = query.or(
          availabilityDays.map(day => `availability_schedule.${day}.neq.null`).join(',')
        );
      }
      
      if (availabilityTime !== 'any') {
        // This would require more complex logic based on time preferences
        // For now, we'll add a simple filter
        query = query.not('availability_schedule', 'is', null);
      }
    }
    
    // Apply advanced boolean filters
    if (isAdvanced) {
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      
      if (verifiedOnly) {
        query = query.eq('is_verified', true);
      }
      
      if (hasPortfolio) {
        query = query.not('portfolio_images', 'is', null)
                     .gt('portfolio_images->0', 'null');
      }
      
      if (acceptsNewClients) {
        query = query.eq('accepts_new_clients', true);
      }
    }

    // Apply sorting
    const sortColumn = filters.sort_by === 'reviews' ? 'total_reviews' : filters.sort_by;
    query = query.order(sortColumn!, { ascending: filters.sort_order === 'asc' });

    // Apply pagination
    const from = (filters.page! - 1) * filters.limit!;
    const to = from + filters.limit! - 1;
    query = query.range(from, to);

    const { data: profiles, error, count } = await query;

    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json(
        { error: { code: 'FETCH_ERROR', message: 'Failed to fetch profiles' }, success: false },
        { status: 500 }
      );
    }

    const result: ProfileSearchResult = {
      profiles: profiles || [],
      total: count || 0,
      page: filters.page!,
      limit: filters.limit!,
      has_more: (count || 0) > filters.page! * filters.limit!
    };

    return NextResponse.json({ data: result, success: true });
  } catch (error) {
    console.error('Unexpected error in GET /api/profiles:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, success: false },
      { status: 500 }
    );
  }
}

// POST /api/profiles - Create a new profile
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' }, success: false },
        { status: 401 }
      );
    }

    const body: CreateProfileRequest = await request.json();

    // Validate required fields
    if (!body.profile_type || !body.display_name || !body.name) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' }, success: false },
        { status: 400 }
      );
    }

    // Start a transaction
    const { data: existingUserProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let userProfileId: string;

    if (existingUserProfile) {
      // Update existing user profile
      const { data: updatedUserProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          profile_type: body.profile_type,
          display_name: body.display_name,
          bio: body.bio,
          social_links: body.social_links || {},
          contact_info: body.contact_info || {},
        })
        .eq('id', existingUserProfile.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user profile:', updateError);
        return NextResponse.json(
          { error: { code: 'UPDATE_ERROR', message: 'Failed to update user profile' }, success: false },
          { status: 500 }
        );
      }

      userProfileId = updatedUserProfile.id;
    } else {
      // Create new user profile
      const { data: newUserProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          profile_type: body.profile_type,
          display_name: body.display_name,
          bio: body.bio,
          social_links: body.social_links || {},
          contact_info: body.contact_info || {},
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user profile:', createError);
        return NextResponse.json(
          { error: { code: 'CREATE_ERROR', message: 'Failed to create user profile' }, success: false },
          { status: 500 }
        );
      }

      userProfileId = newUserProfile.id;
    }

    // Create the professional profile
    const profileData: any = {
      user_profile_id: userProfileId,
      profile_type: body.profile_type,
      name: body.name,
      description: body.description,
      location: body.location,
      phone: body.phone,
      email: body.email,
      website: body.website,
      instagram: body.instagram,
    };

    // Add coordinates if provided
    if (body.coordinates) {
      profileData.coordinates = `POINT(${body.coordinates[0]} ${body.coordinates[1]})`;
    }

    // Add type-specific fields
    if (body.profile_type === 'artist') {
      profileData.experience_years = body.experience_years;
      profileData.hourly_rate = body.hourly_rate;
      profileData.studio_affiliation = body.studio_affiliation;
    } else if (body.profile_type === 'studio') {
      profileData.address = body.address;
      profileData.opening_hours = body.opening_hours;
      profileData.amenities = body.amenities;
      profileData.capacity = body.capacity;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
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

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return NextResponse.json(
        { error: { code: 'CREATE_ERROR', message: 'Failed to create profile' }, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: profile, success: true }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/profiles:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, success: false },
      { status: 500 }
    );
  }
}
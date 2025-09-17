import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Review, ReviewsResponse, CreateReviewRequest } from '@/shared/types/profiles';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profile_id');
    const clientId = searchParams.get('client_id');
    const rating = searchParams.get('rating');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    let query = supabase
      .from('reviews')
      .select(`
        *,
        profile:profiles(id, display_name, business_name, type, avatar_url),
        client:user_profiles(id, full_name, avatar_url)
      `)
      .order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply filters
    if (profileId) {
      query = query.eq('profile_id', profileId);
    }

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (rating) {
      query = query.eq('rating', parseInt(rating));
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: reviews, error, count } = await query;

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let totalCount = count;
    if (totalCount === null) {
      const { count: totalCountResult } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });
      totalCount = totalCountResult || 0;
    }

    // Calculate rating statistics if profile_id is provided
    let ratingStats = null;
    if (profileId) {
      const { data: stats } = await supabase
        .from('reviews')
        .select('rating')
        .eq('profile_id', profileId);

      if (stats && stats.length > 0) {
        const ratings = stats.map(s => s.rating);
        const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        const distribution = [1, 2, 3, 4, 5].map(star => 
          ratings.filter(rating => rating === star).length
        );

        ratingStats = {
          average: Math.round(average * 10) / 10,
          total: ratings.length,
          distribution
        };
      }
    }

    const response: ReviewsResponse = {
      reviews: reviews || [],
      total: totalCount,
      page: Math.floor(offset / limit) + 1,
      limit,
      hasMore: (offset + limit) < totalCount,
      ratingStats
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in reviews API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  try {
    const body: CreateReviewRequest = await request.json();
    const {
      profile_id,
      client_id,
      appointment_id,
      rating,
      comment,
      service_type
    } = body;

    // Validate required fields
    if (!profile_id || !client_id || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields: profile_id, client_id, rating' },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profile_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if client exists
    const { data: client, error: clientError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // If appointment_id is provided, validate it
    if (appointment_id) {
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('id, status, profile_id, client_id')
        .eq('id', appointment_id)
        .single();

      if (appointmentError || !appointment) {
        return NextResponse.json(
          { error: 'Appointment not found' },
          { status: 404 }
        );
      }

      // Verify appointment belongs to the profile and client
      if (appointment.profile_id !== profile_id || appointment.client_id !== client_id) {
        return NextResponse.json(
          { error: 'Appointment does not match profile and client' },
          { status: 400 }
        );
      }

      // Only allow reviews for completed appointments
      if (appointment.status !== 'completed') {
        return NextResponse.json(
          { error: 'Can only review completed appointments' },
          { status: 400 }
        );
      }

      // Check if review already exists for this appointment
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('appointment_id', appointment_id)
        .single();

      if (existingReview) {
        return NextResponse.json(
          { error: 'Review already exists for this appointment' },
          { status: 409 }
        );
      }
    } else {
      // If no appointment_id, check if client has already reviewed this profile
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('profile_id', profile_id)
        .eq('client_id', client_id)
        .is('appointment_id', null)
        .single();

      if (existingReview) {
        return NextResponse.json(
          { error: 'You have already reviewed this profile' },
          { status: 409 }
        );
      }
    }

    // Content moderation - basic profanity and spam detection
    const moderationResult = await moderateContent(comment || '');
    if (!moderationResult.approved) {
      return NextResponse.json(
        { error: 'Review content violates community guidelines' },
        { status: 400 }
      );
    }

    // Create the review
    const { data: review, error: createError } = await supabase
      .from('reviews')
      .insert({
        profile_id,
        client_id,
        appointment_id: appointment_id || null,
        rating,
        comment: comment || null,
        service_type: service_type || null,
        is_verified: !!appointment_id // Verified if linked to appointment
      })
      .select(`
        *,
        profile:profiles(id, display_name, business_name, type, avatar_url),
        client:user_profiles(id, full_name, avatar_url)
      `)
      .single();

    if (createError) {
      console.error('Error creating review:', createError);
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      );
    }

    // Update profile rating statistics
    await updateProfileRatingStats(profile_id);

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in review creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function for content moderation
async function moderateContent(content: string): Promise<{ approved: boolean; reason?: string }> {
  // Basic profanity filter - in production, use a proper moderation service
  const profanityWords = [
    'spam', 'fake', 'scam', 'terrible', 'awful', 'horrible',
    // Add more words as needed
  ];

  const lowerContent = content.toLowerCase();
  
  // Check for excessive profanity
  const profanityCount = profanityWords.filter(word => lowerContent.includes(word)).length;
  if (profanityCount > 2) {
    return { approved: false, reason: 'Excessive profanity' };
  }

  // Check for spam patterns
  if (content.length > 1000) {
    return { approved: false, reason: 'Content too long' };
  }

  // Check for repeated characters (spam indicator)
  if (/(..)\1{4,}/.test(content)) {
    return { approved: false, reason: 'Spam pattern detected' };
  }

  return { approved: true };
}

// Helper function to update profile rating statistics
async function updateProfileRatingStats(profileId: string) {
  try {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('profile_id', profileId);

    if (reviews && reviews.length > 0) {
      const ratings = reviews.map(r => r.rating);
      const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      const total = ratings.length;

      await supabase
        .from('profiles')
        .update({
          average_rating: Math.round(average * 10) / 10,
          total_reviews: total
        })
        .eq('id', profileId);
    }
  } catch (error) {
    console.error('Error updating profile rating stats:', error);
  }
}
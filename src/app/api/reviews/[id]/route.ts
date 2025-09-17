import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UpdateReviewRequest } from '@/shared/types/profiles';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviewId = params.id;

    const { data: review, error } = await supabase
      .from('reviews')
      .select(`
        *,
        profile:profiles(id, display_name, business_name, type, avatar_url),
        client:user_profiles(id, full_name, avatar_url),
        appointment:appointments(id, appointment_date, service_type)
      `)
      .eq('id', reviewId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Review not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching review:', error);
      return NextResponse.json(
        { error: 'Failed to fetch review' },
        { status: 500 }
      );
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Unexpected error in review fetch:', error);
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
    const reviewId = params.id;
    const body: UpdateReviewRequest = await request.json();
    const { rating, comment, service_type } = body;

    // First, get the current review to check permissions
    const { data: currentReview, error: fetchError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Review not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching review for update:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch review' },
        { status: 500 }
      );
    }

    // Check if review is too old to edit (e.g., 30 days)
    const reviewDate = new Date(currentReview.created_at);
    const now = new Date();
    const daysDifference = (now.getTime() - reviewDate.getTime()) / (1000 * 3600 * 24);
    
    if (daysDifference > 30) {
      return NextResponse.json(
        { error: 'Cannot edit reviews older than 30 days' },
        { status: 400 }
      );
    }

    // Validate rating if provided
    if (rating !== undefined) {
      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return NextResponse.json(
          { error: 'Rating must be an integer between 1 and 5' },
          { status: 400 }
        );
      }
    }

    // Content moderation for comment if provided
    if (comment !== undefined) {
      const moderationResult = await moderateContent(comment);
      if (!moderationResult.approved) {
        return NextResponse.json(
          { error: 'Review content violates community guidelines' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (rating !== undefined) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment;
    if (service_type !== undefined) updateData.service_type = service_type;

    // Update the review
    const { data: review, error: updateError } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select(`
        *,
        profile:profiles(id, display_name, business_name, type, avatar_url),
        client:user_profiles(id, full_name, avatar_url),
        appointment:appointments(id, appointment_date, service_type)
      `)
      .single();

    if (updateError) {
      console.error('Error updating review:', updateError);
      return NextResponse.json(
        { error: 'Failed to update review' },
        { status: 500 }
      );
    }

    // Update profile rating statistics if rating changed
    if (rating !== undefined && rating !== currentReview.rating) {
      await updateProfileRatingStats(currentReview.profile_id);
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Unexpected error in review update:', error);
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
    const reviewId = params.id;

    // First, get the review to check permissions and get profile_id
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('profile_id, client_id, created_at')
      .eq('id', reviewId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Review not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching review for deletion:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch review' },
        { status: 500 }
      );
    }

    // Check if review is too old to delete (e.g., 7 days)
    const reviewDate = new Date(review.created_at);
    const now = new Date();
    const daysDifference = (now.getTime() - reviewDate.getTime()) / (1000 * 3600 * 24);
    
    if (daysDifference > 7) {
      return NextResponse.json(
        { error: 'Cannot delete reviews older than 7 days' },
        { status: 400 }
      );
    }

    // Delete the review
    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (deleteError) {
      console.error('Error deleting review:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete review' },
        { status: 500 }
      );
    }

    // Update profile rating statistics
    await updateProfileRatingStats(review.profile_id);

    return NextResponse.json(
      { message: 'Review deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in review deletion:', error);
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
    } else {
      // No reviews left, reset stats
      await supabase
        .from('profiles')
        .update({
          average_rating: null,
          total_reviews: 0
        })
        .eq('id', profileId);
    }
  } catch (error) {
    console.error('Error updating profile rating stats:', error);
  }
}
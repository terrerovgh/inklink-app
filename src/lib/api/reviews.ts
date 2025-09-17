import { supabase } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/server';
import { 
  Review, 
  CreateReviewRequest, 
  UpdateReviewRequest,
  ReviewWithRelations,
  ReviewSearchFilters,
  PaginationParams,
  PaginatedResponse
} from '@/types/database';

export interface CreateReviewData {
  profile_id: string;
  client_id: string;
  appointment_id?: string;
  rating: number; // 1-5
  comment: string;
  images?: string[]; // URLs of review images
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
  images?: string[];
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recent_reviews: ReviewWithRelations[];
}

export interface ReviewFilters {
  profile_id?: string;
  client_id?: string;
  rating?: number;
  date_from?: string;
  date_to?: string;
  has_images?: boolean;
}

export class ReviewsAPI {
  /**
   * Create a new review
   */
  static async createReview(data: CreateReviewData): Promise<ReviewWithRelations> {
    try {
      // Validate rating
      if (data.rating < 1 || data.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Check if user already reviewed this profile
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('profile_id', data.profile_id)
        .eq('client_id', data.client_id)
        .single();

      if (existingReview) {
        throw new Error('You have already reviewed this profile');
      }

      const { data: review, error } = await supabase
        .from('reviews')
        .insert({
          profile_id: data.profile_id,
          client_id: data.client_id,
          appointment_id: data.appointment_id,
          rating: data.rating,
          comment: data.comment,
          images: data.images || []
        })
        .select(`
          *,
          profiles!reviews_profile_id_fkey (
            id,
            name,
            avatar_url,
            profile_type
          ),
          users!reviews_client_id_fkey (
            id,
            email,
            user_profiles (
              full_name,
              avatar_url
            )
          ),
          appointments!reviews_appointment_id_fkey (
            id,
            appointment_date,
            service_description
          )
        `)
        .single();

      if (error) throw error;

      // Update profile average rating
      await this.updateProfileRating(data.profile_id);

      return review;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error instanceof Error ? error : new Error('Failed to create review');
    }
  }

  /**
   * Get review by ID
   */
  static async getReview(id: string): Promise<ReviewWithRelations> {
    try {
      const { data: review, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_profile_id_fkey (
            id,
            name,
            avatar_url,
            profile_type
          ),
          users!reviews_client_id_fkey (
            id,
            email,
            user_profiles (
              full_name,
              avatar_url
            )
          ),
          appointments!reviews_appointment_id_fkey (
            id,
            appointment_date,
            service_description
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!review) throw new Error('Review not found');
      
      return review;
    } catch (error) {
      console.error('Error fetching review:', error);
      throw new Error('Failed to fetch review');
    }
  }

  /**
   * Update review
   */
  static async updateReview(
    id: string, 
    data: UpdateReviewData
  ): Promise<ReviewWithRelations> {
    try {
      // Validate rating if provided
      if (data.rating && (data.rating < 1 || data.rating > 5)) {
        throw new Error('Rating must be between 1 and 5');
      }

      const updateData: any = {
        ...data,
        updated_at: new Date().toISOString()
      };

      const { data: review, error } = await supabase
        .from('reviews')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          profiles!reviews_profile_id_fkey (
            id,
            name,
            avatar_url,
            profile_type
          ),
          users!reviews_client_id_fkey (
            id,
            email,
            user_profiles (
              full_name,
              avatar_url
            )
          ),
          appointments!reviews_appointment_id_fkey (
            id,
            appointment_date,
            service_description
          )
        `)
        .single();

      if (error) throw error;

      // Update profile average rating if rating was changed
      if (data.rating) {
        await this.updateProfileRating(review.profile_id);
      }

      return review;
    } catch (error) {
      console.error('Error updating review:', error);
      throw new Error('Failed to update review');
    }
  }

  /**
   * Delete review
   */
  static async deleteReview(id: string): Promise<void> {
    try {
      // Get the review to know which profile to update
      const { data: review } = await supabase
        .from('reviews')
        .select('profile_id')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update profile average rating
      if (review) {
        await this.updateProfileRating(review.profile_id);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      throw new Error('Failed to delete review');
    }
  }

  /**
   * Get reviews for a profile
   */
  static async getProfileReviews(
    profileId: string,
    filters?: {
      rating?: number;
      date_from?: string;
      date_to?: string;
      has_images?: boolean;
    },
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<ReviewWithRelations>> {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_profile_id_fkey (
            id,
            name,
            avatar_url,
            profile_type
          ),
          users!reviews_client_id_fkey (
            id,
            email,
            user_profiles (
              full_name,
              avatar_url
            )
          ),
          appointments!reviews_appointment_id_fkey (
            id,
            appointment_date,
            service_description
          )
        `, { count: 'exact' })
        .eq('profile_id', profileId);

      // Apply filters
      if (filters?.rating) {
        query = query.eq('rating', filters.rating);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters?.has_images) {
        query = query.not('images', 'is', null);
      }

      // Apply pagination and sorting
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const offset = (page - 1) * limit;
      const sortBy = pagination?.sort_by || 'created_at';
      const sortOrder = pagination?.sort_order || 'desc';

      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data: reviews, error, count } = await query;

      if (error) throw error;

      return {
        data: reviews || [],
        count: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching profile reviews:', error);
      throw new Error('Failed to fetch reviews');
    }
  }

  /**
   * Get reviews by a client
   */
  static async getClientReviews(
    clientId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<ReviewWithRelations>> {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_profile_id_fkey (
            id,
            name,
            avatar_url,
            profile_type
          ),
          users!reviews_client_id_fkey (
            id,
            email,
            user_profiles (
              full_name,
              avatar_url
            )
          ),
          appointments!reviews_appointment_id_fkey (
            id,
            appointment_date,
            service_description
          )
        `, { count: 'exact' })
        .eq('client_id', clientId);

      // Apply pagination and sorting
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const offset = (page - 1) * limit;

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: reviews, error, count } = await query;

      if (error) throw error;

      return {
        data: reviews || [],
        count: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching client reviews:', error);
      throw new Error('Failed to fetch client reviews');
    }
  }

  /**
   * Get review statistics for a profile
   */
  static async getReviewStats(profileId: string): Promise<ReviewStats> {
    try {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
          rating,
          created_at,
          comment,
          users!reviews_client_id_fkey (
            user_profiles (
              full_name,
              avatar_url
            )
          )
        `)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalReviews = reviews?.length || 0;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0;

      // Calculate rating distribution
      const ratingDistribution = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      };

      reviews?.forEach(review => {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      });

      // Get recent reviews (last 5)
      const recentReviews = reviews?.slice(0, 5).map(review => ({
        ...review,
        id: review.id || '',
        profile_id: profileId,
        client_id: review.client_id || '',
        appointment_id: review.appointment_id,
        images: review.images || [],
        created_at: review.created_at,
        updated_at: review.updated_at
      })) || [];

      return {
        total_reviews: totalReviews,
        average_rating: Number(averageRating.toFixed(1)),
        rating_distribution: ratingDistribution,
        recent_reviews: recentReviews as ReviewWithRelations[]
      };
    } catch (error) {
      console.error('Error fetching review stats:', error);
      throw new Error('Failed to fetch review statistics');
    }
  }

  /**
   * Search reviews with filters
   */
  static async searchReviews(
    filters: ReviewFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<ReviewWithRelations>> {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_profile_id_fkey (
            id,
            name,
            avatar_url,
            profile_type
          ),
          users!reviews_client_id_fkey (
            id,
            email,
            user_profiles (
              full_name,
              avatar_url
            )
          ),
          appointments!reviews_appointment_id_fkey (
            id,
            appointment_date,
            service_description
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.profile_id) {
        query = query.eq('profile_id', filters.profile_id);
      }
      if (filters.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters.rating) {
        query = query.eq('rating', filters.rating);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters.has_images) {
        query = query.not('images', 'is', null);
      }

      // Apply pagination and sorting
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const offset = (page - 1) * limit;
      const sortBy = pagination?.sort_by || 'created_at';
      const sortOrder = pagination?.sort_order || 'desc';

      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data: reviews, error, count } = await query;

      if (error) throw error;

      return {
        data: reviews || [],
        count: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error searching reviews:', error);
      throw new Error('Failed to search reviews');
    }
  }

  /**
   * Get featured reviews (high-rated reviews with images)
   */
  static async getFeaturedReviews(
    profileId?: string,
    limit: number = 6
  ): Promise<ReviewWithRelations[]> {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_profile_id_fkey (
            id,
            name,
            avatar_url,
            profile_type
          ),
          users!reviews_client_id_fkey (
            id,
            email,
            user_profiles (
              full_name,
              avatar_url
            )
          )
        `)
        .gte('rating', 4) // 4+ star reviews
        .not('images', 'is', null) // Has images
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data: reviews, error } = await query;

      if (error) throw error;
      return reviews || [];
    } catch (error) {
      console.error('Error fetching featured reviews:', error);
      throw new Error('Failed to fetch featured reviews');
    }
  }

  /**
   * Check if user can review a profile
   */
  static async canUserReview(
    profileId: string,
    clientId: string
  ): Promise<{
    can_review: boolean;
    reason?: string;
  }> {
    try {
      // Check if user already reviewed this profile
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('profile_id', profileId)
        .eq('client_id', clientId)
        .single();

      if (existingReview) {
        return {
          can_review: false,
          reason: 'You have already reviewed this profile'
        };
      }

      // Check if user has completed appointment with this profile
      const { data: completedAppointment } = await supabase
        .from('appointments')
        .select('id')
        .eq('profile_id', profileId)
        .eq('client_id', clientId)
        .eq('status', 'completed')
        .single();

      if (!completedAppointment) {
        return {
          can_review: false,
          reason: 'You need to complete an appointment before reviewing'
        };
      }

      return { can_review: true };
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      return {
        can_review: false,
        reason: 'Unable to verify review eligibility'
      };
    }
  }

  /**
   * Update profile average rating (internal method)
   */
  private static async updateProfileRating(profileId: string): Promise<void> {
    try {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('profile_id', profileId);

      if (reviews && reviews.length > 0) {
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        
        await supabase
          .from('profiles')
          .update({ 
            average_rating: Number(averageRating.toFixed(1)),
            total_reviews: reviews.length
          })
          .eq('id', profileId);
      } else {
        // No reviews, reset rating
        await supabase
          .from('profiles')
          .update({ 
            average_rating: 0,
            total_reviews: 0
          })
          .eq('id', profileId);
      }
    } catch (error) {
      console.error('Error updating profile rating:', error);
    }
  }

  /**
   * Report a review
   */
  static async reportReview(
    reviewId: string,
    reason: string,
    reporterId: string
  ): Promise<void> {
    try {
      // This would typically create a report record in a reports table
      // For now, we'll just log it
      console.log('Review reported:', {
        reviewId,
        reason,
        reporterId,
        timestamp: new Date().toISOString()
      });

      // In a real implementation, you might:
      // 1. Create a report record
      // 2. Flag the review for moderation
      // 3. Send notification to moderators
      // 4. Potentially hide the review if multiple reports
    } catch (error) {
      console.error('Error reporting review:', error);
      throw new Error('Failed to report review');
    }
  }
}
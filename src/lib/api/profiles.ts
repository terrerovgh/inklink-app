import { supabase, supabaseAdmin } from '../supabase';
import type {
  Profile,
  ProfileWithRelations,
  CreateProfileRequest,
  UpdateProfileRequest,
  ProfileSearchFilters,
  PaginatedResponse,
  PortfolioItem,
  CreatePortfolioItemRequest,
  Specialty
} from '../../types/database';

// Profile CRUD Operations
export class ProfilesAPI {
  // Get all profiles with pagination and filters
  static async getProfiles({
    page = 1,
    limit = 12,
    search,
    specialty,
    location,
    priceRange,
    rating,
    sortBy = 'created_at',
    sortOrder = 'desc'
  }: ProfileSearchFilters = {}): Promise<PaginatedResponse<ProfileWithRelations>> {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          user_profiles!inner(*),
          profile_specialties(
            specialties(*)
          ),
          portfolio_items(
            id,
            title,
            description,
            image_url,
            created_at
          ),
          reviews(
            id,
            rating,
            comment,
            created_at,
            user_profiles(*)
          )
        `)
        .eq('is_active', true);

      // Apply search filter
      if (search) {
        query = query.or(`name.ilike.%${search}%,bio.ilike.%${search}%,location.ilike.%${search}%`);
      }

      // Apply location filter
      if (location) {
        query = query.ilike('location', `%${location}%`);
      }

      // Apply price range filter
      if (priceRange) {
        if (priceRange.min !== undefined) {
          query = query.gte('hourly_rate', priceRange.min);
        }
        if (priceRange.max !== undefined) {
          query = query.lte('hourly_rate', priceRange.max);
        }
      }

      // Apply rating filter
      if (rating) {
        query = query.gte('average_rating', rating);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Filter by specialty if provided (post-processing due to many-to-many relationship)
      let filteredData = data || [];
      if (specialty) {
        filteredData = filteredData.filter(profile => 
          profile.profile_specialties?.some(ps => 
            ps.specialties?.name?.toLowerCase().includes(specialty.toLowerCase())
          )
        );
      }

      return {
        data: filteredData,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching profiles:', error);
      throw error;
    }
  }

  // Get single profile by ID
  static async getProfile(id: string): Promise<ProfileWithRelations | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_profiles(*),
          profile_specialties(
            specialties(*)
          ),
          portfolio_items(
            *,
            portfolio_images(*)
          ),
          reviews(
            *,
            user_profiles(*)
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  // Get profile by user ID
  static async getProfileByUserId(userId: string): Promise<ProfileWithRelations | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_profiles(*),
          profile_specialties(
            specialties(*)
          ),
          portfolio_items(
            *,
            portfolio_images(*)
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile by user ID:', error);
      return null;
    }
  }

  // Create new profile
  static async createProfile(profileData: CreateProfileRequest): Promise<Profile> {
    try {
      const { specialties, ...profileInfo } = profileData;

      // Create the profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert(profileInfo)
        .select()
        .single();

      if (profileError) throw profileError;

      // Add specialties if provided
      if (specialties && specialties.length > 0) {
        const specialtyInserts = specialties.map(specialtyId => ({
          profile_id: profile.id,
          specialty_id: specialtyId
        }));

        const { error: specialtyError } = await supabase
          .from('profile_specialties')
          .insert(specialtyInserts);

        if (specialtyError) throw specialtyError;
      }

      return profile;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  // Update profile
  static async updateProfile(id: string, updates: UpdateProfileRequest): Promise<Profile> {
    try {
      const { specialties, ...profileUpdates } = updates;

      // Update the profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', id)
        .select()
        .single();

      if (profileError) throw profileError;

      // Update specialties if provided
      if (specialties !== undefined) {
        // Remove existing specialties
        await supabase
          .from('profile_specialties')
          .delete()
          .eq('profile_id', id);

        // Add new specialties
        if (specialties.length > 0) {
          const specialtyInserts = specialties.map(specialtyId => ({
            profile_id: id,
            specialty_id: specialtyId
          }));

          const { error: specialtyError } = await supabase
            .from('profile_specialties')
            .insert(specialtyInserts);

          if (specialtyError) throw specialtyError;
        }
      }

      return profile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Delete profile (soft delete)
  static async deleteProfile(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  }

  // Get all specialties
  static async getSpecialties(): Promise<Specialty[]> {
    try {
      const { data, error } = await supabase
        .from('specialties')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching specialties:', error);
      throw error;
    }
  }

  // Portfolio management
  static async addPortfolioItem(portfolioData: CreatePortfolioItemRequest): Promise<PortfolioItem> {
    try {
      const { images, ...itemData } = portfolioData;

      // Create portfolio item
      const { data: item, error: itemError } = await supabase
        .from('portfolio_items')
        .insert(itemData)
        .select()
        .single();

      if (itemError) throw itemError;

      // Add images if provided
      if (images && images.length > 0) {
        const imageInserts = images.map((imageUrl, index) => ({
          portfolio_item_id: item.id,
          image_url: imageUrl,
          display_order: index
        }));

        const { error: imageError } = await supabase
          .from('portfolio_images')
          .insert(imageInserts);

        if (imageError) throw imageError;
      }

      return item;
    } catch (error) {
      console.error('Error adding portfolio item:', error);
      throw error;
    }
  }

  // Delete portfolio item
  static async deletePortfolioItem(itemId: string): Promise<void> {
    try {
      // Delete associated images first
      await supabase
        .from('portfolio_images')
        .delete()
        .eq('portfolio_item_id', itemId);

      // Delete the portfolio item
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting portfolio item:', error);
      throw error;
    }
  }

  // Search profiles with advanced filters
  static async searchProfiles(query: string, filters: ProfileSearchFilters = {}): Promise<ProfileWithRelations[]> {
    try {
      const result = await this.getProfiles({
        ...filters,
        search: query,
        limit: 50 // Higher limit for search results
      });

      return result.data;
    } catch (error) {
      console.error('Error searching profiles:', error);
      throw error;
    }
  }

  // Get featured profiles
  static async getFeaturedProfiles(limit: number = 6): Promise<ProfileWithRelations[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_profiles(*),
          profile_specialties(
            specialties(*)
          ),
          portfolio_items(
            id,
            title,
            image_url
          )
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('average_rating', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching featured profiles:', error);
      return [];
    }
  }

  // Update profile rating (called after new review)
  static async updateProfileRating(profileId: string): Promise<void> {
    try {
      // Calculate new average rating
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('profile_id', profileId);

      if (reviewsError) throw reviewsError;

      if (reviews && reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;
        const reviewCount = reviews.length;

        // Update profile with new rating
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            review_count: reviewCount
          })
          .eq('id', profileId);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Error updating profile rating:', error);
      throw error;
    }
  }
}
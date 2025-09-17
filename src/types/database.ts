// Database entity types for InkLink Professional Profiles System

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
  profile_image_url?: string;
  created_at: string;
  updated_at: string;
}

export type ProfileType = 'studio' | 'artist';
export type ProfileStatus = 'active' | 'inactive' | 'pending';

export interface Profile {
  id: string;
  user_id: string;
  type: ProfileType;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  profile_image_url?: string;
  cover_image_url?: string;
  rating?: number;
  review_count: number;
  years_experience?: number;
  hourly_rate?: number;
  status: ProfileStatus;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Specialty {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileSpecialty {
  id: string;
  profile_id: string;
  specialty_id: string;
  created_at: string;
}

export interface PortfolioImage {
  id: string;
  profile_id: string;
  image_url: string;
  title?: string;
  description?: string;
  tags?: string[];
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  profile_id: string;
  client_id: string;
  title: string;
  description?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes?: string;
  estimated_price?: number;
  final_price?: number;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  profile_id: string;
  client_id: string;
  appointment_id?: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkingHours {
  id: string;
  profile_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  start_time?: string;
  end_time?: string;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface ProfileWithDetails extends Profile {
  user_profile?: UserProfile;
  specialties?: Specialty[];
  portfolio_images?: PortfolioImage[];
  working_hours?: WorkingHours[];
  recent_reviews?: ReviewWithClient[];
}

export interface ReviewWithClient extends Review {
  client?: UserProfile;
}

export interface AppointmentWithDetails extends Appointment {
  profile?: Profile;
  client?: UserProfile;
}

// Request/Response types for API
export interface CreateProfileRequest {
  type: ProfileType;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  years_experience?: number;
  hourly_rate?: number;
  specialty_ids?: string[];
}

export interface UpdateProfileRequest extends Partial<CreateProfileRequest> {
  status?: ProfileStatus;
}

export interface CreateAppointmentRequest {
  profile_id: string;
  title: string;
  description?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
  estimated_price?: number;
}

export interface UpdateAppointmentRequest {
  title?: string;
  description?: string;
  appointment_date?: string;
  start_time?: string;
  end_time?: string;
  status?: AppointmentStatus;
  notes?: string;
  estimated_price?: number;
  final_price?: number;
}

export interface CreateReviewRequest {
  profile_id: string;
  appointment_id?: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface CreatePortfolioImageRequest {
  profile_id: string;
  image_url: string;
  title?: string;
  description?: string;
  tags?: string[];
  display_order?: number;
}

export interface UpdatePortfolioImageRequest {
  title?: string;
  description?: string;
  tags?: string[];
  display_order?: number;
}

// Search and filter types
export interface ProfileSearchFilters {
  type?: ProfileType;
  city?: string;
  state?: string;
  country?: string;
  specialty_ids?: string[];
  min_rating?: number;
  max_hourly_rate?: number;
  min_hourly_rate?: number;
  is_verified?: boolean;
  has_availability?: boolean;
  search_query?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
  details?: any;
}

export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
}

// Utility types
export type ProfileListItem = Pick<Profile, 'id' | 'name' | 'type' | 'city' | 'state' | 'rating' | 'review_count' | 'profile_image_url' | 'hourly_rate' | 'is_verified'> & {
  specialties?: Pick<Specialty, 'id' | 'name'>[];
};

export type AppointmentListItem = Pick<Appointment, 'id' | 'title' | 'appointment_date' | 'start_time' | 'end_time' | 'status'> & {
  profile?: Pick<Profile, 'id' | 'name' | 'profile_image_url'>;
  client?: Pick<UserProfile, 'id' | 'first_name' | 'last_name'>;
};

export type ReviewListItem = Pick<Review, 'id' | 'rating' | 'title' | 'comment' | 'created_at'> & {
  client?: Pick<UserProfile, 'id' | 'first_name' | 'last_name' | 'profile_image_url'>;
};
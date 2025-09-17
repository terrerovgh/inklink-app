// Professional Profiles System Types
// TypeScript interfaces for all entities in the professional profiles system

export interface UserProfile {
  id: string;
  user_id: string;
  profile_type: 'artist' | 'studio';
  display_name: string;
  bio?: string;
  profile_image?: string;
  cover_image?: string;
  is_verified: boolean;
  is_active: boolean;
  social_links: Record<string, string>;
  contact_info: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_profile_id: string;
  profile_type: 'artist' | 'studio';
  
  // Common fields
  name: string;
  description?: string;
  location?: string;
  coordinates?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  rating: number;
  total_reviews: number;
  
  // Artist-specific fields
  experience_years?: number;
  hourly_rate?: number;
  studio_affiliation?: string;
  
  // Studio-specific fields
  address?: string;
  opening_hours?: Record<string, { open: string; close: string; available: boolean }>;
  amenities?: string[];
  capacity?: number;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  user_profile?: UserProfile;
  portfolio_images?: PortfolioImage[];
  specialties?: ProfileSpecialty[];
  appointments?: Appointment[];
}

export interface PortfolioImage {
  id: string;
  profile_id: string;
  title: string;
  description?: string;
  image_url: string;
  style?: string;
  tags: string[];
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  profile?: Profile;
}

export interface Appointment {
  id: string;
  client_id: string;
  profile_id: string;
  appointment_date: string;
  duration_minutes: number;
  service_type: string;
  description?: string;
  estimated_price?: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  profile?: Profile;
  client?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface Review {
  id: string;
  profile_id: string;
  client_id: string;
  appointment_id?: string;
  rating: number;
  comment?: string;
  images?: string[];
  service_date?: string;
  is_verified: boolean;
  created_at: string;
  
  // Relations
  profile?: Profile;
  client?: {
    id: string;
    email: string;
    full_name?: string;
  };
  appointment?: Appointment;
}

export interface Specialty {
  id: string;
  name: string;
  description?: string;
  category?: string;
  created_at: string;
}

export interface ProfileSpecialty {
  id: string;
  profile_id: string;
  specialty_id: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  created_at: string;
  
  // Relations
  profile?: Profile;
  specialty?: Specialty;
}

// API Request/Response Types
export interface CreateProfileRequest {
  profile_type: 'artist' | 'studio';
  display_name: string;
  bio?: string;
  name: string;
  description?: string;
  location?: string;
  coordinates?: [number, number];
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  
  // Artist-specific
  experience_years?: number;
  hourly_rate?: number;
  studio_affiliation?: string;
  
  // Studio-specific
  address?: string;
  opening_hours?: Record<string, { open: string; close: string; available: boolean }>;
  amenities?: string[];
  capacity?: number;
  
  social_links?: Record<string, string>;
  contact_info?: Record<string, string>;
}

export interface UpdateProfileRequest extends Partial<CreateProfileRequest> {
  id: string;
}

export interface CreatePortfolioImageRequest {
  profile_id: string;
  title: string;
  description?: string;
  image_url: string;
  style?: string;
  tags?: string[];
  is_featured?: boolean;
  display_order?: number;
}

export interface UpdatePortfolioImageRequest extends Partial<CreatePortfolioImageRequest> {
  id: string;
}

export interface CreateAppointmentRequest {
  profile_id: string;
  appointment_date: string;
  duration_minutes?: number;
  service_type: string;
  description?: string;
  estimated_price?: number;
}

export interface UpdateAppointmentRequest extends Partial<CreateAppointmentRequest> {
  id: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

export interface CreateReviewRequest {
  profile_id: string;
  appointment_id?: string;
  rating: number;
  comment?: string;
  images?: string[];
  service_date?: string;
}

export interface ProfileSearchFilters {
  profile_type?: 'artist' | 'studio';
  location?: string;
  coordinates?: [number, number];
  radius?: number; // in kilometers
  specialties?: string[];
  min_rating?: number;
  max_price?: number;
  availability?: boolean;
  search_query?: string;
  sort_by?: 'rating' | 'distance' | 'price' | 'reviews' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProfileSearchResult {
  profiles: Profile[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Component Props Types
export interface ProfileCardProps {
  profile: Profile;
  showDistance?: boolean;
  userLocation?: [number, number];
  onClick?: (profile: Profile) => void;
}

export interface PortfolioGalleryProps {
  images: PortfolioImage[];
  editable?: boolean;
  onImageClick?: (image: PortfolioImage) => void;
  onImageDelete?: (imageId: string) => void;
  onImageUpdate?: (image: PortfolioImage) => void;
}

export interface AppointmentFormProps {
  profile: Profile;
  onSubmit: (appointment: CreateAppointmentRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

export interface ReviewFormProps {
  profile: Profile;
  appointment?: Appointment;
  onSubmit: (review: CreateReviewRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

export interface ProfileFormProps {
  profile?: Profile;
  userProfile?: UserProfile;
  onSubmit: (data: CreateProfileRequest | UpdateProfileRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

// Utility Types
export type ProfileWithRelations = Profile & {
  user_profile: UserProfile;
  portfolio_images: PortfolioImage[];
  specialties: (ProfileSpecialty & { specialty: Specialty })[];
};

export type AppointmentWithRelations = Appointment & {
  profile: Profile;
  client: {
    id: string;
    email: string;
    full_name?: string;
  };
};

export type ReviewWithRelations = Review & {
  profile: Profile;
  client: {
    id: string;
    email: string;
    full_name?: string;
  };
  appointment?: Appointment;
};

// Database Response Types (for Supabase)
export interface DatabaseProfile {
  id: string;
  user_profile_id: string;
  profile_type: 'artist' | 'studio';
  name: string;
  description: string | null;
  location: string | null;
  coordinates: any; // PostGIS geography type
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  rating: number;
  total_reviews: number;
  experience_years: number | null;
  hourly_rate: number | null;
  studio_affiliation: string | null;
  address: string | null;
  opening_hours: any;
  amenities: string[] | null;
  capacity: number | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseUserProfile {
  id: string;
  user_id: string;
  profile_type: 'artist' | 'studio';
  display_name: string;
  bio: string | null;
  profile_image: string | null;
  cover_image: string | null;
  is_verified: boolean;
  is_active: boolean;
  social_links: any;
  contact_info: any;
  created_at: string;
  updated_at: string;
}

// Error Types
export interface ProfileError {
  code: string;
  message: string;
  field?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ProfileError;
  success: boolean;
}

// Constants
export const PROFILE_TYPES = ['artist', 'studio'] as const;
export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'] as const;
export const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
export const SORT_OPTIONS = ['rating', 'distance', 'price', 'reviews', 'created_at'] as const;
export const SORT_ORDERS = ['asc', 'desc'] as const;

// Default values
export const DEFAULT_SEARCH_FILTERS: ProfileSearchFilters = {
  sort_by: 'rating',
  sort_order: 'desc',
  page: 1,
  limit: 20,
};

export const DEFAULT_APPOINTMENT_DURATION = 60; // minutes
export const DEFAULT_SEARCH_RADIUS = 50; // kilometers
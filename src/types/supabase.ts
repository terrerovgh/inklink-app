export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      appointments: {
        Row: {
          id: string
          profile_id: string
          client_id: string
          title: string
          description: string | null
          appointment_date: string
          start_time: string
          end_time: string
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          notes: string | null
          estimated_price: number | null
          final_price: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          client_id: string
          title: string
          description?: string | null
          appointment_date: string
          start_time: string
          end_time: string
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          notes?: string | null
          estimated_price?: number | null
          final_price?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          client_id?: string
          title?: string
          description?: string | null
          appointment_date?: string
          start_time?: string
          end_time?: string
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          notes?: string | null
          estimated_price?: number | null
          final_price?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      portfolio_images: {
        Row: {
          id: string
          profile_id: string
          image_url: string
          title: string | null
          description: string | null
          tags: string[] | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          image_url: string
          title?: string | null
          description?: string | null
          tags?: string[] | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          image_url?: string
          title?: string | null
          description?: string | null
          tags?: string[] | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      profile_specialties: {
        Row: {
          id: string
          profile_id: string
          specialty_id: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          specialty_id: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          specialty_id?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          type: 'studio' | 'artist'
          name: string
          description: string | null
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          postal_code: string | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          email: string | null
          website: string | null
          instagram: string | null
          facebook: string | null
          twitter: string | null
          profile_image_url: string | null
          cover_image_url: string | null
          rating: number | null
          review_count: number
          years_experience: number | null
          hourly_rate: number | null
          status: 'active' | 'inactive' | 'pending'
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'studio' | 'artist'
          name: string
          description?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          email?: string | null
          website?: string | null
          instagram?: string | null
          facebook?: string | null
          twitter?: string | null
          profile_image_url?: string | null
          cover_image_url?: string | null
          rating?: number | null
          review_count?: number
          years_experience?: number | null
          hourly_rate?: number | null
          status?: 'active' | 'inactive' | 'pending'
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'studio' | 'artist'
          name?: string
          description?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          email?: string | null
          website?: string | null
          instagram?: string | null
          facebook?: string | null
          twitter?: string | null
          profile_image_url?: string | null
          cover_image_url?: string | null
          rating?: number | null
          review_count?: number
          years_experience?: number | null
          hourly_rate?: number | null
          status?: 'active' | 'inactive' | 'pending'
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          profile_id: string
          client_id: string
          appointment_id: string | null
          rating: number
          title: string | null
          comment: string | null
          images: string[] | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          client_id: string
          appointment_id?: string | null
          rating: number
          title?: string | null
          comment?: string | null
          images?: string[] | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          client_id?: string
          appointment_id?: string | null
          rating?: number
          title?: string | null
          comment?: string | null
          images?: string[] | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      specialties: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          phone: string | null
          date_of_birth: string | null
          profile_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          phone?: string | null
          date_of_birth?: string | null
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          date_of_birth?: string | null
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      working_hours: {
        Row: {
          id: string
          profile_id: string
          day_of_week: number
          start_time: string | null
          end_time: string | null
          is_closed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          day_of_week: number
          start_time?: string | null
          end_time?: string | null
          is_closed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          day_of_week?: number
          start_time?: string | null
          end_time?: string | null
          is_closed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      appointment_status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
      profile_status: 'active' | 'inactive' | 'pending'
      profile_type: 'studio' | 'artist'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
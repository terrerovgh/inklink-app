-- Professional Profiles System Migration
-- This migration adds the missing tables for the professional profiles system

-- Create user_profiles table (extends users table with profile-specific data)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('artist', 'studio')),
  display_name TEXT NOT NULL,
  bio TEXT,
  profile_image TEXT,
  cover_image TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  social_links JSONB DEFAULT '{}',
  contact_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create profiles table (unified table for both artists and studios)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('artist', 'studio')),
  
  -- Common fields
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  coordinates GEOGRAPHY(POINT, 4326),
  phone TEXT,
  email TEXT,
  website TEXT,
  instagram TEXT,
  rating NUMERIC(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  
  -- Artist-specific fields
  experience_years INTEGER,
  hourly_rate NUMERIC(10,2),
  studio_affiliation TEXT,
  
  -- Studio-specific fields
  address TEXT,
  opening_hours JSONB,
  amenities TEXT[],
  capacity INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create portfolio_images table (replaces portfolio_items with better structure)
CREATE TABLE IF NOT EXISTS portfolio_images (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  style TEXT,
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  service_type TEXT NOT NULL,
  description TEXT,
  estimated_price NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create specialties table
CREATE TABLE IF NOT EXISTS specialties (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profile_specialties junction table
CREATE TABLE IF NOT EXISTS profile_specialties (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
  proficiency_level TEXT DEFAULT 'intermediate' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, specialty_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_type ON user_profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_profiles_user_profile_id ON profiles(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_profiles_type ON profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING GIST(coordinates);
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_images_profile_id ON portfolio_images(profile_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_images_featured ON portfolio_images(is_featured, display_order);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_profile_id ON appointments(profile_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_profile_specialties_profile_id ON profile_specialties(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_specialties_specialty_id ON profile_specialties(specialty_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_specialties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view all user profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can manage their own user profile" ON user_profiles FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = profiles.user_profile_id 
    AND up.user_id = auth.uid()
  )
);

-- RLS Policies for portfolio_images
CREATE POLICY "Users can view all portfolio images" ON portfolio_images FOR SELECT USING (true);
CREATE POLICY "Users can manage their own portfolio images" ON portfolio_images FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN user_profiles up ON p.user_profile_id = up.id
    WHERE p.id = portfolio_images.profile_id
    AND up.user_id = auth.uid()
  )
);

-- RLS Policies for appointments
CREATE POLICY "Users can view their own appointments" ON appointments FOR SELECT USING (
  auth.uid() = client_id OR
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN user_profiles up ON p.user_profile_id = up.id
    WHERE p.id = appointments.profile_id
    AND up.user_id = auth.uid()
  )
);
CREATE POLICY "Clients can create appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users can update their own appointments" ON appointments FOR UPDATE USING (
  auth.uid() = client_id OR
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN user_profiles up ON p.user_profile_id = up.id
    WHERE p.id = appointments.profile_id
    AND up.user_id = auth.uid()
  )
);

-- RLS Policies for specialties (public read, admin write)
CREATE POLICY "Anyone can view specialties" ON specialties FOR SELECT USING (true);

-- RLS Policies for profile_specialties
CREATE POLICY "Users can view all profile specialties" ON profile_specialties FOR SELECT USING (true);
CREATE POLICY "Users can manage their own profile specialties" ON profile_specialties FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN user_profiles up ON p.user_profile_id = up.id
    WHERE p.id = profile_specialties.profile_id
    AND up.user_id = auth.uid()
  )
);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolio_images_updated_at BEFORE UPDATE ON portfolio_images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial specialties data
INSERT INTO specialties (name, description, category) VALUES
  ('Traditional', 'Classic tattoo styles with bold lines and solid colors', 'Style'),
  ('Realism', 'Photorealistic tattoo designs', 'Style'),
  ('Watercolor', 'Artistic watercolor-style tattoos', 'Style'),
  ('Geometric', 'Geometric patterns and designs', 'Style'),
  ('Minimalist', 'Simple, clean line tattoos', 'Style'),
  ('Blackwork', 'Bold black ink designs', 'Style'),
  ('Portrait', 'Portrait tattoos of people or animals', 'Subject'),
  ('Floral', 'Flower and plant-based designs', 'Subject'),
  ('Animal', 'Animal-themed tattoos', 'Subject'),
  ('Abstract', 'Abstract artistic designs', 'Subject')
ON CONFLICT (name) DO NOTHING;

-- Grant permissions to authenticated users
GRANT ALL PRIVILEGES ON user_profiles TO authenticated;
GRANT ALL PRIVILEGES ON profiles TO authenticated;
GRANT ALL PRIVILEGES ON portfolio_images TO authenticated;
GRANT ALL PRIVILEGES ON appointments TO authenticated;
GRANT SELECT ON specialties TO authenticated;
GRANT ALL PRIVILEGES ON profile_specialties TO authenticated;

-- Grant permissions to anon users (read-only for public data)
GRANT SELECT ON user_profiles TO anon;
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON portfolio_images TO anon;
GRANT SELECT ON specialties TO anon;
GRANT SELECT ON profile_specialties TO anon;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
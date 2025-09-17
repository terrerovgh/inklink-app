-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create enum types
CREATE TYPE profile_type AS ENUM ('artist', 'studio');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- Create user_profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    date_of_birth DATE,
    profile_id UUID, -- Reference to professional profile if they have one
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create specialties table
CREATE TABLE specialties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    category TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table (professional profiles for artists and studios)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type profile_type NOT NULL,
    display_name TEXT NOT NULL,
    business_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    cover_image_url TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    instagram TEXT,
    
    -- Location
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'US',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location GEOGRAPHY(POINT, 4326), -- PostGIS point for spatial queries
    
    -- Professional details
    years_experience INTEGER,
    hourly_rate_min DECIMAL(10, 2),
    hourly_rate_max DECIMAL(10, 2),
    is_mobile BOOLEAN DEFAULT FALSE,
    accepts_walk_ins BOOLEAN DEFAULT FALSE,
    consultation_required BOOLEAN DEFAULT TRUE,
    min_age_requirement INTEGER DEFAULT 18,
    
    -- Portfolio and social proof
    portfolio_highlights TEXT[], -- Array of featured work descriptions
    certifications TEXT[],
    awards TEXT[],
    
    -- Business hours (JSON format)
    working_hours JSONB,
    
    -- Studio-specific fields
    amenities TEXT[], -- parking, wifi, refreshments, etc.
    
    -- Rating and reviews
    average_rating DECIMAL(3, 2),
    total_reviews INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profile_specialties junction table
CREATE TABLE profile_specialties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    specialty_id UUID NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, specialty_id)
);

-- Create portfolio_images table
CREATE TABLE portfolio_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    tags TEXT[],
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Appointment details
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    service_type TEXT NOT NULL,
    service_description TEXT,
    estimated_price DECIMAL(10, 2),
    
    -- Status and notes
    status appointment_status DEFAULT 'pending',
    client_notes TEXT,
    artist_notes TEXT,
    cancellation_reason TEXT,
    
    -- Contact info
    client_phone TEXT,
    client_email TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    service_type TEXT,
    
    -- Moderation
    is_approved BOOLEAN DEFAULT TRUE,
    moderation_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one review per client per appointment
    UNIQUE(client_id, appointment_id)
);

-- Create working_hours table for more structured business hours
CREATE TABLE working_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    day_of_week day_of_week NOT NULL,
    is_open BOOLEAN DEFAULT TRUE,
    open_time TIME,
    close_time TIME,
    break_start_time TIME,
    break_end_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, day_of_week)
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_type ON profiles(type);
CREATE INDEX idx_profiles_location ON profiles USING GIST(location);
CREATE INDEX idx_profiles_city_state ON profiles(city, state);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
CREATE INDEX idx_profiles_average_rating ON profiles(average_rating DESC);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

CREATE INDEX idx_portfolio_images_profile_id ON portfolio_images(profile_id);
CREATE INDEX idx_portfolio_images_display_order ON portfolio_images(profile_id, display_order);
CREATE INDEX idx_portfolio_images_featured ON portfolio_images(profile_id, is_featured);

CREATE INDEX idx_appointments_profile_id ON appointments(profile_id);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

CREATE INDEX idx_reviews_profile_id ON reviews(profile_id);
CREATE INDEX idx_reviews_client_id ON reviews(client_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

CREATE INDEX idx_profile_specialties_profile_id ON profile_specialties(profile_id);
CREATE INDEX idx_profile_specialties_specialty_id ON profile_specialties(specialty_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolio_images_updated_at BEFORE UPDATE ON portfolio_images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update location point when lat/lng changes
CREATE OR REPLACE FUNCTION update_location_point()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    ELSE
        NEW.location = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_location BEFORE INSERT OR UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_location_point();

-- Create trigger to update user_profiles.profile_id when a profile is created
CREATE OR REPLACE FUNCTION update_user_profile_reference()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_profiles 
    SET profile_id = NEW.id 
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profile_reference_trigger AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION update_user_profile_reference();

-- Insert default specialties
INSERT INTO specialties (name, category, description) VALUES
-- Traditional styles
('Traditional', 'Style', 'Classic American traditional tattoo style'),
('Neo-Traditional', 'Style', 'Modern take on traditional tattoo style'),
('Japanese', 'Style', 'Traditional Japanese tattoo art'),
('Tribal', 'Style', 'Tribal and indigenous tattoo designs'),

-- Realistic styles
('Realism', 'Style', 'Photorealistic tattoo artwork'),
('Portrait', 'Style', 'Portrait tattoos of people and pets'),
('Black and Grey', 'Style', 'Monochromatic tattoo work'),

-- Artistic styles
('Watercolor', 'Style', 'Watercolor painting style tattoos'),
('Abstract', 'Style', 'Abstract and artistic tattoo designs'),
('Geometric', 'Style', 'Geometric patterns and designs'),
('Minimalist', 'Style', 'Simple, clean, minimalist designs'),

-- Subject matter
('Floral', 'Subject', 'Flower and plant-based designs'),
('Animal', 'Subject', 'Animal and wildlife tattoos'),
('Religious', 'Subject', 'Religious and spiritual imagery'),
('Memorial', 'Subject', 'Memorial and remembrance tattoos'),
('Script', 'Subject', 'Lettering and calligraphy'),

-- Specialized services
('Cover-up', 'Service', 'Cover-up and rework of existing tattoos'),
('Touch-up', 'Service', 'Touch-up and restoration work'),
('Piercing', 'Service', 'Body piercing services'),
('Consultation', 'Service', 'Design consultation services');

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- User profiles: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Profiles: Public read, owner write
CREATE POLICY "Profiles are publicly readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can create own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON profiles FOR DELETE USING (auth.uid() = user_id);

-- Portfolio images: Public read, owner write
CREATE POLICY "Portfolio images are publicly readable" ON portfolio_images FOR SELECT USING (true);
CREATE POLICY "Users can manage own portfolio" ON portfolio_images FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = portfolio_images.profile_id 
        AND profiles.user_id = auth.uid()
    )
);

-- Appointments: Users can see their own appointments (as client or professional)
CREATE POLICY "Users can view own appointments" ON appointments FOR SELECT USING (
    auth.uid() = client_id OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = appointments.profile_id 
        AND profiles.user_id = auth.uid()
    )
);
CREATE POLICY "Users can create appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users can update own appointments" ON appointments FOR UPDATE USING (
    auth.uid() = client_id OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = appointments.profile_id 
        AND profiles.user_id = auth.uid()
    )
);

-- Reviews: Public read, restricted write
CREATE POLICY "Reviews are publicly readable" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE USING (auth.uid() = client_id);

-- Working hours: Public read, owner write
CREATE POLICY "Working hours are publicly readable" ON working_hours FOR SELECT USING (true);
CREATE POLICY "Users can manage own working hours" ON working_hours FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = working_hours.profile_id 
        AND profiles.user_id = auth.uid()
    )
);

-- Specialties and profile_specialties: Public read
CREATE POLICY "Specialties are publicly readable" ON specialties FOR SELECT USING (true);
CREATE POLICY "Profile specialties are publicly readable" ON profile_specialties FOR SELECT USING (true);
CREATE POLICY "Users can manage own profile specialties" ON profile_specialties FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = profile_specialties.profile_id 
        AND profiles.user_id = auth.uid()
    )
);
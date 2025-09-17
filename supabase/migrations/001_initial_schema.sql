-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_type AS ENUM ('client', 'artist', 'studio');
CREATE TYPE request_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    user_type user_type NOT NULL DEFAULT 'client',
    phone TEXT,
    location TEXT,
    coordinates GEOGRAPHY(POINT, 4326), -- PostGIS geography type for lat/lng
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artists table (profile extension for artist users)
CREATE TABLE artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    specialties TEXT[] DEFAULT '{}', -- Array of specialties
    experience_years INTEGER,
    hourly_rate DECIMAL(10,2),
    studio_id UUID, -- Will reference studios table
    instagram TEXT,
    website TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Studios table (profile extension for studio users)
CREATE TABLE studios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    coordinates GEOGRAPHY(POINT, 4326) NOT NULL, -- PostGIS geography type
    phone TEXT,
    email TEXT,
    website TEXT,
    instagram TEXT,
    opening_hours JSONB, -- Store opening hours as JSON
    amenities TEXT[] DEFAULT '{}', -- Array of amenities
    is_verified BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint for artists.studio_id
ALTER TABLE artists ADD CONSTRAINT fk_artists_studio 
    FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE SET NULL;

-- Tattoo requests table
CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    style TEXT NOT NULL,
    size TEXT NOT NULL,
    placement TEXT NOT NULL,
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    reference_images TEXT[] DEFAULT '{}', -- Array of image URLs
    preferred_location TEXT,
    coordinates GEOGRAPHY(POINT, 4326), -- PostGIS geography type
    deadline TIMESTAMPTZ,
    status request_status DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_budget CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_min <= budget_max)
);

-- Artist offers table
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    estimated_duration TEXT,
    availability TEXT,
    portfolio_samples TEXT[] DEFAULT '{}', -- Array of portfolio image URLs
    status offer_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(request_id, artist_id) -- One offer per artist per request
);

-- Portfolio items table
CREATE TABLE portfolio_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image TEXT NOT NULL, -- Image URL
    style TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table (for artists and studios)
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT review_target CHECK (
        (artist_id IS NOT NULL AND studio_id IS NULL) OR 
        (artist_id IS NULL AND studio_id IS NOT NULL)
    ),
    UNIQUE(reviewer_id, artist_id),
    UNIQUE(reviewer_id, studio_id)
);

-- Messages table (for communication between users)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance

-- Geospatial indexes
CREATE INDEX idx_users_coordinates ON users USING GIST (coordinates);
CREATE INDEX idx_studios_coordinates ON studios USING GIST (coordinates);
CREATE INDEX idx_requests_coordinates ON requests USING GIST (coordinates);

-- Regular indexes
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_artists_user_id ON artists(user_id);
CREATE INDEX idx_artists_studio_id ON artists(studio_id);
CREATE INDEX idx_artists_specialties ON artists USING GIN (specialties);
CREATE INDEX idx_studios_user_id ON studios(user_id);
CREATE INDEX idx_requests_client_id ON requests(client_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_style ON requests(style);
CREATE INDEX idx_offers_request_id ON offers(request_id);
CREATE INDEX idx_offers_artist_id ON offers(artist_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_portfolio_items_artist_id ON portfolio_items(artist_id);
CREATE INDEX idx_portfolio_items_style ON portfolio_items(style);
CREATE INDEX idx_reviews_artist_id ON reviews(artist_id);
CREATE INDEX idx_reviews_studio_id ON reviews(studio_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_offer_id ON messages(offer_id);

-- Create functions for geospatial queries

-- Function to find nearby artists
CREATE OR REPLACE FUNCTION nearby_artists(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    specialties TEXT[],
    hourly_rate DECIMAL,
    rating DECIMAL,
    distance_km DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.user_id,
        u.full_name,
        u.avatar_url,
        a.bio,
        a.specialties,
        a.hourly_rate,
        a.rating,
        ST_Distance(
            u.coordinates::geometry,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)
        ) / 1000 AS distance_km
    FROM artists a
    JOIN users u ON a.user_id = u.id
    WHERE u.coordinates IS NOT NULL
    AND ST_DWithin(
        u.coordinates::geometry,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326),
        radius_km * 1000
    )
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Function to find nearby studios
CREATE OR REPLACE FUNCTION nearby_studios(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    description TEXT,
    address TEXT,
    phone TEXT,
    rating DECIMAL,
    distance_km DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.user_id,
        s.name,
        s.description,
        s.address,
        s.phone,
        s.rating,
        ST_Distance(
            s.coordinates::geometry,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)
        ) / 1000 AS distance_km
    FROM studios s
    WHERE s.coordinates IS NOT NULL
    AND ST_DWithin(
        s.coordinates::geometry,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326),
        radius_km * 1000
    )
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_studios_updated_at BEFORE UPDATE ON studios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_items_updated_at BEFORE UPDATE ON portfolio_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update artist/studio ratings when reviews are added/updated
CREATE OR REPLACE FUNCTION update_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL;
    review_count INTEGER;
BEGIN
    -- Handle artist rating update
    IF NEW.artist_id IS NOT NULL THEN
        SELECT AVG(rating), COUNT(*) 
        INTO avg_rating, review_count
        FROM reviews 
        WHERE artist_id = NEW.artist_id;
        
        UPDATE artists 
        SET rating = ROUND(avg_rating, 2), total_reviews = review_count
        WHERE id = NEW.artist_id;
    END IF;
    
    -- Handle studio rating update
    IF NEW.studio_id IS NOT NULL THEN
        SELECT AVG(rating), COUNT(*) 
        INTO avg_rating, review_count
        FROM reviews 
        WHERE studio_id = NEW.studio_id;
        
        UPDATE studios 
        SET rating = ROUND(avg_rating, 2), total_reviews = review_count
        WHERE id = NEW.studio_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for rating updates
CREATE TRIGGER update_rating_on_insert
    AFTER INSERT ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_rating();

CREATE TRIGGER update_rating_on_update
    AFTER UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_rating();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Artists policies
CREATE POLICY "Anyone can view artist profiles" ON artists FOR SELECT USING (true);
CREATE POLICY "Artists can update own profile" ON artists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Artists can insert own profile" ON artists FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Studios policies
CREATE POLICY "Anyone can view studio profiles" ON studios FOR SELECT USING (true);
CREATE POLICY "Studios can update own profile" ON studios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Studios can insert own profile" ON studios FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Requests policies
CREATE POLICY "Anyone can view open requests" ON requests FOR SELECT USING (status = 'open' OR auth.uid() = client_id);
CREATE POLICY "Clients can create requests" ON requests FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients can update own requests" ON requests FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "Clients can delete own requests" ON requests FOR DELETE USING (auth.uid() = client_id);

-- Offers policies
CREATE POLICY "Request owners and offer artists can view offers" ON offers FOR SELECT USING (
    auth.uid() IN (
        SELECT client_id FROM requests WHERE id = request_id
        UNION
        SELECT user_id FROM artists WHERE id = artist_id
    )
);
CREATE POLICY "Artists can create offers" ON offers FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM artists WHERE id = artist_id)
);
CREATE POLICY "Artists can update own offers" ON offers FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM artists WHERE id = artist_id)
);

-- Portfolio policies
CREATE POLICY "Anyone can view portfolio items" ON portfolio_items FOR SELECT USING (true);
CREATE POLICY "Artists can manage own portfolio" ON portfolio_items FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM artists WHERE id = artist_id)
);

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = reviewer_id);

-- Messages policies
CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own sent messages" ON messages FOR UPDATE USING (auth.uid() = sender_id);
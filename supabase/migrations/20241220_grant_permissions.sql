-- Grant permissions to anon and authenticated roles for all tables

-- Users table
GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;

-- Artists table
GRANT SELECT ON artists TO anon;
GRANT ALL PRIVILEGES ON artists TO authenticated;

-- Studios table
GRANT SELECT ON studios TO anon;
GRANT ALL PRIVILEGES ON studios TO authenticated;

-- Requests table
GRANT SELECT ON requests TO anon;
GRANT ALL PRIVILEGES ON requests TO authenticated;

-- Offers table
GRANT SELECT ON offers TO anon;
GRANT ALL PRIVILEGES ON offers TO authenticated;

-- Portfolio items table
GRANT SELECT ON portfolio_items TO anon;
GRANT ALL PRIVILEGES ON portfolio_items TO authenticated;

-- Reviews table
GRANT SELECT ON reviews TO anon;
GRANT ALL PRIVILEGES ON reviews TO authenticated;

-- Messages table
GRANT SELECT ON messages TO anon;
GRANT ALL PRIVILEGES ON messages TO authenticated;

-- Payments table
GRANT SELECT ON payments TO anon;
GRANT ALL PRIVILEGES ON payments TO authenticated;

-- User profiles table
GRANT SELECT ON user_profiles TO anon;
GRANT ALL PRIVILEGES ON user_profiles TO authenticated;

-- Profiles table
GRANT SELECT ON profiles TO anon;
GRANT ALL PRIVILEGES ON profiles TO authenticated;

-- Portfolio images table
GRANT SELECT ON portfolio_images TO anon;
GRANT ALL PRIVILEGES ON portfolio_images TO authenticated;

-- Appointments table
GRANT SELECT ON appointments TO anon;
GRANT ALL PRIVILEGES ON appointments TO authenticated;

-- Specialties table
GRANT SELECT ON specialties TO anon;
GRANT ALL PRIVILEGES ON specialties TO authenticated;

-- Profile specialties table
GRANT SELECT ON profile_specialties TO anon;
GRANT ALL PRIVILEGES ON profile_specialties TO authenticated;

-- Grant usage on all sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on all functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
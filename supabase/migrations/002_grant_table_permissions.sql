-- Grant permissions to anon and authenticated roles for all tables

-- Grant permissions for user_profiles table
GRANT SELECT ON user_profiles TO anon;
GRANT ALL PRIVILEGES ON user_profiles TO authenticated;

-- Grant permissions for profiles table
GRANT SELECT ON profiles TO anon;
GRANT ALL PRIVILEGES ON profiles TO authenticated;

-- Grant permissions for specialties table
GRANT SELECT ON specialties TO anon;
GRANT ALL PRIVILEGES ON specialties TO authenticated;

-- Grant permissions for profile_specialties table
GRANT SELECT ON profile_specialties TO anon;
GRANT ALL PRIVILEGES ON profile_specialties TO authenticated;

-- Grant permissions for portfolio_images table
GRANT SELECT ON portfolio_images TO anon;
GRANT ALL PRIVILEGES ON portfolio_images TO authenticated;

-- Grant permissions for appointments table
GRANT SELECT ON appointments TO anon;
GRANT ALL PRIVILEGES ON appointments TO authenticated;

-- Grant permissions for reviews table
GRANT SELECT ON reviews TO anon;
GRANT ALL PRIVILEGES ON reviews TO authenticated;

-- Grant permissions for working_hours table
GRANT SELECT ON working_hours TO anon;
GRANT ALL PRIVILEGES ON working_hours TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
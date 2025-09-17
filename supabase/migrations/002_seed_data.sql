-- Insert sample data for testing and development

-- Sample users (these would normally be created through Supabase Auth)
-- Note: In production, users are created via auth.users table automatically

-- Sample studios
INSERT INTO users (id, email, full_name, user_type, phone, location, coordinates) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'studio1@inklink.com', 'Ink Masters Studio', 'studio', '+1-555-0101', 'Barcelona, Spain', ST_SetSRID(ST_MakePoint(2.1734, 41.3851), 4326)),
('550e8400-e29b-41d4-a716-446655440002', 'studio2@inklink.com', 'Black Rose Tattoo', 'studio', '+1-555-0102', 'Madrid, Spain', ST_SetSRID(ST_MakePoint(-3.7038, 40.4168), 4326)),
('550e8400-e29b-41d4-a716-446655440003', 'studio3@inklink.com', 'Electric Ink', 'studio', '+1-555-0103', 'Valencia, Spain', ST_SetSRID(ST_MakePoint(-0.3763, 39.4699), 4326));

-- Sample artists
INSERT INTO users (id, email, full_name, user_type, phone, location, coordinates) VALUES
('550e8400-e29b-41d4-a716-446655440011', 'artist1@inklink.com', 'Carlos Mendez', 'artist', '+1-555-0201', 'Barcelona, Spain', ST_SetSRID(ST_MakePoint(2.1734, 41.3851), 4326)),
('550e8400-e29b-41d4-a716-446655440012', 'artist2@inklink.com', 'Maria Rodriguez', 'artist', '+1-555-0202', 'Madrid, Spain', ST_SetSRID(ST_MakePoint(-3.7038, 40.4168), 4326)),
('550e8400-e29b-41d4-a716-446655440013', 'artist3@inklink.com', 'Alex Thompson', 'artist', '+1-555-0203', 'Barcelona, Spain', ST_SetSRID(ST_MakePoint(2.1634, 41.3951), 4326)),
('550e8400-e29b-41d4-a716-446655440014', 'artist4@inklink.com', 'Sofia Gutierrez', 'artist', '+1-555-0204', 'Valencia, Spain', ST_SetSRID(ST_MakePoint(-0.3663, 39.4799), 4326)),
('550e8400-e29b-41d4-a716-446655440015', 'artist5@inklink.com', 'David Kim', 'artist', '+1-555-0205', 'Madrid, Spain', ST_SetSRID(ST_MakePoint(-3.6938, 40.4268), 4326));

-- Sample clients
INSERT INTO users (id, email, full_name, user_type, phone, location, coordinates) VALUES
('550e8400-e29b-41d4-a716-446655440021', 'client1@inklink.com', 'Ana Garcia', 'client', '+1-555-0301', 'Barcelona, Spain', ST_SetSRID(ST_MakePoint(2.1834, 41.3751), 4326)),
('550e8400-e29b-41d4-a716-446655440022', 'client2@inklink.com', 'Miguel Santos', 'client', '+1-555-0302', 'Madrid, Spain', ST_SetSRID(ST_MakePoint(-3.7138, 40.4068), 4326)),
('550e8400-e29b-41d4-a716-446655440023', 'client3@inklink.com', 'Laura Martinez', 'client', '+1-555-0303', 'Valencia, Spain', ST_SetSRID(ST_MakePoint(-0.3863, 39.4599), 4326));

-- Insert studio profiles
INSERT INTO studios (id, user_id, name, description, address, coordinates, phone, email, website, instagram, opening_hours, amenities, is_verified, rating, total_reviews) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Ink Masters Studio', 'Premier tattoo studio in Barcelona with over 15 years of experience. Specializing in realistic, traditional, and custom designs.', 'Carrer de Balmes, 123, 08008 Barcelona, Spain', ST_SetSRID(ST_MakePoint(2.1734, 41.3851), 4326), '+34-93-123-4567', 'info@inkmasters.com', 'https://inkmasters.com', '@inkmasters_bcn', '{"monday": "10:00-20:00", "tuesday": "10:00-20:00", "wednesday": "10:00-20:00", "thursday": "10:00-20:00", "friday": "10:00-22:00", "saturday": "10:00-22:00", "sunday": "12:00-18:00"}', '{"wifi", "air_conditioning", "music", "private_rooms", "parking"}', true, 4.8, 127),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Black Rose Tattoo', 'Modern tattoo studio in the heart of Madrid. Known for neo-traditional and blackwork styles.', 'Calle de Fuencarral, 45, 28004 Madrid, Spain', ST_SetSRID(ST_MakePoint(-3.7038, 40.4168), 4326), '+34-91-234-5678', 'hello@blackrose.es', 'https://blackrosetattoo.es', '@blackrose_madrid', '{"monday": "closed", "tuesday": "11:00-19:00", "wednesday": "11:00-19:00", "thursday": "11:00-19:00", "friday": "11:00-21:00", "saturday": "11:00-21:00", "sunday": "13:00-19:00"}', '{"wifi", "air_conditioning", "music", "consultation_room"}', true, 4.6, 89),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Electric Ink', 'Contemporary tattoo studio in Valencia specializing in color work and geometric designs.', 'Carrer de Colón, 67, 46004 Valencia, Spain', ST_SetSRID(ST_MakePoint(-0.3763, 39.4699), 4326), '+34-96-345-6789', 'contact@electricink.com', 'https://electricink.com', '@electric_ink_vlc', '{"monday": "10:00-19:00", "tuesday": "10:00-19:00", "wednesday": "10:00-19:00", "thursday": "10:00-19:00", "friday": "10:00-20:00", "saturday": "10:00-20:00", "sunday": "closed"}', '{"wifi", "air_conditioning", "music", "vegan_inks", "aftercare_products"}', false, 4.4, 56);

-- Insert artist profiles
INSERT INTO artists (id, user_id, bio, specialties, experience_years, hourly_rate, studio_id, instagram, website, is_verified, rating, total_reviews) VALUES
('770e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440011', 'Passionate tattoo artist with 8 years of experience. I specialize in realistic portraits and nature-inspired designs. Every tattoo tells a story, and I''m here to help you tell yours.', '{"Realistic", "Portraits", "Nature", "Black and Grey"}', 8, 120.00, '660e8400-e29b-41d4-a716-446655440001', '@carlos_ink_art', 'https://carlosink.com', true, 4.9, 156),
('770e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440012', 'Traditional tattoo artist with a modern twist. I love creating bold, colorful pieces that stand the test of time. Specializing in neo-traditional and American traditional styles.', '{"Neo-Traditional", "American Traditional", "Color Work", "Bold Lines"}', 6, 100.00, '660e8400-e29b-41d4-a716-446655440002', '@maria_traditional', NULL, true, 4.7, 98),
('770e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440013', 'Minimalist tattoo artist focused on fine line work and geometric designs. I believe in the power of simplicity and clean execution.', '{"Fine Line", "Minimalist", "Geometric", "Dotwork"}', 4, 90.00, '660e8400-e29b-41d4-a716-446655440001', '@alex_fine_lines', NULL, false, 4.5, 67),
('770e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440014', 'Watercolor and abstract tattoo specialist. I bring paintings to life on skin with vibrant colors and flowing designs.', '{"Watercolor", "Abstract", "Color Work", "Artistic"}', 5, 110.00, '660e8400-e29b-41d4-a716-446655440003', '@sofia_watercolor', 'https://sofiawatercolor.art', false, 4.6, 43),
('770e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440015', 'Blackwork and tribal tattoo artist. I specialize in bold, striking designs with deep cultural significance and modern interpretation.', '{"Blackwork", "Tribal", "Ornamental", "Cultural"}', 7, 105.00, '660e8400-e29b-41d4-a716-446655440002', '@david_blackwork', NULL, true, 4.8, 112);

-- Insert sample portfolio items
INSERT INTO portfolio_items (id, artist_id, title, description, image, style) VALUES
-- Carlos Mendez portfolio
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440011', 'Lion Portrait', 'Realistic lion portrait with detailed mane work', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=realistic%20lion%20portrait%20tattoo%20black%20and%20grey&image_size=square', 'Realistic'),
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440011', 'Rose and Skull', 'Classic combination with modern realistic approach', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=realistic%20rose%20and%20skull%20tattoo%20detailed&image_size=square', 'Realistic'),
('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440011', 'Forest Scene', 'Detailed forest landscape on forearm', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=realistic%20forest%20landscape%20tattoo%20nature&image_size=square', 'Nature'),

-- Maria Rodriguez portfolio
('880e8400-e29b-41d4-a716-446655440011', '770e8400-e29b-41d4-a716-446655440012', 'Traditional Eagle', 'Bold American traditional eagle with banner', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=american%20traditional%20eagle%20tattoo%20bold%20colors&image_size=square', 'American Traditional'),
('880e8400-e29b-41d4-a716-446655440012', '770e8400-e29b-41d4-a716-446655440012', 'Neo-Traditional Cat', 'Colorful neo-traditional cat with flowers', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=neo%20traditional%20cat%20tattoo%20with%20flowers%20colorful&image_size=square', 'Neo-Traditional'),
('880e8400-e29b-41d4-a716-446655440013', '770e8400-e29b-41d4-a716-446655440012', 'Sailor Jerry Pin-up', 'Classic pin-up girl in traditional style', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=sailor%20jerry%20pin%20up%20girl%20traditional%20tattoo&image_size=square', 'American Traditional'),

-- Alex Thompson portfolio
('880e8400-e29b-41d4-a716-446655440021', '770e8400-e29b-41d4-a716-446655440013', 'Geometric Mandala', 'Intricate geometric mandala design', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=geometric%20mandala%20tattoo%20fine%20line%20minimalist&image_size=square', 'Geometric'),
('880e8400-e29b-41d4-a716-446655440022', '770e8400-e29b-41d4-a716-446655440013', 'Fine Line Mountains', 'Minimalist mountain range silhouette', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=fine%20line%20mountain%20range%20minimalist%20tattoo&image_size=square', 'Fine Line'),
('880e8400-e29b-41d4-a716-446655440023', '770e8400-e29b-41d4-a716-446655440013', 'Dotwork Pattern', 'Sacred geometry dotwork pattern', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=dotwork%20sacred%20geometry%20pattern%20tattoo&image_size=square', 'Dotwork'),

-- Sofia Gutierrez portfolio
('880e8400-e29b-41d4-a716-446655440031', '770e8400-e29b-41d4-a716-446655440014', 'Watercolor Butterfly', 'Vibrant watercolor butterfly with paint splashes', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=watercolor%20butterfly%20tattoo%20vibrant%20colors%20paint%20splash&image_size=square', 'Watercolor'),
('880e8400-e29b-41d4-a716-446655440032', '770e8400-e29b-41d4-a716-446655440014', 'Abstract Waves', 'Flowing abstract wave design in blues', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=abstract%20wave%20tattoo%20blue%20watercolor%20flowing&image_size=square', 'Abstract'),

-- David Kim portfolio
('880e8400-e29b-41d4-a716-446655440041', '770e8400-e29b-41d4-a716-446655440015', 'Tribal Sleeve', 'Modern interpretation of Polynesian tribal', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=polynesian%20tribal%20tattoo%20sleeve%20modern%20blackwork&image_size=square', 'Tribal'),
('880e8400-e29b-41d4-a716-446655440042', '770e8400-e29b-41d4-a716-446655440015', 'Ornamental Design', 'Intricate ornamental pattern with cultural elements', 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=ornamental%20tattoo%20pattern%20cultural%20blackwork&image_size=square', 'Ornamental');

-- Insert sample tattoo requests
INSERT INTO requests (id, client_id, title, description, style, size, placement, budget_min, budget_max, reference_images, preferred_location, coordinates, deadline, status) VALUES
('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440021', 'Small Minimalist Moon', 'Looking for a small, minimalist crescent moon tattoo. Clean lines, simple design. This will be my first tattoo.', 'Minimalist', 'Small (2-4 inches)', 'Wrist', 80.00, 150.00, '{"https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=minimalist%20crescent%20moon%20tattoo%20reference&image_size=square"}', 'Barcelona, Spain', ST_SetSRID(ST_MakePoint(2.1834, 41.3751), 4326), '2024-03-15 18:00:00+00', 'open'),
('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440022', 'Traditional Anchor', 'Want a classic American traditional anchor with rope and banner. Bold colors, old school style.', 'American Traditional', 'Medium (4-6 inches)', 'Forearm', 200.00, 350.00, '{"https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=american%20traditional%20anchor%20tattoo%20with%20rope%20banner&image_size=square"}', 'Madrid, Spain', ST_SetSRID(ST_MakePoint(-3.7138, 40.4068), 4326), '2024-04-01 12:00:00+00', 'open'),
('990e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440023', 'Watercolor Flowers', 'Dreaming of a watercolor flower bouquet on my shoulder. Soft colors, artistic style. Roses and peonies preferred.', 'Watercolor', 'Large (6+ inches)', 'Shoulder', 300.00, 500.00, '{"https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=watercolor%20flower%20bouquet%20tattoo%20roses%20peonies&image_size=square"}', 'Valencia, Spain', ST_SetSRID(ST_MakePoint(-0.3863, 39.4599), 4326), '2024-03-30 15:00:00+00', 'open'),
('990e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440021', 'Geometric Wolf', 'Looking for a geometric wolf head design. Modern, clean lines with some dotwork elements.', 'Geometric', 'Medium (4-6 inches)', 'Thigh', 250.00, 400.00, '{"https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=geometric%20wolf%20head%20tattoo%20dotwork%20modern&image_size=square"}', 'Barcelona, Spain', ST_SetSRID(ST_MakePoint(2.1834, 41.3751), 4326), NULL, 'open');

-- Insert sample offers
INSERT INTO offers (id, request_id, artist_id, message, price, estimated_duration, availability, portfolio_samples, status) VALUES
-- Offers for minimalist moon request
('aa0e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440013', 'Hi! I''d love to create this minimalist moon for you. I specialize in fine line work and this would be perfect for a first tattoo. I can do this in about 1 hour with a clean, simple design.', 120.00, '1 hour', 'Available next week, Tuesday-Thursday', '{"880e8400-e29b-41d4-a716-446655440022", "880e8400-e29b-41d4-a716-446655440023"}', 'pending'),

-- Offers for traditional anchor request
('aa0e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440012', 'Perfect! Traditional work is my specialty. I can create a bold, classic anchor with rope and banner. I have lots of experience with this style and can guarantee vibrant, long-lasting colors.', 280.00, '2-3 hours', 'Available this month, flexible schedule', '{"880e8400-e29b-41d4-a716-446655440011", "880e8400-e29b-41d4-a716-446655440013"}', 'pending'),
('aa0e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440015', 'I can do a great traditional anchor for you. While I specialize more in blackwork, I have experience with traditional pieces and can deliver exactly what you''re looking for.', 250.00, '2 hours', 'Available in 2 weeks', '{"880e8400-e29b-41d4-a716-446655440041"}', 'pending'),

-- Offers for watercolor flowers request
('aa0e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440014', 'This sounds absolutely beautiful! Watercolor flowers are exactly my specialty. I can create a stunning bouquet with roses and peonies in soft, flowing colors. Check out my portfolio for similar work!', 420.00, '4-5 hours', 'Available next month, weekends preferred', '{"880e8400-e29b-41d4-a716-446655440031", "880e8400-e29b-41d4-a716-446655440032"}', 'pending'),

-- Offers for geometric wolf request
('aa0e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440013', 'Geometric designs are my passion! I can create a stunning wolf head with clean lines and dotwork elements. This would look amazing on the thigh with the space to really showcase the geometric patterns.', 320.00, '3-4 hours', 'Available in 3 weeks', '{"880e8400-e29b-41d4-a716-446655440021", "880e8400-e29b-41d4-a716-446655440023"}', 'pending');

-- Insert sample reviews
INSERT INTO reviews (id, reviewer_id, artist_id, studio_id, rating, comment) VALUES
-- Reviews for Carlos Mendez
('bb0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440021', '770e8400-e29b-41d4-a716-446655440011', NULL, 5, 'Carlos did an amazing job on my portrait tattoo. The detail and realism are incredible. Highly professional and made me feel comfortable throughout the process.'),
('bb0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440022', '770e8400-e29b-41d4-a716-446655440011', NULL, 5, 'Best tattoo artist in Barcelona! The lion portrait he did for me is absolutely stunning. Worth every euro.'),

-- Reviews for Maria Rodriguez
('bb0e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440023', '770e8400-e29b-41d4-a716-446655440012', NULL, 5, 'Maria''s traditional work is top-notch. Bold, clean lines and vibrant colors. She really knows her craft.'),
('bb0e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440021', '770e8400-e29b-41d4-a716-446655440012', NULL, 4, 'Great experience with Maria. The neo-traditional piece came out beautiful, though the session ran a bit longer than expected.'),

-- Reviews for studios
('bb0e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440022', NULL, '660e8400-e29b-41d4-a716-446655440001', 5, 'Ink Masters Studio is fantastic. Clean, professional environment with top-tier artists. Highly recommend!'),
('bb0e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440023', NULL, '660e8400-e29b-41d4-a716-446655440002', 4, 'Black Rose Tattoo has a great atmosphere. The artists are skilled and the studio is well-maintained.'),
('bb0e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440021', NULL, '660e8400-e29b-41d4-a716-446655440003', 4, 'Electric Ink is a modern studio with talented artists. Good experience overall, though booking can be challenging.');

-- Insert sample messages
INSERT INTO messages (id, sender_id, recipient_id, offer_id, content, is_read) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440013', 'aa0e8400-e29b-41d4-a716-446655440001', 'Hi Alex! I love your offer for the minimalist moon tattoo. Could we schedule a consultation to discuss the design details?', false),
('cc0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440021', 'aa0e8400-e29b-41d4-a716-446655440001', 'Absolutely! I''d be happy to meet for a consultation. How about this Thursday at 3 PM? We can go over the design and placement in detail.', false),
('cc0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440012', 'aa0e8400-e29b-41d4-a716-446655440002', 'Maria, your traditional work looks amazing! I''m interested in your offer for the anchor tattoo. When would be the earliest we could start?', false),
('cc0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440014', 'aa0e8400-e29b-41d4-a716-446655440004', 'Sofia, I''m so excited about the watercolor flowers! Your portfolio pieces are exactly the style I''m looking for. Let''s discuss the details.', false);

-- Update sequences to avoid conflicts
SELECT setval('users_id_seq', (SELECT MAX(EXTRACT(EPOCH FROM NOW())) FROM users), false);
SELECT setval('artists_id_seq', (SELECT MAX(EXTRACT(EPOCH FROM NOW())) FROM artists), false);
SELECT setval('studios_id_seq', (SELECT MAX(EXTRACT(EPOCH FROM NOW())) FROM studios), false);
SELECT setval('requests_id_seq', (SELECT MAX(EXTRACT(EPOCH FROM NOW())) FROM requests), false);
SELECT setval('offers_id_seq', (SELECT MAX(EXTRACT(EPOCH FROM NOW())) FROM offers), false);
SELECT setval('portfolio_items_id_seq', (SELECT MAX(EXTRACT(EPOCH FROM NOW())) FROM portfolio_items), false);
SELECT setval('reviews_id_seq', (SELECT MAX(EXTRACT(EPOCH FROM NOW())) FROM reviews), false);
SELECT setval('messages_id_seq', (SELECT MAX(EXTRACT(EPOCH FROM NOW())) FROM messages), false);
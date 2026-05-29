-- ============================================================
-- VigilHealth Seed Data
-- Development / local environment only
-- All inserts use ON CONFLICT DO NOTHING for idempotency
-- ============================================================

-- ------------------------------------------------------------
-- Test Users
-- password: 'TestPass123!' — hash is a placeholder for development only
-- ------------------------------------------------------------
INSERT INTO users (id, email, password_hash, email_verified) VALUES
  ('00000000-0000-0000-0000-000000000001', 'alice@example.com', '$2b$10$placeholder_hash_alice', TRUE),
  ('00000000-0000-0000-0000-000000000002', 'bob@example.com', '$2b$10$placeholder_hash_bob', TRUE),
  ('00000000-0000-0000-0000-000000000003', 'admin@vigilhealth.com', '$2b$10$placeholder_hash_admin', TRUE)
ON CONFLICT (email) DO NOTHING;

-- ------------------------------------------------------------
-- User Profiles
-- ------------------------------------------------------------
INSERT INTO user_profiles (id, full_name, primary_location, primary_city, primary_state, search_radius_miles) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Alice Johnson',
    ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography,
    'San Francisco',
    'CA',
    10
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Bob Smith',
    ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)::geography,
    'New York',
    'NY',
    5
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'VigilHealth Admin',
    ST_SetSRID(ST_MakePoint(-97.7431, 30.2672), 4326)::geography,
    'Austin',
    'TX',
    25
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- Supply Locations — 10 realistic entries across major US cities
-- ------------------------------------------------------------
INSERT INTO supply_locations (id, name, type, location, address, city, state, zip_code, phone, hours, is_premium, has_safe_badge) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    'Walgreens - Market St',
    'pharmacy',
    ST_SetSRID(ST_MakePoint(-122.4177, 37.7751), 4326)::geography,
    '1189 Market St',
    'San Francisco',
    'CA',
    '94103',
    '(415) 861-3136',
    'Mon-Sun 8:00 AM - 10:00 PM',
    TRUE,
    TRUE
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'CVS Pharmacy - Castro',
    'pharmacy',
    ST_SetSRID(ST_MakePoint(-122.4350, 37.7609), 4326)::geography,
    '2535 Market St',
    'San Francisco',
    'CA',
    '94114',
    '(415) 861-6519',
    'Mon-Sun 7:00 AM - 11:00 PM',
    FALSE,
    FALSE
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'SF COVID Testing Center - Civic Center',
    'testing_site',
    ST_SetSRID(ST_MakePoint(-122.4194, 37.7793), 4326)::geography,
    '101 Grove St',
    'San Francisco',
    'CA',
    '94102',
    '(415) 554-2500',
    'Mon-Fri 9:00 AM - 5:00 PM',
    FALSE,
    TRUE
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'Duane Reade - Times Square',
    'pharmacy',
    ST_SetSRID(ST_MakePoint(-73.9857, 40.7580), 4326)::geography,
    '1627 Broadway',
    'New York',
    'NY',
    '10019',
    '(212) 541-9708',
    'Mon-Sun 24 Hours',
    TRUE,
    TRUE
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    'NYC Health + Hospitals Testing - Bellevue',
    'testing_site',
    ST_SetSRID(ST_MakePoint(-73.9762, 40.7394), 4326)::geography,
    '462 1st Ave',
    'New York',
    'NY',
    '10016',
    '(212) 562-4141',
    'Mon-Fri 8:00 AM - 6:00 PM',
    FALSE,
    FALSE
  ),
  (
    '10000000-0000-0000-0000-000000000006',
    'H-E-B Pharmacy - South Congress',
    'pharmacy',
    ST_SetSRID(ST_MakePoint(-97.7500, 30.2500), 4326)::geography,
    '2400 S Congress Ave',
    'Austin',
    'TX',
    '78704',
    '(512) 442-3688',
    'Mon-Fri 9:00 AM - 8:00 PM, Sat 9:00 AM - 6:00 PM',
    FALSE,
    FALSE
  ),
  (
    '10000000-0000-0000-0000-000000000007',
    'Austin Public Health Testing Site',
    'testing_site',
    ST_SetSRID(ST_MakePoint(-97.7431, 30.2672), 4326)::geography,
    '7201 Levander Loop',
    'Austin',
    'TX',
    '78702',
    '(512) 972-5520',
    'Mon-Sat 8:00 AM - 4:00 PM',
    FALSE,
    TRUE
  ),
  (
    '10000000-0000-0000-0000-000000000008',
    'Rite Aid - Michigan Ave',
    'pharmacy',
    ST_SetSRID(ST_MakePoint(-87.6244, 41.8827), 4326)::geography,
    '757 N Michigan Ave',
    'Chicago',
    'IL',
    '60611',
    '(312) 664-8686',
    'Mon-Sun 8:00 AM - 9:00 PM',
    TRUE,
    FALSE
  ),
  (
    '10000000-0000-0000-0000-000000000009',
    'Teladoc Health - Virtual',
    'telehealth',
    ST_SetSRID(ST_MakePoint(-96.7970, 32.7767), 4326)::geography,
    '2 Manhattanville Rd (Virtual)',
    'Dallas',
    'TX',
    '75201',
    '1-800-835-2362',
    'Mon-Sun 24 Hours',
    TRUE,
    TRUE
  ),
  (
    '10000000-0000-0000-0000-000000000010',
    'Walgreens - Sunset Blvd',
    'pharmacy',
    ST_SetSRID(ST_MakePoint(-118.3617, 34.0983), 4326)::geography,
    '8490 W Sunset Blvd',
    'Los Angeles',
    'CA',
    '90069',
    '(310) 652-0135',
    'Mon-Sun 8:00 AM - 10:00 PM',
    FALSE,
    FALSE
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- Supply Availability
-- ------------------------------------------------------------
INSERT INTO supply_availability (location_id, item_name, status) VALUES
  ('10000000-0000-0000-0000-000000000001', 'N95 Masks', 'in_stock'),
  ('10000000-0000-0000-0000-000000000001', 'Rapid COVID Test Kits', 'low_stock'),
  ('10000000-0000-0000-0000-000000000001', 'Hand Sanitizer', 'in_stock'),
  ('10000000-0000-0000-0000-000000000002', 'N95 Masks', 'out_of_stock'),
  ('10000000-0000-0000-0000-000000000002', 'Surgical Masks', 'in_stock'),
  ('10000000-0000-0000-0000-000000000002', 'Rapid COVID Test Kits', 'in_stock'),
  ('10000000-0000-0000-0000-000000000003', 'PCR Tests', 'in_stock'),
  ('10000000-0000-0000-0000-000000000003', 'Rapid Antigen Tests', 'in_stock'),
  ('10000000-0000-0000-0000-000000000004', 'N95 Masks', 'in_stock'),
  ('10000000-0000-0000-0000-000000000004', 'Rapid COVID Test Kits', 'in_stock'),
  ('10000000-0000-0000-0000-000000000004', 'Thermometers', 'low_stock'),
  ('10000000-0000-0000-0000-000000000006', 'N95 Masks', 'in_stock'),
  ('10000000-0000-0000-0000-000000000006', 'Rapid COVID Test Kits', 'low_stock'),
  ('10000000-0000-0000-0000-000000000008', 'Surgical Masks', 'in_stock'),
  ('10000000-0000-0000-0000-000000000008', 'Hand Sanitizer', 'in_stock'),
  ('10000000-0000-0000-0000-000000000010', 'N95 Masks', 'unknown'),
  ('10000000-0000-0000-0000-000000000010', 'Rapid COVID Test Kits', 'out_of_stock')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Risk Levels — sample entries for different cities
-- ------------------------------------------------------------
INSERT INTO risk_levels (
  id, location, location_name, city, state, country,
  disease, risk_level, risk_score, case_count,
  source, source_url, confidence,
  valid_from, valid_until
) VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography,
    'San Francisco, CA',
    'San Francisco',
    'CA',
    'US',
    'Influenza A',
    'moderate',
    45,
    312,
    'cdc',
    'https://www.cdc.gov/flu/weekly/index.htm',
    80,
    NOW(),
    NOW() + INTERVAL '6 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)::geography,
    'New York, NY',
    'New York',
    'NY',
    'US',
    'COVID-19',
    'high',
    72,
    1840,
    'cdc',
    'https://www.cdc.gov/covid-data-tracker/',
    90,
    NOW(),
    NOW() + INTERVAL '6 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    ST_SetSRID(ST_MakePoint(-97.7431, 30.2672), 4326)::geography,
    'Austin, TX',
    'Austin',
    'TX',
    'US',
    'Hantavirus',
    'low',
    12,
    3,
    'cdc',
    'https://www.cdc.gov/hantavirus/',
    65,
    NOW(),
    NOW() + INTERVAL '6 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    ST_SetSRID(ST_MakePoint(-87.6298, 41.8781), 4326)::geography,
    'Chicago, IL',
    'Chicago',
    'IL',
    'US',
    'RSV',
    'moderate',
    38,
    520,
    'who',
    'https://www.who.int/emergencies/disease-outbreak-news',
    75,
    NOW(),
    NOW() + INTERVAL '6 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- Sample Questions
-- ------------------------------------------------------------
INSERT INTO questions (id, user_id, title, body, tags, view_count) VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'What are the early symptoms of Hantavirus?',
    'I live in a rural area and recently found evidence of rodents in my garage. I''m concerned about Hantavirus exposure. What symptoms should I watch for in the first few days?',
    ARRAY['hantavirus', 'symptoms', 'prevention'],
    47
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'How effective are N95 masks compared to surgical masks for respiratory viruses?',
    'With multiple respiratory viruses circulating this season, I want to understand the real-world difference in protection between N95 respirators and standard surgical masks.',
    ARRAY['masks', 'ppe', 'respiratory', 'prevention'],
    123
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- Sample Answers (with verified sources)
-- ------------------------------------------------------------
INSERT INTO answers (id, question_id, user_id, body, sources, is_verified, upvotes) VALUES
  (
    '40000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    'Early Hantavirus Pulmonary Syndrome (HPS) symptoms typically appear 1–5 weeks after exposure and begin with fatigue, fever, and muscle aches — especially in the large muscle groups (thighs, hips, back, and shoulders). Some people also experience headaches, dizziness, chills, and abdominal problems. These early symptoms are often mistaken for flu. The late stage (4–10 days after initial symptoms) involves coughing and shortness of breath as the lungs fill with fluid. If you suspect exposure, seek medical attention immediately — HPS has a mortality rate of approximately 38%.',
    '[{"url": "https://www.cdc.gov/hantavirus/hps/symptoms.html", "title": "HPS Symptoms", "organization": "CDC"}, {"url": "https://www.who.int/news-room/fact-sheets/detail/hantavirus-disease", "title": "Hantavirus Disease Fact Sheet", "organization": "WHO"}]'::jsonb,
    TRUE,
    31
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    'N95 respirators filter at least 95% of airborne particles when properly fitted, including small aerosols that can carry respiratory viruses. Surgical masks primarily block large droplets and provide source control (protecting others from you) but offer less protection to the wearer from fine aerosols. For high-risk situations — crowded indoor spaces, caring for sick individuals, or areas with elevated community transmission — a properly fitted N95 or KN95 provides meaningfully better protection. The CDC recommends N95s for healthcare workers and high-risk individuals.',
    '[{"url": "https://www.cdc.gov/niosh/npptl/topics/respirators/disp_part/respsource3healthcare.html", "title": "Respirator Trusted-Source Information", "organization": "CDC/NIOSH"}, {"url": "https://www.fda.gov/medical-devices/personal-protective-equipment-infection-control/n95-respirators-surgical-masks-face-masks-and-barrier-face-coverings", "title": "N95 Respirators and Surgical Masks", "organization": "FDA"}]'::jsonb,
    TRUE,
    58
  )
ON CONFLICT (id) DO NOTHING;

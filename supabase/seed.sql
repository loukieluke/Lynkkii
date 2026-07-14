-- =============================================================================
-- Phase 0 / Phase 0.5 manual seed — a SMALL, high-quality, well-flyered catalog
-- for the two launch hubs (Kingston + Montego Bay). Quality over volume.
--
-- NOTE: these are realistic-but-illustrative sample rows so the app has content
-- to render end-to-end. Replace flyer_url/ticket_url/source_url with real,
-- attributed data during curation. `slug` and `dedup_key` auto-fill via trigger.
-- Applied automatically by `supabase db reset`.
-- =============================================================================

-- VENUES ----------------------------------------------------------------------
insert into venues (id, name, address, neighborhood, parish, geo) values
  ('11111111-1111-1111-1111-111111111111', 'National Stadium', 'Arthur Wint Dr, Kingston', 'New Kingston', 'Kingston',
     st_setsrid(st_makepoint(-76.7834, 17.9899), 4326)::geography),
  ('22222222-2222-2222-2222-222222222222', 'Emancipation Park', 'Knutsford Blvd, Kingston', 'New Kingston', 'Kingston',
     st_setsrid(st_makepoint(-76.7920, 18.0083), 4326)::geography),
  ('33333333-3333-3333-3333-333333333333', 'Pier 1', 'Howard Cooke Blvd, Montego Bay', 'Montego Bay', 'St. James',
     st_setsrid(st_makepoint(-77.9250, 18.4700), 4326)::geography),
  ('44444444-4444-4444-4444-444444444444', 'Sabina Park', 'South Camp Rd, Kingston', 'Kingston', 'Kingston',
     st_setsrid(st_makepoint(-76.7847, 17.9686), 4326)::geography),
  ('55555555-5555-5555-5555-555555555555', 'Aqueduct Lawns', 'Rose Hall, Montego Bay', 'Rose Hall', 'St. James',
     st_setsrid(st_makepoint(-77.8500, 18.5150), 4326)::geography)
on conflict (id) do nothing;

-- EVENTS ----------------------------------------------------------------------
-- start_time uses future-relative timestamps so the "upcoming only" contract
-- always has content regardless of when the seed runs.
insert into events (
  title, short_description, description, start_time, end_time,
  venue_id, event_type, status, price_type, price_display, price_min, price_max, currency,
  flyer_url, ticket_url, organizer, source_url, source_type, confidence
) values
  (
    'Reggae Night at National Stadium',
    'Live reggae concert with headline Jamaican artists under the Kingston sky.',
    'A flagship reggae showcase featuring a rotating lineup of established and emerging Jamaican artists, backed by a full live band. Gates open two hours before showtime.',
    now() + interval '5 days' + interval '19 hours',
    now() + interval '5 days' + interval '22 hours',
    '11111111-1111-1111-1111-111111111111', 'music', 'scheduled', 'paid',
    'JMD 2,000 / USD 15', 2000, 2000, 'JMD',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80',
    'https://tickets.example.jm/reggae-night', 'Irie Promotions',
    'https://venue.example.jm/event/reggae-night', 'venue', 'high'
  ),
  (
    'Emancipation Park Free Fitness Fest',
    'Free open-air fitness sessions, live DJ, and wellness vendors for the whole family.',
    'A community wellness morning: guided yoga, aerobics, and a group run around the park, followed by healthy-food vendors and a family zone.',
    now() + interval '3 days' + interval '6 hours',
    now() + interval '3 days' + interval '10 hours',
    '22222222-2222-2222-2222-222222222222', 'family', 'scheduled', 'free',
    'Free', 0, 0, 'JMD',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80',
    null, 'Kingston Wellness Collective',
    'https://media.example.jm/emancipation-fitness', 'media', 'medium'
  ),
  (
    'Sunset Sounds at Pier 1',
    'Waterfront nightlife with top selectors spinning dancehall and afrobeats.',
    'Montego Bay''s waterfront party series returns with a stacked selector lineup, harbourside bar, and food trucks. 18+.',
    now() + interval '2 days' + interval '21 hours',
    now() + interval '3 days' + interval '2 hours',
    '33333333-3333-3333-3333-333333333333', 'nightlife', 'scheduled', 'paid',
    'JMD 3,500 / USD 25', 3500, 3500, 'JMD',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80',
    'https://tickets.example.jm/sunset-sounds', 'Pier 1 Entertainment',
    'https://venue.example.jm/event/sunset-sounds', 'venue', 'high'
  ),
  (
    'Test Cricket: Jamaica vs Barbados',
    'Regional first-class cricket at the historic Sabina Park.',
    'Day one of a four-day regional first-class fixture. Stands open from morning; bring sunscreen.',
    now() + interval '9 days' + interval '10 hours',
    now() + interval '9 days' + interval '17 hours',
    '44444444-4444-4444-4444-444444444444', 'sports', 'scheduled', 'paid',
    'JMD 1,000 / USD 8', 1000, 1500, 'JMD',
    'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&q=80',
    'https://tickets.example.jm/cricket-sabina', 'Cricket Jamaica',
    'https://official.example.jm/fixtures/jamaica-barbados', 'official', 'high'
  ),
  (
    'Rose Hall Arts & Craft Festival',
    'Open-air arts market showcasing Jamaican makers, painters, and craft vendors.',
    'A curated market of Jamaican visual artists and craftspeople on the Aqueduct Lawns, with live painting demos and a kids'' craft tent.',
    now() + interval '12 days' + interval '11 hours',
    now() + interval '12 days' + interval '18 hours',
    '55555555-5555-5555-5555-555555555555', 'arts', 'scheduled', 'free',
    'Free', 0, 0, 'JMD',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=80',
    null, 'St. James Arts Council',
    'https://media.example.jm/rose-hall-arts', 'media', 'medium'
  ),
  (
    'Kingston Jazz & Blues Festival',
    'Two nights of jazz, blues, and reggae fusion with international guests.',
    'The annual Kingston Jazz & Blues Festival brings a headline lineup of local and international artists across two stages.',
    now() + interval '18 days' + interval '18 hours',
    now() + interval '18 days' + interval '23 hours',
    '11111111-1111-1111-1111-111111111111', 'festival', 'scheduled', 'paid',
    'JMD 6,000 / USD 45', 6000, 12000, 'JMD',
    'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&q=80',
    'https://tickets.example.jm/kingston-jazz', 'Kingston Festivals Ltd',
    'https://venue.example.jm/event/kingston-jazz', 'venue', 'high'
  );

/**
 * Seed a HOSTED Supabase project with the curated sample catalog.
 * For local dev, prefer `supabase db reset` (runs supabase/seed.sql).
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm db:seed
 * or put those in a root .env (loaded via dotenv).
 */
import 'dotenv/config';
import { createServiceClient } from '@irie/api';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const client = createServiceClient(url, serviceKey);

const venues = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'National Stadium', address: 'Arthur Wint Dr, Kingston', neighborhood: 'New Kingston', parish: 'Kingston', lng: -76.7834, lat: 17.9899 },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Emancipation Park', address: 'Knutsford Blvd, Kingston', neighborhood: 'New Kingston', parish: 'Kingston', lng: -76.792, lat: 18.0083 },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Pier 1', address: 'Howard Cooke Blvd, Montego Bay', neighborhood: 'Montego Bay', parish: 'St. James', lng: -77.925, lat: 18.47 },
] as const;

function inDays(days: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

async function main() {
  console.log('Seeding venues…');
  for (const v of venues) {
    const { error } = await client.from('venues').upsert(
      {
        id: v.id,
        name: v.name,
        address: v.address,
        neighborhood: v.neighborhood,
        parish: v.parish,
        // PostGIS geography accepts EWKT via PostgREST when cast; simplest is a POINT WKT.
        geo: `SRID=4326;POINT(${v.lng} ${v.lat})` as unknown as never,
      },
      { onConflict: 'id' },
    );
    if (error) console.error(`  venue ${v.name}:`, error.message);
  }

  console.log('Seeding events…');
  const events = [
    {
      title: 'Reggae Night at National Stadium',
      short_description: 'Live reggae concert with headline Jamaican artists under the Kingston sky.',
      start_time: inDays(5, 19),
      end_time: inDays(5, 22),
      venue_id: venues[0].id,
      event_type: 'music',
      price_type: 'paid',
      price_display: 'JMD 2,000 / USD 15',
      price_min: 2000,
      price_max: 2000,
      flyer_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80',
      ticket_url: 'https://tickets.example.jm/reggae-night',
      organizer: 'Irie Promotions',
      source_url: 'https://venue.example.jm/event/reggae-night',
      source_type: 'venue',
      confidence: 'high',
    },
    {
      title: 'Sunset Sounds at Pier 1',
      short_description: 'Waterfront nightlife with top selectors spinning dancehall and afrobeats.',
      start_time: inDays(2, 21),
      end_time: inDays(3, 2),
      venue_id: venues[2].id,
      event_type: 'nightlife',
      price_type: 'paid',
      price_display: 'JMD 3,500 / USD 25',
      price_min: 3500,
      price_max: 3500,
      flyer_url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80',
      ticket_url: 'https://tickets.example.jm/sunset-sounds',
      organizer: 'Pier 1 Entertainment',
      source_url: 'https://venue.example.jm/event/sunset-sounds',
      source_type: 'venue',
      confidence: 'high',
    },
  ] as const;

  for (const e of events) {
    const { error } = await client.from('events').insert(e as never);
    if (error) console.error(`  event ${e.title}:`, error.message);
  }

  console.log('Done. Verify with the /feed function or the app.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Shared types + upsert logic for importing events into Supabase, used by
 * both the file-based importer (import-visitjamaica.ts) and the live
 * scraper (scrape-visitjamaica.ts).
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export type ScrapedVenue = {
  name?: string;
  address?: string;
  lat?: number | null;
  lng?: number | null;
};

export type ScrapedEvent = {
  source?: string;
  external_id?: string | null;
  title: string;
  start_time?: string | null;
  end_time?: string | null;
  description?: string | null;
  flyer_url?: string | null;
  source_url?: string | null;
  venue?: ScrapedVenue | null;
  category?: string | null;
};

export const PARISHES = [
  'Kingston',
  'St. Andrew',
  'St. Catherine',
  'Clarendon',
  'Manchester',
  'St. Elizabeth',
  'Westmoreland',
  'Hanover',
  'St. James',
  'Trelawny',
  'St. Ann',
  'St. Mary',
  'Portland',
  'St. Thomas',
] as const;

export type Parish = (typeof PARISHES)[number];
export type EventType = 'music' | 'festival' | 'sports' | 'arts' | 'family' | 'nightlife' | 'other';

export function mapCategory(category?: string | null): EventType {
  const c = (category ?? '').toLowerCase();
  if (c.includes('music')) return 'music';
  if (c.includes('sport')) return 'sports';
  if (c.includes('family')) return 'family';
  if (c.includes('art') || c.includes('culture') || c.includes('film')) return 'arts';
  if (c.includes('business') || c.includes('industry')) return 'other';
  if (c.includes('festival') || c.includes('food') || c.includes('rum')) return 'festival';
  return 'other';
}

export function inferParish(text: string): Parish | null {
  const hay = text.toLowerCase();
  // Prefer longer / more specific names first
  const ordered = [...PARISHES].sort((a, b) => b.length - a.length);
  for (const p of ordered) {
    if (hay.includes(p.toLowerCase())) return p;
  }
  if (hay.includes('kingston')) return 'Kingston';
  if (hay.includes('montego bay') || hay.includes('mobay')) return 'St. James';
  if (hay.includes('negril')) return 'Westmoreland';
  if (hay.includes('ocho rios')) return 'St. Ann';
  if (hay.includes('treasure beach')) return 'St. Elizabeth';
  return null;
}

export function toTimestamptz(dateOnly?: string | null, endOfDay = false): string | null {
  if (!dateOnly) return null;
  // Already ISO with time
  if (dateOnly.includes('T')) return new Date(dateOnly).toISOString();
  const suffix = endOfDay ? 'T23:59:59' : 'T12:00:00';
  // Jamaica is UTC-5 year-round (no DST)
  return new Date(`${dateOnly}${suffix}-05:00`).toISOString();
}

export function shortDescription(desc?: string | null): string | null {
  if (!desc) return null;
  const cleaned = desc.replace(/\s+/g, ' ').trim();
  return cleaned.length <= 200 ? cleaned : `${cleaned.slice(0, 197)}...`;
}

async function upsertVenue(
  client: SupabaseClient,
  venue: ScrapedVenue,
  parish: Parish | null,
): Promise<string | null> {
  const name = (venue.name || venue.address || '').trim();
  if (!name) return null;

  const { data: existing, error: findErr } = await client
    .from('venues')
    .select('id')
    .eq('name', name)
    .maybeSingle();
  if (findErr) {
    console.error(`  venue lookup ${name}:`, findErr.message);
    return null;
  }
  if (existing?.id) return existing.id;

  const row: Record<string, unknown> = {
    name,
    address: venue.address || null,
    parish,
  };
  if (venue.lat != null && venue.lng != null) {
    row.geo = `SRID=4326;POINT(${venue.lng} ${venue.lat})`;
  }

  const { data, error } = await client.from('venues').insert(row as never).select('id').single();
  if (error) {
    console.error(`  venue insert ${name}:`, error.message);
    return null;
  }
  return data.id as string;
}

export async function importEvents(
  client: SupabaseClient,
  events: ScrapedEvent[],
): Promise<{ imported: number; skipped: number }> {
  let imported = 0;
  let skipped = 0;

  for (const e of events) {
    if (!e.title || !e.start_time) {
      console.warn(`  skip (missing title/start): ${e.title ?? '(no title)'}`);
      skipped += 1;
      continue;
    }

    const placeText = [e.venue?.name, e.venue?.address, e.title].filter(Boolean).join(' ');
    const parish = inferParish(placeText);
    const venueId = e.venue ? await upsertVenue(client, e.venue, parish) : null;
    const externalId = e.external_id ? String(e.external_id) : null;

    const baseRow = {
      title: e.title,
      short_description: shortDescription(e.description),
      description: e.description ?? null,
      start_time: toTimestamptz(e.start_time, false)!,
      end_time: toTimestamptz(e.end_time, true),
      venue_id: venueId,
      parish,
      event_type: mapCategory(e.category),
      flyer_url: e.flyer_url ?? null,
      organizer: 'Jamaica Tourist Board',
      source_url: e.source_url ?? null,
      source_type: 'official' as const,
      confidence: 'high' as const,
      is_published: true,
    };

    // Prefer update-by-external-id when present
    if (externalId) {
      const { data: existing } = await client
        .from('events')
        .select('id')
        .contains('external_ids', { visitjamaica: externalId })
        .maybeSingle();

      const row = {
        ...baseRow,
        price_type: 'paid' as const,
        source_urls: e.source_url ? [e.source_url] : [],
        external_ids: { visitjamaica: externalId },
      };

      if (existing?.id) {
        const { error } = await client.from('events').update(row as never).eq('id', existing.id);
        if (error) {
          console.error(`  update ${e.title}:`, error.message);
          skipped += 1;
          continue;
        }
        console.log(`  updated: ${e.title}`);
      } else {
        const { error } = await client.from('events').insert(row as never);
        if (error) {
          console.error(`  insert ${e.title}:`, error.message);
          skipped += 1;
          continue;
        }
        console.log(`  inserted: ${e.title}`);
      }
      imported += 1;
      continue;
    }

    const { error } = await client.from('events').insert(baseRow as never);
    if (error) {
      console.error(`  insert ${e.title}:`, error.message);
      skipped += 1;
    } else {
      console.log(`  inserted: ${e.title}`);
      imported += 1;
    }
  }

  return { imported, skipped };
}

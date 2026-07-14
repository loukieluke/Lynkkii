import type { EventFilters, FeedEvent } from '@irie/types';
import type { IrieClient } from './client';

// Map the public EventFilters shape to the search_events RPC arguments.
export function filtersToRpcArgs(filters: EventFilters = {}) {
  return {
    p_parishes: filters.parish?.length ? filters.parish : null,
    p_event_types: filters.event_type?.length ? filters.event_type : null,
    p_start_date: filters.date_range?.start_date ?? null,
    p_end_date: filters.date_range?.end_date ?? null,
    p_price_type: filters.price_type ?? 'any',
    p_lat: filters.near?.lat ?? null,
    p_lng: filters.near?.lng ?? null,
    p_radius_km: filters.near?.radius_km ?? null,
    p_q: filters.q?.trim() ? filters.q.trim() : null,
    p_limit: filters.limit ?? 100,
    p_offset: filters.offset ?? 0,
  };
}

/**
 * Canonical read: upcoming events matching the given filters, sorted by
 * start_time asc. Returns the feed contract shape.
 */
export async function searchEvents(
  client: IrieClient,
  filters: EventFilters = {},
): Promise<FeedEvent[]> {
  const { data, error } = await client.rpc('search_events', filtersToRpcArgs(filters));
  if (error) throw new Error(`searchEvents failed: ${error.message}`);
  return (data ?? []) as unknown as FeedEvent[];
}

/** Fetch a single upcoming event by slug (for detail pages / deep links). */
export async function getEventBySlug(
  client: IrieClient,
  slug: string,
): Promise<FeedEvent | null> {
  // Reuse the canonical shape via search then match slug (keeps one source of
  // truth for the object shape). For a hot path you can add a dedicated RPC.
  const { data, error } = await client.rpc('search_events', {
    ...filtersToRpcArgs({ limit: 200 }),
  });
  if (error) throw new Error(`getEventBySlug failed: ${error.message}`);
  const events = (data ?? []) as unknown as FeedEvent[];
  return events.find((e) => e.slug === slug) ?? null;
}

/** Fetch a single event by id from the base table (works for past events too). */
export async function getEventById(
  client: IrieClient,
  id: string,
): Promise<FeedEvent | null> {
  const { data, error } = await client
    .from('events')
    .select(
      `id, title, slug, short_description, description, start_time, end_time, timezone,
       parish, event_type, status, price_display, price_min, price_max, currency, price_type,
       flyer_url, ticket_url, organizer, source_url, source_type, source_urls, confidence, last_updated,
       venue:venues ( name, address, neighborhood, parish, geo )`,
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`getEventById failed: ${error.message}`);
  return (data as unknown as FeedEvent) ?? null;
}

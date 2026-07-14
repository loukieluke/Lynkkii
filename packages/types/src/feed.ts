import type {
  ConfidenceLevel,
  EventStatus,
  EventType,
  Parish,
  PriceType,
  SourceType,
} from './enums';

// The exact feed object shape from the brief (Section 5). This is the contract
// consumed by the mobile app, the website, and the future public API. It is the
// return shape of the `search_events` RPC and the `/feed` Edge Function.

export interface FeedVenue {
  name: string;
  address: string | null;
  neighborhood: string | null;
  parish: Parish | null;
  lat: number | null;
  lng: number | null;
}

export interface FeedEvent {
  id: string;
  title: string;
  slug: string | null;
  start_time: string; // ISO 8601
  end_time: string | null; // ISO 8601 | null
  timezone: string; // 'America/Jamaica'
  parish: Parish | null;
  venue: FeedVenue | null;
  event_type: EventType;
  status: EventStatus;
  price_display: string | null;
  price_min: number | null;
  price_max: number | null;
  currency: string | null;
  price_type: PriceType;
  flyer_url: string | null;
  ticket_url: string | null;
  organizer: string | null;
  short_description: string | null;
  description: string | null;
  source_url: string | null;
  source_type: SourceType;
  source_urls: string[];
  confidence: ConfidenceLevel;
  last_updated: string; // ISO 8601
}

// One-line concise format helper output (brief Section 5).
export function toConciseLine(e: FeedEvent): string {
  return [e.title, e.start_time, e.parish, e.price_display, e.source_url]
    .map((v) => (v == null ? '' : String(v)))
    .join(' — ');
}

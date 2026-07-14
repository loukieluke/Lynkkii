// Enum unions mirroring the Postgres enums in supabase/migrations/0001_init.sql.
// Keep in sync with the schema (the contract).

export const EVENT_TYPES = [
  'music',
  'festival',
  'sports',
  'arts',
  'family',
  'nightlife',
  'other',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_STATUSES = ['scheduled', 'cancelled', 'postponed', 'sold_out'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const PRICE_TYPES = ['free', 'paid'] as const;
export type PriceType = (typeof PRICE_TYPES)[number];

export const SOURCE_TYPES = [
  'official',
  'media',
  'ticketing',
  'social',
  'venue',
  'partner',
  'manual',
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const CONFIDENCE_LEVELS = ['high', 'medium', 'low'] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

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

// Human-friendly labels for event types (used in filter UI / badges).
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  music: 'Music',
  festival: 'Festival',
  sports: 'Sports',
  arts: 'Arts',
  family: 'Family',
  nightlife: 'Nightlife',
  other: 'Other',
};

export const JAMAICA_TZ = 'America/Jamaica' as const;

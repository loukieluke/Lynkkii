import type { EventType, Parish } from './enums';

// Read/query contract filters (brief Section 5). All optional + combinable.
// NOTE: min_lead_days was intentionally dropped for v1 (product decision).

export type PriceFilter = 'free' | 'paid' | 'any';

export interface NearFilter {
  lat: number;
  lng: number;
  radius_km: number;
}

export interface DateRangeFilter {
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
}

export interface EventFilters {
  parish?: Parish[];
  event_type?: EventType[];
  date_range?: DateRangeFilter;
  price_type?: PriceFilter;
  near?: NearFilter;
  q?: string;
  limit?: number; // default 100, hard cap 200
  offset?: number; // default 0
}

export const DEFAULT_LIMIT = 100;
export const MAX_LIMIT = 200;

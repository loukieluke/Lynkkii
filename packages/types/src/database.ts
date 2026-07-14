// -----------------------------------------------------------------------------
// Supabase generated types (placeholder).
//
// Regenerate the real, authoritative version with:
//   pnpm db:types            (local)
//   supabase gen types typescript --project-id <ref> > packages/types/src/database.ts
//
// This hand-written stand-in matches supabase/migrations so the workspace
// type-checks before you run codegen. It will be OVERWRITTEN by `db:types`.
// -----------------------------------------------------------------------------

import type {
  ConfidenceLevel,
  EventStatus,
  EventType,
  Parish,
  PriceType,
  SourceType,
} from './enums';

// These MUST be `type` aliases (not `interface`): supabase-js's GenericSchema
// constraint requires each Row/Insert/Update to satisfy `Record<string, unknown>`,
// which object type aliases satisfy but interfaces do not. Using `interface` here
// silently collapses every query result to `never`.
export type EventRow = {
  id: string;
  title: string;
  slug: string | null;
  short_description: string | null;
  description: string | null;
  start_time: string;
  end_time: string | null;
  timezone: string;
  venue_id: string | null;
  parish: Parish | null;
  event_type: EventType;
  status: EventStatus;
  price_type: PriceType;
  price_display: string | null;
  price_min: number | null;
  price_max: number | null;
  currency: string | null;
  flyer_url: string | null;
  ticket_url: string | null;
  organizer: string | null;
  source_url: string | null;
  source_type: SourceType;
  source_urls: string[];
  external_ids: Record<string, string>;
  confidence: ConfidenceLevel;
  dedup_key: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  is_published: boolean;
  created_at: string;
  last_updated: string;
}

export type PushTokenRow = {
  id: string;
  user_id: string;
  expo_token: string;
  platform: string | null;
  created_at: string;
  updated_at: string;
}

export type VenueRow = {
  id: string;
  name: string;
  address: string | null;
  neighborhood: string | null;
  parish: Parish | null;
  geo: unknown | null; // PostGIS geography
  created_at: string;
}

export type FavoriteRow = {
  user_id: string;
  event_id: string;
  created_at: string;
}

export type SourceRow = {
  id: string;
  name: string;
  base_url: string | null;
  source_type: SourceType;
  robots_ok: boolean;
  refresh_hrs: number;
  enabled: boolean;
  last_crawled: string | null;
}

// Minimal Database shape compatible with @supabase/supabase-js generics.
// NOTE: `Relationships` and `CompositeTypes` are REQUIRED for supabase-js v2 to
// recognize this as a GenericSchema — without them, `.from()`/`.rpc()` fall back
// to `never`/`undefined`. Regenerate the authoritative version with `pnpm db:types`.
export interface Database {
  public: {
    Tables: {
      events: {
        Row: EventRow;
        Insert: Partial<EventRow> & Pick<EventRow, 'title' | 'start_time'>;
        Update: Partial<EventRow>;
        Relationships: [
          {
            foreignKeyName: 'events_venue_id_fkey';
            columns: ['venue_id'];
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
        ];
      };
      venues: {
        Row: VenueRow;
        Insert: Partial<VenueRow> & Pick<VenueRow, 'name'>;
        Update: Partial<VenueRow>;
        Relationships: [];
      };
      favorites: {
        Row: FavoriteRow;
        Insert: Pick<FavoriteRow, 'user_id' | 'event_id'> & Partial<FavoriteRow>;
        Update: Partial<FavoriteRow>;
        Relationships: [
          {
            foreignKeyName: 'favorites_event_id_fkey';
            columns: ['event_id'];
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      sources: {
        Row: SourceRow;
        Insert: Partial<SourceRow> & Pick<SourceRow, 'name' | 'source_type'>;
        Update: Partial<SourceRow>;
        Relationships: [];
      };
      push_tokens: {
        Row: PushTokenRow;
        Insert: Pick<PushTokenRow, 'user_id' | 'expo_token'> & Partial<PushTokenRow>;
        Update: Partial<PushTokenRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_events: {
        Args: {
          p_parishes?: Parish[] | null;
          p_event_types?: EventType[] | null;
          p_start_date?: string | null;
          p_end_date?: string | null;
          p_price_type?: string | null;
          p_lat?: number | null;
          p_lng?: number | null;
          p_radius_km?: number | null;
          p_q?: string | null;
          p_limit?: number | null;
          p_offset?: number | null;
        };
        Returns: unknown; // setof jsonb (feed objects)
      };
    };
    Enums: {
      event_type: EventType;
      event_status: EventStatus;
      price_type: PriceType;
      source_type: SourceType;
      confidence_level: ConfidenceLevel;
      parish: Parish;
    };
    CompositeTypes: Record<string, never>;
  };
}

-- =============================================================================
-- IrieEvents — Phase 0 schema (CONTRACT).
-- This is the exact data model from the project brief (Section 4).
-- Every other component depends on this. Do not deviate without approval.
-- =============================================================================

-- EXTENSIONS ------------------------------------------------------------------
create extension if not exists postgis;      -- geo / "near me" queries
create extension if not exists pg_trgm;      -- fuzzy matching for dedup + search

-- ENUMS -----------------------------------------------------------------------
create type event_type as enum ('music','festival','sports','arts','family','nightlife','other');
create type event_status as enum ('scheduled','cancelled','postponed','sold_out');
create type price_type as enum ('free','paid');
create type source_type as enum ('official','media','ticketing','social','venue','partner','manual');
create type confidence_level as enum ('high','medium','low');
create type parish as enum (
  'Kingston','St. Andrew','St. Catherine','Clarendon','Manchester',
  'St. Elizabeth','Westmoreland','Hanover','St. James','Trelawny',
  'St. Ann','St. Mary','Portland','St. Thomas'
);

-- VENUE MASTER TABLE (resolve parish + geo once, reuse everywhere) -------------
create table venues (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  address      text,
  neighborhood text,
  parish       parish,
  geo          geography(Point, 4326),   -- lng/lat; enables "near me"
  created_at   timestamptz not null default now()
);
create index venues_geo_idx on venues using gist (geo);
create index venues_name_trgm on venues using gin (name gin_trgm_ops);

-- EVENTS (canonical store) ----------------------------------------------------
create table events (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  slug              text unique,
  short_description text check (char_length(short_description) <= 200),
  description       text,                 -- optional long form
  start_time        timestamptz not null,
  end_time          timestamptz,
  timezone          text not null default 'America/Jamaica',
  venue_id          uuid references venues(id),
  parish            parish,               -- denormalized from venue for fast filtering
  event_type        event_type not null default 'other',
  status            event_status not null default 'scheduled',
  -- pricing (Jamaica is frequently dual-priced JMD/USD)
  price_type        price_type not null default 'paid',
  price_display     text,                 -- e.g. "JMD 2,000 / USD 15" or "Free"
  price_min         numeric,
  price_max         numeric,
  currency          text default 'JMD',   -- ISO 4217; support 'USD' too
  -- media & links
  flyer_url         text,                 -- Supabase Storage or source image
  ticket_url        text,                 -- distinct from source_url
  organizer         text,
  -- provenance & dedup
  source_url        text,                 -- primary authoritative URL
  source_type       source_type not null default 'manual',
  source_urls       jsonb default '[]',   -- all merged source URLs
  external_ids      jsonb default '{}',   -- {source_name: id} for matching
  confidence        confidence_level not null default 'medium',
  dedup_key         text,                 -- normalized title|date|venue
  -- recurrence
  is_recurring      boolean not null default false,
  recurrence_rule   text,                 -- RFC 5545 RRULE if recurring
  -- timestamps
  created_at        timestamptz not null default now(),
  last_updated      timestamptz not null default now()
);
create index events_start_idx   on events (start_time);
create index events_type_idx    on events (event_type);
create index events_parish_idx  on events (parish);
create index events_status_idx  on events (status);
create unique index events_dedup_idx on events (dedup_key);
create index events_title_trgm  on events using gin (title gin_trgm_ops);

-- USER FAVORITES --------------------------------------------------------------
create table favorites (
  user_id    uuid references auth.users(id) on delete cascade,
  event_id   uuid references events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

-- SOURCE REGISTRY (used by ingestion worker in Phase 3) -----------------------
create table sources (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  base_url     text,
  source_type  source_type not null,
  robots_ok    boolean default false,    -- confirmed scraping permitted
  refresh_hrs  int default 6,
  enabled      boolean default false,
  last_crawled timestamptz
);

-- Keep last_updated fresh on every event write -------------------------------
create or replace function set_last_updated()
returns trigger
language plpgsql
as $$
begin
  new.last_updated = now();
  return new;
end;
$$;

create trigger events_set_last_updated
  before update on events
  for each row execute function set_last_updated();

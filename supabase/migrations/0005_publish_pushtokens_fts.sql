-- =============================================================================
-- 0005 — Product-owner-approved additions on top of the Phase 0 contract:
--   (1) events.is_published  -> stage drafts in the admin; only published rows
--       are publicly readable. This is also the hook the Phase 4 partner
--       moderation flow needs.
--   (2) push_tokens          -> stable home for Expo push tokens (used Phase 2).
--   (3) full-text search     -> search by artist / organizer / venue, not just
--       title (adopts supabase/proposed/0005_fulltext_search.sql). pg_trgm still
--       provides typo tolerance.
-- All additive; no existing contract column changes type or meaning.
-- =============================================================================

-- (1) PUBLISH FLAG ------------------------------------------------------------
alter table events
  add column if not exists is_published boolean not null default true;

create index if not exists events_is_published_idx on events (is_published);

-- Tighten the public read policy: anon/authenticated see only published events.
-- (service_role bypasses RLS, so the admin curation tool still sees drafts.)
drop policy if exists "events are publicly readable" on events;
create policy "published events are publicly readable"
  on events for select
  using (is_published = true);

-- (2) PUSH TOKENS (Phase 2 — Expo push notifications) -------------------------
create table if not exists push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  expo_token  text not null,
  platform    text,                       -- 'ios' | 'android' | 'web'
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, expo_token)
);

alter table push_tokens enable row level security;

create policy "users manage their own push tokens (select)"
  on push_tokens for select using (auth.uid() = user_id);
create policy "users manage their own push tokens (insert)"
  on push_tokens for insert with check (auth.uid() = user_id);
create policy "users manage their own push tokens (update)"
  on push_tokens for update using (auth.uid() = user_id);
create policy "users manage their own push tokens (delete)"
  on push_tokens for delete using (auth.uid() = user_id);

-- (3) FULL-TEXT SEARCH --------------------------------------------------------
alter table events
  add column if not exists search_tsv tsvector
  generated always as (
    to_tsvector('simple',
      coalesce(title, '') || ' ' ||
      coalesce(organizer, '') || ' ' ||
      coalesce(short_description, '')
    )
  ) stored;

create index if not exists events_search_tsv_idx on events using gin (search_tsv);

-- Re-create search_events so free-text `q` matches title (trigram, typo-tolerant)
-- OR full-text over title/organizer/short_description. Signature unchanged, so
-- every caller (app, /feed, website) is unaffected.
create or replace function search_events(
  p_parishes    parish[]          default null,
  p_event_types event_type[]      default null,
  p_start_date  date              default null,
  p_end_date    date              default null,
  p_price_type  text              default 'any',
  p_lat         double precision  default null,
  p_lng         double precision  default null,
  p_radius_km   double precision  default null,
  p_q           text              default null,
  p_limit       int               default 100,
  p_offset      int               default 0
)
returns setof jsonb
language sql
stable
as $$
  with bounded as (
    select least(coalesce(nullif(p_limit, 0), 100), 200) as lim,
           greatest(coalesce(p_offset, 0), 0)            as off
  )
  select jsonb_build_object(
    'id', e.id,
    'title', e.title,
    'slug', e.slug,
    'start_time', e.start_time,
    'end_time', e.end_time,
    'timezone', e.timezone,
    'parish', e.parish,
    'venue', case when v.id is null then null else jsonb_build_object(
        'name', v.name,
        'address', v.address,
        'neighborhood', v.neighborhood,
        'parish', v.parish,
        'lat', st_y(v.geo::geometry),
        'lng', st_x(v.geo::geometry)
      ) end,
    'event_type', e.event_type,
    'status', e.status,
    'price_display', e.price_display,
    'price_min', e.price_min,
    'price_max', e.price_max,
    'currency', e.currency,
    'price_type', e.price_type,
    'flyer_url', e.flyer_url,
    'ticket_url', e.ticket_url,
    'organizer', e.organizer,
    'short_description', e.short_description,
    'description', e.description,
    'source_url', e.source_url,
    'source_type', e.source_type,
    'source_urls', e.source_urls,
    'confidence', e.confidence,
    'last_updated', e.last_updated
  )
  from events e
  left join venues v on v.id = e.venue_id
  cross join bounded b
  where e.start_time >= now()                                            -- upcoming only
    and (p_parishes    is null or e.parish = any(p_parishes))
    and (p_event_types is null or e.event_type = any(p_event_types))
    and (p_start_date  is null or (e.start_time at time zone 'America/Jamaica')::date >= p_start_date)
    and (p_end_date    is null or (e.start_time at time zone 'America/Jamaica')::date <= p_end_date)
    and (coalesce(p_price_type, 'any') = 'any' or e.price_type::text = p_price_type)
    and (
      p_lat is null or p_lng is null or p_radius_km is null
      or (v.geo is not null
          and st_dwithin(
            v.geo,
            geography(st_setsrid(st_makepoint(p_lng, p_lat), 4326)),
            p_radius_km * 1000
          ))
    )
    and (
      p_q is null or p_q = ''
      or e.title ilike '%' || p_q || '%'
      or e.title % p_q
      or e.search_tsv @@ websearch_to_tsquery('simple', p_q)
    )
  order by e.start_time asc
  limit (select lim from bounded)
  offset (select off from bounded);
$$;

grant execute on function search_events(parish[], event_type[], date, date, text,
  double precision, double precision, double precision, text, int, int)
  to anon, authenticated;

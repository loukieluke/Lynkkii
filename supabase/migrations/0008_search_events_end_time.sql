-- =============================================================================
-- Fix search_events "upcoming" filter: it excluded multi-day events the
-- moment they started (start_time >= now()), even while still running.
-- Use coalesce(end_time, start_time) so an event stays visible until it
-- actually ends. Signature unchanged, so every caller is unaffected.
-- =============================================================================
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
  where coalesce(e.end_time, e.start_time) >= now()                       -- upcoming or in progress
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

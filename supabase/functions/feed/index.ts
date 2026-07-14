// =============================================================================
// GET /feed — public feed Edge Function (brief Section 5).
// Wraps the canonical `search_events` RPC and returns either the JSON feed
// array or a `concise_list` (one line per event). Also serves as the seed of
// the future public B2B API.
//
// Query params (all optional, all combinable):
//   parish       repeatable or comma-separated (e.g. ?parish=Kingston&parish=St.%20James)
//   event_type   repeatable or comma-separated (music,festival,sports,arts,family,nightlife,other)
//   start_date   YYYY-MM-DD
//   end_date     YYYY-MM-DD
//   price_type   free | paid | any            (default any)
//   lat,lng,radius_km   "near me" (all three required together)
//   q            free-text search over title
//   limit        default 100, hard cap 200
//   offset       default 0
//   format       json (default) | concise_list
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

function err(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), { status, headers: JSON_HEADERS });
}

function multi(params: URLSearchParams, key: string): string[] | null {
  const all = params.getAll(key).flatMap((v) => v.split(',').map((s) => s.trim())).filter(Boolean);
  return all.length ? all : null;
}

function num(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw === null || raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: JSON_HEADERS });
  if (req.method !== 'GET') return err('Method not allowed', 405);

  const url = new URL(req.url);
  const p = url.searchParams;

  const format = (p.get('format') ?? 'json').toLowerCase();
  if (format !== 'json' && format !== 'concise_list') {
    return err("format must be 'json' or 'concise_list'");
  }

  const priceType = (p.get('price_type') ?? 'any').toLowerCase();
  if (!['free', 'paid', 'any'].includes(priceType)) {
    return err("price_type must be 'free', 'paid', or 'any'");
  }

  const lat = num(p, 'lat');
  const lng = num(p, 'lng');
  const radius = num(p, 'radius_km');
  if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(radius)) {
    return err('lat, lng, and radius_km must be numbers');
  }
  const nearProvided = [lat, lng, radius].filter((v) => v !== null).length;
  if (nearProvided !== 0 && nearProvided !== 3) {
    return err('near search requires all of lat, lng, and radius_km');
  }

  const limit = num(p, 'limit');
  const offset = num(p, 'offset');
  if (Number.isNaN(limit) || Number.isNaN(offset)) return err('limit and offset must be numbers');

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) return err('Server misconfigured: missing Supabase env', 500);

  const supabase = createClient(supabaseUrl, anonKey);

  const { data, error } = await supabase.rpc('search_events', {
    p_parishes: multi(p, 'parish'),
    p_event_types: multi(p, 'event_type'),
    p_start_date: p.get('start_date') || null,
    p_end_date: p.get('end_date') || null,
    p_price_type: priceType,
    p_lat: lat,
    p_lng: lng,
    p_radius_km: radius,
    p_q: p.get('q') || null,
    p_limit: limit ?? 100,
    p_offset: offset ?? 0,
  });

  if (error) return err(error.message, 500);

  const events = (data ?? []) as Array<Record<string, unknown>>;

  if (format === 'concise_list') {
    // "title — start_time — parish — price_display — source_url"
    const lines = events.map((e) =>
      [e.title, e.start_time, e.parish, e.price_display, e.source_url]
        .map((v) => (v == null ? '' : String(v)))
        .join(' — '),
    );
    return new Response(lines.join('\n'), {
      headers: { ...JSON_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  return new Response(JSON.stringify(events), { headers: JSON_HEADERS });
});

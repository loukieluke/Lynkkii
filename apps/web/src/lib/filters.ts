import {
  EVENT_TYPES,
  PARISHES,
  type EventFilters,
  type EventType,
  type Parish,
  type PriceFilter,
} from '@irie/types';

export type RawSearchParams = Record<string, string | string[] | undefined>;

function asArray(v: string | string[] | undefined): string[] {
  if (v == null) return [];
  return (Array.isArray(v) ? v : [v]).flatMap((s) => s.split(',')).map((s) => s.trim()).filter(Boolean);
}

function one(v: string | string[] | undefined): string | undefined {
  const a = asArray(v);
  return a.length ? a[0] : undefined;
}

/** Parse URL search params into the shared EventFilters contract (validated). */
export function parseFilters(sp: RawSearchParams): EventFilters {
  const parishes = asArray(sp.parish).filter((p): p is Parish =>
    (PARISHES as readonly string[]).includes(p),
  );
  const types = asArray(sp.event_type).filter((t): t is EventType =>
    (EVENT_TYPES as readonly string[]).includes(t),
  );

  const priceRaw = one(sp.price_type);
  const price: PriceFilter | undefined =
    priceRaw === 'free' || priceRaw === 'paid' || priceRaw === 'any' ? priceRaw : undefined;

  const start = one(sp.start_date);
  const end = one(sp.end_date);

  const lat = Number(one(sp.lat));
  const lng = Number(one(sp.lng));
  const radius = Number(one(sp.radius_km));
  const hasNear = Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(radius);

  const q = one(sp.q);
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const limit = 24;

  return {
    parish: parishes.length ? parishes : undefined,
    event_type: types.length ? types : undefined,
    price_type: price && price !== 'any' ? price : undefined,
    date_range: start || end ? { start_date: start, end_date: end } : undefined,
    near: hasNear ? { lat, lng, radius_km: radius } : undefined,
    q: q || undefined,
    limit,
    offset: (page - 1) * limit,
  };
}

/** Build a query string from a partial set of filter params (for links/toggles). */
export function buildQuery(base: RawSearchParams, patch: Record<string, string | string[] | null>): string {
  const params = new URLSearchParams();
  const merged: RawSearchParams = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete merged[k];
    else merged[k] = v;
  }
  for (const [k, v] of Object.entries(merged)) {
    if (v == null) continue;
    for (const item of Array.isArray(v) ? v : [v]) {
      if (item) params.append(k, item);
    }
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

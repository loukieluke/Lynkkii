'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { EVENT_TYPES, EVENT_TYPE_LABELS, PARISHES } from '@lynkkii/types';
import { useTransition } from 'react';

const NEAR_RADIUS_KM = '25';

export function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function push(next: URLSearchParams) {
    next.delete('page');
    startTransition(() => router.push(`/?${next.toString()}`));
  }

  function toggleMulti(key: string, val: string) {
    const next = new URLSearchParams(params.toString());
    const current = next.getAll(key);
    next.delete(key);
    if (current.includes(val)) current.filter((v) => v !== val).forEach((v) => next.append(key, v));
    else [...current, val].forEach((v) => next.append(key, v));
    push(next);
  }

  function setPrice(val: 'free' | 'paid') {
    const next = new URLSearchParams(params.toString());
    if (next.get('price_type') === val) next.delete('price_type');
    else next.set('price_type', val);
    push(next);
  }

  function toggleNear() {
    const next = new URLSearchParams(params.toString());
    if (next.get('lat')) {
      ['lat', 'lng', 'radius_km'].forEach((k) => next.delete(k));
      push(next);
      return;
    }
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const n = new URLSearchParams(params.toString());
        n.set('lat', pos.coords.latitude.toFixed(5));
        n.set('lng', pos.coords.longitude.toFixed(5));
        n.set('radius_km', NEAR_RADIUS_KM);
        push(n);
      },
      () => alert('Could not get your location. Please allow location access.'),
    );
  }

  function clearAll() {
    startTransition(() => router.push('/'));
  }

  const activeTypes = params.getAll('event_type');
  const activeParishes = params.getAll('parish');
  const price = params.get('price_type');
  const nearOn = Boolean(params.get('lat'));
  const hasAny = activeTypes.length || activeParishes.length || price || nearOn || params.get('q');

  return (
    <div style={{ opacity: pending ? 0.6 : 1 }}>
      <div className="chips" role="group" aria-label="Event type">
        {EVENT_TYPES.map((t) => (
          <button
            key={t}
            className="chip"
            data-active={activeTypes.includes(t)}
            onClick={() => toggleMulti('event_type', t)}
            type="button"
          >
            {EVENT_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="chips" role="group" aria-label="Price and location">
        <button className="chip" data-active={price === 'free'} onClick={() => setPrice('free')} type="button">
          Free
        </button>
        <button className="chip" data-active={price === 'paid'} onClick={() => setPrice('paid')} type="button">
          Paid
        </button>
        <button className="chip" data-active={nearOn} onClick={toggleNear} type="button">
          📍 Near me
        </button>

        <select
          className="chip"
          aria-label="Parish"
          value={activeParishes[0] ?? ''}
          onChange={(e) => {
            const next = new URLSearchParams(params.toString());
            next.delete('parish');
            if (e.target.value) next.append('parish', e.target.value);
            push(next);
          }}
        >
          <option value="">All parishes</option>
          {PARISHES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {hasAny ? (
          <button className="chip chip--ghost" data-active onClick={clearAll} type="button">
            Clear ✕
          </button>
        ) : null}
      </div>
    </div>
  );
}

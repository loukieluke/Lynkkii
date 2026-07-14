'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import type { FeedEvent } from '@irie/types';
import { formatEventDate, priceBadge } from '@irie/api';

// Kingston-ish default center; fit to markers when we have them.
const JAMAICA_CENTER: [number, number] = [18.05, -77.3];

export function MapView({ events }: { events: FeedEvent[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import('leaflet').Map | undefined;
    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current).setView(JAMAICA_CENTER, 9);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: 'irie-pin',
        html: '<div style="width:18px;height:18px;border-radius:50%;background:#009b3a;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const pts: [number, number][] = [];
      for (const e of events) {
        const lat = e.venue?.lat;
        const lng = e.venue?.lng;
        if (lat == null || lng == null) continue;
        pts.push([lat, lng]);
        const href = `/event/${e.slug ?? e.id}`;
        L.marker([lat, lng], { icon })
          .addTo(map)
          .bindPopup(
            `<a href="${href}" style="font-weight:700;color:#0e1512">${escapeHtml(e.title)}</a>` +
              `<br/><span style="color:#6b7770">${escapeHtml(formatEventDate(e.start_time))} · ${escapeHtml(
                priceBadge(e),
              )}</span>` +
              (e.venue?.name ? `<br/><span style="color:#6b7770">${escapeHtml(e.venue.name)}</span>` : ''),
          );
      }

      if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 13 });
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [events]);

  return <div ref={containerRef} style={{ height: '70vh', width: '100%', borderRadius: 16 }} />;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}

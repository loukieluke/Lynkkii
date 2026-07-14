import { JAMAICA_TZ, type FeedEvent } from '@irie/types';

// Display helpers shared by web + mobile. All times render in America/Jamaica.

export function formatEventDate(iso: string): string {
  return new Intl.DateTimeFormat('en-JM', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: JAMAICA_TZ,
  }).format(new Date(iso));
}

export function formatEventTime(iso: string): string {
  return new Intl.DateTimeFormat('en-JM', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: JAMAICA_TZ,
  }).format(new Date(iso));
}

export function formatEventDateTime(iso: string): string {
  return `${formatEventDate(iso)} · ${formatEventTime(iso)}`;
}

/** Short price badge text: "Free" or a compact price display. */
export function priceBadge(event: Pick<FeedEvent, 'price_type' | 'price_display'>): string {
  if (event.price_type === 'free') return 'Free';
  return event.price_display?.trim() || 'Paid';
}

/** A canonical, shareable web URL for an event (deep-link fallback). */
export function eventWebUrl(baseUrl: string, event: Pick<FeedEvent, 'slug' | 'id'>): string {
  const path = event.slug ?? event.id;
  return `${baseUrl.replace(/\/$/, '')}/event/${path}`;
}

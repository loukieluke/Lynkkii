import type { Metadata } from 'next';
import Link from 'next/link';
import { searchEvents } from '@lynkkii/api';
import type { FeedEvent } from '@lynkkii/types';
import { EventCard } from '@/components/EventCard';
import { getReadClient } from '@/lib/supabase';
import { PARISH_LINKS, CATEGORY_LINKS } from '@/lib/seo-routes';

export const dynamic = 'force-dynamic';

const DESCRIPTION =
  'Free upcoming events in Jamaica — concerts, festivals, community and family events with no ticket cost, updated daily.';

export const metadata: Metadata = {
  title: 'Free Events in Jamaica',
  description: DESCRIPTION,
  alternates: { canonical: '/events/free' },
  openGraph: { title: 'Free Events in Jamaica', description: DESCRIPTION, url: '/events/free' },
};

export default async function FreeEventsPage() {
  const client = getReadClient();
  let events: FeedEvent[] = [];
  if (client) {
    try {
      events = await searchEvents(client, { price_type: 'free', limit: 100 });
    } catch {
      events = [];
    }
  }

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Free Events in Jamaica</h1>
          <p>
            {events.length
              ? `${events.length} upcoming free event${events.length === 1 ? '' : 's'} across Jamaica — no ticket cost, curated and updated daily.`
              : `No free events listed right now — check back soon, or browse what's happening across Jamaica.`}
          </p>
        </div>
      </section>

      <div className="container">
        {events.length ? (
          <div className="grid">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        ) : (
          <div className="notice">
            <h3>No free events yet</h3>
            <p>
              <Link href="/">See all upcoming events in Jamaica →</Link>
            </p>
          </div>
        )}

        <nav className="browse-links" aria-label="Browse">
          <h2>Browse by category</h2>
          <div className="browse-links__row">
            {CATEGORY_LINKS.map((c) => (
              <Link key={c.slug} className="chip" href={`/events/category/${c.slug}`}>
                {c.label}
              </Link>
            ))}
          </div>
          <h2>Browse by parish</h2>
          <div className="browse-links__row">
            {PARISH_LINKS.map((p) => (
              <Link key={p.slug} className="chip" href={`/events/parish/${p.slug}`}>
                {p.parish}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}

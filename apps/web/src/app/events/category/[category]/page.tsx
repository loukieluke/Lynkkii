import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { searchEvents } from '@lynkkii/api';
import { EVENT_TYPE_LABELS, type FeedEvent } from '@lynkkii/types';
import { EventCard } from '@/components/EventCard';
import { getReadClient } from '@/lib/supabase';
import { PARISH_LINKS, CATEGORY_LINKS, slugToCategory } from '@/lib/seo-routes';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return CATEGORY_LINKS.map(({ slug }) => ({ category: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const type = slugToCategory(slug);
  if (!type) return { title: 'Category not found', robots: { index: false } };
  const label = EVENT_TYPE_LABELS[type];
  const path = `/events/category/${slug}`;
  const description = `Upcoming ${label.toLowerCase()} events across Jamaica — dates, venues and ticket info, updated daily.`;
  return {
    title: `${label} Events in Jamaica`,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${label} Events in Jamaica`, description, url: path },
  };
}

export default async function CategoryEventsPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const type = slugToCategory(slug);
  if (!type) notFound();
  const label = EVENT_TYPE_LABELS[type];

  const client = getReadClient();
  let events: FeedEvent[] = [];
  if (client) {
    try {
      events = await searchEvents(client, { event_type: [type], limit: 100 });
    } catch {
      events = [];
    }
  }

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>{label} Events in Jamaica</h1>
          <p>
            {events.length
              ? `${events.length} upcoming ${label.toLowerCase()} event${events.length === 1 ? '' : 's'} across Jamaica, curated and updated daily.`
              : `No upcoming ${label.toLowerCase()} events right now — check back soon, or browse what's happening across Jamaica.`}
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
            <h3>No {label.toLowerCase()} events yet</h3>
            <p>
              <Link href="/">See all upcoming events in Jamaica →</Link>
            </p>
          </div>
        )}

        <nav className="browse-links" aria-label="Other categories">
          <h2>Browse other categories</h2>
          <div className="browse-links__row">
            {CATEGORY_LINKS.filter((c) => c.type !== type).map((c) => (
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

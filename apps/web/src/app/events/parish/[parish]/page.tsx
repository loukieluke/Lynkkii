import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { searchEvents } from '@lynkkii/api';
import type { FeedEvent } from '@lynkkii/types';
import { EventCard } from '@/components/EventCard';
import { getReadClient } from '@/lib/supabase';
import { PARISH_LINKS, CATEGORY_LINKS, slugToParish } from '@/lib/seo-routes';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return PARISH_LINKS.map(({ slug }) => ({ parish: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ parish: string }>;
}): Promise<Metadata> {
  const { parish: slug } = await params;
  const parish = slugToParish(slug);
  if (!parish) return { title: 'Parish not found', robots: { index: false } };
  const path = `/events/parish/${slug}`;
  const description = `Upcoming concerts, festivals, sports, arts and nightlife events happening in ${parish}, Jamaica. Updated daily.`;
  return {
    title: `Events in ${parish}, Jamaica`,
    description,
    alternates: { canonical: path },
    openGraph: { title: `Events in ${parish}, Jamaica`, description, url: path },
  };
}

export default async function ParishEventsPage({
  params,
}: {
  params: Promise<{ parish: string }>;
}) {
  const { parish: slug } = await params;
  const parish = slugToParish(slug);
  if (!parish) notFound();

  const client = getReadClient();
  let events: FeedEvent[] = [];
  if (client) {
    try {
      events = await searchEvents(client, { parish: [parish], limit: 100 });
    } catch {
      events = [];
    }
  }

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Events in {parish}</h1>
          <p>
            {events.length
              ? `${events.length} upcoming event${events.length === 1 ? '' : 's'} in ${parish} — concerts, festivals, sports, arts and nightlife, curated and updated daily.`
              : `No upcoming events in ${parish} right now — check back soon, or browse what's happening across Jamaica.`}
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
            <h3>No events in {parish} yet</h3>
            <p>
              <Link href="/">See all upcoming events in Jamaica →</Link>
            </p>
          </div>
        )}

        <nav className="browse-links" aria-label="Other parishes">
          <h2>Browse other parishes</h2>
          <div className="browse-links__row">
            {PARISH_LINKS.filter((p) => p.parish !== parish).map((p) => (
              <Link key={p.slug} className="chip" href={`/events/parish/${p.slug}`}>
                {p.parish}
              </Link>
            ))}
          </div>
          <h2>Browse by category</h2>
          <div className="browse-links__row">
            {CATEGORY_LINKS.map((c) => (
              <Link key={c.slug} className="chip" href={`/events/category/${c.slug}`}>
                {c.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}

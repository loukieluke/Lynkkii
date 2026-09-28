import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getEventBySlug, formatEventDate, formatEventTime, priceBadge } from '@lynkkii/api';
import { EVENT_TYPE_LABELS, type FeedEvent } from '@lynkkii/types';
import { ShareButton } from '@/components/ShareButton';
import { getReadClient } from '@/lib/supabase';
import { SITE_URL } from '@/lib/env';

export const dynamic = 'force-dynamic';

async function load(slug: string): Promise<FeedEvent | null> {
  const client = getReadClient();
  if (!client) return null;
  try {
    return await getEventBySlug(client, slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await load(slug);
  if (!event) return { title: 'Event not found', robots: { index: false } };
  const path = `/event/${event.slug ?? event.id}`;
  const where = [event.venue?.name, event.parish].filter(Boolean).join(', ');
  const description =
    event.short_description ??
    `${event.title} — ${formatEventDate(event.start_time)}, ${formatEventTime(event.start_time)}` +
      `${where ? ` at ${where}` : ''}. Time, location and ticket info on Lynkkii.`;
  return {
    title: event.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: event.title,
      description,
      url: path,
      type: 'website',
      images: event.flyer_url ? [event.flyer_url] : undefined,
    },
    twitter: {
      card: event.flyer_url ? 'summary_large_image' : 'summary',
      title: event.title,
      description,
      images: event.flyer_url ? [event.flyer_url] : undefined,
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await load(slug);
  if (!event) notFound();

  const v = event.venue;
  const hasGeo = v?.lat != null && v?.lng != null;
  const shareUrl = `${SITE_URL}/event/${event.slug ?? event.id}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: event.start_time,
    endDate: event.end_time ?? undefined,
    eventStatus: `https://schema.org/Event${event.status === 'cancelled' ? 'Cancelled' : 'Scheduled'}`,
    image: event.flyer_url ? [event.flyer_url] : undefined,
    description: event.short_description ?? event.description ?? undefined,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    offers:
      event.price_type === 'free' || event.price_min != null
        ? {
            '@type': 'Offer',
            url: event.ticket_url ?? shareUrl,
            price: event.price_type === 'free' ? 0 : event.price_min,
            priceCurrency: event.currency ?? 'JMD',
            availability: 'https://schema.org/InStock',
          }
        : undefined,
    location: v
      ? {
          '@type': 'Place',
          name: v.name,
          address: v.address ?? undefined,
          geo: hasGeo ? { '@type': 'GeoCoordinates', latitude: v.lat, longitude: v.lng } : undefined,
        }
      : undefined,
    organizer: event.organizer ? { '@type': 'Organization', name: event.organizer } : undefined,
    url: shareUrl,
  };

  return (
    <div className="detail">
      <div className="container">
        <Link href="/" className="backlink">
          ← All events
        </Link>

        <div className="detail__grid">
          <div className="detail__flyer">
            {event.flyer_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.flyer_url} alt={event.title} />
            ) : null}
          </div>

          <div>
            <div className="card__date">{EVENT_TYPE_LABELS[event.event_type]}</div>
            <h1>{event.title}</h1>

            <div className="detail__row">
              <span className="k">🗓</span>
              <span className="v">
                <strong>{formatEventDate(event.start_time)}</strong>
                <br />
                {formatEventTime(event.start_time)}
                {event.end_time ? ` – ${formatEventTime(event.end_time)}` : ''} (Jamaica time)
              </span>
            </div>

            {v ? (
              <div className="detail__row">
                <span className="k">📍</span>
                <span className="v">
                  <strong>{v.name}</strong>
                  {v.address ? (
                    <>
                      <br />
                      {v.address}
                    </>
                  ) : null}
                  {event.parish ? (
                    <>
                      <br />
                      {event.parish}
                    </>
                  ) : null}
                </span>
              </div>
            ) : null}

            <div className="detail__row">
              <span className="k">🎟</span>
              <span className="v">
                <strong>{priceBadge(event)}</strong>
              </span>
            </div>

            {event.organizer ? (
              <div className="detail__row">
                <span className="k">👤</span>
                <span className="v">{event.organizer}</span>
              </div>
            ) : null}

            <div className="detail__actions">
              {event.ticket_url ? (
                <a className="btn btn--gold" href={event.ticket_url} target="_blank" rel="noreferrer">
                  Get Tickets
                </a>
              ) : null}
              {hasGeo ? (
                <a
                  className="btn btn--ghost"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${v!.lat},${v!.lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Directions
                </a>
              ) : null}
              <ShareButton title={event.title} url={shareUrl} />
            </div>

            {event.description ? <p className="prose">{event.description}</p> : null}

            {hasGeo ? (
              <div className="map">
                <iframe
                  title="Event location map"
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${v!.lng! - 0.01}%2C${
                    v!.lat! - 0.01
                  }%2C${v!.lng! + 0.01}%2C${v!.lat! + 0.01}&layer=mapnik&marker=${v!.lat}%2C${v!.lng}`}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}

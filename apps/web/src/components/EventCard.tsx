import Link from 'next/link';
import { formatEventDateTime, priceBadge } from '@lynkkii/api';
import { EVENT_TYPE_LABELS, type FeedEvent } from '@lynkkii/types';

export function EventCard({ event }: { event: FeedEvent }) {
  const href = `/event/${event.slug ?? event.id}`;
  const isFree = event.price_type === 'free';
  const venueName = event.venue?.name;
  const location = [venueName, event.parish].filter(Boolean).join(' · ');

  return (
    <Link href={href} className="card">
      <div className="card__media">
        {event.flyer_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.flyer_url} alt={event.title} loading="lazy" />
        ) : null}
        <div className="card__badges">
          <span className={`badge ${isFree ? 'badge--free' : ''}`}>{priceBadge(event)}</span>
          <span className="badge badge--type">{EVENT_TYPE_LABELS[event.event_type]}</span>
        </div>
      </div>
      <div className="card__body">
        <div className="card__date">{formatEventDateTime(event.start_time)}</div>
        <h3 className="card__title">{event.title}</h3>
        {location ? <div className="card__meta">📍 {location}</div> : null}
      </div>
    </Link>
  );
}

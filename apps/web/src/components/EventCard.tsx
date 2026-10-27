import Link from 'next/link';
import { formatEventDateTime, priceBadge } from '@lynkkii/api';
import { EVENT_TYPE_LABELS, JAMAICA_TZ, type FeedEvent } from '@lynkkii/types';
import { PinIcon } from './Icons';

const monthFmt = new Intl.DateTimeFormat('en-US', { timeZone: JAMAICA_TZ, month: 'short' });
const dayFmt = new Intl.DateTimeFormat('en-US', { timeZone: JAMAICA_TZ, day: '2-digit' });

export function EventCard({ event }: { event: FeedEvent }) {
  const href = `/event/${event.slug ?? event.id}`;
  const isFree = event.price_type === 'free';
  const location = [event.venue?.name, event.parish].filter(Boolean).join(' · ');
  const start = new Date(event.start_time);

  return (
    <Link href={href} className="card">
      <div className="card__media">
        {event.flyer_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.flyer_url} alt={event.title} loading="lazy" />
        ) : null}
        <div className="card__datebadge" aria-hidden="true">
          <span>{monthFmt.format(start).toUpperCase()}</span>
          <strong>{dayFmt.format(start)}</strong>
        </div>
        <div className="card__badges">
          <span className={`badge ${isFree ? 'badge--free' : ''}`}>{priceBadge(event)}</span>
          <span className="badge">{EVENT_TYPE_LABELS[event.event_type]}</span>
        </div>
      </div>
      <div className="card__body">
        <div className="card__date">{formatEventDateTime(event.start_time)}</div>
        <h3 className="card__title">{event.title}</h3>
        {location ? (
          <div className="card__meta">
            <PinIcon size={15} />
            {location}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

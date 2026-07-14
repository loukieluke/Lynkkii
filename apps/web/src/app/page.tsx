import Link from 'next/link';
import { searchEvents } from '@irie/api';
import type { FeedEvent } from '@irie/types';
import { EventCard } from '@/components/EventCard';
import { SearchBox } from '@/components/SearchBox';
import { FilterBar } from '@/components/FilterBar';
import { getReadClient } from '@/lib/supabase';
import { buildQuery, parseFilters, type RawSearchParams } from '@/lib/filters';

export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const client = getReadClient();

  let events: FeedEvent[] = [];
  let error: string | null = null;

  if (!client) {
    error = 'unconfigured';
  } else {
    try {
      events = await searchEvents(client, filters);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load events';
    }
  }

  const page = Math.max(1, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1);
  const pageSize = filters.limit ?? 24;
  const hasNext = events.length === pageSize;

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>What’s happening in Jamaica</h1>
          <p>
            Concerts, festivals, sports, arts, family fun and nightlife — curated and always
            up to date.
          </p>
        </div>
      </section>

      <section className="toolbar">
        <div className="container">
          <SearchBox />
          <FilterBar />
        </div>
      </section>

      <div className="container">
        {error === 'unconfigured' ? (
          <div className="notice">
            <h3>Connect Supabase to see events</h3>
            <p>
              Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>apps/web/.env.local</code>,
              then reload.
            </p>
          </div>
        ) : error ? (
          <div className="notice">
            <h3>Couldn’t load events</h3>
            <p>{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="notice">
            <h3>No upcoming events match</h3>
            <p>Try clearing a filter or broadening your search.</p>
          </div>
        ) : (
          <>
            <div className="grid">
              {events.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
            {(page > 1 || hasNext) && (
              <nav className="pager">
                {page > 1 ? (
                  <Link
                    className="btn btn--ghost"
                    href={`/${buildQuery(sp, { page: String(page - 1) })}`}
                  >
                    ← Previous
                  </Link>
                ) : null}
                {hasNext ? (
                  <Link
                    className="btn btn--ghost"
                    href={`/${buildQuery(sp, { page: String(page + 1) })}`}
                  >
                    Next →
                  </Link>
                ) : null}
              </nav>
            )}
          </>
        )}
      </div>
    </>
  );
}

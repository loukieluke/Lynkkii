import type { Metadata } from 'next';
import Link from 'next/link';
import { searchEvents } from '@lynkkii/api';
import type { FeedEvent } from '@lynkkii/types';
import { EventCard } from '@/components/EventCard';
import { SearchBox } from '@/components/SearchBox';
import { FilterBar } from '@/components/FilterBar';
import {
  ArtsIcon,
  ChevronRightIcon,
  FamilyIcon,
  FestivalIcon,
  MusicIcon,
  NightlifeIcon,
  SportsIcon,
  TagIcon,
} from '@/components/Icons';
import { getReadClient } from '@/lib/supabase';
import { buildQuery, parseFilters, type RawSearchParams } from '@/lib/filters';
import { jamaicaToday, jamaicaWeekend } from '@/lib/dates';

const CATEGORY_TILES = [
  { href: '/events/category/music', label: 'Music', color: '#E0306F', Icon: MusicIcon },
  { href: '/events/category/festival', label: 'Festival', color: '#F2711C', Icon: FestivalIcon },
  { href: '/events/category/sports', label: 'Sports', color: '#009B3A', Icon: SportsIcon },
  { href: '/events/category/arts', label: 'Arts', color: '#2F6FEB', Icon: ArtsIcon },
  { href: '/events/category/family', label: 'Family', color: '#8B4FD8', Icon: FamilyIcon },
  { href: '/events/category/nightlife', label: 'Nightlife', color: '#B5179E', Icon: NightlifeIcon },
  { href: '/events/free', label: 'Free', color: '#FED100', Icon: TagIcon, dark: true },
];

async function safeSearch(
  client: NonNullable<ReturnType<typeof getReadClient>>,
  filters: Parameters<typeof searchEvents>[1],
): Promise<FeedEvent[]> {
  try {
    return await searchEvents(client, filters);
  } catch {
    return [];
  }
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const isFilteredView = Object.keys(sp).length > 0;
  return {
    alternates: { canonical: '/' },
    robots: isFilteredView ? { index: false, follow: true } : undefined,
  };
}

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

  const isFilteredView = Object.keys(sp).length > 0;
  let tonight: FeedEvent[] = [];
  let weekend: FeedEvent[] = [];
  if (client && !isFilteredView) {
    const today = jamaicaToday();
    [tonight, weekend] = await Promise.all([
      safeSearch(client, { date_range: { start_date: today, end_date: today }, limit: 12 }),
      safeSearch(client, { date_range: jamaicaWeekend(), limit: 12 }),
    ]);
  }
  const showTonight = tonight.length > 0;
  const upNext = showTonight ? [] : events.slice(0, 10);

  const page = Math.max(1, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1);
  const pageSize = filters.limit ?? 24;
  const hasNext = events.length === pageSize;

  return (
    <>
      {isFilteredView ? (
        <section className="hero">
          <div className="container">
            <h1>Find your vibe</h1>
            <p>Search and filter upcoming events across Jamaica.</p>
          </div>
        </section>
      ) : (
        <div className="container">
          <section className="feature" aria-label="Featured">
            <div className="feature__copy">
              <div className="feature__kicker">MUSIC · FOOD · CULTURE · GOOD PEOPLE</div>
              <h1>
                <span>Jamaica</span>
                <span>Land We Love</span>
              </h1>
              <p>
                Concerts, festivals, sports, arts and nightlife across the island, curated and
                updated every day.
              </p>
              <div className="feature__actions">
                <a className="btn btn--gold btn--lg" href="#all-events">
                  Explore events <ChevronRightIcon size={18} />
                </a>
                <Link className="btn btn--ghost btn--lg" href="/events/free">
                  Free events
                </Link>
              </div>
            </div>
            <div className="feature__flag" aria-hidden="true">
              <i />
              <i />
              <b />
              <b />
            </div>
          </section>

          <section className="section" aria-labelledby="vibe-heading">
            <div className="section__head">
              <h2 id="vibe-heading">Browse by vibe</h2>
              <Link href="/events">All categories</Link>
            </div>
            <div className="cats">
              {CATEGORY_TILES.map(({ href, label, color, Icon, dark }) => (
                <Link key={href} href={href} className="cat">
                  <span className="cat__icon" style={{ background: color, color: dark ? '#0b0d0c' : '#fff' }}>
                    <Icon />
                  </span>
                  {label}
                </Link>
              ))}
            </div>
          </section>

          {showTonight || upNext.length ? (
            <section className="section" aria-labelledby="tonight-heading">
              <div className="section__head">
                <h2 id="tonight-heading">{showTonight ? 'Tonight in Jamaica' : 'Coming up next'}</h2>
                <a href="#all-events">See all</a>
              </div>
              <div className="row row--tall">
                {(showTonight ? tonight : upNext).map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </section>
          ) : null}

          {weekend.length ? (
            <section className="section" aria-labelledby="weekend-heading">
              <div className="section__head">
                <h2 id="weekend-heading">This weekend</h2>
                <a href="#all-events">See all</a>
              </div>
              <div className="row">
                {weekend.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </section>
          ) : null}

          <div className="section section__head" id="all-events">
            <h2>All upcoming events</h2>
          </div>
        </div>
      )}

      <section className="toolbar" aria-label="Search and filters">
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

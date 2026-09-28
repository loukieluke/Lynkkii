import type { Metadata } from 'next';
import Link from 'next/link';
import { PARISH_LINKS, CATEGORY_LINKS } from '@/lib/seo-routes';

const DESCRIPTION =
  'Browse upcoming Jamaican events by parish or category — concerts, festivals, sports, arts, family and nightlife.';

export const metadata: Metadata = {
  title: 'Browse Events',
  description: DESCRIPTION,
  alternates: { canonical: '/events' },
  openGraph: { title: 'Browse Events · Lynkkii', description: DESCRIPTION, url: '/events' },
};

export default function EventsHubPage() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Browse Events</h1>
          <p>Find what&rsquo;s happening by parish or by category.</p>
        </div>
      </section>

      <div className="container">
        <nav className="browse-links" aria-label="Browse all">
          <h2>By parish</h2>
          <div className="browse-links__row">
            {PARISH_LINKS.map((p) => (
              <Link key={p.slug} className="chip" href={`/events/parish/${p.slug}`}>
                {p.parish}
              </Link>
            ))}
          </div>
          <h2>By category</h2>
          <div className="browse-links__row">
            {CATEGORY_LINKS.map((c) => (
              <Link key={c.slug} className="chip" href={`/events/category/${c.slug}`}>
                {c.label}
              </Link>
            ))}
            <Link className="chip" href="/events/free">
              Free
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}

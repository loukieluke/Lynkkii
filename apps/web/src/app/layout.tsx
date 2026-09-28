import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/next';
import { SITE_URL } from '@/lib/env';
import './globals.css';

const DESCRIPTION =
  'Discover upcoming concerts, festivals, sports, arts, family, and nightlife events across Jamaica. Curated, accurate, and always up to date.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Lynkkii — What’s happening in Jamaica',
    template: '%s · Lynkkii',
  },
  description: DESCRIPTION,
  applicationName: 'Lynkkii',
  openGraph: {
    siteName: 'Lynkkii',
    title: 'Lynkkii — What’s happening in Jamaica',
    description: DESCRIPTION,
    type: 'website',
    locale: 'en_JM',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Lynkkii',
      description: DESCRIPTION,
      inLanguage: 'en-JM',
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Lynkkii',
      url: SITE_URL,
    },
  ],
};

export const viewport: Viewport = {
  themeColor: '#009b3a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-JM">
      <body>
        <header className="site-header">
          <div className="container site-header__row">
            <Link href="/" className="brand" aria-label="Lynkkii home">
              <span className="brand__dot" aria-hidden />
              <span>
                Lynk<em>kii</em>
              </span>
            </Link>
            <nav className="nav">
              <Link href="/">Discover</Link>
              <Link href="/?price_type=free">Free</Link>
              <Link href="/map">Map</Link>
              <Link href="/events">Browse</Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="site-footer">
          <div className="container">
            Lynkkii · Curated Jamaican events · Times shown in Jamaica time
            (America/Jamaica).
          </div>
        </footer>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
        <Analytics />
      </body>
    </html>
  );
}

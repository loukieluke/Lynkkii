import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Anton, Inter, Kaushan_Script } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { TabBar } from '@/components/TabBar';
import { SITE_URL } from '@/lib/env';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--font-anton', display: 'swap' });
const kaushan = Kaushan_Script({ subsets: ['latin'], weight: '400', variable: '--font-kaushan', display: 'swap' });

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
  themeColor: '#0b0d0c',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-JM" className={`${inter.variable} ${anton.variable} ${kaushan.variable}`}>
      <body>
        <a href="#main" className="visually-hidden skip-link">
          Skip to content
        </a>
        <header className="site-header">
          <div className="container site-header__row">
            <Link href="/" className="brand" aria-label="Lynkkii home">
              <span className="brand__mark" aria-hidden />
              <span>
                LYNK<em>KII</em>
              </span>
            </Link>
            <nav className="nav" aria-label="Main">
              <Link href="/">Discover</Link>
              <Link href="/events">Browse</Link>
              <Link href="/events/free">Free</Link>
              <Link href="/map">Map</Link>
            </nav>
          </div>
        </header>

        <main id="main">{children}</main>

        <footer className="site-footer">
          <div className="container site-footer__row">
            <span>Lynkkii · Curated Jamaican events · Times shown in Jamaica time</span>
            <span className="site-footer__tagline">Same island, more vibes</span>
          </div>
        </footer>
        <TabBar />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
        <Analytics />
      </body>
    </html>
  );
}

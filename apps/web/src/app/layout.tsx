import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'IrieEvents — What’s happening in Jamaica',
  description:
    'Discover upcoming concerts, festivals, sports, arts, family, and nightlife events across Jamaica. Curated, accurate, and always up to date.',
  openGraph: {
    title: 'IrieEvents',
    description: 'Discover upcoming events across Jamaica.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#009b3a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container site-header__row">
            <Link href="/" className="brand" aria-label="IrieEvents home">
              <span className="brand__dot" aria-hidden />
              <span>
                Irie<em>Events</em>
              </span>
            </Link>
            <nav className="nav">
              <Link href="/">Discover</Link>
              <Link href="/?price_type=free">Free</Link>
              <Link href="/map">Map</Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="site-footer">
          <div className="container">
            IrieEvents · Curated Jamaican events · Times shown in Jamaica time
            (America/Jamaica).
          </div>
        </footer>
      </body>
    </html>
  );
}

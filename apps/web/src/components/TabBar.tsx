'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GridIcon, HomeIcon, MapIcon, TagIcon } from './Icons';

const TABS = [
  { href: '/', label: 'Home', Icon: HomeIcon },
  { href: '/events', label: 'Browse', Icon: GridIcon },
  { href: '/map', label: 'Map', Icon: MapIcon },
  { href: '/events/free', label: 'Free', Icon: TagIcon },
];

export function TabBar() {
  const pathname = usePathname();
  const active = (href: string) =>
    href === '/' ? pathname === '/' : href === '/events' ? pathname === '/events' || pathname.startsWith('/events/parish') || pathname.startsWith('/events/category') : pathname.startsWith(href);

  return (
    <nav className="tabbar" aria-label="Primary">
      {TABS.map(({ href, label, Icon }) => (
        <Link key={href} href={href} aria-current={active(href) ? 'page' : undefined}>
          <Icon />
          {label}
        </Link>
      ))}
    </nav>
  );
}

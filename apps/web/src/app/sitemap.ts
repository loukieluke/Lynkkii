import type { MetadataRoute } from 'next';
import { searchEvents } from '@lynkkii/api';
import type { FeedEvent } from '@lynkkii/types';
import { getReadClient } from '@/lib/supabase';
import { SITE_URL } from '@/lib/env';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/map`, changeFrequency: 'daily', priority: 0.5 },
  ];

  const client = getReadClient();
  if (!client) return pages;

  let events: FeedEvent[] = [];
  try {
    events = await searchEvents(client, { limit: 200 });
  } catch {
    return pages;
  }

  return [
    ...pages,
    ...events.map((e) => ({
      url: `${SITE_URL}/event/${e.slug ?? e.id}`,
      lastModified: e.last_updated ? new Date(e.last_updated) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}

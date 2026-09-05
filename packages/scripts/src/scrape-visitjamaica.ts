/**
 * Scrape visitjamaica.com's public events feed and upsert into Supabase.
 * Run on a schedule via .github/workflows/scrape-events.yml.
 *
 * Source: the site's events RSS feed lists upcoming events; each event's
 * detail page embeds a schema.org/Event JSON-LD block with the venue,
 * dates, and coordinates the feed itself doesn't include.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm --filter @lynkkii/scripts exec tsx src/scrape-visitjamaica.ts
 *
 * Pass --dry-run to fetch + parse without touching Supabase (no env vars needed).
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { importEvents, type ScrapedEvent } from './lib/events';

const RSS_URL = 'https://www.visitjamaica.com/event/rss/';
// The site's WAF (Akamai) blocks requests without a browser-like User-Agent.
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const REQUEST_DELAY_MS = 400;

const dryRun = process.argv.includes('--dry-run');
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!dryRun && (!url || !serviceKey)) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const client = dryRun ? null : createClient(url!, serviceKey!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type FeedItem = {
  title: string;
  link: string;
  categories: string[];
};

type EventLdJson = {
  '@type': string;
  name?: string;
  startDate?: string;
  endDate?: string;
  image?: string;
  url?: string;
  description?: string;
  location?: {
    name?: string;
    address?: { streetAddress?: string };
    geo?: { latitude?: number; longitude?: number };
  };
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchText(target: string): Promise<string> {
  const res = await fetch(target, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} fetching ${target}`);
  return res.text();
}

function matchTag(block: string, tag: string): string | null {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  const raw = (m?.[1] ?? '').trim();
  if (!raw) return null;
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/);
  return (cdata?.[1] ?? raw).trim();
}

function parseFeed(xml: string): FeedItem[] {
  const items: FeedItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml))) {
    const block = match[1] ?? '';
    const title = matchTag(block, 'title');
    const link = matchTag(block, 'link');
    if (!title || !link) continue;
    const categories = [...block.matchAll(/<category>([\s\S]*?)<\/category>/g)]
      .map((m) => {
        const raw = (m[1] ?? '').trim();
        const cdata = raw.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/);
        return (cdata?.[1] ?? raw).trim();
      })
      .filter(Boolean);
    items.push({ title, link, categories });
  }
  return items;
}

function externalIdFromUrl(link: string): string | null {
  const m = link.match(/\/(\d+)\/?$/);
  return m?.[1] ?? null;
}

function extractEventLdJson(html: string): EventLdJson | null {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const b of blocks) {
    try {
      const parsed = JSON.parse(b[1] ?? '');
      if (parsed?.['@type'] === 'Event') return parsed as EventLdJson;
    } catch {
      continue;
    }
  }
  return null;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

// The site's fields carry raw HTML entities (e.g. "&#8211;") that would
// otherwise render literally on the site.
function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED_ENTITIES[name.toLowerCase()] ?? m);
}

async function scrapeEvent(item: FeedItem): Promise<ScrapedEvent | null> {
  const html = await fetchText(item.link);
  const ld = extractEventLdJson(html);
  if (!ld || !ld.startDate) {
    console.warn(`  skip (no structured data): ${item.title}`);
    return null;
  }

  return {
    source: 'visitjamaica',
    external_id: externalIdFromUrl(item.link),
    title: decodeEntities(ld.name ?? item.title),
    start_time: ld.startDate,
    end_time: ld.endDate ?? null,
    description: ld.description ? decodeEntities(ld.description) : null,
    flyer_url: ld.image ?? null,
    source_url: ld.url ?? item.link,
    venue: ld.location
      ? {
          name: ld.location.name ? decodeEntities(ld.location.name) : undefined,
          address: ld.location.address?.streetAddress
            ? decodeEntities(ld.location.address.streetAddress)
            : undefined,
          lat: ld.location.geo?.latitude ?? null,
          lng: ld.location.geo?.longitude ?? null,
        }
      : null,
    category: item.categories.join(' '),
  };
}

async function main() {
  console.log(`Fetching feed: ${RSS_URL}`);
  const feedXml = await fetchText(RSS_URL);
  const feedItems = parseFeed(feedXml);
  console.log(`Found ${feedItems.length} events in feed`);

  const scraped: ScrapedEvent[] = [];
  for (const item of feedItems) {
    try {
      const event = await scrapeEvent(item);
      if (event) scraped.push(event);
    } catch (err) {
      console.error(`  failed to scrape ${item.link}:`, (err as Error).message);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  if (dryRun) {
    console.log(`Scraped ${scraped.length} events (dry run, nothing written):`);
    console.log(JSON.stringify(scraped, null, 2));
    return;
  }

  console.log(`Scraped ${scraped.length} events, importing...`);
  const { imported, skipped } = await importEvents(client!, scraped);
  console.log(`Done. imported=${imported} skipped=${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

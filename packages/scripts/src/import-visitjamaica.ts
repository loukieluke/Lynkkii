/**
 * Import scraped Visit Jamaica events into Supabase.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm --filter @lynkkii/scripts exec tsx src/import-visitjamaica.ts [path-to-irie-import.json]
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { importEvents, type ScrapedEvent } from './lib/events';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const client = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type ScrapedFile = {
  events: ScrapedEvent[];
};

async function main() {
  const inputPath = resolve(process.argv[2] ?? 'tmp-vj/irie-import.json');
  const payload = JSON.parse(readFileSync(inputPath, 'utf8')) as ScrapedFile;
  const events = payload.events ?? [];
  console.log(`Importing ${events.length} Visit Jamaica events from ${inputPath}`);

  const { imported, skipped } = await importEvents(client, events);
  console.log(`Done. imported=${imported} skipped=${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@irie/types';

export type IrieClient = SupabaseClient<Database>;

export interface ClientConfig {
  url: string;
  anonKey: string;
}

/**
 * Public / anon client used by the app + website to READ the canonical store.
 * Respects RLS (public read on events/venues, owner-only favorites).
 */
export function createIrieClient(config: ClientConfig): IrieClient {
  return createClient<Database>(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

/**
 * Service-role client for admin curation, seeding, and the (later) ingestion
 * worker. BYPASSES RLS — server-side only. NEVER expose the service key to a
 * client bundle.
 */
export function createServiceClient(url: string, serviceRoleKey: string): IrieClient {
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

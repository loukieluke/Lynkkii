import { createIrieClient, createServiceClient, type IrieClient } from '@irie/api';
import {
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from './env';

/**
 * Anon (public, RLS-respecting) client for reading the canonical catalog.
 * Safe to use in Server Components. Returns null if env is unconfigured so the
 * UI can render a friendly "connect Supabase" state instead of crashing.
 */
export function getReadClient(): IrieClient | null {
  if (!isSupabaseConfigured) return null;
  return createIrieClient({ url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY });
}

/**
 * Service-role client for the admin curation tool. BYPASSES RLS.
 * SERVER-ONLY — never import from a client component or leak the key.
 */
export function getServiceClient(): IrieClient | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createServiceClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

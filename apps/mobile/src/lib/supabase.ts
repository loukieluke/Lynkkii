import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@lynkkii/types';
import type { LynkkiiClient } from '@lynkkii/api';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isConfigured = Boolean(url && anonKey);

// RN-specific client: persist the auth session in AsyncStorage. Reuses the same
// Database types + @lynkkii/api query functions as the web app.
export const supabase: LynkkiiClient = createClient<Database>(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

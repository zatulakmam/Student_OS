import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default env or fallback
const DEFAULT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const DEFAULT_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let cachedClient: SupabaseClient | null = null;
let currentConfig = { url: '', key: '' };

export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient | null {
  const url = customUrl || DEFAULT_URL;
  const key = customKey || DEFAULT_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  if (cachedClient && currentConfig.url === url && currentConfig.key === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    currentConfig = { url, key };
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function isSupabaseConfigured(customUrl?: string, customKey?: string): boolean {
  const url = customUrl || DEFAULT_URL;
  const key = customKey || DEFAULT_ANON_KEY;
  return Boolean(url && key && url.startsWith('http'));
}

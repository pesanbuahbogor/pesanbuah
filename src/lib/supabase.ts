import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'pesanbuah_supabase_url';
const STORAGE_ANON_KEY = 'pesanbuah_supabase_anon_key';

/**
 * Sanitizes and normalizes a Supabase project URL.
 * Automatically cleans trailing slashes, subpaths, converts dashboard URLs,
 * and handles raw project reference IDs.
 */
export function sanitizeSupabaseUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim().replace(/^['"]+|['"]+$/g, '');
  if (!cleaned) return '';

  // Case 1: user entered only the project ref ID (e.g. 20 alphanumeric characters, no spaces, no dots, no slashes)
  if (/^[a-z0-9_-]{15,35}$/i.test(cleaned)) {
    return `https://${cleaned}.supabase.co`;
  }

  // Case 2: user copied from dashboard URL:
  // e.g. https://supabase.com/dashboard/project/abcdefghijk
  // or https://supabase.com/dashboard/project/abcdefghijk/settings/api
  if (cleaned.includes('supabase.com/dashboard/project/') || cleaned.includes('supabase.com/project/')) {
    const match = cleaned.match(/project\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://${match[1]}.supabase.co`;
    }
  }

  // Case 3: user typed "xxx.supabase.co" without protocol
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }

  try {
    const parsed = new URL(cleaned);
    // Origin only - this strictly strips subpaths like /rest/v1, /auth/v1, or trailing slashes /
    // which cause the "Invalid path specified in request URL" error in Supabase Kong gateway
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      // Basic check that hostname is valid and not a placeholder
      if (parsed.hostname && parsed.hostname.includes('.') && !parsed.hostname.includes('your-project')) {
        return parsed.origin;
      }
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Sanitizes and normalizes a Supabase Anon Key.
 * Removes surrounding whitespace, quotes, zero-width characters,
 * and accidental prefixes such as "anon:", "Bearer ", "apikey:", etc.
 */
export function sanitizeAnonKey(rawKey: string | null | undefined): string {
  if (!rawKey) return '';
  let cleaned = rawKey
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '') // remove zero-width & non-breaking spaces
    .trim()
    .replace(/^['"`]+|['"`]+$/g, '') // remove quotes
    .trim();

  // If user accidentally copied prefix like "Bearer ", "anon public: ", "anon: ", "apikey: "
  cleaned = cleaned.replace(/^(bearer|anon\s*public|anon|apikey|public|key)\s*[:=]?\s*/i, '').trim();

  // Strip quotes again just in case they were inside the prefix
  cleaned = cleaned.replace(/^['"`]+|['"`]+$/g, '').trim();

  return cleaned;
}

export function isValidSupabaseConfig(url: string, key: string): boolean {
  if (!url || !key) return false;
  if (url.includes('your-project') || key.includes('your-anon-key')) return false;
  try {
    const parsed = new URL(url);
    const validHost = Boolean(parsed.hostname && parsed.hostname.includes('.'));
    const cleanKey = sanitizeAnonKey(key);
    return validHost && cleanKey.length >= 20;
  } catch {
    return false;
  }
}

export function getStoredSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const localUrl = localStorage.getItem(STORAGE_URL_KEY);
  const localKey = localStorage.getItem(STORAGE_ANON_KEY);

  const rawUrl = localUrl || (envUrl && !envUrl.includes('your-project') ? envUrl : '');
  const rawKey = localKey || (envKey && !envKey.includes('your-anon-key') ? envKey : '');

  const sanitizedUrl = sanitizeSupabaseUrl(rawUrl);
  const cleanKey = sanitizeAnonKey(rawKey);

  return { url: sanitizedUrl, key: cleanKey };
}

export function saveSupabaseConfig(url: string, key: string) {
  const sanitizedUrl = sanitizeSupabaseUrl(url);
  const cleanKey = sanitizeAnonKey(key);

  if (sanitizedUrl && cleanKey) {
    localStorage.setItem(STORAGE_URL_KEY, sanitizedUrl);
    localStorage.setItem(STORAGE_ANON_KEY, cleanKey);
  } else {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_ANON_KEY);
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getStoredSupabaseConfig();
  if (!isValidSupabaseConfig(url, key)) {
    return null;
  }

  try {
    if (!supabaseInstance) {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      });
    }
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function resetSupabaseClient() {
  supabaseInstance = null;
}

/**
 * Subscribes to real-time Postgres changes on a specific Supabase table.
 * Automatically handles channel creation and returns an unsubscribe cleanup function.
 */
export function subscribeToRealtime(
  table: string,
  callback: (payload: any) => void
): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channelName = `realtime:${table}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}



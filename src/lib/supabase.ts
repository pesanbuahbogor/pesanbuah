import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'pesanbuah_supabase_url';
const STORAGE_ANON_KEY = 'pesanbuah_supabase_anon_key';

/**
 * Sanitizes and normalizes a Supabase project URL.
 * Automatically cleans trailing slashes, subpaths, and converts dashboard URLs.
 */
export function sanitizeSupabaseUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim().replace(/^['"]+|['"]+$/g, '');
  if (!cleaned) return '';

  // Handle common user mistake: copying the dashboard URL instead of API URL
  // e.g. https://supabase.com/dashboard/project/abcdefghijk
  // or https://app.supabase.com/project/abcdefghijk
  if (cleaned.includes('supabase.com/dashboard/project/') || cleaned.includes('supabase.com/project/')) {
    const match = cleaned.match(/project\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://${match[1]}.supabase.co`;
    }
  }

  // Ensure standard protocol
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

export function isValidSupabaseConfig(url: string, key: string): boolean {
  if (!url || !key) return false;
  if (url.includes('your-project') || key.includes('your-anon-key')) return false;
  try {
    const parsed = new URL(url);
    return Boolean(parsed.hostname && parsed.hostname.includes('.'));
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
  const cleanKey = (rawKey || '').trim().replace(/^['"]+|['"]+$/g, '');

  return { url: sanitizedUrl, key: cleanKey };
}

export function saveSupabaseConfig(url: string, key: string) {
  const sanitizedUrl = sanitizeSupabaseUrl(url);
  const cleanKey = (key || '').trim().replace(/^['"]+|['"]+$/g, '');

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


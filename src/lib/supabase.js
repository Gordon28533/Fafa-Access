/**
 * Supabase Client Configuration
 * Provides authenticated Supabase client for interacting with Supabase services
 */

import { createClient } from '@supabase/supabase-js';
import process from 'process';

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in .env file');
}

/**
 * Supabase Client Instance
 * 
 * Features:
 * - Database queries (if using Supabase Postgres)
 * - File storage (Storage API)
 * - Authentication (if using Supabase Auth)
 * - Real-time subscriptions
 * 
 * @example
 * // Query database
 * const { data, error } = await supabase
 *   .from('table_name')
 *   .select('*');
 * 
 * @example
 * // Upload file
 * const { data, error } = await supabase.storage
 *   .from('bucket_name')
 *   .upload('file_path', file);
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'fafa-access-app'
    }
  }
});

/**
 * Get Supabase client instance
 * @returns {import('@supabase/supabase-js').SupabaseClient} Supabase client
 */
export function getSupabaseClient() {
  return supabase;
}

/**
 * Check if Supabase is properly configured
 * @returns {boolean} True if configured
 */
export function isSupabaseConfigured() {
  return !!(supabaseUrl && supabaseKey);
}

/**
 * Get Supabase project URL
 * @returns {string} Project URL
 */
export function getSupabaseUrl() {
  return supabaseUrl;
}

export default supabase;

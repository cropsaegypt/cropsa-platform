import { createClient } from '@supabase/supabase-js';

// Retrieve Supabase credentials from Vite environment variables or default project config
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qpedcfseabohgfqhlhnp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WLgtjlAK01tC949Aj2bkoA_nzXaW_hR';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

import { createClient } from '@supabase/supabase-js';

// Retrieve Supabase credentials from Vite environment variables or default project config
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qpedcfseabohgfqhlhnp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WLgtjlAK01tC949Aj2bkoA_nzXaW_hR';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string; timestamp?: string }> {
  if (!supabase) return { ok: false, message: 'Supabase is not configured' };
  try {
    const { error } = await supabase.from('system_settings').select('id, updated_at').limit(1);
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true, message: 'متصل بنجاح بقاعدة البيانات السحابية (Supabase)', timestamp: new Date().toISOString() };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'فشل الاتصال بقاعدة البيانات' };
  }
}


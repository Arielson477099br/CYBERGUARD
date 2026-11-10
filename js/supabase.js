import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.SUPABASE_URL;
const anonKey = import.meta.env.SUPABASE_ANON_KEY;
if (!url || !anonKey) throw new Error('Configure SUPABASE_URL e SUPABASE_ANON_KEY no arquivo .env.');
export const supabase = createClient(url, anonKey, { auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });

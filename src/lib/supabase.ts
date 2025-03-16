
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = 'your-supabase-anon-key';

export const createClient = () => 
  createSupabaseClient(supabaseUrl, supabaseAnonKey);

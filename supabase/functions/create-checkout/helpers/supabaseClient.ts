
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

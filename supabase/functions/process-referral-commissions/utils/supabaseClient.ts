
// Créer un client Supabase
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Utiliser le service role pour les fonctions edge ayant besoin de droits admin
export const supabase = createClient(supabaseUrl, supabaseServiceRole);

// Client anonyme pour les opérations normales
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

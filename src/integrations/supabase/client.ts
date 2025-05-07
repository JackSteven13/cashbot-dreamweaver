
// Re-exporter les fonctions et le client de lib/supabase.ts
import { supabase, clearStoredAuthData, isProductionEnvironment, testSupabaseConnection } from '@/lib/supabase';

export { 
  supabase, 
  clearStoredAuthData,
  isProductionEnvironment,
  testSupabaseConnection
};

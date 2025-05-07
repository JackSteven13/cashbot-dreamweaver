
// Re-exporter les fonctions et le client de lib/supabase.ts
import { supabase, clearStoredAuthData } from '@/lib/supabase';

export { 
  supabase, 
  clearStoredAuthData
};

// Fonction utilitaire pour détecter l'environnement
export const isProductionEnvironment = () => {
  return typeof window !== 'undefined' && 
         (window.location.hostname.includes('streamgenius.io') || 
          window.location.hostname.includes('netlify.app'));
};

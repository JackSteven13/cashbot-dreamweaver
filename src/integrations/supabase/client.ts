
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Version ultra simplifiée du client Supabase pour éviter les problèmes cross-domain
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    // Cruciale: désactiver cette option pour éviter les problèmes URL
    detectSessionInUrl: false,
    storage: localStorage
  }
});

// Nettoie les données d'authentification en cas de problème
export const clearStoredAuthData = () => {
  try {
    localStorage.removeItem('supabase-auth-token');
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};

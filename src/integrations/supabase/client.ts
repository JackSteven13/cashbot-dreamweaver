
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Version ultra simplifiée du client Supabase sans options avancées
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Nettoie les données d'authentification en cas de problème
export const clearStoredAuthData = () => {
  try {
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};

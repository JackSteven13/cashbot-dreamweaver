
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { clearAuthData as libClearAuthData } from '@/lib/supabase';

// Configuration des URLs
export const SUPABASE_URL = "https://cfjibduhagxiwqkiyhqd.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4";

// Instance singleton pour éviter les conflits
let supabaseInstance: SupabaseClient<Database> | null = null;

// Create and return the Supabase client directly
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: localStorage
    }
  }
);

// Fonction pour nettoyer les données d'authentification - utilise la fonction de la bibliothèque
export const clearStoredAuthData = () => {
  return libClearAuthData();
};

// Fonction pour forcer une réinitialisation de l'authentification
export const forceRetrySigning = async () => {
  clearStoredAuthData();
  
  try {
    // Déconnexion explicite
    await supabase.auth.signOut({ scope: 'global' });
  } catch (e) {
    // Ignorer les erreurs
  }
  
  return supabase;
};

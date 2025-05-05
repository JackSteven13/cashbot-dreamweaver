
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Configuration des URLs
export const SUPABASE_URL = "https://cfjibduhagxiwqkiyhqd.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4";

// Configuration ultra-simplifiée du client Supabase sans options complexes
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// Fonction de nettoyage simplifiée et robuste pour éliminer complètement les données d'authentification
export const clearStoredAuthData = () => {
  try {
    // Nettoyer localStorage - approche exhaustive
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || 
          key.includes('sb-') || 
          key.includes('auth') || 
          key.includes('token')) {
        localStorage.removeItem(key);
      }
    });
    
    // Nettoyer les cookies liés à l'authentification
    document.cookie.split(";").forEach(c => {
      const cookieName = c.split("=")[0].trim();
      if (cookieName.includes('sb-') || 
          cookieName.includes('supabase') ||
          cookieName.includes('access') ||
          cookieName.includes('refresh')) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
    
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};


import { createClient } from '@supabase/supabase-js';

// Adresses URL universelles qui fonctionneront dans tous les environnements
const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Configuration minimale garantie de fonctionner partout
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fonction pour nettoyer radicalement toutes les données d'authentification
export const clearStoredAuthData = () => {
  try {
    // Supprimer tous les éléments de localStorage
    localStorage.clear();
    // Supprimer tous les éléments de sessionStorage
    sessionStorage.clear();
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données:", err);
    return false;
  }
};

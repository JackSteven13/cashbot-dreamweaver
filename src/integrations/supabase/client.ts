
import { createClient } from '@supabase/supabase-js';

// Configuration de Supabase avec URL et clé publique
const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Client Supabase simplifié avec configuration épurée
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fonction de nettoyage des données d'authentification simplifiée
export const clearStoredAuthData = () => {
  try {
    if (typeof window === 'undefined') return false;
    
    // Nettoyer localStorage
    const keysToRemove = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token',
      'supabase.auth.token',
      'sb-cfjibduhagxiwqkiyhqd-auth-token',
      'auth_redirecting',
      'auth_checking',
      'auth_refreshing',
      'auth_redirect_timestamp',
      'auth_check_timestamp',
      'data_syncing'
    ];
    
    // Suppression des clés connues
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Rechercher et supprimer toutes les clés liées à Supabase
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.') || key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};

// Fonction simple pour tester la connexion à Supabase
export const testSupabaseConnection = async () => {
  try {
    // Utiliser une URL publique qui ne nécessite pas d'authentification
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: 'HEAD',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'apikey': supabaseAnonKey
      }
    });
    
    return response.ok;
  } catch (error) {
    console.warn("Erreur lors du test de connexion à Supabase:", error);
    return false;
  }
};

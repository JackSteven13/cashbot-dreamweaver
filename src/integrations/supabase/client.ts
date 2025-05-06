
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { clearAuthData as libClearAuthData } from '@/lib/supabase';

// Configuration des URLs
export const SUPABASE_URL = "https://cfjibduhagxiwqkiyhqd.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4";

// Configuration avancée pour le client Supabase avec une meilleure gestion des erreurs réseau
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: localStorage
    },
    global: {
      fetch: (...args) => {
        const [url, options] = args;
        
        // Créer un contrôleur d'abandon pour gérer les timeouts
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log("La requête a expiré, abandon");
          controller.abort();
        }, 12000); // 12 secondes de timeout
        
        // Définir les options de fetch améliorées
        const fetchOptions = {
          ...options,
          signal: controller.signal,
          keepalive: true,
          credentials: 'include',
          headers: {
            ...options?.headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          }
        };
        
        // Compteur pour les tentatives
        let attempts = 0;
        const maxAttempts = 2;
        
        // Fonction de requête avec retry
        const attemptFetch = async (): Promise<Response> => {
          try {
            attempts++;
            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);
            return response;
          } catch (error) {
            console.error(`Erreur fetch (tentative ${attempts}/${maxAttempts}):`, error);
            
            // Si nous avons atteint le nombre maximum de tentatives, propager l'erreur
            if (attempts >= maxAttempts) {
              throw error;
            }
            
            // Sinon, attendre un peu et réessayer
            await new Promise(resolve => setTimeout(resolve, 800));
            return attemptFetch();
          }
        };
        
        return attemptFetch();
      }
    }
  }
);

// Fonction pour nettoyer les données d'authentification
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
    console.error("Erreur lors de la déconnexion forcée:", e);
  }
  
  // Pour la rétrocompatibilité, retourner l'instance
  return supabase;
};

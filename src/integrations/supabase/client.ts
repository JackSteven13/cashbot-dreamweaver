
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Configuration universelle pour les domaines streamgenius.io et lovable.dev
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important: désactivé pour résoudre les conflits multi-domaines
    storage: localStorage,
    storageKey: 'sb-auth-token', // Clé universelle pour tous les domaines
    flowType: 'pkce', // PKCE plus sécurisé pour les redirections cross-domain
  },
  global: {
    headers: {
      'X-Client-Info': 'streamgenius@1.0.0',
      'X-Client-Domain': typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    },
  },
  // Paramètres réseau plus tolérants pour les connexions instables
  realtime: {
    params: {
      eventsPerSecond: 1,
    },
  },
  // Paramètres robustes pour les domaines streamgenius.io et lovable.dev
  db: {
    schema: 'public'
  }
});

/**
 * Nettoie complètement toutes les données d'authentification
 * Version robuste qui résout les problèmes de connexion multi-domaines
 */
export const clearStoredAuthData = () => {
  try {
    // Nettoyer tous les jetons possibles (anciens et nouveaux formats)
    localStorage.removeItem('supabase-auth-token');
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    localStorage.removeItem('sb-auth-token');
    
    // Nettoyer tous les refresh tokens
    localStorage.removeItem('sb-refresh-token');
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
    localStorage.removeItem('supabase-auth-refresh');
    
    // Nettoyer d'autres flags et métadonnées
    const allKeys = Object.keys(localStorage);
    const authKeys = allKeys.filter(key => 
      key.includes('auth') || 
      key.includes('supabase') || 
      key.includes('sb-') || 
      key.includes('token')
    );
    
    authKeys.forEach(key => localStorage.removeItem(key));
    
    // Nettoyer les cookies qui pourraient interférer
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      if (name && (name.includes('sb-') || name.includes('supabase'))) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.streamgenius.io`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });
    
    console.log("Nettoyage complet des données d'authentification effectué");
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};

/**
 * Fonction utilitaire pour tester la connexion à Supabase
 * @returns true si la connexion est établie avec succès
 */
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Paramètres pour une requête légère avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // Test simple pour vérifier que Supabase est accessible
    try {
      // Alternative approach without using abortSignal method
      const { error } = await supabase.from('_health').select('*').limit(1).maybeSingle();
      
      clearTimeout(timeoutId);
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 signifie juste que la table n'existe pas, ce qui est normal
        console.error("Erreur de connexion à Supabase:", error);
        return false;
      }
      
      return true;
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Exception lors du test de connexion à Supabase:", err);
      return false;
    }
  } catch (err) {
    console.error("Exception lors du test de connexion à Supabase:", err);
    return false;
  }
};

/**
 * Récupère une session proprement
 * @returns La session si elle existe, null sinon
 */
export const getSessionSafely = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Erreur lors de la récupération de session:", error);
      return null;
    }
    return data.session;
  } catch (err) {
    console.error("Exception lors de la récupération de session:", err);
    return null;
  }
};

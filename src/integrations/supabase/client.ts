
import { createClient } from '@supabase/supabase-js';

// Configuration de Supabase avec URL et clé publique
const supabaseUrl = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

// Client Supabase avec configuration optimisée pour la persistance des sessions
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    flowType: 'implicit' // Utilise le flux implicite pour une meilleure compatibilité
  }
});

// Fonction de nettoyage radical des données d'authentification
export const clearStoredAuthData = () => {
  try {
    console.log("Nettoyage radical des données d'authentification");
    
    // Supprimer tous les tokens possibles
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
    localStorage.removeItem('sb-auth-token');
    
    // Supprimer la clé spécifique pour ce projet
    localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    
    // Rechercher et supprimer toutes les clés liées à Supabase
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.') || key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Nettoyer les cookies liés à l'authentification
    document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'sb-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    return true;
  } catch (err) {
    console.error("Erreur lors du nettoyage des données d'authentification:", err);
    return false;
  }
};

// Fonction utilitaire pour détecter l'environnement
export const isProductionEnvironment = () => {
  return typeof window !== 'undefined' && 
         (window.location.hostname.includes('streamgenius.io') || 
          window.location.hostname.includes('streamgenius.netlify.app'));
};

// Fonction pour vérifier la connectivité au serveur Supabase
export const checkSupabaseConnectivity = async (): Promise<boolean> => {
  try {
    const startTime = Date.now();
    const { data, error } = await supabase.from('_connection_test').select('*').limit(1).maybeSingle();
    const endTime = Date.now();
    
    // Si la requête prend trop de temps, considérer comme un problème de connectivité
    if (endTime - startTime > 5000) {
      console.warn("La connexion à Supabase est lente");
      return false;
    }
    
    // Une erreur de table inexistante est normale et signifie que la connexion fonctionne
    if (error && error.code === '42P01') {
      return true;
    }
    
    return !error;
  } catch (err) {
    console.error("Erreur de connectivité Supabase:", err);
    return false;
  }
};

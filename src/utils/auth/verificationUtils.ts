
import { supabase, isProductionEnvironment } from '@/integrations/supabase/client';

/**
 * Vérifier la connectivité réseau
 */
const checkNetworkConnectivity = async (): Promise<boolean> => {
  if (!navigator.onLine) {
    console.log("Le navigateur rapporte être hors ligne");
    return false;
  }
  
  // Vérifier la connexion à Supabase avec une requête simple
  try {
    const startTime = Date.now();
    const response = await fetch('https://cfjibduhagxiwqkiyhqd.supabase.co/auth/v1/health', {
      method: 'HEAD',
      mode: 'no-cors', 
      cache: 'no-store',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4'
      },
      signal: AbortSignal.timeout(3000)
    });
    const endTime = Date.now();
    
    console.log(`Connectivité vérifiée en ${endTime - startTime}ms`);
    return true;
  } catch (error) {
    console.error("Erreur lors de la vérification de connectivité:", error);
    return navigator.onLine; // Utiliser l'état en ligne comme fallback
  }
};

/**
 * Vérifie si l'utilisateur est authentifié avec gestion d'erreur réseau améliorée
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    console.log("Début de la vérification d'authentification");
    
    // Vérifier d'abord la connectivité réseau
    const isNetworkAvailable = await checkNetworkConnectivity();
    if (!isNetworkAvailable) {
      console.log("Réseau non disponible, échec de la vérification");
      return false;
    }
    
    // Détection de l'environnement
    const isProduction = isProductionEnvironment();
    console.log(`Vérification d'auth en ${isProduction ? 'PRODUCTION' : 'DÉVELOPPEMENT'}`);
    
    // Vérifier localStorage avec clé adaptée selon l'environnement
    const storageKey = 'sb-cfjibduhagxiwqkiyhqd-auth-token';
    const hasLocalStorage = !!localStorage.getItem(storageKey);
    
    if (!hasLocalStorage) {
      console.log(`Aucun token trouvé dans localStorage (${storageKey})`);
      return false;
    }
    
    try {
      // Récupérer la session avec un timeout court (3 secondes)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const { data, error } = await supabase.auth.getSession();
      clearTimeout(timeoutId);
      
      if (error) {
        console.error("Erreur lors de la vérification d'authentification:", error);
        return false;
      }
      
      if (!data || !data.session) {
        console.log("Aucune session trouvée via getSession");
        return false;
      }
      
      console.log("Session trouvée, utilisateur authentifié");
      return true;
    } catch (err) {
      console.error("Erreur lors de la vérification de session:", err);
      
      // Si erreur de timeout ou réseau, vérifier si le token existe et n'est pas expiré
      try {
        const tokenRaw = localStorage.getItem(storageKey);
        if (!tokenRaw) return false;
        
        const token = JSON.parse(tokenRaw);
        if (!token.access_token) return false;
        
        // Vérifier si le token a une date d'expiration et s'il est toujours valide
        if (token.expires_at) {
          const expiresAt = new Date(token.expires_at * 1000);
          const now = new Date();
          if (now < expiresAt) {
            console.log("Token local valide en date d'expiration, considéré comme authentifié malgré l'erreur réseau");
            return true;
          }
        }
        
        return false;
      } catch (e) {
        console.error("Erreur lors de la vérification du token local:", e);
        return false;
      }
    }
  } catch (error) {
    console.error("Exception lors de la vérification d'authentification:", error);
    return false;
  }
};

/**
 * Version simplifiée de isUserAuthenticated
 */
export const isUserAuthenticated = async (): Promise<boolean> => {
  return await verifyAuth();
};

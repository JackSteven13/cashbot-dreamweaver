
/**
 * Module pour effectuer des appels directs à l'API Supabase
 * quand le client standard échoue sur certains réseaux mobiles
 */

const SUPABASE_URL = 'https://cfjibduhagxiwqkiyhqd.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmamliZHVoYWd4aXdxa2l5aHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY1NTMsImV4cCI6MjA1NzY5MjU1M30.QRjnxj3RAjU_-G0PINfmPoOWixu8LTIsZDHcdGIVEg4';

export interface DirectLoginResponse {
  success: boolean;
  session: any | null;
  user: any | null;
  error: string | null;
}

/**
 * Fonction pour tenter une connexion directe à l'API Supabase
 * Utile quand le client standard échoue sur certains réseaux mobiles
 */
export async function directLogin(email: string, password: string): Promise<DirectLoginResponse> {
  try {
    // Tenter d'abord une connexion via le proxy local
    const localProxyUrl = '/supabase-auth/token?grant_type=password';
    const response = await fetch(localProxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      // Si le proxy local échoue, essayer directement avec l'API Supabase
      const directResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      if (!directResponse.ok) {
        return {
          success: false,
          session: null,
          user: null,
          error: `Erreur API: ${directResponse.status}`
        };
      }
      
      const data = await directResponse.json();
      return {
        success: true,
        session: data.session,
        user: data.user,
        error: null
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      session: data.session,
      user: data.user,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      session: null,
      user: null,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Fonction pour vérifier la connectivité directe avec Supabase
 * Renvoie true si la connexion directe fonctionne
 */
export async function checkDirectConnectivity(): Promise<boolean> {
  try {
    // Essayer d'abord via le proxy local
    try {
      const localProxyResponse = await fetch('/supabase-auth/health', {
        method: 'GET',
        headers: {
          'apikey': ANON_KEY
        }
      });
      
      if (localProxyResponse.ok) {
        return true;
      }
    } catch (e) {
      console.log("Le proxy local n'est pas disponible");
    }
    
    // Essayer directement avec l'API Supabase
    const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      method: 'GET',
      headers: {
        'apikey': ANON_KEY
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error("Erreur lors de la vérification de connectivité:", error);
    return false;
  }
}

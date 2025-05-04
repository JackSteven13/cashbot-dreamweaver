
/**
 * Module pour effectuer des appels directs à l'API Supabase
 * quand le client standard échoue sur certains réseaux mobiles
 */

// Cette fonction n'est plus utilisée activement mais conservée pour référence future
export interface DirectLoginResponse {
  success: boolean;
  session: any | null;
  user: any | null;
  error: string | null;
}

// Fonction simplifiée qui ne fait rien, juste pour compatibilité
export async function directLogin(email: string, password: string): Promise<DirectLoginResponse> {
  return {
    success: false,
    session: null,
    user: null,
    error: "Cette fonction est désactivée"
  };
}

// Fonction simplifiée qui renvoie toujours true
export async function checkDirectConnectivity(): Promise<boolean> {
  return true;
}

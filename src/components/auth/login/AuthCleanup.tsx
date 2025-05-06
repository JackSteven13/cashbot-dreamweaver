
import { useEffect } from 'react';

const AuthCleanup = () => {
  // Nettoyer les flags d'authentification potentiellement bloquants
  useEffect(() => {
    // Protection contre les blocages persistants
    const loginBlockingFlags = [
      'auth_checking',
      'auth_refreshing',
      'auth_redirecting',
      'auth_check_timestamp',
      'auth_refresh_timestamp',
      'auth_redirect_timestamp',
      'auth_signing_out'
    ];
    
    loginBlockingFlags.forEach(flag => {
      localStorage.removeItem(flag);
    });
    
    // Silencieusement nettoyer les jetons potentiellement invalides sans afficher d'alerte
    const authToken = localStorage.getItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
    if (authToken) {
      try {
        const tokenData = JSON.parse(authToken);
        const expiresAt = tokenData?.expires_at;
        
        if (expiresAt && Date.now() / 1000 >= expiresAt) {
          console.log("Detected expired token, cleaning up silently");
          localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-token');
          localStorage.removeItem('sb-cfjibduhagxiwqkiyhqd-auth-refresh');
        }
      } catch (e) {
        console.error("Error parsing auth token:", e);
      }
    }
  }, []);

  return null;
};

export default AuthCleanup;

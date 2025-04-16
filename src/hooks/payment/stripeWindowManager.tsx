
/**
 * Gestionnaire de fenêtre Stripe optimisé pour les mobiles et navigateurs modernes
 */

/**
 * Ouvre l'URL de paiement Stripe dans une nouvelle fenêtre/onglet
 * avec gestion améliorée pour les appareils mobiles
 */
export const openStripeWindow = (stripeUrl: string): boolean => {
  if (!stripeUrl) {
    console.error("URL Stripe manquante");
    return false;
  }
  
  try {
    // Détection d'appareil mobile (plus précise)
    const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(navigator.userAgent);
    
    console.log(`Tentative d'ouverture de Stripe (${isMobile ? 'mobile' : 'desktop'}):`, stripeUrl);
    
    if (isMobile) {
      // Sur mobile, utiliser une redirection directe
      window.location.href = stripeUrl;
    } else {
      // Sur desktop, ouvrir dans un nouvel onglet avec une meilleure gestion
      // Technique plus fiable pour ouvrir dans un nouvel onglet
      const newTab = window.open('about:blank', '_blank');
      
      if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
        console.log("Ouverture de nouvel onglet bloquée, utilisation de la redirection directe");
        window.location.href = stripeUrl;
        return true;
      }
      
      // Appliquer des styles pour assurer une bonne visibilité pendant le chargement
      newTab.document.write(`
        <html>
          <head>
            <title>Redirection vers Stripe...</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background-color: #f8fafc;
                color: #334155;
                flex-direction: column;
              }
              .loader {
                border: 5px solid #f3f3f3;
                border-top: 5px solid #3498db;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="loader"></div>
            <p>Redirection vers la page de paiement sécurisée...</p>
            <script>
              // Rediriger après un court délai pour assurer une transition fluide
              setTimeout(() => { window.location.href = "${stripeUrl}"; }, 200);
            </script>
          </body>
        </html>
      `);
      
      // Focus sur le nouvel onglet
      newTab.focus();
    }
    
    // Stocker l'URL dans localStorage pour récupération éventuelle
    localStorage.setItem('lastStripeUrl', stripeUrl);
    localStorage.setItem('pendingPayment', 'true');
    localStorage.setItem('stripeRedirectTimestamp', Date.now().toString());
    
    return true;
  } catch (error) {
    console.error("Erreur lors de l'ouverture de la fenêtre:", error);
    
    // Dernière tentative avec redirection directe
    window.location.href = stripeUrl;
    return true;
  }
};

/**
 * Vérifie si une fenêtre Stripe est déjà ouverte
 */
export const isStripeWindowOpen = (): boolean => {
  // Cette fonction pourrait être étendue pour vérifier si un onglet Stripe spécifique est ouvert
  return false;
};

/**
 * Récupère une session de paiement Stripe interrompue
 * Si une URL est stockée dans localStorage, tente de la récupérer
 * @returns {boolean} True si une session a été récupérée, sinon false
 */
export const recoverStripeSession = (): boolean => {
  try {
    const stripeUrl = localStorage.getItem('lastStripeUrl');
    const isPending = localStorage.getItem('pendingPayment') === 'true';
    
    if (isPending && stripeUrl) {
      console.log("Tentative de récupération d'une session Stripe:", stripeUrl);
      return openStripeWindow(stripeUrl);
    }
    
    return false;
  } catch (error) {
    console.error("Erreur lors de la récupération de session:", error);
    return false;
  }
};

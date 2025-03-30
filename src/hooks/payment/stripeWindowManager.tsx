
/**
 * Gestionnaire simplifié pour la redirection vers Stripe
 * Utilise une approche minimale pour maximiser la compatibilité mobile
 */

import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";

/**
 * Ouvre directement l'URL Stripe sans tentative d'ouverture de nouvelle fenêtre
 * Cette méthode est la plus compatible avec les appareils mobiles
 */
export const openStripeWindow = (url: string): void => {
  if (!url) {
    console.error("URL Stripe manquante");
    return;
  }
  
  console.log("Tentative de redirection vers Stripe:", url);
  
  // Afficher d'abord le toast avec le bouton de secours
  showManualStripeRedirectToast(url);
  
  // Redirection directe - méthode la plus fiable sur mobile
  try {
    // Retarder très légèrement pour permettre au toast de s'afficher d'abord
    setTimeout(() => {
      window.location.href = url;
      console.log("Redirection directe effectuée vers:", url);
    }, 200);
  } catch (error) {
    console.error("Échec de redirection:", error);
    // Les boutons du toast serviront de solution de secours
  }
};

/**
 * Affiche un toast avec un bouton bien visible pour une redirection manuelle
 */
export const showManualStripeRedirectToast = (url: string): void => {
  if (!url) {
    console.error("URL Stripe manquante pour le toast");
    return;
  }
  
  toast({
    title: "Paiement en attente",
    description: "Si la page de paiement ne s'ouvre pas dans 3 secondes, cliquez sur le bouton ci-dessous.",
    action: (
      <ToastAction 
        onClick={() => {
          try {
            console.log("Redirection manuelle via toast vers:", url);
            window.open(url, "_blank");
            
            // Seconde tentative si la première échoue
            setTimeout(() => {
              window.location.href = url;
            }, 100);
          } catch (error) {
            console.error("Échec de redirection manuelle:", error);
          }
        }}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md cursor-pointer text-sm font-bold shadow-md"
        altText="Ouvrir la page de paiement"
      >
        Ouvrir le paiement
      </ToastAction>
    ),
    duration: 60000, // Afficher pendant une minute complète
  });
};

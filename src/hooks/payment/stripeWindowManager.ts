
import { toast } from "@/components/ui/use-toast";

/**
 * Ouvre une fenêtre Stripe de manière fiable
 */
export const openStripeWindow = (url: string): boolean => {
  try {
    console.log("Tentative d'ouverture de la fenêtre Stripe:", url);
    
    // Tentative d'ouverture dans un nouvel onglet
    const stripeWindow = window.open(url, '_blank', 'noopener,noreferrer');
    
    // Vérifier si la fenêtre a été ouverte avec succès
    if (stripeWindow) {
      stripeWindow.focus();
      console.log("Fenêtre Stripe ouverte avec succès");
      return true;
    }
    
    // Si l'ouverture a échoué mais que nous sommes sur mobile, rediriger directement
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      console.log("Redirection mobile vers Stripe");
      window.location.href = url;
      return true;
    }
    
    // Échec de l'ouverture
    console.error("Impossible d'ouvrir la fenêtre Stripe");
    return false;
  } catch (error) {
    console.error("Erreur lors de l'ouverture de la fenêtre Stripe:", error);
    
    // Tentative de redirection directe en dernier recours
    try {
      window.location.href = url;
      return true;
    } catch (e) {
      console.error("Échec de la redirection directe:", e);
      return false;
    }
  }
};

/**
 * Vérifie si les popups sont bloqués
 */
export const checkPopupBlocker = async (callback?: () => void): Promise<boolean> => {
  try {
    // Tente d'ouvrir une petite fenêtre pour vérifier si les popups sont bloqués
    const testWindow = window.open("about:blank", "_blank", "width=1,height=1");
    
    if (!testWindow || testWindow.closed || testWindow.closed === undefined) {
      console.warn("Les popups semblent être bloqués");
      
      // Afficher un message à l'utilisateur
      toast({
        title: "Popups bloqués",
        description: "Veuillez autoriser les popups pour ce site afin de continuer vers la page de paiement",
        variant: "destructive",
        duration: 10000,
      });
      
      if (callback) callback();
      return true;
    }
    
    // Fermer la fenêtre de test
    testWindow.close();
    return false;
  } catch (error) {
    console.error("Erreur lors de la vérification des popups:", error);
    return true;
  }
};

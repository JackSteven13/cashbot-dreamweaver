
import { toast } from "@/components/ui/use-toast";

/**
 * Ouvre une fenêtre Stripe de manière fiable
 * avec gestion améliorée des blocages de popup et compatibilité mobile
 */
export const openStripeWindow = (url: string): boolean => {
  try {
    console.log("Tentative d'ouverture de la fenêtre Stripe:", url);
    
    if (!url) {
      console.error("URL Stripe invalide ou manquante");
      return false;
    }
    
    // Détection de l'environnement mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    // Détection de Safari mobile
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    // Sur mobile, particulièrement iOS Safari, préférer la redirection directe
    if (isMobile) {
      console.log("Appareil mobile détecté, redirection directe");
      // Timeout pour permettre au toast de s'afficher avant la redirection
      setTimeout(() => {
        window.location.href = url;
      }, 100);
      return true;
    }
    
    // Sur desktop, essayer d'ouvrir dans un nouvel onglet
    const stripeWindow = window.open(url, '_blank', 'noopener,noreferrer');
    
    // Vérifier si la fenêtre a été ouverte avec succès
    if (stripeWindow && !stripeWindow.closed) {
      stripeWindow.focus();
      console.log("Fenêtre Stripe ouverte avec succès");
      return true;
    }
    
    // Si l'ouverture a échoué (probablement bloquée par un popup blocker)
    console.warn("Échec de l'ouverture de la fenêtre - popups probablement bloqués");
    
    // Montrer un toast pour informer l'utilisateur et essayer la redirection directe
    toast({
      title: "Ouverture de la page de paiement",
      description: "Redirection vers la page de paiement Stripe...",
      duration: 3000,
    });
    
    // Redirection directe après un court délai
    setTimeout(() => {
      window.location.href = url;
    }, 300);
    
    return true;
  } catch (error) {
    console.error("Erreur lors de l'ouverture de la fenêtre Stripe:", error);
    
    // Tentative de redirection directe en dernier recours
    try {
      toast({
        title: "Problème de redirection",
        description: "Tentative de redirection alternative...",
        duration: 3000,
      });
      
      setTimeout(() => {
        window.location.href = url;
      }, 300);
      
      return true;
    } catch (e) {
      console.error("Échec de toutes les tentatives de redirection:", e);
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


import { supabase } from "@/integrations/supabase/client";
import { SUBSCRIPTION_LIMITS } from "./constants";

/**
 * Convertit l'ancien abonnement "alpha" en "starter"
 */
export const normalizeSubscription = (subscription: string): string => {
  if (subscription === "alpha") {
    console.log('Normalisation d\'abonnement: alpha -> starter');
    return "starter";
  }
  return subscription;
};

/**
 * Vérifie le mode Pro temporaire et retourne la souscription effective
 */
export const getEffectiveSubscription = (subscription: string): string => {
  // Normaliser d'abonnement (convertir "alpha" en "starter")
  const normalizedSubscription = normalizeSubscription(subscription);
  
  // Vérifier si l'utilisateur a un essai Pro actif
  const proTrialActive = localStorage.getItem('proTrialActive') === 'true';
  const proTrialExpires = localStorage.getItem('proTrialExpires');
  
  if (proTrialActive && proTrialExpires) {
    const expiryTime = parseInt(proTrialExpires, 10);
    const now = Date.now();
    
    // Vérification de l'expiration
    if (now < expiryTime) {
      console.log("Essai Pro actif, retourne 'starter'");
      return 'starter';
    } else {
      // Si expiré, nettoyer le localStorage et marquer comme utilisé
      console.log("Essai Pro expiré. Nettoyage des données d'essai.");
      localStorage.removeItem('proTrialActive');
      localStorage.removeItem('proTrialExpires');
      localStorage.removeItem('proTrialActivatedAt');
      localStorage.setItem('proTrialUsed', 'true');
      
      // Essayer de mettre à jour la base de données
      try {
        const updateProTrialStatus = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await supabase
              .from('user_balances')
              .update({ 
                pro_trial_used: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', session.user.id);
          }
        };
        
        updateProTrialStatus();
      } catch (error) {
        console.error("Erreur lors de la mise à jour du statut de l'essai Pro:", error);
      }
    }
  }
  
  return normalizedSubscription;
};

/**
 * Checks if the user has reached the daily gain limit based on their subscription
 */
export const checkDailyLimit = (balance: number, subscription: string): boolean => {
  const normalizedSubscription = normalizeSubscription(subscription);
  const effectiveSubscription = getEffectiveSubscription(normalizedSubscription);
  const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Vérifie si la dernière réinitialisation était aujourd'hui
  const lastResetDay = localStorage.getItem('lastBalanceResetDay');
  const today = new Date().toDateString();
  
  if (lastResetDay !== today) {
    console.log("Nouveau jour détecté, réinitialisation des compteurs devrait être effectuée");
    // Nous ne réinitialisons pas le solde ici pour éviter les effets de bord
    // La réinitialisation doit être traitée séparément
    localStorage.setItem('lastBalanceResetDay', today);
    return false;
  }
  
  return balance >= dailyLimit;
};

/**
 * Vérifie si les compteurs quotidiens doivent être réinitialisés
 * @returns {boolean} true si une réinitialisation est nécessaire
 */
export const shouldResetDailyCounters = (): boolean => {
  const lastResetDay = localStorage.getItem('lastBalanceResetDay');
  const today = new Date().toDateString();
  return lastResetDay !== today;
};


import { getSavedSession } from './auth/sessionStorage';
import { supabase } from '@/integrations/supabase/client';
import balanceManager from './balance/balanceManager';

// Re-exporter la fonction cleanupUserBalanceData pour la rendre disponible
export const cleanupUserBalanceData = () => {
  balanceManager.cleanupUserBalanceData();
};

/**
 * Fonction pour détecter un changement d'utilisateur et nettoyer les données locales
 * Cette fonction aide à éviter que des utilisateurs différents partagent des données
 * qui devraient être spécifiques à chacun.
 */
export const checkUserSwitch = async () => {
  try {
    // Récupérer la session actuelle
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) return false;
    
    const currentUserId = session.user.id;
    const storedUserId = localStorage.getItem('lastActiveUserId');
    
    // Si l'utilisateur a changé
    if (storedUserId && currentUserId !== storedUserId) {
      console.log(`Changement d'utilisateur détecté: ${storedUserId} -> ${currentUserId}`);
      
      // Nettoyer les données spécifiques à l'ancien utilisateur
      cleanupUserBalanceData();
      
      // Nettoyer les données génériques qui pourraient être partagées
      localStorage.removeItem('currentBalance');
      localStorage.removeItem('lastKnownBalance');
      localStorage.removeItem('highestBalance');
      localStorage.removeItem('todaySessionCount');
      localStorage.removeItem('lastAutoSessionDate');
      localStorage.removeItem('lastAutoSessionTime');
      localStorage.removeItem('balanceState');
      localStorage.removeItem('botActive');
      
      // Mettre à jour l'ID utilisateur
      localStorage.setItem('lastActiveUserId', currentUserId);
      localStorage.setItem('lastActive', new Date().toISOString());
      
      return true; // Indique qu'un nettoyage a été effectué
    }
    
    // Si aucun ID n'était stocké, simplement stocker l'actuel
    if (!storedUserId) {
      localStorage.setItem('lastActiveUserId', currentUserId);
      localStorage.setItem('lastActive', new Date().toISOString());
    }
    
    return false;
  } catch (error) {
    console.error("Erreur lors de la vérification du changement d'utilisateur:", error);
    return false;
  }
};

/**
 * Hook pour appliquer la protection contre le mélange de données entre utilisateurs
 * À utiliser dans un useEffect au chargement de l'application
 */
export const applyUserSwitchGuard = () => {
  checkUserSwitch().then(wasReset => {
    if (wasReset) {
      console.log("Les données locales ont été réinitialisées en raison d'un changement d'utilisateur");
      // Forcer un rafraîchissement de la page pour recharger proprement les données
      window.location.reload();
    }
  });
};

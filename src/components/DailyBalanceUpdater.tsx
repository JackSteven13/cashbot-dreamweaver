
import { useEffect } from 'react';
import balanceManager from '@/utils/balance/balanceManager';
import { shouldResetDailyCounters } from '@/utils/subscription/sessionManagement';

/**
 * Composant invisible qui gère la synchronisation des limitations quotidiennes
 * Il s'exécute une fois au chargement du tableau de bord
 */
const DailyBalanceUpdater = () => {
  // Vérifier et réinitialiser les compteurs quotidiens si nécessaire
  useEffect(() => {
    const resetIfNeeded = () => {
      // Vérifier s'il faut réinitialiser les compteurs quotidiens
      if (shouldResetDailyCounters()) {
        console.log("Nouveau jour détecté, réinitialisation des gains quotidiens");
        
        // Réinitialiser les gains quotidiens
        balanceManager.setDailyGains(0);
        
        // Déclencher un événement pour informer le reste de l'application
        window.dispatchEvent(new CustomEvent('dailyGains:reset'));
        
        // Également remettre à zéro le compteur de sessions quotidiennes
        localStorage.removeItem('freemium_daily_limit_reached');
        localStorage.removeItem('last_session_date');
        localStorage.removeItem('dailySessionCount');
      }
    };
    
    // Exécuter immédiatement
    resetIfNeeded();
    
    // Vérifier périodiquement (toutes les 5 minutes)
    const checkInterval = setInterval(resetIfNeeded, 5 * 60 * 1000);
    
    return () => clearInterval(checkInterval);
  }, []);
  
  // Ce composant ne rend rien, il exécute juste du code
  return null;
};

export default DailyBalanceUpdater;

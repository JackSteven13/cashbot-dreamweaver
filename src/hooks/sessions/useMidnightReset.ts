
import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import balanceManager from '@/utils/balance/balanceManager';

/**
 * Hook pour réinitialiser les compteurs quotidiens à minuit
 * et s'assurer de la cohérence des données au chargement de la page
 */
export const useMidnightReset = () => {
  useEffect(() => {
    // Fonction pour calculer les millisecondes jusqu'à minuit
    const getMsUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1, // Jour suivant
        0, 0, 0 // Minuit
      );
      return midnight.getTime() - now.getTime();
    };
    
    // Fonction de réinitialisation des compteurs quotidiens
    const resetDailyCounts = () => {
      // Stocker qu'une réinitialisation a eu lieu aujourd'hui
      const today = new Date().toDateString();
      localStorage.setItem('last_reset_date', today);
      
      // Réinitialiser les compteurs de session
      Object.keys(localStorage).forEach(key => {
        if (key.endsWith('_session_count')) {
          localStorage.setItem(key, '0');
        }
      });
      
      // Réinitialiser les gains quotidiens
      localStorage.setItem('stats_daily_gains', '0');
      localStorage.setItem('stats_last_sync_date', today);
      
      // Activer le bot s'il était désactivé en raison d'une limite atteinte
      const botStatus = localStorage.getItem('bot_active');
      const wasLimitReached = localStorage.getItem('daily_limit_reached') === 'true';
      
      if (wasLimitReached) {
        localStorage.setItem('bot_active', 'true');
        localStorage.setItem('daily_limit_reached', 'false');
        
        // Propager l'événement de changement d'état du bot
        window.dispatchEvent(new CustomEvent('bot:external-status-change', {
          detail: { active: true }
        }));
      }
      
      // Propager l'événement de réinitialisation
      window.dispatchEvent(new CustomEvent('dailyGains:reset'));
      
      // Notifier l'utilisateur
      toast({
        title: "Nouveau jour",
        description: "Les compteurs quotidiens ont été réinitialisés.",
        duration: 5000
      });
    };
    
    // Vérifier si une réinitialisation est nécessaire au chargement
    const checkInitialReset = () => {
      const lastResetDate = localStorage.getItem('last_reset_date');
      const today = new Date().toDateString();
      
      if (lastResetDate !== today) {
        console.log("Réinitialisation des compteurs quotidiens au chargement");
        resetDailyCounts();
      }
    };
    
    // Effectuer la vérification initiale
    checkInitialReset();
    
    // Configurer le timer pour la réinitialisation à minuit
    const timeUntilMidnight = getMsUntilMidnight();
    console.log(`Prochaine réinitialisation dans ${Math.floor(timeUntilMidnight / 60000)} minutes`);
    
    const midnightTimer = setTimeout(() => {
      console.log("Réinitialisation à minuit");
      resetDailyCounts();
      
      // Configurer la réinitialisation pour le jour suivant (récursif)
      const nextDayTimer = setTimeout(() => {
        resetDailyCounts();
      }, 24 * 60 * 60 * 1000); // 24 heures
      
      return () => clearTimeout(nextDayTimer);
    }, timeUntilMidnight);
    
    // Nettoyer le timer si le composant est démonté
    return () => clearTimeout(midnightTimer);
  }, []);
};

export default useMidnightReset;

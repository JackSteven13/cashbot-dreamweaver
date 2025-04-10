
import { useRef, useEffect } from 'react';
import { useBotStatus } from './useBotStatus';
import { useSessionOperations } from './useSessionOperations';
import { UserData } from '@/types/userData';
import { toast } from '@/components/ui/use-toast';
import { addTransaction } from '@/utils/user/transactionUtils';

export const useAutoRevenueGenerator = (
  userData: UserData,
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void,
  todaysGainsRef: React.MutableRefObject<number>,
  getDailyLimit: () => number
) => {
  const isInitialMount = useRef(true);
  const lastRevenueDateRef = useRef<string | null>(null);
  const consecutiveDaysRef = useRef<number>(0);

  // Utiliser le hook de gestion d'état du bot avec vérification de limite
  const { 
    isBotActive, 
    updateBotStatus, 
    resetBotActivity, 
    checkLimitAndUpdateBot 
  } = useBotStatus(true);

  // Intégrer les opérations de session
  const { 
    generateAutomaticRevenue, 
    isSessionInProgress, 
    getCurrentBalance 
  } = useSessionOperations(
    userData,
    updateBalance,
    setShowLimitAlert,
    todaysGainsRef,
    getDailyLimit,
    isBotActive,
    updateBotStatus
  );

  // Vérifier la limite au montage et désactiver le bot si nécessaire
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      
      // Vérifier si la limite est déjà atteinte au montage
      if (userData?.subscription && userData?.balance !== undefined) {
        // Utiliser l'API du hook pour vérifier et mettre à jour l'état du bot
        checkLimitAndUpdateBot(userData.subscription, userData.balance);
        
        // Récupérer la date du dernier revenu et des jours consécutifs depuis localStorage
        try {
          const lastDate = localStorage.getItem('lastRevenueDate');
          const consecutiveDays = localStorage.getItem('consecutiveDays');
          
          if (lastDate) {
            lastRevenueDateRef.current = lastDate;
          }
          
          if (consecutiveDays) {
            const days = parseInt(consecutiveDays, 10);
            if (!isNaN(days)) {
              consecutiveDaysRef.current = days;
            }
          }
        } catch (e) {
          console.error("Erreur lors de la récupération des données de suivi:", e);
        }
      }
      
      // Configurer la vérification de réinitialisation à minuit
      const checkMidnightReset = () => {
        const now = new Date();
        const today = now.toISOString().split('T')[0]; // Format YYYY-MM-DD
        
        // Si c'est un nouveau jour (00:00-00:05), réinitialiser l'activité du bot
        if (now.getHours() === 0 && now.getMinutes() < 5) {
          console.log("MINUIT DÉTECTÉ - Réinitialisation du bot et des limites!");
          resetBotActivity();
          todaysGainsRef.current = 0;
          
          // Vérifier si c'est un nouveau jour par rapport au dernier revenu
          if (lastRevenueDateRef.current !== today) {
            // Incrémenter les jours consécutifs si le jour précédent avait des revenus
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toISOString().split('T')[0];
            
            if (lastRevenueDateRef.current === yesterdayString) {
              consecutiveDaysRef.current += 1;
              localStorage.setItem('consecutiveDays', consecutiveDaysRef.current.toString());
              
              // Afficher un toast pour féliciter l'utilisateur
              if (consecutiveDaysRef.current > 1) {
                toast({
                  title: `${consecutiveDaysRef.current} jours consécutifs!`,
                  description: "Votre constance est récompensée. Continuez ainsi pour maximiser vos revenus!",
                  duration: 6000
                });
              }
            }
          }
          
          // Forcer l'activation du bot
          updateBotStatus(true);
          
          // Démarrer une session après la réinitialisation
          setTimeout(() => {
            if (isBotActive) {
              console.log("Démarrage d'une première session après réinitialisation");
              generateAutomaticRevenue(true);
            }
          }, 3000);
        }
      };
      
      // Exécuter la vérification immédiatement pour traiter les cas où l'app redémarre juste après minuit
      checkMidnightReset();
      
      // Configurer l'intervalle pour vérifier régulièrement
      const midnightCheckInterval = setInterval(checkMidnightReset, 60000);
      
      return () => {
        clearInterval(midnightCheckInterval);
      };
    }
  }, [userData, checkLimitAndUpdateBot, resetBotActivity, isBotActive, generateAutomaticRevenue]);

  // Écouter les changements explicites d'état du bot
  useEffect(() => {
    // Si le bot est désactivé manuellement ailleurs, propager l'info
    const handleExternalBotChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      
      // Si on essaie d'activer le bot, vérifier la limite
      if (typeof isActive === 'boolean' && isActive) {
        const dailyLimit = getDailyLimit();
        const currentBalance = getCurrentBalance();
        
        // Si la limite est atteinte, empêcher l'activation
        if (currentBalance >= dailyLimit) {
          console.log("[useAutoRevenueGenerator] Bot activation prevented: limit reached");
          setShowLimitAlert(true);
          updateBotStatus(false);
        } else {
          updateBotStatus(isActive);
          
          // Si on active le bot, lancer une session après un court délai
          if (isActive) {
            setTimeout(() => {
              console.log("Bot activé - démarrage d'une première session");
              generateAutomaticRevenue(true);
            }, 2000);
          }
        }
      } else if (typeof isActive === 'boolean') {
        // Si on désactive, le faire sans vérification
        updateBotStatus(isActive);
      }
    };
    
    window.addEventListener('bot:external-status-change' as any, handleExternalBotChange);
    
    return () => {
      window.removeEventListener('bot:external-status-change' as any, handleExternalBotChange);
    };
  }, [updateBotStatus, getDailyLimit, getCurrentBalance, setShowLimitAlert, generateAutomaticRevenue]);

  // Mettre à jour la date du dernier revenu lorsqu'un revenu est généré
  useEffect(() => {
    const handleRevenueGenerated = (event: CustomEvent) => {
      const amount = event.detail?.amount;
      
      if (amount && amount > 0) {
        const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
        lastRevenueDateRef.current = today;
        localStorage.setItem('lastRevenueDate', today);
        
        // S'assurer qu'une transaction est également créée
        if (userData.id) {
          addTransaction(userData.id, amount, `Analyse automatique complétée: +${amount.toFixed(2)}€`);
        }
      }
    };
    
    window.addEventListener('revenue:generated' as any, handleRevenueGenerated);
    
    return () => {
      window.removeEventListener('revenue:generated' as any, handleRevenueGenerated);
    };
  }, [userData.id]);

  return {
    generateAutomaticRevenue,
    isSessionInProgress: () => isSessionInProgress(),
    isBotActive,
    updateBotStatus,
    resetBotActivity: () => resetBotActivity(userData.subscription, userData.balance),
    consecutiveDays: consecutiveDaysRef.current
  };
};

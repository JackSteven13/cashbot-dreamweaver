
import { useState, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';
import balanceManager from '@/utils/balance/balanceManager';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { loadUserStats, saveUserStats } from '@/hooks/stats/utils/storageManager';
import { calculateAutoSessionGain } from '@/utils/subscription/sessionGain';

export const useAutoSessions = ({
  userData,
  updateBalance,
  setShowLimitAlert
}) => {
  // References to ensure data stability
  const todaysGainsRef = useRef(0);
  const lastKnownBalanceRef = useRef(userData?.balance || 0);
  
  // Create a safe userData object with default values
  const safeUserData = userData || { subscription: 'freemium', profile: { id: null }, balance: 0 };
  
  // State to track bot activity - ACTIF SAUF SI LIMITE ATTEINTE
  const [isBotActive, setIsBotActive] = useState(true);
  const botActiveRef = useRef(true);
  
  // Pour suivre la limite quotidienne
  const [dailyLimitProgress, setDailyLimitProgress] = useState(0);
  
  // State to track initial session execution
  const isInitialSessionExecuted = useRef(false);
  const lastAutoSessionTime = useRef(Date.now() - 60000); // -60s pour permettre une génération immédiate
  
  // Update lastKnownBalanceRef when userData.balance changes
  useEffect(() => {
    if (userData?.balance !== undefined && userData.balance !== lastKnownBalanceRef.current) {
      lastKnownBalanceRef.current = userData.balance;
      
      // Also store in localStorage for persistence between renders
      try {
        localStorage.setItem('lastKnownBalance', userData.balance.toString());
      } catch (e) {
        console.error("Failed to store balance in localStorage:", e);
      }
    }
    
    // Calculate today's gains from both local storage and transactions
    updateDailyGains();
  }, [userData?.balance, userData?.transactions]);
  
  // Fonction pour récupérer et synchroniser les gains quotidiens
  const updateDailyGains = () => {
    // Récupérer les gains depuis le gestionnaire de solde
    const managerDailyGains = balanceManager.getDailyGains();
    
    // Calculer aussi depuis les transactions
    if (userData?.transactions) {
      const today = new Date().toISOString().split('T')[0];
      const todaysTransactions = userData.transactions.filter((tx) => 
        tx.date?.startsWith(today) && tx.gain > 0
      );
      const transactionsGains = todaysTransactions.reduce((sum, tx) => sum + (tx.gain || 0), 0);
      
      // Utiliser la valeur la plus élevée
      const actualDailyGains = Math.max(managerDailyGains, transactionsGains);
      todaysGainsRef.current = actualDailyGains;
      
      // Calculer le pourcentage atteint pour la limite quotidienne
      const subscription = safeUserData.subscription || 'freemium';
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      const percentProgress = Math.min(100, (actualDailyGains / dailyLimit) * 100);
      setDailyLimitProgress(percentProgress);
      
      // IMPORTANT - Désactiver le bot quand la limite est atteinte pour freemium
      if (subscription === 'freemium' && actualDailyGains >= dailyLimit) {
        setShowLimitAlert(true);
        setIsBotActive(false);
        botActiveRef.current = false;
        console.log("Limite quotidienne atteinte, bot désactivé pour freemium");
        
        window.dispatchEvent(new CustomEvent('bot:status-change', {
          detail: { active: false, reason: 'limit_reached' }
        }));
      }
    }
  };
  
  // Automatic session scheduler - MOINS FRÉQUENT POUR FREEMIUM
  useEffect(() => {
    if (safeUserData?.profile?.id && !isInitialSessionExecuted.current) {
      isInitialSessionExecuted.current = true;
      
      // Déclencher une première session automatique avec un léger délai
      console.log("Scheduling initial auto session generation");
      setTimeout(() => {
        generateAutomaticRevenue(true);
      }, 2000);
    }
  }, [safeUserData?.profile?.id]);

  // Set up periodic auto session generation - FRÉQUENCE ADAPTÉE
  useEffect(() => {
    // Skip if user data is not available
    if (!safeUserData?.profile?.id) return;

    // Déterminer l'intervalle en fonction de l'abonnement
    const baseInterval = safeUserData.subscription === 'freemium' ? 30000 : 20000;
    const randomOffset = Math.random() * 10000;
    
    // Setup interval for regular automatic sessions
    const autoSessionInterval = setInterval(() => {
      const now = Date.now();
      if (botActiveRef.current && now - lastAutoSessionTime.current > baseInterval) {
        lastAutoSessionTime.current = now;
        console.log("Generating auto session from primary interval");
        generateAutomaticRevenue();
      }
    }, baseInterval + randomOffset); // Run every 30-40s for freemium, 20-30s for paid plans
    
    return () => {
      clearInterval(autoSessionInterval);
    };
  }, [safeUserData?.profile?.id, safeUserData?.subscription]);
  
  // Pour freemium : ne garder que l'intervalle principal
  useEffect(() => {
    if (!safeUserData?.profile?.id || safeUserData.subscription === 'freemium') return;
    
    // Second interval only for paid subscriptions
    const quickInterval = setInterval(() => {
      const now = Date.now();
      if (botActiveRef.current && now - lastAutoSessionTime.current > 20000 && Math.random() > 0.7) {
        lastAutoSessionTime.current = now;
        console.log("Generating auto session from quick interval");
        generateAutomaticRevenue();
      }
    }, 15000); // Check every 15 seconds
    
    return () => {
      clearInterval(quickInterval);
    };
  }, [safeUserData?.profile?.id, safeUserData?.subscription]);
  
  // Synchronisez le solde avec la base de données périodiquement
  useEffect(() => {
    const syncTimerId = setInterval(() => {
      if (safeUserData?.profile?.id) {
        balanceManager.syncWithDatabase().catch(err => 
          console.error("Error during periodic balance sync:", err)
        );
      }
    }, 30000); // Toutes les 30 secondes
    
    return () => clearInterval(syncTimerId);
  }, [safeUserData?.profile?.id]);
  
  // Listen for bot status changes
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const newStatus = event.detail?.active;
      const userId = event.detail?.userId;
      const reason = event.detail?.reason;
      
      // Only handle events for this user
      if (userId && safeUserData?.profile?.id && userId !== safeUserData.profile.id) {
        return;
      }
      
      if (typeof newStatus === 'boolean') {
        // Si la limite est atteinte pour freemium, ne pas réactiver le bot
        if (safeUserData.subscription === 'freemium' && reason === 'limit_reached') {
          console.log("Bot désactivé car limite atteinte pour freemium");
          setIsBotActive(false);
          botActiveRef.current = false;
          return;
        }
        
        // Update local state and reference
        setIsBotActive(newStatus);
        botActiveRef.current = newStatus;
        console.log("Bot status updated:", newStatus ? "active" : "inactive");
        
        // Enregistrer l'état du bot dans le localStorage
        try {
          localStorage.setItem(`botActive_${safeUserData?.profile?.id}`, newStatus.toString());
        } catch (e) {
          console.error("Failed to store bot status in localStorage:", e);
        }
      }
    };
    
    // Check if we should disable bot due to daily limit on init
    const subscription = safeUserData.subscription || 'freemium';
    if (subscription === 'freemium') {
      const dailyGains = balanceManager.getDailyGains();
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription] || 0.5;
      
      if (dailyGains >= dailyLimit) {
        console.log("Initial check: daily limit reached for freemium, disabling bot");
        setIsBotActive(false);
        botActiveRef.current = false;
        setShowLimitAlert(true);
      } else {
        setIsBotActive(true);
        botActiveRef.current = true;
      }
    }
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    window.addEventListener('bot:external-status-change' as any, handleBotStatusChange);
    window.addEventListener('dailyGains:updated' as any, updateDailyGains);
    window.addEventListener('dailyGains:reset' as any, updateDailyGains);
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('bot:external-status-change' as any, handleBotStatusChange);
      window.removeEventListener('dailyGains:updated' as any, updateDailyGains);
      window.removeEventListener('dailyGains:reset' as any, updateDailyGains);
    };
  }, [safeUserData?.profile?.id, safeUserData.subscription, setShowLimitAlert]);

  // Function to generate automatic revenue with improved limit checking
  async function generateAutomaticRevenue(isFirst = false): Promise<void> {
    // Vérifier si le bot est actif et si on peut générer des revenus
    if (!botActiveRef.current) {
      console.log("Skipping automatic revenue generation - bot is inactive");
      return;
    }
    
    try {
      const subscription = safeUserData.subscription || 'freemium';
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      const userStats = loadUserStats(subscription);
      
      // Vérifier les gains quotidiens actuels
      const currentDailyGains = balanceManager.getDailyGains();
      
      // Pour freemium, si on a déjà atteint la limite, ne rien faire
      if (subscription === 'freemium' && currentDailyGains >= dailyLimit) {
        setIsBotActive(false);
        botActiveRef.current = false;
        setShowLimitAlert(true);
        console.log("Limite quotidienne atteinte pour freemium, génération de revenus automatiques annulée");
        return;
      }
      
      // Calculer le gain adapté à la situation
      const gain = calculateAutoSessionGain(subscription, currentDailyGains, userData?.referrals?.length || 0);
      
      // Si aucun gain n'est possible, sortir
      if (gain <= 0) {
        console.log("Pas de gain possible, limite atteinte");
        
        if (subscription === 'freemium') {
          setIsBotActive(false);
          botActiveRef.current = false;
          setShowLimitAlert(true);
        }
        
        return;
      }
      
      // Proceed with the transaction
      const terminalAnimation = createBackgroundTerminalSequence([
        "Initialisation de l'analyse du contenu vidéo..."
      ], true);
      
      terminalAnimation.add("Traitement des données algorithmiques...");
      
      // Short delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
      
      terminalAnimation.add(`Analyse complétée. Optimisation des résultats: ${gain.toFixed(2)}€`);
      
      // Create a descriptive message for the transaction
      const transactionReport = `Analyse automatique de contenu`;
      
      // Mettre à jour le solde
      await updateBalance(gain, transactionReport, isFirst);
      
      // Update user stats
      saveUserStats({
        currentGains: userStats.currentGains + gain,
        sessionCount: userStats.sessionCount + 1
      });
      
      // Add daily gain to balance manager
      balanceManager.addDailyGain(gain);
      
      // Re-check daily limit after adding gain
      const newDailyGains = balanceManager.getDailyGains();
      if (subscription === 'freemium' && newDailyGains >= dailyLimit) {
        setIsBotActive(false);
        botActiveRef.current = false;
        setShowLimitAlert(true);
      }
      
      // Trigger animated balance update with a custom event
      window.dispatchEvent(new CustomEvent('balance:update', {
        detail: {
          amount: gain,
          animate: true,
          automatic: true
        }
      }));
      
      // Display a notification to confirm automatic generation (moins souvent pour freemium)
      const notificationChance = subscription === 'freemium' ? 0.1 : 0.2;
      if (isFirst || Math.random() > (1 - notificationChance)) {
        toast({
          title: `Gains automatiques +${gain.toFixed(2)}€`,
          description: `L'analyse automatique de contenu vidéo a généré des revenus.`,
          duration: 3000,
        });
      }
      
      // Complete the animation with the obtained gain
      terminalAnimation.complete(gain);
      
    } catch (error) {
      console.error("Error in generateAutomaticRevenue:", error);
    }
  }

  return {
    lastAutoSessionTime: new Date(),
    activityLevel: 60,
    isBotActive,
    dailyLimitProgress,
    generateAutomaticRevenue
  };
};

export default useAutoSessions;

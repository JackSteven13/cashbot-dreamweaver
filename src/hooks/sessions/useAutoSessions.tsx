
import { useState, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';
import balanceManager from '@/utils/balance/balanceManager';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { loadUserStats, saveUserStats } from '@/hooks/stats/utils/storageManager';

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
  
  // State to track bot activity - TOUJOURS ACTIF
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
      const dailyLimit = balanceManager.getDailyLimit(subscription);
      const percentProgress = Math.min(100, (actualDailyGains / dailyLimit) * 100);
      setDailyLimitProgress(percentProgress);
      
      // MODIFIÉ - Ne pas désactiver le bot quand la limite est atteinte
      // Permettre de continuer à générer des revenus même si la limite est atteinte
      if (actualDailyGains >= dailyLimit) {
        setShowLimitAlert(true);
        console.log("Limite quotidienne atteinte, mais le bot reste actif");
      }
    }
  };
  
  // MODIFIÉ - Automatic session scheduler activé IMMÉDIATEMENT et PLUS FRÉQUEMMENT
  useEffect(() => {
    if (safeUserData?.profile?.id && !isInitialSessionExecuted.current) {
      isInitialSessionExecuted.current = true;
      
      // Déclencher une première session automatique immédiatement
      console.log("Immediate auto session generation");
      setTimeout(() => {
        generateAutomaticRevenue(true);
      }, 1000);
    }
  }, [safeUserData?.profile?.id]);

  // Set up periodic auto session generation - FRÉQUENCE AUGMENTÉE
  useEffect(() => {
    // Skip if user data is not available
    if (!safeUserData?.profile?.id) return;

    // Setup interval for regular automatic sessions - PLUS RAPIDE
    const autoSessionInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastAutoSessionTime.current > 15000) { // 15 secondes minimum
        lastAutoSessionTime.current = now;
        console.log("Generating auto session from primary interval");
        generateAutomaticRevenue();
      }
    }, 20000 + Math.random() * 10000); // Run every 20-30 seconds
    
    return () => {
      clearInterval(autoSessionInterval);
    };
  }, [safeUserData?.profile?.id]);
  
  // NOUVEAU - Intervalle secondaire encore plus rapide
  useEffect(() => {
    if (!safeUserData?.profile?.id) return;
    
    // Second interval for even more frequent checks
    const quickInterval = setInterval(() => {
      const now = Date.now();
      // Petite chance de génération supplémentaire
      if (now - lastAutoSessionTime.current > 20000 && Math.random() > 0.7) { // 30% de chance
        lastAutoSessionTime.current = now;
        console.log("Generating auto session from quick interval");
        generateAutomaticRevenue();
      }
    }, 10000); // Check every 10 seconds
    
    return () => {
      clearInterval(quickInterval);
    };
  }, [safeUserData?.profile?.id]);
  
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
      
      // Only handle events for this user
      if (userId && safeUserData?.profile?.id && userId !== safeUserData.profile.id) {
        return;
      }
      
      if (typeof newStatus === 'boolean') {
        // MODIFIÉ - Toujours actif, ignorer les événements de désactivation
        if (newStatus === false) {
          console.log("Ignoring bot deactivation attempt - keeping bot active");
          
          // Réactiver le bot après un court délai
          setTimeout(() => {
            setIsBotActive(true);
            botActiveRef.current = true;
            console.log("Bot réactivé automatiquement");
            
            window.dispatchEvent(new CustomEvent('bot:status-change', {
              detail: { active: true, userId: safeUserData?.profile?.id }
            }));
            
            localStorage.setItem(`botActive_${safeUserData?.profile?.id}`, 'true');
          }, 5000);
        } else {
          // Update local state and reference if activation requested
          setIsBotActive(true);
          botActiveRef.current = true;
          console.log("Bot status updated to active");
          
          // Enregistrer l'état du bot dans le localStorage
          try {
            localStorage.setItem(`botActive_${safeUserData?.profile?.id}`, 'true');
          } catch (e) {
            console.error("Failed to store bot status in localStorage:", e);
          }
        }
      }
    };
    
    // MODIFIÉ - Activer par défaut quoi qu'il arrive
    setIsBotActive(true);
    botActiveRef.current = true;
    localStorage.setItem(`botActive_${safeUserData?.profile?.id}`, 'true');
    
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
  }, [safeUserData?.profile?.id]);

  // Function to generate automatic revenue with improved limit checking
  async function generateAutomaticRevenue(isFirst = false): Promise<void> {
    // MODIFIÉ - Toujours autoriser la génération de revenus
    console.log("Generating automatic revenue within limits...");
    
    try {
      const subscription = safeUserData.subscription || 'freemium';
      const dailyLimit = balanceManager.getDailyLimit(subscription);
      const userStats = loadUserStats(subscription);
      
      // Déterminer si on est proche de la limite
      const isNearLimit = userStats.currentGains >= dailyLimit * 0.9;
      
      // Calculate a gain amount based on limit status
      let gain = 0.05;
      
      if (isNearLimit || userStats.currentGains >= dailyLimit) {
        // Si proche/au-delà de la limite, gain très faible
        gain = parseFloat((0.01 + Math.random() * 0.02).toFixed(2));
      } else {
        // Gain normal basé sur le niveau d'abonnement
        const minGain = 0.03;
        const maxGain = 0.08;
        gain = parseFloat((Math.random() * (maxGain - minGain) + minGain).toFixed(2));
      }
      
      // Proceed with the transaction
      const terminalAnimation = createBackgroundTerminalSequence([
        "Initialisation de l'analyse du contenu vidéo..."
      ], true);
      
      terminalAnimation.add("Traitement des données algorithmiques...");
      
      // Short delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
      
      // Trigger animated balance update with a custom event
      window.dispatchEvent(new CustomEvent('balance:update', {
        detail: {
          amount: gain,
          animate: true,
          automatic: true
        }
      }));
      
      // Display a notification to confirm automatic generation
      if (isFirst || Math.random() > 0.8) {
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
    isBotActive: true, // TOUJOURS ACTIF
    dailyLimitProgress,
    generateAutomaticRevenue
  };
};

export default useAutoSessions;

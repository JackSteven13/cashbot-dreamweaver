
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { calculateAutoSessionGain } from '@/utils/subscription';
import { updateUserBalance } from '@/utils/balance/updateBalance';
import { getRandomCryptoName } from '@/utils/dummy-data/cryptoNames';
import { getRandomAmount } from '@/utils/dummy-data/amountGenerator';
import { balanceManager } from '@/utils/balance/balanceManager';
import { supabase } from '@/integrations/supabase/client';
import { OfflineGain } from '@/types/offlineGains';

export const useAutoRevenueGenerator = (
  userData: any,
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void,
  todaysGainsRef: React.MutableRefObject<number>,
  getDailyLimit: (subscription: string) => number
) => {
  const [sessionInProgress, setSessionInProgress] = useState(false);
  const [botActive, setBotActive] = useState(true); // Bot actif par défaut
  const sessionGainRef = useRef<number>(0);
  const initialSessionExecutedRef = useRef(false);
  const lastOfflineUpdateRef = useRef<string | null>(null);
  
  // Check if limit is reached and update bot status accordingly
  useEffect(() => {
    if (!userData?.subscription) return;
    
    // Get the daily limit
    const dailyLimit = getDailyLimit(userData.subscription);
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Try to get today's gains from localStorage
    let todaysGains = 0;
    try {
      const todaysGainsKey = `todaysGains_${today}`;
      const storedGains = localStorage.getItem(todaysGainsKey);
      if (storedGains) {
        todaysGains = parseFloat(storedGains);
      }
    } catch (e) {
      console.error("Error retrieving daily gains:", e);
    }
    
    // Use the higher value between reference and localStorage
    const effectiveGains = Math.max(todaysGains, todaysGainsRef.current);
    
    // If limit is reached, deactivate bot
    if (effectiveGains >= dailyLimit) {
      console.log(`Daily limit reached (${effectiveGains}/${dailyLimit}), deactivating bot`);
      setBotActive(false);
      setShowLimitAlert(true);
      
      // Ensure this is reflected globally
      window.dispatchEvent(new CustomEvent('bot:status-change', { 
        detail: { active: false }
      }));
    }
  }, [userData?.subscription, userData?.balance, getDailyLimit, setShowLimitAlert, todaysGainsRef]);
  
  // Effet pour synchroniser les gains générés hors-ligne
  useEffect(() => {
    if (!userData?.id) return;
    
    const syncOfflineGains = async () => {
      try {
        // Récupérer la date de la dernière mise à jour
        const lastUpdateKey = `lastOfflineUpdate_${userData.id}`;
        const storedLastUpdate = localStorage.getItem(lastUpdateKey) || null;
        const lastUpdate = storedLastUpdate || lastOfflineUpdateRef.current;
        
        // Récupérer les gains générés lorsque l'utilisateur était absent
        // Utiliser `as any` pour contourner les restrictions TypeScript
        const { data: offlineGains, error } = await (supabase as any)
          .from('offline_gains')
          .select('*')
          .eq('user_id', userData.id)
          .gt('created_at', lastUpdate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: true });
          
        if (error) {
          console.error("Erreur lors de la récupération des gains hors ligne:", error);
          return;
        }
        
        if (offlineGains && offlineGains.length > 0) {
          console.log(`Récupération de ${offlineGains.length} gains générés hors ligne`);
          
          // Traiter séquentiellement les gains avec un délai pour l'expérience utilisateur
          let totalGain = 0;
          let newestTimestamp = lastUpdate;
          
          // Traiter les gains en tant que OfflineGain[]
          const typedGains = offlineGains as OfflineGain[];
          
          // Mettre à jour le solde avec tous les gains accumulés
          for (const gain of typedGains) {
            totalGain += gain.amount;
            
            // Mettre à jour la date la plus récente
            if (!newestTimestamp || new Date(gain.created_at) > new Date(newestTimestamp)) {
              newestTimestamp = gain.created_at;
            }
          }
          
          if (totalGain > 0) {
            // Générer un rapport consolidé
            const report = `Revenus générés pendant votre absence: ${offlineGains.length} analyses publicitaires effectuées automatiquement pour un total de ${totalGain.toFixed(2)}€`;
            
            // Mettre à jour le solde avec le montant total
            await updateBalance(totalGain, report, true);
            
            toast({
              title: "Revenus générés pendant votre absence",
              description: `Nos bots ont continué à travailler: ${totalGain.toFixed(2)}€ ajoutés à votre compte.`,
              duration: 6000
            });
            
            // Marquer ces gains comme distribués
            if (offlineGains.length > 0) {
              await (supabase as any)
                .from('offline_gains')
                .delete()
                .in('id', offlineGains.map(g => g.id));
            }
          }
          
          // Mettre à jour la référence de dernière mise à jour
          if (newestTimestamp) {
            lastOfflineUpdateRef.current = newestTimestamp;
            localStorage.setItem(lastUpdateKey, newestTimestamp);
          }
        }
      } catch (e) {
        console.error("Erreur lors de la synchronisation des gains hors ligne:", e);
      }
    };
    
    // Exécuter la synchronisation au chargement
    syncOfflineGains();
    
    // Configurer une synchronisation périodique
    const syncInterval = setInterval(syncOfflineGains, 15 * 60 * 1000); // Toutes les 15 minutes
    
    return () => clearInterval(syncInterval);
  }, [userData?.id, updateBalance]);
  
  // Effet pour écouter les changements d'état du bot
  useEffect(() => {
    const handleExternalStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      const checkLimit = event.detail?.checkLimit;
      const subscription = event.detail?.subscription;
      const currentBalance = event.detail?.balance;
      
      if (typeof isActive === 'boolean') {
        if (checkLimit && subscription && typeof currentBalance === 'number') {
          // Vérifier la limite journalière
          const dailyLimit = getDailyLimit(subscription);
          
          // Vérifier les gains du jour, pas le solde total
          const today = new Date().toISOString().split('T')[0];
          let todaysGains = todaysGainsRef.current;
          
          // Essayer également de récupérer depuis localStorage pour plus de fiabilité
          try {
            const storedGains = localStorage.getItem(`todaysGains_${today}`);
            if (storedGains) {
              todaysGains = Math.max(todaysGains, parseFloat(storedGains));
            }
          } catch (e) {
            console.error("Erreur lors de la récupération des gains quotidiens:", e);
          }
          
          if (todaysGains >= dailyLimit) {
            if (isActive) {
              console.log('Tentative d\'activation du bot bloquée - limite journalière atteinte');
              
              // Garder le bot désactivé
              setBotActive(false);
              
              // Notifier l'utilisateur
              setShowLimitAlert(true);
              toast({
                title: "Limite journalière atteinte",
                description: `Vous avez atteint votre limite de gain journalier de ${dailyLimit}€. Revenez demain ou passez à un forfait supérieur.`,
                variant: "destructive",
                duration: 5000
              });
              
              return;
            }
          }
        }
        
        // Mettre à jour l'état du bot
        console.log(`État du bot changé à: ${isActive ? 'actif' : 'inactif'}`);
        setBotActive(isActive);
        
        // Déclencher un événement global pour la synchronisation
        window.dispatchEvent(new CustomEvent('bot:status-change', { 
          detail: { active: isActive }
        }));
      }
    };
    
    // Écouter les événements externes de changement d'état
    window.addEventListener('bot:external-status-change' as any, handleExternalStatusChange);
    
    return () => {
      window.removeEventListener('bot:external-status-change' as any, handleExternalStatusChange);
    };
  }, [getDailyLimit, setShowLimitAlert, todaysGainsRef]);
  
  // Fonction pour générer des revenus automatiquement
  const generateAutomaticRevenue = useCallback(async (isFirst = false) => {
    // Vérifier si une session est déjà en cours
    if (sessionInProgress || !userData || !botActive) return;
    
    // Si c'est la première session, la marquer comme exécutée
    if (isFirst) {
      initialSessionExecutedRef.current = true;
    }
    
    // Marquer la session comme en cours
    setSessionInProgress(true);
    
    try {
      // Obtenir la limite journalière
      const dailyLimit = getDailyLimit(userData.subscription);
      
      // Date du jour pour le suivi des gains
      const today = new Date().toISOString().split('T')[0];
      
      // Récupérer les gains quotidiens actuels
      let todaysGains = todaysGainsRef.current;
      
      // Vérifier également dans localStorage
      try {
        const todaysGainsKey = `todaysGains_${today}`;
        const storedGains = localStorage.getItem(todaysGainsKey);
        if (storedGains) {
          todaysGains = Math.max(todaysGains, parseFloat(storedGains));
        }
      } catch (e) {
        console.error("Erreur lors de la récupération des gains quotidiens:", e);
      }
      
      // Vérifier si la limite journalière est atteinte
      if (todaysGains >= dailyLimit) {
        console.log(`Limite journalière atteinte: ${todaysGains}/${dailyLimit}`);
        
        // Notifier visuellement
        setShowLimitAlert(true);
        
        // Désactiver le bot
        setBotActive(false);
        window.dispatchEvent(new CustomEvent('bot:status-change', { 
          detail: { active: false }
        }));
        
        toast({
          title: "Limite journalière atteinte",
          description: `Vous avez atteint votre limite de gain journalier de ${dailyLimit}€. Revenez demain ou passez à un forfait supérieur.`,
          variant: "default",
          duration: 5000
        });
        
        return;
      }
      
      // Calculer un gain aléatoire basé sur le type d'abonnement
      const gain = calculateAutoSessionGain(
        userData.subscription,
        todaysGains, // Utiliser les gains du jour au lieu du solde total
        userData.referrals?.length || 0
      );
      
      // Si le gain est significatif
      if (gain > 0) {
        // Préparer le rapport pour la transaction
        const cryptoName = getRandomCryptoName();
        const amount = getRandomAmount(20, 200);
        
        // Créer un rapport détaillé aléatoire
        const report = `Analyse automatique : Détection d'opportunité publicitaire pour ${cryptoName} (${amount} impressions). Revenu généré: ${gain.toFixed(2)}€`;
        
        // Mettre à jour la référence des gains quotidiens
        todaysGainsRef.current = todaysGains + gain;
        
        // Mettre à jour les gains quotidiens dans localStorage
        try {
          const todaysGainsKey = `todaysGains_${today}`;
          localStorage.setItem(todaysGainsKey, todaysGainsRef.current.toString());
          console.log(`Gains quotidiens mis à jour: ${todaysGains} -> ${todaysGainsRef.current}`);
        } catch (e) {
          console.error("Erreur lors de la mise à jour des gains quotidiens:", e);
        }
        
        // Sauvegarder la référence du gain pour l'animation
        sessionGainRef.current = gain;
        
        // Annoncer la mise à jour du solde pour l'animation
        window.dispatchEvent(new CustomEvent('balance:update', { 
          detail: { amount: gain } 
        }));
        
        // Mettre à jour le solde
        await updateBalance(gain, report, true);
        
        // Mettre à jour également le gestionnaire central de solde
        balanceManager.updateBalance(gain);
        
        // Check if limit is now reached after this gain
        if (todaysGainsRef.current >= dailyLimit) {
          console.log('Limite atteinte après ce gain, désactivation du bot');
          setBotActive(false);
          setShowLimitAlert(true);
          window.dispatchEvent(new CustomEvent('bot:status-change', { 
            detail: { active: false }
          }));
        }
      }
    } catch (error) {
      console.error('Erreur lors de la génération automatique de revenus:', error);
    } finally {
      // Marquer la session comme terminée
      setSessionInProgress(false);
    }
  }, [getDailyLimit, sessionInProgress, botActive, userData, updateBalance, setShowLimitAlert, todaysGainsRef]);
  
  // Fonction pour réinitialiser l'activité du bot
  const resetBotActivity = useCallback(() => {
    // Réinitialiser le compteur des gains quotidiens
    todaysGainsRef.current = 0;
    
    // Mettre à jour dans localStorage également
    const today = new Date().toISOString().split('T')[0];
    const todaysGainsKey = `todaysGains_${today}`;
    localStorage.setItem(todaysGainsKey, '0');
    
    // Réactiver le bot
    setBotActive(true);
    
    // Notifier globalement
    window.dispatchEvent(new CustomEvent('bot:status-change', { 
      detail: { active: true }
    }));
  }, [todaysGainsRef]);
  
  return {
    generateAutomaticRevenue,
    isSessionInProgress: sessionInProgress,
    sessionGain: sessionGainRef.current,
    isBotActive: botActive,
    resetBotActivity
  };
};

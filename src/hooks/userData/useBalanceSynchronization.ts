
import { useState, useEffect, useRef, useCallback } from 'react';
import { UserData } from '@/types/userData';
import balanceManager from '@/utils/balance/balanceManager';
import { toast } from '@/components/ui/use-toast';

export const useBalanceSynchronization = (userData: UserData | null, isNewUser: boolean) => {
  // Utiliser balanceManager comme source unique de vérité
  const [effectiveBalance, setEffectiveBalance] = useState(() => {
    return balanceManager.getCurrentBalance();
  });
  const firstSyncRef = useRef<boolean>(true);
  const lastSyncTimeRef = useRef<number>(0);
  const highestBalanceRef = useRef<number>(balanceManager.getHighestBalance());
  
  // Synchronisation initiale et lorsque les données utilisateur changent
  useEffect(() => {
    if (!userData) return;
    
    // Pour les nouveaux utilisateurs, toujours maintenir un solde à zéro
    if (isNewUser) {
      setEffectiveBalance(0);
      balanceManager.forceBalanceSync(0); 
      localStorage.removeItem('currentBalance');
      localStorage.removeItem('lastKnownBalance');
      sessionStorage.removeItem('currentBalance');
      return;
    }
    
    // Protection contre les synchronisations trop fréquentes
    const now = Date.now();
    if (now - lastSyncTimeRef.current < 5000 && !firstSyncRef.current) return;
    lastSyncTimeRef.current = now;
    
    // Première synchronisation - initialiser le gestionnaire de solde
    if (firstSyncRef.current && userData.balance !== undefined) {
      console.log(`Première synchronisation du solde: ${userData.balance}€`);
      
      // Vérifier si on a un solde local plus élevé
      const currentLocalBalance = balanceManager.getCurrentBalance();
      const highestStoredBalance = balanceManager.getHighestBalance();
      const serverBalance = userData.balance;
      
      // Utiliser le solde le plus élevé parmi toutes les sources
      const effectiveBalance = Math.max(serverBalance, currentLocalBalance, highestStoredBalance);
      
      if (effectiveBalance > serverBalance) {
        console.log(`Le solde local (${effectiveBalance}€) est plus élevé que celui du serveur (${serverBalance}€)`);
      }
      
      // Synchroniser le gestionnaire avec le solde le plus élevé
      balanceManager.forceBalanceSync(effectiveBalance);
      balanceManager.updateHighestBalance(effectiveBalance);
      
      // Si le solde local est significativement plus élevé, afficher une notification
      if (effectiveBalance > serverBalance * 1.2) { // 20% de différence
        toast({
          title: "Solde synchronisé",
          description: "Un solde plus élevé a été trouvé localement et a été restauré.",
          duration: 5000
        });
      }
      
      firstSyncRef.current = false;
    }
    // Synchronisations ultérieures - comparer avec le serveur mais éviter de réduire le solde local
    else if (userData.balance !== undefined) {
      const currentLocalBalance = balanceManager.getCurrentBalance();
      const highestStoredBalance = balanceManager.getHighestBalance();
      const serverBalance = userData.balance;
      
      // Si le solde stocké localement est plus élevé que celui du serveur
      if (Math.max(currentLocalBalance, highestStoredBalance) > serverBalance) {
        console.log(`Solde local (${Math.max(currentLocalBalance, highestStoredBalance)}€) supérieur au serveur (${serverBalance}€)`);
        
        // Utiliser le plus élevé des deux soldes
        const effectiveBalance = Math.max(currentLocalBalance, highestStoredBalance);
        balanceManager.forceBalanceSync(effectiveBalance);
        
        // Mettre à jour le solde le plus élevé si nécessaire
        if (effectiveBalance > highestBalanceRef.current) {
          balanceManager.updateHighestBalance(effectiveBalance);
          highestBalanceRef.current = effectiveBalance;
        }
      } 
      // Si le solde du serveur est plus élevé que le local
      else if (serverBalance > currentLocalBalance) {
        console.log(`Solde du serveur (${serverBalance}€) supérieur au solde local (${currentLocalBalance}€)`);
        balanceManager.forceBalanceSync(serverBalance);
        
        // Mettre à jour le solde le plus élevé si nécessaire
        if (serverBalance > highestBalanceRef.current) {
          balanceManager.updateHighestBalance(serverBalance);
          highestBalanceRef.current = serverBalance;
        }
      }
    }
    
    // Toujours mettre à jour l'état local avec le solde stable
    const stableBalance = balanceManager.getCurrentBalance();
    setEffectiveBalance(stableBalance);
  }, [userData, isNewUser]);
  
  // Effet pour la croissance automatique quotidienne
  useEffect(() => {
    // Vérifier si une journée s'est écoulée depuis la dernière mise à jour
    const checkDailyGrowth = () => {
      const now = new Date();
      const lastGrowthDate = localStorage.getItem('lastGrowthDate');
      const today = now.toDateString();
      
      if (lastGrowthDate !== today && !isNewUser) {
        // Nouvelle journée, mettre à jour le solde
        const currentBalance = balanceManager.getCurrentBalance();
        
        // Synchroniser
        setEffectiveBalance(currentBalance);
        
        // Enregistrer la date de la mise à jour
        localStorage.setItem('lastGrowthDate', today);
      }
    };
    
    // Vérifier immédiatement
    checkDailyGrowth();
    
    // Puis vérifier périodiquement
    const interval = setInterval(checkDailyGrowth, 60000); // Toutes les minutes
    
    return () => clearInterval(interval);
  }, [isNewUser]);
  
  // S'abonner aux changements de solde via balanceManager
  useEffect(() => {
    const unsubscribe = balanceManager.addWatcher((newBalance) => {
      setEffectiveBalance(newBalance);
    });
    
    return unsubscribe;
  }, []);
  
  // Écouter l'événement de croissance quotidienne
  useEffect(() => {
    const handleDailyGrowth = (event: CustomEvent) => {
      const { growth, newBalance } = event.detail;
      console.log(`[BalanceSynchronization] Daily growth detected: +${growth.toFixed(2)}€`);
      
      // Mettre à jour le solde affiché
      setEffectiveBalance(newBalance);
    };
    
    // Écouter l'événement de restauration de solde
    const handleBalanceRestored = (event: CustomEvent) => {
      const { balance, previousBalance } = event.detail;
      
      if (balance > previousBalance) {
        console.log(`[BalanceSynchronization] Balance restored: ${previousBalance}€ -> ${balance}€`);
        
        // Notifier l'utilisateur
        toast({
          title: "Solde restauré",
          description: `Votre solde précédent de ${balance.toFixed(2)}€ a été restauré.`,
          duration: 5000
        });
        
        setEffectiveBalance(balance);
      }
    };
    
    window.addEventListener('balance:daily-growth', handleDailyGrowth as EventListener);
    window.addEventListener('balance:restored', handleBalanceRestored as EventListener);
    
    return () => {
      window.removeEventListener('balance:daily-growth', handleDailyGrowth as EventListener);
      window.removeEventListener('balance:restored', handleBalanceRestored as EventListener);
    };
  }, []);
  
  // Fonction de synchronisation manuelle
  const syncBalance = useCallback(() => {
    if (isNewUser) {
      setEffectiveBalance(0);
      return;
    }
    
    if (!userData?.balance) return;
    
    // Ne pas synchroniser trop fréquemment
    const now = Date.now();
    if (now - lastSyncTimeRef.current < 2000) return;
    lastSyncTimeRef.current = now;
    
    // Obtenir le solde local actuel
    const currentLocalBalance = balanceManager.getCurrentBalance();
    const highestStoredBalance = balanceManager.getHighestBalance();
    
    // Déterminer le solde effectif à utiliser
    const effectiveLocalBalance = Math.max(currentLocalBalance, highestStoredBalance);
    const serverBalance = userData.balance;
    
    // Toujours utiliser le solde le plus élevé entre local et serveur
    if (effectiveLocalBalance > serverBalance) {
      console.log(`Synchronisation manuelle: solde local (${effectiveLocalBalance}€) supérieur au serveur (${serverBalance}€)`);
      balanceManager.forceBalanceSync(effectiveLocalBalance);
    } else if (serverBalance > currentLocalBalance) {
      console.log(`Synchronisation manuelle: solde serveur (${serverBalance}€) supérieur au local (${currentLocalBalance}€)`);
      balanceManager.forceBalanceSync(serverBalance);
    }
    
    // Mettre à jour le solde le plus élevé
    const highestBalance = Math.max(effectiveLocalBalance, serverBalance);
    if (highestBalance > highestBalanceRef.current) {
      balanceManager.updateHighestBalance(highestBalance);
      highestBalanceRef.current = highestBalance;
    }
    
    // Mettre à jour l'état local avec le solde le plus élevé
    const stableBalance = balanceManager.getCurrentBalance();
    setEffectiveBalance(stableBalance);
  }, [userData, isNewUser]);
  
  return {
    effectiveBalance,
    syncBalance
  };
};

export default useBalanceSynchronization;

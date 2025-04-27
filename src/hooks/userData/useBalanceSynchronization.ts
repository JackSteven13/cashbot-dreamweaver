import { useState, useEffect, useRef, useCallback } from 'react';
import { UserData } from '@/types/userData';
import balanceManager from '@/utils/balance/balanceManager';
import { toast } from '@/components/ui/use-toast';

export const useBalanceSynchronization = (userData: UserData | null, isNewUser: boolean) => {
  // Utiliser balanceManager comme source unique de vérité avec garantie de valeur numérique
  const [effectiveBalance, setEffectiveBalance] = useState(() => {
    const initialBalance = balanceManager.getCurrentBalance();
    return isNaN(initialBalance) ? 0 : initialBalance;
  });
  
  const firstSyncRef = useRef<boolean>(true);
  const lastSyncTimeRef = useRef<number>(0);
  const highestBalanceRef = useRef<number>(
    Math.max(
      typeof balanceManager.getHighestBalance === 'function' ? balanceManager.getHighestBalance() : 0,
      parseFloat(localStorage.getItem('highest_balance') || '0') || 0
    )
  );
  
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
      
      // Garantir que toutes les valeurs sont des nombres valides
      const currentLocalBalance = balanceManager.getCurrentBalance();
      const validLocalBalance = isNaN(currentLocalBalance) ? 0 : currentLocalBalance;
      
      // Collecter toutes les sources potentielles de solde
      const sources = [
        validLocalBalance,
        highestBalanceRef.current,
        parseFloat(localStorage.getItem('highest_balance') || '0') || 0,
        parseFloat(localStorage.getItem('currentBalance') || '0') || 0,
        parseFloat(localStorage.getItem('lastKnownBalance') || '0') || 0,
        parseFloat(localStorage.getItem('lastUpdatedBalance') || '0') || 0,
        parseFloat(sessionStorage.getItem('currentBalance') || '0') || 0
      ];
      
      // Filtrer les valeurs NaN et trouver le maximum
      const maxLocalBalance = Math.max(...sources.filter(val => !isNaN(val)));
      
      const serverBalance = userData.balance !== null && !isNaN(userData.balance) 
        ? userData.balance 
        : 0;
      
      // Utiliser le solde le plus élevé parmi toutes les sources
      const effectiveBalance = Math.max(serverBalance, maxLocalBalance);
      
      if (effectiveBalance > serverBalance) {
        console.log(`Le solde local (${effectiveBalance}€) est plus élevé que celui du serveur (${serverBalance}€)`);
      }
      
      // Synchroniser le gestionnaire avec le solde le plus élevé
      balanceManager.forceBalanceSync(effectiveBalance);
      
      if (typeof balanceManager.updateHighestBalance === 'function') {
        balanceManager.updateHighestBalance(effectiveBalance);
      } else {
        localStorage.setItem('highest_balance', effectiveBalance.toString());
      }
      
      // Si le solde local est significativement plus élevé, afficher une notification
      if (effectiveBalance > serverBalance * 1.1 && effectiveBalance - serverBalance > 0.2) {
        toast({
          title: "Solde restauré",
          description: "Votre solde local le plus élevé a été restauré.",
          duration: 3000
        });
      }
      
      // Mettre à jour l'état local
      setEffectiveBalance(effectiveBalance);
      firstSyncRef.current = false;
      
      // Persister dans toutes les sources pour éviter les pertes
      localStorage.setItem('lastKnownBalance', effectiveBalance.toString());
      localStorage.setItem('currentBalance', effectiveBalance.toString());
      localStorage.setItem('lastUpdatedBalance', effectiveBalance.toString());
      sessionStorage.setItem('currentBalance', effectiveBalance.toString());
    }
    // Synchronisations ultérieures - comparer avec le serveur mais éviter de réduire le solde local
    else if (userData.balance !== undefined) {
      const currentLocalBalance = balanceManager.getCurrentBalance();
      const validLocalBalance = isNaN(currentLocalBalance) ? 0 : currentLocalBalance;
      
      const highestStored = typeof balanceManager.getHighestBalance === 'function' 
        ? balanceManager.getHighestBalance() 
        : parseFloat(localStorage.getItem('highest_balance') || '0');
      const validHighestBalance = isNaN(highestStored) ? 0 : highestStored;
      
      const serverBalance = userData.balance !== null && !isNaN(userData.balance) 
        ? userData.balance 
        : 0;
      
      // Si le solde stocké localement est plus élevé que celui du serveur
      if (Math.max(validLocalBalance, validHighestBalance) > serverBalance) {
        console.log(`Solde local (${Math.max(validLocalBalance, validHighestBalance)}€) supérieur au serveur (${serverBalance}€)`);
        
        // Utiliser le plus élevé des deux soldes
        const effectiveBal = Math.max(validLocalBalance, validHighestBalance);
        balanceManager.forceBalanceSync(effectiveBal);
        
        // Mettre à jour le solde le plus élevé si nécessaire
        if (effectiveBal > highestBalanceRef.current) {
          if (typeof balanceManager.updateHighestBalance === 'function') {
            balanceManager.updateHighestBalance(effectiveBal);
          }
          highestBalanceRef.current = effectiveBal;
        }
        
        // Mettre à jour l'état local
        setEffectiveBalance(effectiveBal);
      } 
      // Si le solde du serveur est plus élevé que le local
      else if (serverBalance > validLocalBalance) {
        console.log(`Solde du serveur (${serverBalance}€) supérieur au solde local (${validLocalBalance}€)`);
        balanceManager.forceBalanceSync(serverBalance);
        
        // Mettre à jour le solde le plus élevé si nécessaire
        if (serverBalance > highestBalanceRef.current) {
          if (typeof balanceManager.updateHighestBalance === 'function') {
            balanceManager.updateHighestBalance(serverBalance);
          }
          highestBalanceRef.current = serverBalance;
        }
        
        // Mettre à jour l'état local
        setEffectiveBalance(serverBalance);
      }
      
      // Persister dans toutes les sources de stockage
      const effectiveBal = Math.max(
        balanceManager.getCurrentBalance(), 
        parseFloat(localStorage.getItem('lastKnownBalance') || '0') || 0,
        parseFloat(localStorage.getItem('currentBalance') || '0') || 0,
        parseFloat(localStorage.getItem('lastUpdatedBalance') || '0') || 0,
        userData.balance || 0
      );
      
      localStorage.setItem('lastKnownBalance', effectiveBal.toString());
      localStorage.setItem('currentBalance', effectiveBal.toString());
      localStorage.setItem('lastUpdatedBalance', effectiveBal.toString());
      sessionStorage.setItem('currentBalance', effectiveBal.toString());
    }
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
  
  // Ajouter un gestionnaire pour l'événement session-completed
  useEffect(() => {
    const handleSessionComplete = (event: CustomEvent) => {
      if (!event.detail) return;
      
      const { gain, finalBalance } = event.detail;
      
      if (typeof gain === 'number' && !isNaN(gain) && gain > 0) {
        const currentBal = balanceManager.getCurrentBalance();
        const newBalance = Math.max(
          (typeof finalBalance === 'number' && !isNaN(finalBalance)) ? finalBalance : 0,
          isNaN(currentBal) ? 0 : currentBal + gain
        );
        
        balanceManager.forceBalanceSync(newBalance);
        
        // Persister immédiatement pour éviter les pertes
        localStorage.setItem('lastKnownBalance', newBalance.toString());
        localStorage.setItem('currentBalance', newBalance.toString());
        localStorage.setItem('lastUpdatedBalance', newBalance.toString());
        sessionStorage.setItem('currentBalance', newBalance.toString());
        
        if (typeof balanceManager.updateHighestBalance === 'function') {
          balanceManager.updateHighestBalance(newBalance);
        }
        
        setEffectiveBalance(newBalance);
      }
    };
    
    window.addEventListener('session:completed', handleSessionComplete as EventListener);
    window.addEventListener('manual-session:completed', handleSessionComplete as EventListener);
    
    return () => {
      window.removeEventListener('session:completed', handleSessionComplete as EventListener);
      window.removeEventListener('manual-session:completed', handleSessionComplete as EventListener);
    };
  }, []);
  
  // Écouter les modifications du balanceManager
  useEffect(() => {
    const handleBalanceChange = (newBalance: number) => {
      if (isNaN(newBalance)) return;
      
      setEffectiveBalance(newBalance);
      
      // Persister immédiatement pour éviter les pertes lors des rechargements
      localStorage.setItem('lastKnownBalance', newBalance.toString());
      localStorage.setItem('currentBalance', newBalance.toString());
      localStorage.setItem('lastUpdatedBalance', newBalance.toString());
      sessionStorage.setItem('currentBalance', newBalance.toString());
    };
    
    const unsubscribe = balanceManager.addWatcher(handleBalanceChange);
    return unsubscribe;
  }, []);
  
  // Fonction de synchronisation manuelle
  const syncBalance = useCallback(() => {
    if (isNewUser) {
      setEffectiveBalance(0);
      return;
    }
    
    if (!userData?.balance) return;
    
    // Collecter toutes les sources potentielles de solde
    const sources = [
      balanceManager.getCurrentBalance(),
      typeof balanceManager.getHighestBalance === 'function' ? balanceManager.getHighestBalance() : 0,
      parseFloat(localStorage.getItem('highest_balance') || '0') || 0,
      parseFloat(localStorage.getItem('currentBalance') || '0') || 0,
      parseFloat(localStorage.getItem('lastKnownBalance') || '0') || 0,
      parseFloat(localStorage.getItem('lastUpdatedBalance') || '0') || 0,
      userData.balance
    ];
    
    // Filtrer les valeurs NaN et trouver le maximum
    const maxBalance = Math.max(...sources.filter(val => !isNaN(val) && val > 0));
    
    if (maxBalance > 0) {
      balanceManager.forceBalanceSync(maxBalance);
      
      // Mettre à jour le solde le plus élevé
      if (typeof balanceManager.updateHighestBalance === 'function') {
        balanceManager.updateHighestBalance(maxBalance);
      }
      
      setEffectiveBalance(maxBalance);
      
      // Persister dans toutes les sources
      localStorage.setItem('lastKnownBalance', maxBalance.toString());
      localStorage.setItem('currentBalance', maxBalance.toString());
      localStorage.setItem('lastUpdatedBalance', maxBalance.toString());
      sessionStorage.setItem('currentBalance', maxBalance.toString());
    }
  }, [userData, isNewUser]);
  
  return {
    effectiveBalance,
    syncBalance
  };
};

export default useBalanceSynchronization;

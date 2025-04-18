
import { useState, useEffect, useRef, useCallback } from 'react';
import { UserData } from '@/types/userData';
import balanceManager from '@/utils/balance/balanceManager';

export const useBalanceSynchronization = (userData: UserData | null, isNewUser: boolean) => {
  // Utiliser balanceManager comme source unique de vérité
  const [effectiveBalance, setEffectiveBalance] = useState(() => {
    return balanceManager.getCurrentBalance();
  });
  const firstSyncRef = useRef<boolean>(true);
  const lastSyncTimeRef = useRef<number>(0);
  
  // Synchronisation initiale et lorsque les données utilisateur changent
  useEffect(() => {
    if (!userData) return;
    
    // Pour les nouveaux utilisateurs, toujours maintenir un solde à zéro
    if (isNewUser) {
      setEffectiveBalance(0);
      balanceManager.resetBalance();
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
      balanceManager.initialize(userData.balance);
      firstSyncRef.current = false;
    }
    // Synchronisations ultérieures - comparer avec le serveur mais éviter de réduire le solde local
    else if (userData.balance !== undefined) {
      const currentLocalBalance = balanceManager.getCurrentBalance();
      const serverBalance = userData.balance;
      
      // Ne synchroniser avec le serveur que si le solde serveur est plus élevé
      if (serverBalance > currentLocalBalance) {
        console.log(`Synchronisation du solde avec le serveur: ${serverBalance}€ (local: ${currentLocalBalance}€)`);
        balanceManager.syncWithServer(serverBalance);
      } else {
        console.log(`Solde local plus élevé que serveur, conservation: ${currentLocalBalance}€ (serveur: ${serverBalance}€)`);
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
    
    window.addEventListener('balance:daily-growth', handleDailyGrowth as EventListener);
    return () => window.removeEventListener('balance:daily-growth', handleDailyGrowth as EventListener);
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
    
    // Ne synchroniser avec le serveur que si le solde serveur est plus élevé
    if (userData.balance > currentLocalBalance) {
      console.log(`Synchronisation manuelle du solde avec le serveur: ${userData.balance}€`);
      balanceManager.syncWithServer(userData.balance);
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

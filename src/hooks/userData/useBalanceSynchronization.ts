
import { useState, useEffect, useRef, useCallback } from 'react';
import { UserData } from '@/types/userData';
import balanceManager from '@/utils/balance/balanceManager';
import stableBalance from '@/utils/balance/stableBalance';
import { toast } from '@/components/ui/use-toast';

export const useBalanceSynchronization = (userData: UserData | null, isNewUser: boolean) => {
  // Utiliser stableBalance comme source unique de vérité
  const [effectiveBalance, setEffectiveBalance] = useState(() => {
    return isNewUser ? 0 : stableBalance.getBalance();
  });
  
  const firstSyncRef = useRef<boolean>(true);
  const lastSyncTimeRef = useRef<number>(0);
  
  // Synchronisation initiale et lorsque les données utilisateur changent
  useEffect(() => {
    if (!userData) return;
    
    // Pour les nouveaux utilisateurs, toujours maintenir un solde à zéro
    if (isNewUser) {
      setEffectiveBalance(0);
      balanceManager.forceBalanceSync(0); 
      stableBalance.setBalance(0);
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
      
      // Collecter toutes les sources potentielles de solde
      const sources = [
        balanceManager.getCurrentBalance(),
        stableBalance.getBalance(),
        parseFloat(localStorage.getItem('highest_balance') || '0') || 0,
        parseFloat(localStorage.getItem('currentBalance') || '0') || 0,
        parseFloat(localStorage.getItem('lastKnownBalance') || '0') || 0,
        parseFloat(localStorage.getItem('lastUpdatedBalance') || '0') || 0,
        parseFloat(sessionStorage.getItem('currentBalance') || '0') || 0,
        userData.balance || 0
      ];
      
      // Filtrer les valeurs NaN et trouver le maximum
      const validSources = sources.filter(val => !isNaN(val) && val >= 0);
      const maxBalance = validSources.length > 0 ? Math.max(...validSources) : 0;
      
      // Utiliser le solde le plus élevé parmi toutes les sources
      console.log(`Utilisation du solde maximum ${maxBalance.toFixed(2)}€ parmi toutes les sources`);
      
      // Synchroniser tous les systèmes de gestion du solde
      balanceManager.forceBalanceSync(maxBalance);
      stableBalance.setBalance(maxBalance);
      
      // Mettre à jour toutes les sources de stockage pour cohérence
      localStorage.setItem('lastKnownBalance', maxBalance.toString());
      localStorage.setItem('currentBalance', maxBalance.toString());
      localStorage.setItem('lastUpdatedBalance', maxBalance.toString());
      localStorage.setItem('highest_balance', maxBalance.toString());
      sessionStorage.setItem('currentBalance', maxBalance.toString());
      
      // Mettre à jour l'état local
      setEffectiveBalance(maxBalance);
      firstSyncRef.current = false;
    }
    // Synchronisations ultérieures
    else if (userData.balance !== undefined) {
      // Utiliser le système de solde stable
      const stableValue = stableBalance.getBalance();
      const serverBalance = userData.balance !== null && !isNaN(userData.balance) ? userData.balance : 0;
      
      // Prendre le maximum entre le solde serveur et le solde stable
      const maxBalance = Math.max(serverBalance, stableValue);
      
      // Si le solde a changé, mettre à jour tous les systèmes
      if (maxBalance !== effectiveBalance) {
        console.log(`Mise à jour du solde: ${effectiveBalance} → ${maxBalance}`);
        
        // Mettre à jour tous les systèmes de gestion du solde
        balanceManager.forceBalanceSync(maxBalance);
        stableBalance.setBalance(maxBalance);
        
        // Mettre à jour toutes les sources de stockage pour cohérence
        localStorage.setItem('lastKnownBalance', maxBalance.toString());
        localStorage.setItem('currentBalance', maxBalance.toString());
        localStorage.setItem('lastUpdatedBalance', maxBalance.toString());
        localStorage.setItem('highest_balance', maxBalance.toString());
        sessionStorage.setItem('currentBalance', maxBalance.toString());
        
        // Mettre à jour l'état local
        setEffectiveBalance(maxBalance);
      }
    }
  }, [userData, isNewUser, effectiveBalance]);
  
  // Écouter les modifications du solde stable
  useEffect(() => {
    const unsubscribe = stableBalance.addListener((newBalance) => {
      if (!isNewUser && newBalance !== effectiveBalance) {
        setEffectiveBalance(newBalance);
      }
    });
    
    return unsubscribe;
  }, [isNewUser, effectiveBalance]);
  
  // Fonction de synchronisation manuelle
  const syncBalance = useCallback(() => {
    if (isNewUser) {
      setEffectiveBalance(0);
      return;
    }
    
    // Forcer une actualisation du solde à partir de toutes les sources
    const sources = [
      stableBalance.getBalance(),
      balanceManager.getCurrentBalance(),
      parseFloat(localStorage.getItem('highest_balance') || '0') || 0,
      parseFloat(localStorage.getItem('currentBalance') || '0') || 0,
      parseFloat(localStorage.getItem('lastKnownBalance') || '0') || 0,
      userData?.balance || 0
    ];
    
    // Filtrer les valeurs NaN et trouver le maximum
    const validSources = sources.filter(val => !isNaN(val) && val >= 0);
    const maxBalance = validSources.length > 0 ? Math.max(...validSources) : 0;
    
    console.log(`Synchronisation manuelle du solde: ${maxBalance.toFixed(2)}€`);
    
    // Mettre à jour tous les systèmes
    balanceManager.forceBalanceSync(maxBalance);
    stableBalance.setBalance(maxBalance);
    setEffectiveBalance(maxBalance);
    
    // Mettre à jour toutes les sources de stockage
    localStorage.setItem('lastKnownBalance', maxBalance.toString());
    localStorage.setItem('currentBalance', maxBalance.toString());
    localStorage.setItem('lastUpdatedBalance', maxBalance.toString());
    localStorage.setItem('highest_balance', maxBalance.toString());
    sessionStorage.setItem('currentBalance', maxBalance.toString());
    
  }, [userData, isNewUser]);
  
  return {
    effectiveBalance,
    syncBalance
  };
};

export default useBalanceSynchronization;

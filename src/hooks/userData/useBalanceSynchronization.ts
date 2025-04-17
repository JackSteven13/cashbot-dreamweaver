
import { useState, useEffect, useRef, useCallback } from 'react';
import { UserData } from '@/types/userData';
import balanceManager from '@/utils/balance/balanceManager';

export const useBalanceSynchronization = (userData: UserData | null, isNewUser: boolean) => {
  // Utiliser balanceManager comme source unique de vérité
  const [effectiveBalance, setEffectiveBalance] = useState(() => balanceManager.getStableBalance());
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
    // Synchronisations ultérieures - comparer avec le serveur
    else if (userData.balance !== undefined) {
      console.log(`Synchronisation du solde avec le serveur: ${userData.balance}€`);
      balanceManager.syncWithServer(userData.balance);
    }
    
    // Toujours mettre à jour l'état local avec le solde stable
    const stableBalance = balanceManager.getStableBalance();
    setEffectiveBalance(stableBalance);
  }, [userData, isNewUser]);
  
  // S'abonner aux changements de solde via balanceManager
  useEffect(() => {
    const unsubscribe = balanceManager.addWatcher((newBalance) => {
      setEffectiveBalance(newBalance);
    });
    
    return unsubscribe;
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
    
    // Synchroniser avec le serveur
    balanceManager.syncWithServer(userData.balance);
    
    // Mettre à jour l'état local
    const stableBalance = balanceManager.getStableBalance();
    setEffectiveBalance(stableBalance);
  }, [userData, isNewUser]);
  
  return {
    effectiveBalance,
    syncBalance
  };
};

export default useBalanceSynchronization;

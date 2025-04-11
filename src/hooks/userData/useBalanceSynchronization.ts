
import { useState, useEffect } from 'react';
import { UserData } from '@/types/userData';
import { getHighestBalance } from '@/utils/balance/balanceManager';

export const useBalanceSynchronization = (userData: UserData | null, isNewUser: boolean) => {
  const [effectiveBalance, setEffectiveBalance] = useState(0);
  
  useEffect(() => {
    if (!userData) {
      setEffectiveBalance(0);
      return;
    }
    
    // Pour un nouvel utilisateur, toujours montrer 0
    if (isNewUser) {
      setEffectiveBalance(0);
      return;
    }
    
    // Déterminer le solde le plus élevé entre toutes les sources possibles
    const highestBalance = getHighestBalance();
    const localStorageBalance = localStorage.getItem('currentBalance');
    const apiBalance = userData.balance || 0;
    
    const calculatedBalance = Math.max(
      apiBalance,
      highestBalance || 0,
      localStorageBalance ? parseFloat(localStorageBalance) : 0
    );
    
    setEffectiveBalance(calculatedBalance);
    
    // Écouter les événements de mise à jour de solde
    const handleBalanceUpdate = (event: CustomEvent) => {
      const newBalance = event.detail?.newBalance;
      if (typeof newBalance === 'number' && !isNaN(newBalance)) {
        setEffectiveBalance(newBalance);
      }
    };
    
    window.addEventListener('balance:force-update' as any, handleBalanceUpdate);
    window.addEventListener('balance:force-sync' as any, handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balance:force-update' as any, handleBalanceUpdate);
      window.removeEventListener('balance:force-sync' as any, handleBalanceUpdate);
    };
  }, [userData, isNewUser, userData?.balance]);
  
  return { effectiveBalance };
};

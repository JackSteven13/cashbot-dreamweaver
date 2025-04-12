
import { useState, useEffect, useRef } from 'react';
import { UserData } from '@/types/userData';
import { getHighestBalance } from '@/utils/balance/balanceManager';

export const useBalanceSynchronization = (userData: UserData | null, isNewUser: boolean) => {
  const [effectiveBalance, setEffectiveBalance] = useState(0);
  const localBalanceRef = useRef<number>(0);
  const highestBalanceRef = useRef<number>(0);
  
  // Synchroniser les balances lors du chargement initial et des changements
  useEffect(() => {
    if (isNewUser) {
      setEffectiveBalance(0);
      return;
    }
    
    if (userData) {
      const highestBalance = getHighestBalance();
      const apiBalance = userData.balance || 0;
      const storedBalance = parseFloat(localStorage.getItem('currentBalance') || '0');
      
      // Utiliser le solde maximum entre toutes les sources
      const maxBalance = Math.max(
        highestBalance,
        apiBalance,
        storedBalance,
        localBalanceRef.current
      );
      
      setEffectiveBalance(maxBalance);
      localBalanceRef.current = maxBalance;
      highestBalanceRef.current = maxBalance;
      
      // Synchroniser avec localStorage
      localStorage.setItem('currentBalance', maxBalance.toString());
      localStorage.setItem('highestBalance', maxBalance.toString());
    }
  }, [userData, isNewUser]);
  
  // Écouter les événements de mise à jour externe du solde
  useEffect(() => {
    const handleForceUpdate = (event: CustomEvent) => {
      const newBalance = event.detail?.newBalance;
      if (typeof newBalance === 'number') {
        setEffectiveBalance(newBalance);
        localBalanceRef.current = newBalance;
      }
    };
    
    const handleForceSync = (event: CustomEvent) => {
      const balance = event.detail?.balance;
      if (typeof balance === 'number') {
        setEffectiveBalance(balance);
        localBalanceRef.current = balance;
      }
    };
    
    // Enregistrer les gestionnaires d'événements
    window.addEventListener('balance:force-update' as any, handleForceUpdate);
    window.addEventListener('balance:force-sync' as any, handleForceSync);
    
    return () => {
      window.removeEventListener('balance:force-update' as any, handleForceUpdate);
      window.removeEventListener('balance:force-sync' as any, handleForceSync);
    };
  }, []);
  
  return {
    effectiveBalance
  };
};

export default useBalanceSynchronization;

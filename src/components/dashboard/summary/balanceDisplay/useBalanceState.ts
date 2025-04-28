
import { useState, useRef, useEffect } from 'react';
import balanceManager from '@/utils/balance/balanceManager';
import { UseBalanceStateResult } from './types';
import { useAuth } from '@/hooks/useAuth';

export const useBalanceState = (initialBalance: number): UseBalanceStateResult => {
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';
  
  // Définir l'ID utilisateur dans le balanceManager
  useEffect(() => {
    if (user?.id) {
      balanceManager.setUserId(user.id);
    }
  }, [user?.id]);
  
  const [displayedBalance, setDisplayedBalance] = useState(() => {
    const managerBalance = balanceManager.getCurrentBalance();
    const safeManagerBalance = isNaN(managerBalance) ? 0 : managerBalance;
    
    // Utiliser une clé spécifique à l'utilisateur pour le stockage local
    const localStorageKey = `lastKnownBalance_${userId}`;
    const storedBalance = localStorage.getItem(localStorageKey);
    const parsedStoredBalance = storedBalance ? parseFloat(storedBalance) : 0;
    
    return Math.max(safeManagerBalance, parsedStoredBalance, initialBalance, 0);
  });
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousBalance, setPreviousBalance] = useState<number | null>(null);
  const [gain, setGain] = useState<number | null>(null);
  
  const balanceRef = useRef<HTMLDivElement>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const forceUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateDebounceTime = 2000;
  
  // Suivre les mises à jour de solde via balanceManager
  useEffect(() => {
    const handleBalanceUpdate = () => {
      const currentBalance = balanceManager.getCurrentBalance();
      if (!isNaN(currentBalance) && Math.abs(currentBalance - displayedBalance) > 0.01) {
        console.log(`useBalanceState: Mise à jour du solde depuis balanceManager: ${displayedBalance.toFixed(2)} -> ${currentBalance.toFixed(2)}`);
        setPreviousBalance(displayedBalance);
        setDisplayedBalance(currentBalance);
        setIsAnimating(true);
        
        // Stocker la valeur pour persistence
        localStorage.setItem(`lastKnownBalance_${userId}`, currentBalance.toString());
        
        // Réinitialiser l'animation après un délai
        setTimeout(() => {
          setIsAnimating(false);
        }, 3000);
      }
    };
    
    // S'abonner aux mises à jour du balanceManager
    const unsubscribe = balanceManager.addWatcher(handleBalanceUpdate);
    
    // Écouter les événements de balance:update
    const handleBalanceUpdateEvent = (event: CustomEvent) => {
      if (event.detail && event.detail.amount > 0) {
        // Calculer le nouveau solde
        const newAmount = displayedBalance + event.detail.amount;
        
        console.log(`useBalanceState: Event balance:update reçu, gain: ${event.detail.amount}€, nouveau solde: ${newAmount.toFixed(2)}€`);
        
        // Mettre à jour le solde avec animation
        setPreviousBalance(displayedBalance);
        setDisplayedBalance(newAmount);
        setGain(event.detail.amount);
        setIsAnimating(true);
        
        // Synchroniser avec balanceManager
        balanceManager.forceBalanceSync(newAmount);
        
        // Stocker la valeur pour persistence
        localStorage.setItem(`lastKnownBalance_${userId}`, newAmount.toString());
        
        // Réinitialiser l'animation après un délai
        setTimeout(() => {
          setIsAnimating(false);
          setGain(null);
        }, 3000);
      }
    };
    
    window.addEventListener('balance:update', handleBalanceUpdateEvent as EventListener);
    
    return () => {
      unsubscribe();
      window.removeEventListener('balance:update', handleBalanceUpdateEvent as EventListener);
    };
  }, [displayedBalance, userId]);
  
  // Listen for timestamp updates from events
  useEffect(() => {
    const handleTimestampUpdate = (event: CustomEvent) => {
      if (event.detail?.timestamp && event.detail?.userId === userId) {
        // Just store the timestamp in localStorage instead of trying to modify the ref
        localStorage.setItem(`lastBalanceUpdate_${userId}`, event.detail.timestamp.toString());
      }
    };
    
    window.addEventListener('balance:timestamp-update', handleTimestampUpdate as EventListener);
    
    return () => {
      window.removeEventListener('balance:timestamp-update', handleTimestampUpdate as EventListener);
    };
  }, [userId]);

  return {
    state: {
      displayedBalance,
      isAnimating,
      previousBalance,
      gain
    },
    refs: {
      balanceRef,
      lastUpdateTimeRef,
      forceUpdateTimeoutRef
    },
    setters: {
      setDisplayedBalance,
      setIsAnimating,
      setPreviousBalance,
      setGain
    },
    constants: {
      updateDebounceTime
    }
  };
};

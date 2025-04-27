
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

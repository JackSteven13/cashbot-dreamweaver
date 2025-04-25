
import { useState, useRef, useEffect } from 'react';
import balanceManager from '@/utils/balance/balanceManager';
import { UseBalanceStateResult } from './types';

export const useBalanceState = (initialBalance: number): UseBalanceStateResult => {
  const [displayedBalance, setDisplayedBalance] = useState(() => {
    const managerBalance = balanceManager.getCurrentBalance();
    const safeManagerBalance = isNaN(managerBalance) ? 0 : managerBalance;
    return Math.max(safeManagerBalance, initialBalance, 0);
  });
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousBalance, setPreviousBalance] = useState<number | null>(null);
  const [gain, setGain] = useState<number | null>(null);
  
  const balanceRef = useRef<HTMLDivElement>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const forceUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateDebounceTime = 2000;

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

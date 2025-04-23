
import { useEffect } from 'react';
import balanceManager from '@/utils/balance/balanceManager';
import { BalanceEventDetail } from './types';

export const useBalanceEvents = (
  displayedBalance: number,
  setters: {
    setDisplayedBalance: (value: number) => void;
    setPreviousBalance: (value: number | null) => void;
    setIsAnimating: (value: boolean) => void;
    setGain: (value: number | null) => void;
  },
  refs: {
    lastUpdateTimeRef: React.RefObject<number>;
    forceUpdateTimeoutRef: React.RefObject<NodeJS.Timeout | null>;
  },
  updateDebounceTime: number
) => {
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent<BalanceEventDetail>) => {
      const now = Date.now();
      if (now - refs.lastUpdateTimeRef.current < updateDebounceTime) {
        if (refs.forceUpdateTimeoutRef.current) {
          clearTimeout(refs.forceUpdateTimeoutRef.current);
        }
        
        refs.forceUpdateTimeoutRef.current = setTimeout(() => {
          processBalanceUpdate(event);
        }, updateDebounceTime);
        return;
      }
      
      processBalanceUpdate(event);
    };

    const processBalanceUpdate = (event: CustomEvent<BalanceEventDetail>) => {
      const newBalance = event.detail?.newBalance || event.detail?.currentBalance;
      const gain = event.detail?.gain || event.detail?.amount;
      const shouldAnimate = event.detail?.animate === true;
      const oldBalanceFromEvent = event.detail?.oldBalance;
      
      if (typeof gain === 'number' && gain > 0) {
        const oldBalance = oldBalanceFromEvent !== undefined ? oldBalanceFromEvent : displayedBalance;
        const calculatedNewBalance = parseFloat((oldBalance + gain).toFixed(2));
        
        balanceManager.updateBalance(gain);
        balanceManager.forceBalanceSync(calculatedNewBalance);
        
        setters.setPreviousBalance(oldBalance);
        setters.setDisplayedBalance(calculatedNewBalance);
        setters.setIsAnimating(shouldAnimate !== false);
        setters.setGain(gain);
        
        localStorage.setItem('currentBalance', calculatedNewBalance.toString());
        localStorage.setItem('lastKnownBalance', calculatedNewBalance.toString());
        
        refs.lastUpdateTimeRef.current = now;
        
        if (shouldAnimate !== false) {
          setTimeout(() => setters.setIsAnimating(false), 2500);
        }
      }
      else if (typeof newBalance === 'number' && newBalance > 0 && 
          Math.abs(newBalance - displayedBalance) > 0.001) {
        const implicitGain = Math.max(0, newBalance - displayedBalance);
        
        balanceManager.forceBalanceSync(newBalance);
        
        setters.setPreviousBalance(displayedBalance);
        setters.setDisplayedBalance(newBalance);
        setters.setIsAnimating(shouldAnimate !== false && implicitGain > 0);
        
        if (implicitGain > 0) {
          setters.setGain(implicitGain);
        }
        
        localStorage.setItem('currentBalance', newBalance.toString());
        localStorage.setItem('lastKnownBalance', newBalance.toString());
        
        refs.lastUpdateTimeRef.current = now;
        
        if (shouldAnimate !== false && implicitGain > 0) {
          setTimeout(() => setters.setIsAnimating(false), 2500);
        }
      }
    };

    window.addEventListener('balance:update', handleBalanceUpdate as EventListener);
    window.addEventListener('balance:force-update', handleBalanceUpdate as EventListener);
    window.addEventListener('dashboard:micro-gain', handleBalanceUpdate as EventListener);
    
    return () => {
      window.removeEventListener('balance:update', handleBalanceUpdate as EventListener);
      window.removeEventListener('balance:force-update', handleBalanceUpdate as EventListener);
      window.removeEventListener('dashboard:micro-gain', handleBalanceUpdate as EventListener);
    };
  }, [displayedBalance, setters, refs, updateDebounceTime]);
};

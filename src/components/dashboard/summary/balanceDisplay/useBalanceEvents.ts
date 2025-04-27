
import { useEffect } from 'react';
import balanceManager from '@/utils/balance/balanceManager';
import { BalanceEventDetail, BalanceSetters, BalanceRefs } from './types';

export const useBalanceEvents = ({
  displayedBalance,
  setters,
  refs,
  updateDebounceTime
}: {
  displayedBalance: number;
  setters: BalanceSetters;
  refs: BalanceRefs;
  updateDebounceTime: number;
}) => {
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent<BalanceEventDetail>) => {
      const currentTime = Date.now();
      if (currentTime - refs.lastUpdateTimeRef.current < updateDebounceTime) {
        // Clear existing timeout before creating a new one
        if (refs.forceUpdateTimeoutRef.current !== null) {
          clearTimeout(refs.forceUpdateTimeoutRef.current);
        }
        
        // Set new timeout and store the reference
        refs.forceUpdateTimeoutRef.current = setTimeout(() => {
          processBalanceUpdate(event);
          // Clear the reference after execution
          refs.forceUpdateTimeoutRef.current = null;
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
      const currentTime = Date.now();
      
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
        
        // Update ref directly
        refs.lastUpdateTimeRef.current = currentTime;
        
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
        
        // Update ref directly
        refs.lastUpdateTimeRef.current = currentTime;
        
        if (shouldAnimate !== false && implicitGain > 0) {
          setTimeout(() => setters.setIsAnimating(false), 2500);
        }
      }
    };

    window.addEventListener('balance:update', handleBalanceUpdate as EventListener);
    window.addEventListener('balance:force-update', handleBalanceUpdate as EventListener);
    window.addEventListener('dashboard:micro-gain', handleBalanceUpdate as EventListener);
    
    // Cleanup event listeners and any active timeouts
    return () => {
      window.removeEventListener('balance:update', handleBalanceUpdate as EventListener);
      window.removeEventListener('balance:force-update', handleBalanceUpdate as EventListener);
      window.removeEventListener('dashboard:micro-gain', handleBalanceUpdate as EventListener);
      
      // Clear any pending timeout when component unmounts
      if (refs.forceUpdateTimeoutRef.current !== null) {
        clearTimeout(refs.forceUpdateTimeoutRef.current);
      }
    };
  }, [displayedBalance, setters, refs, updateDebounceTime]);
};

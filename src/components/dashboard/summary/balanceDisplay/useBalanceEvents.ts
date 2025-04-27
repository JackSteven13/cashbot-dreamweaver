
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
      
      // Avoid processing updates too frequently
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
      
      // Update with gain (positive value)
      if (typeof gain === 'number' && gain > 0) {
        const oldBalance = oldBalanceFromEvent !== undefined ? oldBalanceFromEvent : displayedBalance;
        const calculatedNewBalance = parseFloat((oldBalance + gain).toFixed(2));
        
        // Update balance manager
        balanceManager.updateBalance(gain);
        balanceManager.forceBalanceSync(calculatedNewBalance);
        
        // Batch state updates to prevent multiple renders
        const batchedUpdates = () => {
          setters.setPreviousBalance(oldBalance);
          setters.setDisplayedBalance(calculatedNewBalance);
          setters.setGain(gain);
          
          // Animation should be a separate update to avoid render loops
          if (shouldAnimate !== false) {
            setters.setIsAnimating(true);
            setTimeout(() => setters.setIsAnimating(false), 2500);
          }
        };
        
        // Execute updates
        batchedUpdates();
        
        // Store in localStorage
        localStorage.setItem('currentBalance', calculatedNewBalance.toString());
        localStorage.setItem('lastKnownBalance', calculatedNewBalance.toString());
        
        // Update ref directly without triggering renders
        refs.lastUpdateTimeRef.current = currentTime;
      }
      // Direct balance update
      else if (typeof newBalance === 'number' && newBalance > 0 && 
          Math.abs(newBalance - displayedBalance) > 0.001) {
        const implicitGain = Math.max(0, newBalance - displayedBalance);
        
        // Update balance manager
        balanceManager.forceBalanceSync(newBalance);
        
        // Batch state updates
        const batchedUpdates = () => {
          setters.setPreviousBalance(displayedBalance);
          setters.setDisplayedBalance(newBalance);
          
          if (implicitGain > 0) {
            setters.setGain(implicitGain);
          }
          
          // Animation should be a separate update
          if (shouldAnimate !== false && implicitGain > 0) {
            setters.setIsAnimating(true);
            setTimeout(() => setters.setIsAnimating(false), 2500);
          }
        };
        
        // Execute updates
        batchedUpdates();
        
        // Store in localStorage
        localStorage.setItem('currentBalance', newBalance.toString());
        localStorage.setItem('lastKnownBalance', newBalance.toString());
        
        // Update ref directly
        refs.lastUpdateTimeRef.current = currentTime;
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
        refs.forceUpdateTimeoutRef.current = null;
      }
    };
  }, [displayedBalance, setters, refs, updateDebounceTime]);
};

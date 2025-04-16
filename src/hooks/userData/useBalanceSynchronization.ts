
import { useState, useEffect, useRef, useCallback } from 'react';
import { UserData } from '@/types/userData';
import balanceManager from '@/utils/balance/balanceManager';

export const useBalanceSynchronization = (userData: UserData | null, isNewUser: boolean) => {
  const [effectiveBalance, setEffectiveBalance] = useState(0);
  const localBalanceRef = useRef<number>(0);
  const highestBalanceRef = useRef<number>(0);
  const lastSyncTimeRef = useRef<number>(0);
  
  // Function to sync balance from multiple sources
  const syncBalance = useCallback(() => {
    if (isNewUser) {
      setEffectiveBalance(0);
      return;
    }
    
    if (!userData) return;
    
    // Get current time
    const now = Date.now();
    
    // Don't sync too frequently
    if (now - lastSyncTimeRef.current < 2000) return;
    lastSyncTimeRef.current = now;
    
    // Get balances from different sources
    const apiBalance = userData.balance || 0;
    const storedBalance = parseFloat(localStorage.getItem('currentBalance') || '0');
    const highestBalance = balanceManager.getHighestBalance();
    
    // Use the highest balance from all sources
    const maxBalance = Math.max(
      highestBalance,
      apiBalance,
      storedBalance,
      localBalanceRef.current
    );
    
    // Update state if there's a significant change
    if (Math.abs(maxBalance - effectiveBalance) > 0.01) {
      setEffectiveBalance(maxBalance);
      
      // Update local refs
      localBalanceRef.current = maxBalance;
      highestBalanceRef.current = maxBalance;
      
      // Update balance manager and localStorage
      balanceManager.forceBalanceSync(maxBalance);
    }
  }, [userData, isNewUser, effectiveBalance]);
  
  // Initial synchronization
  useEffect(() => {
    syncBalance();
    
    // Sync on interval
    const syncInterval = setInterval(syncBalance, 15000);
    return () => clearInterval(syncInterval);
  }, [userData, syncBalance]);
  
  // Listen for external balance update events
  useEffect(() => {
    const handleForceUpdate = (event: CustomEvent) => {
      const newBalance = event.detail?.newBalance;
      if (typeof newBalance === 'number' && newBalance > 0) {
        setEffectiveBalance(newBalance);
        localBalanceRef.current = newBalance;
        
        // Also sync with balance manager
        balanceManager.forceBalanceSync(newBalance);
      }
    };
    
    const handleBalanceUpdated = (event: CustomEvent) => {
      const currentBalance = event.detail?.currentBalance;
      if (typeof currentBalance === 'number' && currentBalance > 0) {
        setEffectiveBalance(currentBalance);
        localBalanceRef.current = currentBalance;
      }
    };
    
    // Register event handlers
    window.addEventListener('balance:force-update' as any, handleForceUpdate);
    window.addEventListener('balance:updated' as any, handleBalanceUpdated);
    window.addEventListener('balance:force-sync' as any, handleForceUpdate);
    
    return () => {
      window.removeEventListener('balance:force-update' as any, handleForceUpdate);
      window.removeEventListener('balance:updated' as any, handleBalanceUpdated);
      window.removeEventListener('balance:force-sync' as any, handleForceUpdate);
    };
  }, []);
  
  return {
    effectiveBalance,
    syncBalance
  };
};

export default useBalanceSynchronization;

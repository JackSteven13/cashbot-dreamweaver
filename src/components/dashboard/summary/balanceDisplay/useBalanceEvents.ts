
import { useEffect } from 'react';
import balanceManager from '@/utils/balance/balanceManager';
import { BalanceEventDetail, BalanceSetters, BalanceRefs } from './types';
import { useAuth } from '@/hooks/useAuth';

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
  // Obtenir l'ID utilisateur actuel
  const { user } = useAuth();
  const userId = user?.id || null;
  
  useEffect(() => {
    // Définir l'ID utilisateur dans le gestionnaire de solde
    if (userId) {
      balanceManager.setUserId(userId);
    }
    
    const handleBalanceUpdate = (event: CustomEvent<BalanceEventDetail>) => {
      // Vérifier si l'événement est destiné à cet utilisateur
      const eventUserId = event.detail?.userId;
      if (eventUserId && userId && eventUserId !== userId) {
        // Ignorer les événements destinés à d'autres utilisateurs
        return;
      }
      
      const currentTime = Date.now();
      if (currentTime - (refs.lastUpdateTimeRef.current || 0) < updateDebounceTime) {
        if (refs.forceUpdateTimeoutRef.current) {
          clearTimeout(refs.forceUpdateTimeoutRef.current);
        }
        
        const timeoutId = setTimeout(() => {
          processBalanceUpdate(event);
        }, updateDebounceTime);
        
        refs.forceUpdateTimeoutRef.current = timeoutId;
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
        balanceManager.forceBalanceSync(calculatedNewBalance, userId || undefined);
        
        setters.setPreviousBalance(oldBalance);
        setters.setDisplayedBalance(calculatedNewBalance);
        setters.setIsAnimating(shouldAnimate !== false);
        setters.setGain(gain);
        
        // Utiliser une clé spécifique à l'utilisateur
        if (userId) {
          localStorage.setItem(`currentBalance_${userId}`, calculatedNewBalance.toString());
          localStorage.setItem(`lastKnownBalance_${userId}`, calculatedNewBalance.toString());
        }
        
        if (refs.lastUpdateTimeRef) {
          refs.lastUpdateTimeRef.current = currentTime;
        }
        
        if (shouldAnimate !== false) {
          setTimeout(() => setters.setIsAnimating(false), 2500);
        }
      }
      else if (typeof newBalance === 'number' && newBalance > 0 && 
          Math.abs(newBalance - displayedBalance) > 0.001) {
        const implicitGain = Math.max(0, newBalance - displayedBalance);
        
        balanceManager.forceBalanceSync(newBalance, userId || undefined);
        
        setters.setPreviousBalance(displayedBalance);
        setters.setDisplayedBalance(newBalance);
        setters.setIsAnimating(shouldAnimate !== false && implicitGain > 0);
        
        if (implicitGain > 0) {
          setters.setGain(implicitGain);
        }
        
        // Utiliser une clé spécifique à l'utilisateur
        if (userId) {
          localStorage.setItem(`currentBalance_${userId}`, newBalance.toString());
          localStorage.setItem(`lastKnownBalance_${userId}`, newBalance.toString());
        }
        
        if (refs.lastUpdateTimeRef) {
          refs.lastUpdateTimeRef.current = currentTime;
        }
        
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
  }, [displayedBalance, setters, refs, updateDebounceTime, userId]);
};

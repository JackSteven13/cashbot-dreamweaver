
import { useState, useEffect, useRef } from 'react';
import balanceManager from '@/utils/balance/balanceManager';

interface UseLocalBalanceProps {
  initialBalance: number;
  userId: string;
}

interface UseLocalBalanceResult {
  localBalance: number;
  updateLocalBalance: (newBalance: number) => void;
  addToLocalBalance: (amount: number) => void;
  getPersistedBalance: () => number;
}

/**
 * Hook pour gérer le solde local avec persistance entre les sessions
 */
export const useLocalBalance = ({ initialBalance, userId }: UseLocalBalanceProps): UseLocalBalanceResult => {
  // Utiliser une fonction pour récupérer le solde persisté de façon fiable
  const getPersistedBalance = (): number => {
    if (!userId) {
      console.warn('No userId provided to useLocalBalance');
      return initialBalance;
    }
    
    // D'abord, vérifier si balanceManager a déjà une valeur
    const managerBalance = balanceManager.getCurrentBalance();
    if (managerBalance > 0) {
      return managerBalance;
    }
    
    // Utiliser UNIQUEMENT des clés spécifiques à l'utilisateur
    const userBalanceKey = `user_balance_${userId}`;
    const userHighestBalanceKey = `highest_balance_${userId}`;
    const userLastKnownBalanceKey = `last_balance_${userId}`;
    
    const sources = [
      localStorage.getItem(userBalanceKey),
      localStorage.getItem(userHighestBalanceKey),
      localStorage.getItem(userLastKnownBalanceKey),
      localStorage.getItem('currentBalance'),
      localStorage.getItem('lastKnownBalance'),
    ];
    
    // Trouver la valeur maximale parmi toutes les sources (y compris initialBalance)
    let highestValue = initialBalance;
    
    for (const source of sources) {
      if (source) {
        try {
          const parsedValue = parseFloat(source);
          if (!isNaN(parsedValue) && parsedValue > highestValue) {
            highestValue = parsedValue;
          }
        } catch (e) {
          console.error("Failed to parse stored balance:", e);
        }
      }
    }
    
    // Toujours enregistrer la valeur déterminée dans les clés spécifiques à l'utilisateur
    if (userId) {
      try {
        localStorage.setItem(userBalanceKey, highestValue.toString());
        localStorage.setItem(userHighestBalanceKey, highestValue.toString());
        localStorage.setItem(userLastKnownBalanceKey, highestValue.toString());
        localStorage.setItem('currentBalance', highestValue.toString());
        localStorage.setItem('lastKnownBalance', highestValue.toString());
        
        // Synchroniser avec balanceManager
        balanceManager.forceBalanceSync(highestValue, userId);
      } catch (e) {
        console.error("Failed to persist initial balance:", e);
      }
    }
    
    return highestValue;
  };
  
  // État local pour le solde avec initialisation améliorée
  const [localBalance, setLocalBalance] = useState<number>(() => getPersistedBalance());
  const previousBalanceRef = useRef<number>(getPersistedBalance());
  const isInitializedRef = useRef<boolean>(false);
  
  // Assurer la persistance initiale
  useEffect(() => {
    if (!isInitializedRef.current && userId) {
      const currentValue = getPersistedBalance();
      setLocalBalance(currentValue);
      previousBalanceRef.current = currentValue;
      isInitializedRef.current = true;
      
      // Synchroniser avec balanceManager
      balanceManager.forceBalanceSync(currentValue, userId);
      
      console.log(`[useLocalBalance] Initialized with persisted balance for user ${userId}: ${currentValue}`);
    }
  }, [userId]);
  
  // Ajouter un watcher à balanceManager
  useEffect(() => {
    if (!userId) return;
    
    const unsubscribe = balanceManager.addWatcher((newBalance) => {
      if (newBalance !== localBalance) {
        setLocalBalance(newBalance);
        previousBalanceRef.current = newBalance;
      }
    });
    
    return unsubscribe;
  }, [userId, localBalance]);
  
  // Mettre à jour le localStorage quand le solde change
  useEffect(() => {
    // Ne sauvegarder que si le solde est différent de la valeur précédente et que l'utilisateur est identifié
    if (localBalance !== previousBalanceRef.current && userId) {
      console.log(`[useLocalBalance] Updating persisted balance for user ${userId} from ${previousBalanceRef.current} to ${localBalance}`);
      
      const userBalanceKey = `user_balance_${userId}`;
      const userHighestBalanceKey = `highest_balance_${userId}`;
      const userLastKnownBalanceKey = `last_balance_${userId}`;
      
      localStorage.setItem(userBalanceKey, localBalance.toString());
      localStorage.setItem(userHighestBalanceKey, localBalance.toString());
      localStorage.setItem(userLastKnownBalanceKey, localBalance.toString());
      localStorage.setItem('currentBalance', localBalance.toString());
      localStorage.setItem('lastKnownBalance', localBalance.toString());
      
      previousBalanceRef.current = localBalance;
      
      // Synchroniser avec balanceManager
      balanceManager.forceBalanceSync(localBalance, userId);
      
      // Informer les autres composants du changement avec l'ID utilisateur
      window.dispatchEvent(new CustomEvent('balance:local-update', {
        detail: { balance: localBalance, userId }
      }));
      
      // Déclencher également un rafraîchissement des transactions
      window.dispatchEvent(new CustomEvent('transactions:refresh', {
        detail: { timestamp: Date.now(), forceRefresh: true }
      }));
    }
  }, [localBalance, userId]);
  
  // Écouter les événements de mise à jour de solde
  useEffect(() => {
    if (!userId) return; // Ne pas écouter les événements si l'utilisateur n'est pas identifié
    
    // Écouter les mises à jour forcées avec valeur complète
    const handleForceUpdate = (event: CustomEvent) => {
      const newBalance = event.detail?.newBalance;
      const eventUserId = event.detail?.userId;
      
      // Ne traiter que les événements pour cet utilisateur ou sans userId spécifié
      if (eventUserId && eventUserId !== userId) return;
      
      if (typeof newBalance === 'number' && newBalance >= 0) {
        console.log(`[useLocalBalance] Force update balance for user ${userId} from ${localBalance} to ${newBalance}`);
        setLocalBalance(newBalance);
        previousBalanceRef.current = newBalance;
        
        // Aussi persister immédiatement pour éviter toute perte
        const userBalanceKey = `user_balance_${userId}`;
        const userHighestBalanceKey = `highest_balance_${userId}`;
        const userLastKnownBalanceKey = `last_balance_${userId}`;
        
        localStorage.setItem(userBalanceKey, newBalance.toString());
        localStorage.setItem(userHighestBalanceKey, newBalance.toString());
        localStorage.setItem(userLastKnownBalanceKey, newBalance.toString());
        localStorage.setItem('currentBalance', newBalance.toString());
        localStorage.setItem('lastKnownBalance', newBalance.toString());
        
        // Déclencher également un rafraîchissement des transactions
        window.dispatchEvent(new CustomEvent('transactions:refresh', {
          detail: { timestamp: Date.now(), forceRefresh: true }
        }));
      }
    };
    
    // Écouter les mises à jour incrémentielles
    const handleBalanceUpdate = (event: CustomEvent) => {
      const amount = event.detail?.gain;
      const currentBalance = event.detail?.newBalance;
      const eventUserId = event.detail?.userId;
      
      // Ne traiter que les événements pour cet utilisateur ou sans userId spécifié
      if (eventUserId && eventUserId !== userId) return;
      
      if (typeof currentBalance === 'number' && currentBalance >= 0) {
        // Si un solde complet est fourni, l'utiliser
        console.log(`[useLocalBalance] Update balance for user ${userId} with full value: ${currentBalance}`);
        setLocalBalance(currentBalance);
        previousBalanceRef.current = currentBalance;
        
        // Persister immédiatement
        const userBalanceKey = `user_balance_${userId}`;
        const userHighestBalanceKey = `highest_balance_${userId}`;
        const userLastKnownBalanceKey = `last_balance_${userId}`;
        
        localStorage.setItem(userBalanceKey, currentBalance.toString());
        localStorage.setItem(userHighestBalanceKey, currentBalance.toString());
        localStorage.setItem(userLastKnownBalanceKey, currentBalance.toString());
        localStorage.setItem('currentBalance', currentBalance.toString());
        localStorage.setItem('lastKnownBalance', currentBalance.toString());
        
        // Déclencher également un rafraîchissement des transactions
        window.dispatchEvent(new CustomEvent('transactions:refresh', {
          detail: { timestamp: Date.now() }
        }));
      } else if (typeof amount === 'number' && amount > 0) {
        // Sinon ajouter le montant au solde actuel
        console.log(`[useLocalBalance] Update balance for user ${userId} with increment: +${amount}`);
        setLocalBalance(prev => {
          const newBalance = parseFloat((prev + amount).toFixed(2));
          
          // Persister immédiatement
          const userBalanceKey = `user_balance_${userId}`;
          const userHighestBalanceKey = `highest_balance_${userId}`;
          const userLastKnownBalanceKey = `last_balance_${userId}`;
          
          localStorage.setItem(userBalanceKey, newBalance.toString());
          localStorage.setItem(userHighestBalanceKey, newBalance.toString());
          localStorage.setItem(userLastKnownBalanceKey, newBalance.toString());
          localStorage.setItem('currentBalance', newBalance.toString());
          localStorage.setItem('lastKnownBalance', newBalance.toString());
          
          // Synchroniser avec balanceManager
          balanceManager.forceBalanceSync(newBalance, userId);
          
          // Déclencher également un rafraîchissement des transactions
          window.dispatchEvent(new CustomEvent('transactions:refresh', {
            detail: { timestamp: Date.now() }
          }));
          
          return newBalance;
        });
      }
    };
    
    window.addEventListener('balance:force-update' as any, handleForceUpdate);
    window.addEventListener('balance:update' as any, handleBalanceUpdate);
    
    // Émettre un événement pour synchroniser le solde au montage
    window.dispatchEvent(new CustomEvent('balance:local-update', {
      detail: { balance: localBalance, userId }
    }));
    
    return () => {
      window.removeEventListener('balance:force-update' as any, handleForceUpdate);
      window.removeEventListener('balance:update' as any, handleBalanceUpdate);
    };
  }, [localBalance, userId]);
  
  // Fonctions pour mettre à jour le solde
  const updateLocalBalance = (newBalance: number) => {
    if (!userId) return;
    
    // Toujours persister immédiatement en localStorage pour éviter les pertes
    const userBalanceKey = `user_balance_${userId}`;
    const userHighestBalanceKey = `highest_balance_${userId}`;
    const userLastKnownBalanceKey = `last_balance_${userId}`;
    
    localStorage.setItem(userBalanceKey, newBalance.toString());
    localStorage.setItem(userHighestBalanceKey, newBalance.toString());
    localStorage.setItem(userLastKnownBalanceKey, newBalance.toString());
    localStorage.setItem('currentBalance', newBalance.toString());
    localStorage.setItem('lastKnownBalance', newBalance.toString());
    
    setLocalBalance(newBalance);
    
    // Synchroniser avec balanceManager
    balanceManager.forceBalanceSync(newBalance, userId);
    
    // Déclencher également un rafraîchissement des transactions
    window.dispatchEvent(new CustomEvent('transactions:refresh', {
      detail: { timestamp: Date.now(), forceRefresh: true }
    }));
  };
  
  const addToLocalBalance = (amount: number) => {
    if (!userId) return;
    
    setLocalBalance(prev => {
      const newBalance = parseFloat((prev + amount).toFixed(2));
      
      // Persister immédiatement en localStorage
      const userBalanceKey = `user_balance_${userId}`;
      const userHighestBalanceKey = `highest_balance_${userId}`;
      const userLastKnownBalanceKey = `last_balance_${userId}`;
      
      localStorage.setItem(userBalanceKey, newBalance.toString());
      localStorage.setItem(userHighestBalanceKey, newBalance.toString());
      localStorage.setItem(userLastKnownBalanceKey, newBalance.toString());
      localStorage.setItem('currentBalance', newBalance.toString());
      localStorage.setItem('lastKnownBalance', newBalance.toString());
      
      // Synchroniser avec balanceManager
      balanceManager.forceBalanceSync(newBalance, userId);
      
      // Déclencher également un rafraîchissement des transactions
      window.dispatchEvent(new CustomEvent('transactions:refresh', {
        detail: { timestamp: Date.now() }
      }));
      
      return newBalance;
    });
  };
  
  return {
    localBalance,
    updateLocalBalance,
    addToLocalBalance,
    getPersistedBalance
  };
};

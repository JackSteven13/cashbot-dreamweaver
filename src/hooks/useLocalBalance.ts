
import { useState, useEffect, useRef } from 'react';

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
    const key = `user_balance_${userId}`;
    const sources = [
      localStorage.getItem(key),
      localStorage.getItem('currentBalance'),
      localStorage.getItem('lastKnownBalance')
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
    
    // Toujours enregistrer la valeur déterminée dans toutes les sources pour cohérence
    try {
      localStorage.setItem(`user_balance_${userId}`, highestValue.toString());
      localStorage.setItem('currentBalance', highestValue.toString());
      localStorage.setItem('lastKnownBalance', highestValue.toString());
    } catch (e) {
      console.error("Failed to persist initial balance:", e);
    }
    
    return highestValue;
  };
  
  // État local pour le solde avec initialisation améliorée
  const [localBalance, setLocalBalance] = useState<number>(() => getPersistedBalance());
  const previousBalanceRef = useRef<number>(getPersistedBalance());
  const isInitializedRef = useRef<boolean>(false);
  
  // Assurer la persistance initiale
  useEffect(() => {
    if (!isInitializedRef.current) {
      const currentValue = getPersistedBalance();
      setLocalBalance(currentValue);
      previousBalanceRef.current = currentValue;
      isInitializedRef.current = true;
      
      // Synchroniser avec une valeur persistée au chargement
      console.log(`[useLocalBalance] Initialized with persisted balance: ${currentValue}`);
    }
  }, [userId]);
  
  // Mettre à jour le localStorage quand le solde change
  useEffect(() => {
    // Ne sauvegarder que si le solde est différent de la valeur précédente
    if (localBalance !== previousBalanceRef.current) {
      console.log(`[useLocalBalance] Updating persisted balance from ${previousBalanceRef.current} to ${localBalance}`);
      
      const key = `user_balance_${userId}`;
      localStorage.setItem(key, localBalance.toString());
      localStorage.setItem('currentBalance', localBalance.toString());
      localStorage.setItem('lastKnownBalance', localBalance.toString());
      
      previousBalanceRef.current = localBalance;
      
      // Informer les autres composants du changement
      window.dispatchEvent(new CustomEvent('balance:local-update', {
        detail: { balance: localBalance, userId }
      }));
    }
  }, [localBalance, userId]);
  
  // Écouter les événements de mise à jour de solde
  useEffect(() => {
    // Écouter les mises à jour forcées avec valeur complète
    const handleForceUpdate = (event: CustomEvent) => {
      const newBalance = event.detail?.newBalance;
      if (typeof newBalance === 'number' && newBalance >= 0) {
        console.log(`[useLocalBalance] Force update balance from ${localBalance} to ${newBalance}`);
        setLocalBalance(newBalance);
        
        // Aussi persister immédiatement pour éviter toute perte
        const key = `user_balance_${userId}`;
        localStorage.setItem(key, newBalance.toString());
        localStorage.setItem('currentBalance', newBalance.toString());
        localStorage.setItem('lastKnownBalance', newBalance.toString());
      }
    };
    
    // Écouter les mises à jour incrémentielles
    const handleBalanceUpdate = (event: CustomEvent) => {
      const amount = event.detail?.amount;
      const currentBalance = event.detail?.currentBalance;
      
      if (typeof currentBalance === 'number' && currentBalance >= 0) {
        // Si un solde complet est fourni, l'utiliser
        console.log(`[useLocalBalance] Update balance with full value: ${currentBalance}`);
        setLocalBalance(currentBalance);
        
        // Persister immédiatement
        const key = `user_balance_${userId}`;
        localStorage.setItem(key, currentBalance.toString());
        localStorage.setItem('currentBalance', currentBalance.toString());
        localStorage.setItem('lastKnownBalance', currentBalance.toString());
      } else if (typeof amount === 'number') {
        // Sinon ajouter le montant au solde actuel
        console.log(`[useLocalBalance] Update balance with increment: +${amount}`);
        setLocalBalance(prev => {
          const newBalance = parseFloat((prev + amount).toFixed(2));
          
          // Persister immédiatement
          const key = `user_balance_${userId}`;
          localStorage.setItem(key, newBalance.toString());
          localStorage.setItem('currentBalance', newBalance.toString());
          localStorage.setItem('lastKnownBalance', newBalance.toString());
          
          return newBalance;
        });
      }
    };
    
    // Écouter les événements de synchronisation de solde
    const handleBalanceSync = (event: CustomEvent) => {
      // Vérifier toutes les sources pour prendre la valeur la plus élevée
      const syncedBalance = getPersistedBalance();
      if (syncedBalance > localBalance) {
        console.log(`[useLocalBalance] Syncing to higher balance: ${syncedBalance}`);
        setLocalBalance(syncedBalance);
      }
    };
    
    window.addEventListener('balance:force-update' as any, handleForceUpdate);
    window.addEventListener('balance:update' as any, handleBalanceUpdate);
    window.addEventListener('balance:sync-request' as any, handleBalanceSync);
    
    // Émettre un événement pour synchroniser le solde au montage
    window.dispatchEvent(new CustomEvent('balance:local-update', {
      detail: { balance: localBalance, userId }
    }));
    
    return () => {
      window.removeEventListener('balance:force-update' as any, handleForceUpdate);
      window.removeEventListener('balance:update' as any, handleBalanceUpdate);
      window.removeEventListener('balance:sync-request' as any, handleBalanceSync);
    };
  }, [localBalance, userId]);
  
  // Fonctions pour mettre à jour le solde
  const updateLocalBalance = (newBalance: number) => {
    // Toujours persister immédiatement en localStorage pour éviter les pertes
    const key = `user_balance_${userId}`;
    localStorage.setItem(key, newBalance.toString());
    localStorage.setItem('currentBalance', newBalance.toString());
    localStorage.setItem('lastKnownBalance', newBalance.toString());
    
    setLocalBalance(newBalance);
  };
  
  const addToLocalBalance = (amount: number) => {
    setLocalBalance(prev => {
      const newBalance = parseFloat((prev + amount).toFixed(2));
      
      // Persister immédiatement en localStorage
      const key = `user_balance_${userId}`;
      localStorage.setItem(key, newBalance.toString());
      localStorage.setItem('currentBalance', newBalance.toString());
      localStorage.setItem('lastKnownBalance', newBalance.toString());
      
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

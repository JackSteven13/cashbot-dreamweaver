
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
  // Utiliser localStorage pour le solde persisté avec une meilleure récupération
  const getInitialState = () => {
    const key = `user_balance_${userId}`;
    const storedValue = localStorage.getItem(key);
    const currentBalanceValue = localStorage.getItem('currentBalance');
    const lastKnownBalanceValue = localStorage.getItem('lastKnownBalance');
    
    // Utiliser la valeur la plus élevée entre toutes les sources pour éviter les pertes
    let highestValue = initialBalance;
    
    if (storedValue) {
      const parsedValue = parseFloat(storedValue);
      if (!isNaN(parsedValue) && parsedValue > highestValue) {
        highestValue = parsedValue;
      }
    }
    
    if (currentBalanceValue) {
      const parsedValue = parseFloat(currentBalanceValue);
      if (!isNaN(parsedValue) && parsedValue > highestValue) {
        highestValue = parsedValue;
      }
    }
    
    if (lastKnownBalanceValue) {
      const parsedValue = parseFloat(lastKnownBalanceValue);
      if (!isNaN(parsedValue) && parsedValue > highestValue) {
        highestValue = parsedValue;
      }
    }
    
    return highestValue;
  };
  
  // État local pour le solde avec meilleure initialisation
  const [localBalance, setLocalBalance] = useState(getInitialState);
  const previousBalanceRef = useRef<number>(getInitialState());
  const isInitializedRef = useRef<boolean>(false);
  
  // Assurer la persistance initiale si nécessaire
  useEffect(() => {
    if (!isInitializedRef.current) {
      const currentValue = getInitialState();
      setLocalBalance(currentValue);
      previousBalanceRef.current = currentValue;
      
      // Synchroniser toutes les sources de vérité
      const key = `user_balance_${userId}`;
      localStorage.setItem(key, currentValue.toString());
      localStorage.setItem('currentBalance', currentValue.toString());
      localStorage.setItem('lastKnownBalance', currentValue.toString());
      
      isInitializedRef.current = true;
    }
  }, [userId]);
  
  // Mettre à jour le localStorage quand le solde change
  useEffect(() => {
    // Ne sauvegarder que si le solde est différent de la valeur précédente
    if (localBalance !== previousBalanceRef.current) {
      console.log(`Updating persisted balance from ${previousBalanceRef.current} to ${localBalance}`);
      
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
    const handleForceUpdate = (event: CustomEvent) => {
      const newBalance = event.detail?.newBalance;
      if (typeof newBalance === 'number') {
        console.log(`Force update balance from ${localBalance} to ${newBalance}`);
        setLocalBalance(newBalance);
      }
    };
    
    const handleBalanceUpdate = (event: CustomEvent) => {
      const amount = event.detail?.amount;
      const currentBalance = event.detail?.currentBalance;
      
      if (typeof currentBalance === 'number') {
        // Si un solde complet est fourni, l'utiliser
        console.log(`Update balance with full value: ${currentBalance}`);
        setLocalBalance(currentBalance);
      } else if (typeof amount === 'number') {
        // Sinon ajouter le montant au solde actuel
        console.log(`Update balance with increment: +${amount}`);
        setLocalBalance(prev => {
          const newBalance = prev + amount;
          return parseFloat(newBalance.toFixed(2)); // Arrondir à 2 décimales
        });
      }
    };
    
    window.addEventListener('balance:force-update' as any, handleForceUpdate);
    window.addEventListener('balance:update' as any, handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balance:force-update' as any, handleForceUpdate);
      window.removeEventListener('balance:update' as any, handleBalanceUpdate);
    };
  }, []);
  
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
      const newBalance = prev + amount;
      const roundedBalance = parseFloat(newBalance.toFixed(2)); // Arrondir à 2 décimales
      
      // Persister immédiatement en localStorage
      const key = `user_balance_${userId}`;
      localStorage.setItem(key, roundedBalance.toString());
      localStorage.setItem('currentBalance', roundedBalance.toString());
      localStorage.setItem('lastKnownBalance', roundedBalance.toString());
      
      return roundedBalance;
    });
  };
  
  // Fonction pour récupérer le solde persisté actuel
  const getPersistedBalance = (): number => {
    return getInitialState();
  };
  
  return {
    localBalance,
    updateLocalBalance,
    addToLocalBalance,
    getPersistedBalance
  };
};

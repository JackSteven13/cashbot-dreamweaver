
import { useState, useEffect, useRef } from 'react';

interface UseLocalBalanceProps {
  initialBalance: number;
  userId: string;
}

interface UseLocalBalanceResult {
  localBalance: number;
  updateLocalBalance: (newBalance: number) => void;
  addToLocalBalance: (amount: number) => void;
}

/**
 * Hook pour gérer le solde local avec persistance entre les sessions
 */
export const useLocalBalance = ({ initialBalance, userId }: UseLocalBalanceProps): UseLocalBalanceResult => {
  // Utiliser localStorage pour le solde persisté
  const getInitialState = () => {
    const key = `user_balance_${userId}`;
    const storedValue = localStorage.getItem(key);
    
    if (storedValue) {
      const parsedValue = parseFloat(storedValue);
      return !isNaN(parsedValue) ? parsedValue : initialBalance;
    }
    
    return initialBalance;
  };
  
  // État local pour le solde
  const [localBalance, setLocalBalance] = useState(getInitialState);
  const previousBalanceRef = useRef<number>(initialBalance);
  
  // Mettre à jour le localStorage quand le solde change
  useEffect(() => {
    // Ne sauvegarder que si le solde est différent de la valeur précédente
    if (localBalance !== previousBalanceRef.current) {
      const key = `user_balance_${userId}`;
      localStorage.setItem(key, localBalance.toString());
      localStorage.setItem('currentBalance', localBalance.toString()); // Pour la compatibilité
      localStorage.setItem('lastKnownBalance', localBalance.toString()); // Pour la compatibilité
      
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
        setLocalBalance(newBalance);
      }
    };
    
    const handleBalanceUpdate = (event: CustomEvent) => {
      const amount = event.detail?.amount;
      const currentBalance = event.detail?.currentBalance;
      
      if (typeof currentBalance === 'number') {
        // Si un solde complet est fourni, l'utiliser
        setLocalBalance(currentBalance);
      } else if (typeof amount === 'number') {
        // Sinon ajouter le montant au solde actuel
        setLocalBalance(prev => prev + amount);
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
    setLocalBalance(newBalance);
  };
  
  const addToLocalBalance = (amount: number) => {
    setLocalBalance(prev => {
      const newBalance = prev + amount;
      return parseFloat(newBalance.toFixed(2)); // Arrondir à 2 décimales
    });
  };
  
  return {
    localBalance,
    updateLocalBalance,
    addToLocalBalance
  };
};

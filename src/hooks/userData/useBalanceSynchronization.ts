
import { useEffect, useRef } from 'react';
import { UserData } from '@/types/userData';
import balanceManager, { getHighestBalance } from '@/utils/balance/balanceManager';

/**
 * Hook pour gérer la synchronisation du solde utilisateur
 */
export const useBalanceSynchronization = (
  userData: UserData | null,
  isNewUser: boolean
) => {
  const balanceSyncRef = useRef(false);
  const localBalanceRef = useRef<number | null>(null);
  const highestEverBalanceRef = useRef<number | null>(null);
  
  // Effet de synchronisation initiale du solde
  useEffect(() => {
    if (userData) {
      if (isNewUser) {
        console.log("Nouveau utilisateur détecté - Initialisation du state à zéro");
        localStorage.removeItem('highestBalance');
        localStorage.removeItem('currentBalance');
        localStorage.removeItem('lastKnownBalance');
        localStorage.removeItem('lastBalanceUpdateTime');
        localStorage.removeItem('balanceState');
        
        localBalanceRef.current = 0;
        highestEverBalanceRef.current = 0;
        
        window.dispatchEvent(new CustomEvent('balance:force-sync', { 
          detail: { balance: 0 }
        }));
        
        return;
      }
      
      // Pour les utilisateurs existants, vérifier si nous avons déjà un solde en cache
      const highestBalance = getHighestBalance();
      const storedBalance = localStorage.getItem('currentBalance');
      const apiBalance = userData.balance || 0;
      
      // Déterminer la valeur maximale entre toutes ces sources
      const maxBalance = Math.max(
        highestBalance || 0,
        storedBalance ? parseFloat(storedBalance) : 0,
        apiBalance
      );
      
      console.log(`[useUserData] Max balance determined: ${maxBalance} (API: ${apiBalance}, Highest: ${highestBalance})`);
      
      // Si le solde maximum est supérieur au solde de l'API, synchroniser
      if (maxBalance > apiBalance) {
        console.log(`[useUserData] Restoring higher balance: ${maxBalance} (server: ${apiBalance})`);
        localBalanceRef.current = maxBalance;
        highestEverBalanceRef.current = maxBalance;
        
        // Toujours sauvegarder dans localStorage pour redondance
        localStorage.setItem('highestBalance', maxBalance.toString());
        localStorage.setItem('currentBalance', maxBalance.toString());
        localStorage.setItem('lastKnownBalance', maxBalance.toString());
        
        // Déclencher un événement global pour synchroniser l'UI
        window.dispatchEvent(new CustomEvent('balance:force-sync', { 
          detail: { balance: maxBalance }
        }));
      }
      
      balanceSyncRef.current = true;
    }
  }, [userData, isNewUser]);
  
  // Effet de synchronisation lors des changements de solde
  useEffect(() => {
    if (userData?.balance !== undefined) {
      const highestBalance = getHighestBalance();
      const storedHighestBalance = localStorage.getItem('highestBalance');
      const storedBalance = localStorage.getItem('currentBalance');
      const apiBalance = userData.balance;
      
      // Déterminer le solde maximum entre toutes les sources
      const maxBalance = Math.max(
        highestBalance || 0,
        storedHighestBalance ? parseFloat(storedHighestBalance) : 0,
        storedBalance ? parseFloat(storedBalance) : 0,
        apiBalance
      );
      
      localBalanceRef.current = maxBalance;
      highestEverBalanceRef.current = maxBalance;
      
      // Toujours sauvegarder pour persistance
      localStorage.setItem('highestBalance', maxBalance.toString());
      localStorage.setItem('currentBalance', maxBalance.toString());
      localStorage.setItem('lastKnownBalance', maxBalance.toString());
      
      // Si différence significative, forcer la synchronisation de l'UI
      if (Math.abs(apiBalance - maxBalance) > 0.01) {
        console.log(`[useUserData] Syncing UI with correct balance: ${maxBalance} (API: ${apiBalance})`);
        window.dispatchEvent(new CustomEvent('balance:force-sync', { 
          detail: { balance: maxBalance }
        }));
      }
    }
  }, [userData?.balance]);
  
  // Calcul du solde effectif
  const effectiveBalance = isNewUser ? 
    0 : 
    Math.max(
      localBalanceRef.current || 0,
      getHighestBalance() || 0,
      userData?.balance || 0
    );
  
  return { effectiveBalance };
};

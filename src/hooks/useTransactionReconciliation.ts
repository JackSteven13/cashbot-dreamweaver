
import { useEffect } from 'react';
import { addTransaction } from '@/utils/transactionUtils'; // Updated import path
import { getCurrentSession } from '@/utils/auth/sessionUtils';

export const useTransactionReconciliation = (
  userData: any,
  isLoading: boolean
) => {
  useEffect(() => {
    const reconcileTransactions = async () => {
      // Ne pas exécuter si on est en train de charger ou si les données ne sont pas disponibles
      if (isLoading || !userData) return;
      
      // Vérifier si l'utilisateur a un solde positif mais aucune transaction
      if (userData.balance > 0 && (!userData.transactions || userData.transactions.length === 0)) {
        console.log("Détection d'un solde positif sans transactions:", userData.balance);
        
        const session = await getCurrentSession();
        if (!session) return;
        
        // Créer une transaction de réconciliation
        await addTransaction(
          session.user.id,
          userData.balance,
          `Récapitulatif de solde - Sessions précédentes`
        );
        
        console.log("Transaction de réconciliation créée");
      }
    };
    
    reconcileTransactions();
  }, [userData, isLoading]);
};

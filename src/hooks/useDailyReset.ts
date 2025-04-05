
import { useEffect, useRef } from 'react';
import { shouldResetDailyCounters } from '@/utils/subscription';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook pour gérer la réinitialisation quotidienne des compteurs de session uniquement
 * et non plus du solde pour les comptes freemium
 */
export const useDailyReset = (
  resetFunction: () => Promise<void>,
  isLoading: boolean
) => {
  const resetAttempted = useRef(false);

  // Vérifier si une réinitialisation est nécessaire au chargement de la page
  // ou après un chargement réussi des données utilisateur
  useEffect(() => {
    const checkAndResetDaily = async () => {
      // Éviter les multiples tentatives de réinitialisation
      if (resetAttempted.current) return;

      // Si le système détermine qu'une réinitialisation est nécessaire
      // Pass Date.now() as the argument for lastResetTime
      if (shouldResetDailyCounters(Date.now())) {
        console.log("Réinitialisation quotidienne des compteurs nécessaire, exécution...");
        resetAttempted.current = true;
        
        try {
          // Appel à la fonction de réinitialisation qui réinitialise uniquement les compteurs
          // de session et non plus le solde pour les comptes freemium
          await resetFunction();
          
          // Mettre à jour la date de dernière réinitialisation
          const today = new Date().toDateString();
          localStorage.setItem('lastBalanceResetDay', today);
          console.log("Réinitialisation quotidienne des compteurs effectuée avec succès");
        } catch (error) {
          console.error("Erreur lors de la réinitialisation quotidienne:", error);
        }
      }
    };

    // Vérifier seulement après le chargement initial
    if (!isLoading) {
      checkAndResetDaily();
    }
  }, [isLoading, resetFunction]);
};

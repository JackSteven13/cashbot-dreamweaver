
import { useEffect, useRef } from 'react';
import { shouldResetDailyCounters } from '@/utils/subscription';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook pour gérer la réinitialisation quotidienne des compteurs de session
 * sans remettre à zéro le solde pour les comptes freemium
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

      // Get the last reset time from localStorage or use 0 as default
      const lastResetTimeStr = localStorage.getItem('lastResetTime');
      const lastResetTime = lastResetTimeStr ? parseInt(lastResetTimeStr, 10) : 0;

      // Si le système détermine qu'une réinitialisation est nécessaire
      if (shouldResetDailyCounters(lastResetTime)) {
        console.log("Réinitialisation quotidienne des compteurs nécessaire, exécution...");
        resetAttempted.current = true;
        
        try {
          // Vérifier si l'utilisateur est en freemium pour réinitialiser uniquement son compteur de session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { data } = await supabase
              .from('user_balances')
              .select('subscription')
              .eq('id', session.user.id)
              .single();
              
            if (data && data.subscription === 'freemium') {
              // Réinitialiser uniquement le compteur de sessions, pas le solde
              await supabase
                .from('user_balances')
                .update({ 
                  daily_session_count: 0,
                  updated_at: new Date().toISOString()
                })
                .eq('id', session.user.id);
                
              console.log("Compteur de sessions freemium réinitialisé, le solde est conservé");
            }
          }
          
          // Appel à la fonction de réinitialisation qui réinitialise uniquement les compteurs
          await resetFunction();
          
          // Mettre à jour la date de dernière réinitialisation
          const today = new Date().toDateString();
          localStorage.setItem('lastBalanceResetDay', today);
          localStorage.setItem('lastResetTime', Date.now().toString());
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

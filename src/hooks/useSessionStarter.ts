
import React, { useState, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';
import { simulateActivity } from '@/utils/animations/moneyParticles';
import balanceManager from '@/utils/balance/balanceManager';
import { supabase } from '@/integrations/supabase/client';

export interface UseSessionStarterProps {
  userData: any;
  dailySessionCount: number;
  incrementSessionCount: () => Promise<void>;
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
  setShowLimitAlert: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useSessionStarter = ({
  userData,
  dailySessionCount,
  incrementSessionCount,
  updateBalance,
  setShowLimitAlert
}: UseSessionStarterProps) => {
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [lastSessionTimestamp, setLastSessionTimestamp] = useState<number | null>(() => {
    const stored = localStorage.getItem('lastSessionTimestamp');
    return stored ? parseInt(stored, 10) : null;
  });

  const sessionInProgressRef = useRef(false);
  const sessionCountRef = useRef(dailySessionCount);
  const userId = userData?.profile?.id || userData?.id;

  // Keep sessionCountRef in sync
  useEffect(() => {
    sessionCountRef.current = dailySessionCount;
  }, [dailySessionCount]);

  // Vérifier si le compte freemium a déjà atteint sa limite quotidienne
  const checkFreemiumLimit = () => {
    if (userData?.subscription === 'freemium') {
      const limitReached = localStorage.getItem('freemium_daily_limit_reached');
      const lastSessionDate = localStorage.getItem('last_session_date');
      const today = new Date().toDateString();
      
      // Si ce n'est pas un nouveau jour et que la limite est déjà atteinte
      if (lastSessionDate === today && (limitReached === 'true' || sessionCountRef.current >= 1)) {
        return true;
      }
    }
    return false;
  };

  // Synchroniser le solde avec la base de données après une session
  const syncBalanceWithDatabase = async (gain: number) => {
    if (!userId) return;
    
    try {
      const currentBalance = balanceManager.getCurrentBalance();
      
      // Récupérer d'abord le solde actuel de la base de données
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Erreur lors de la récupération du solde pour synchronisation:', error);
        return;
      }
      
      // Comparer et utiliser le solde le plus élevé
      const dbBalance = data.balance || 0;
      const expectedNewBalance = dbBalance + gain;
      
      // Si le solde local est supérieur, mettre à jour la base de données
      if (currentBalance > expectedNewBalance) {
        await supabase
          .from('user_balances')
          .update({ balance: currentBalance })
          .eq('id', userId);
          
        console.log(`Base de données mise à jour avec le solde local: ${currentBalance}€`);
      } 
      // Si le solde calculé est supérieur au solde local, mettre à jour le stockage local
      else if (expectedNewBalance > currentBalance) {
        balanceManager.forceBalanceSync(expectedNewBalance, userId);
        console.log(`Stockage local mis à jour avec le nouveau solde: ${expectedNewBalance}€`);
      }
    } catch (err) {
      console.error('Erreur lors de la synchronisation du solde:', err);
    }
  };

  const handleStartSession = async () => {
    if (sessionInProgressRef.current || isStartingSession) return;

    try {
      sessionInProgressRef.current = true;
      setIsStartingSession(true);

      // Pour les comptes freemium, vérification stricte de la limite
      if (userData?.subscription === 'freemium') {
        // Vérifier d'abord si la limite est déjà atteinte aujourd'hui
        if (checkFreemiumLimit()) {
          toast({
            title: "Limite quotidienne atteinte",
            description: "Les comptes freemium sont limités à 1 session par jour.",
            variant: "destructive"
          });
          
          setShowLimitAlert(true);
          sessionInProgressRef.current = false;
          setIsStartingSession(false);
          return;
        }
      }

      const currentDailyGains = balanceManager.getDailyGains();
      
      // Vérification stricte de la limite de gains quotidiens
      const dailyLimit = 0.5; // Pour les comptes freemium
      if (currentDailyGains >= dailyLimit * 0.95) {
        toast({
          title: "Limite quotidienne de gains atteinte",
          description: `Vous avez atteint votre limite de ${dailyLimit}€ par jour.`,
          variant: "destructive"
        });
        
        setShowLimitAlert(true);
        sessionInProgressRef.current = false;
        setIsStartingSession(false);
        return;
      }
      
      const terminalSequence = createBackgroundTerminalSequence([
        "Initialisation de la session d'analyse manuelle..."
      ]);

      window.dispatchEvent(new CustomEvent('session:start', { detail: { manual: true } }));
      simulateActivity();

      terminalSequence.add("Analyse des données en cours...");
      await new Promise(resolve => setTimeout(resolve, 800));
      terminalSequence.add("Optimisation des résultats...");
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Calculer le gain en fonction du type d'abonnement et de la limite restante
      const remainingGainAllowance = dailyLimit - currentDailyGains;
      const baseGain = userData?.subscription === 'freemium' ? 
          Math.random() * 0.05 + 0.1 : // Entre 0.1 et 0.15 pour freemium
          Math.random() * 0.2 + 0.15;  // Entre 0.15 et 0.35 pour les autres
          
      // S'assurer que le gain ne dépasse pas la limite
      const gain = Math.min(baseGain, remainingGainAllowance);

      const now = Date.now();
      localStorage.setItem('lastSessionTimestamp', now.toString());
      setLastSessionTimestamp(now);

      // Pour les comptes freemium, marquer que la limite quotidienne est atteinte
      if (userData?.subscription === 'freemium') {
        localStorage.setItem('freemium_daily_limit_reached', 'true');
        localStorage.setItem('last_session_date', new Date().toDateString());
      }

      await incrementSessionCount();

      terminalSequence.add(`Résultats optimisés! Gain: ${gain.toFixed(2)}€`);

      // Mettre à jour les gains quotidiens dans le gestionnaire de solde
      balanceManager.addDailyGain(gain);

      // Mettre à jour le solde local
      const oldBalance = balanceManager.getCurrentBalance();
      balanceManager.updateBalance(gain);
      const newBalance = balanceManager.getCurrentBalance();

      // Synchroniser avec la base de données
      await updateBalance(gain, `Session d'analyse manuelle: +${gain.toFixed(2)}€`);
      
      // Assurer la cohérence entre le stockage local et la base de données
      await syncBalanceWithDatabase(gain);

      terminalSequence.complete(gain);

      // Déclencher un événement pour rafraîchir les transactions
      window.dispatchEvent(new CustomEvent('transactions:refresh'));
      
      // Déclencher l'animation de mise à jour du solde
      window.dispatchEvent(new CustomEvent('balance:update', {
        detail: {
          amount: gain,
          oldBalance: oldBalance,
          newBalance: newBalance,
          animate: true,
          duration: 1500
        }
      }));

      toast({
        title: "Session complétée",
        description: `Votre session a généré ${gain.toFixed(2)}€`,
      });
      
      // Pour les comptes freemium, toujours montrer l'alerte de limite après la première session
      if (userData?.subscription === 'freemium') {
        setShowLimitAlert(true);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la session.",
        variant: "destructive"
      });
    } finally {
      setIsStartingSession(false);
      sessionInProgressRef.current = false;
    }
  };

  return { isStartingSession, handleStartSession, lastSessionTimestamp };
};

export default useSessionStarter;

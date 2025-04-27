import React, { useState, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';
import { simulateActivity } from '@/utils/animations/moneyParticles';
import balanceManager from '@/utils/balance/balanceManager';
import { supabase } from '@/integrations/supabase/client';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription/constants';

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
  const [isStrictVerifying, setIsStrictVerifying] = useState(false);

  // Keep sessionCountRef in sync
  useEffect(() => {
    sessionCountRef.current = dailySessionCount;
  }, [dailySessionCount]);

  // Vérifier strictement dans la base de données si la limite freemium a déjà été atteinte
  const checkFreemiumLimitFromDB = async (): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      setIsStrictVerifying(true);
      
      // Obtenir la date d'aujourd'hui au format YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      
      // Vérifier dans la base de données les sessions manuelles d'aujourd'hui
      const { data, error } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .like('date', `${today}%`)
        .like('report', '%Session%');
        
      if (!error && data) {
        // Si au moins 1 session a déjà été faite aujourd'hui
        const hasReachedLimit = data.length >= 1;
        
        if (hasReachedLimit) {
          // Marquer que la limite a été atteinte dans le stockage local
          localStorage.setItem('freemium_daily_limit_reached', 'true');
          localStorage.setItem('last_session_date', new Date().toDateString());
          
          console.log("DB check: Freemium limit reached (DB sessions found:", data.length, ")");
        }
        
        return hasReachedLimit;
      }
    } catch (err) {
      console.error("Error checking Freemium DB limit:", err);
    } finally {
      setIsStrictVerifying(false);
    }
    
    return false;
  };

  // Vérifier strictement dans la base de données si la limite quotidienne de gains est atteinte
  const checkDailyGainsFromDB = async (): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      // Obtenir la date d'aujourd'hui au format YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      
      // Récupérer tous les gains d'aujourd'hui depuis la base de données
      const { data, error } = await supabase
        .from('transactions')
        .select('gain')
        .eq('user_id', userId)
        .like('date', `${today}%`);
      
      if (!error && data) {
        // Calculer les gains totaux d'aujourd'hui
        const todaysGains = data.reduce((sum, tx) => sum + (tx.gain || 0), 0);
        
        // Récupérer la limite quotidienne basée sur l'abonnement
        const subscription = userData?.subscription || 'freemium';
        const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
        
        // Mettre à jour le gestionnaire de solde local avec les données de la DB
        balanceManager.setDailyGains(todaysGains);
        
        // Si déjà à 95% de la limite, considérer que la limite est atteinte
        const isLimitReached = todaysGains >= dailyLimit * 0.95;
        
        if (isLimitReached) {
          console.log(`DB check: Daily limit reached (${todaysGains.toFixed(2)}€/${dailyLimit}€)`);
        }
        
        return isLimitReached;
      }
    } catch (err) {
      console.error("Error checking daily gains limit:", err);
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
    if (sessionInProgressRef.current || isStartingSession || isStrictVerifying) {
      toast({
        title: "Session en cours", 
        description: "Veuillez patienter jusqu'à la fin de la session en cours",
        duration: 3000
      });
      return;
    }

    try {
      sessionInProgressRef.current = true;
      setIsStartingSession(true);

      // Pour les comptes freemium, vérification stricte de la limite
      if (userData?.subscription === 'freemium') {
        // Vérifier d'abord avec les données du localStorage
        const limitReached = localStorage.getItem('freemium_daily_limit_reached');
        const lastSessionDate = localStorage.getItem('last_session_date');
        const today = new Date().toDateString();
        
        // Si la limite est déjà marquée comme atteinte pour aujourd'hui
        if (lastSessionDate === today && (limitReached === 'true' || sessionCountRef.current >= 1)) {
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
        
        // Vérification supplémentaire en base de données (critique pour freemium)
        const dbLimitReached = await checkFreemiumLimitFromDB();
        if (dbLimitReached) {
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

      // Vérification stricte de la limite de gains quotidiens via DB
      const gainsLimitReached = await checkDailyGainsFromDB();
      if (gainsLimitReached) {
        toast({
          title: "Limite quotidienne de gains atteinte",
          description: "Vous avez atteint votre limite de gains journaliers.",
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

      // Récupérer les gains quotidiens actuels depuis le gestionnaire
      const currentDailyGains = balanceManager.getDailyGains();
      
      // Calculer le gain en fonction du type d'abonnement et de la limite restante
      const dailyLimit = SUBSCRIPTION_LIMITS[userData?.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      const remainingGainAllowance = Math.max(0, dailyLimit - currentDailyGains);
      
      // Gain de base selon l'abonnement
      const baseGain = userData?.subscription === 'freemium' ? 
          Math.random() * 0.05 + 0.1 : // Entre 0.1 et 0.15 pour freemium
          Math.random() * 0.2 + 0.15;  // Entre 0.15 et 0.35 pour les autres
          
      // S'assurer strictement que le gain ne dépasse pas la limite
      const gain = Math.min(baseGain, remainingGainAllowance * 0.9); // 90% max pour avoir une marge

      // Si le gain est trop petit (<1 centime), ne pas continuer
      if (gain < 0.01) {
        toast({
          title: "Limite journalière atteinte",
          description: "Vous avez atteint votre limite de gains quotidiens.",
          variant: "destructive"
        });
        
        setShowLimitAlert(true);
        sessionInProgressRef.current = false;
        setIsStartingSession(false);
        return;
      }

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
      window.dispatchEvent(new CustomEvent('transactions:refresh', {
        detail: { timestamp: Date.now() }
      }));
      
      window.dispatchEvent(new CustomEvent('transactions:updated', {
        detail: { gain, timestamp: Date.now() }
      }));

      toast({
        title: "Session complétée",
        description: `Votre session a généré ${gain.toFixed(2)}€`,
      });
      
      // Vérifier si nous sommes proches de la limite après cette session
      const updatedDailyGains = balanceManager.getDailyGains();
      if (updatedDailyGains >= dailyLimit * 0.85) {
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

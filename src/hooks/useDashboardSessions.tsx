
import { useState, useCallback, useRef, useEffect } from 'react';
import { useManualSessions } from './sessions/manual/useManualSessions';
import { toast } from '@/components/ui/use-toast';
import { useBotStatus } from '@/hooks/dashboard/sessions/useBotStatus';
import balanceManager from '@/utils/balance/balanceManager';

const useDashboardSessions = ({
  userData,
  dailySessionCount,
  incrementSessionCount,
  updateBalance,
  setShowLimitAlert,
  resetBalance
}: {
  userData: any;
  dailySessionCount: number;
  incrementSessionCount: () => Promise<void>;
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
  setShowLimitAlert: (show: boolean) => void;
  resetBalance: () => Promise<void>;
}) => {
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [lastSessionTimestamp, setLastSessionTimestamp] = useState<number | null>(Number(localStorage.getItem('lastSessionTimestamp')) || null);
  const { isBotActive: botActiveFromHook } = useBotStatus();
  const [isBotActive, setBotActive] = useState(botActiveFromHook);

  // Persister le dernier horodatage de session entre les charges de page
  useEffect(() => {
    if (lastSessionTimestamp) {
      localStorage.setItem('lastSessionTimestamp', lastSessionTimestamp.toString());
    }
  }, [lastSessionTimestamp]);
  
  // Restaurer l'état du bot depuis le localStorage et s'assurer qu'il n'est pas actif si la limite est atteinte
  useEffect(() => {
    // Récupérer l'état stocké du bot
    const storedBotState = localStorage.getItem('botActive');
    
    // Vérifier si la limite quotidienne est atteinte
    const checkLimitReached = () => {
      if (!userData) return false;
      
      const subscription = userData.subscription || 'freemium';
      const dailyLimit = 0.5; // Valeur pour freemium
      const currentGains = balanceManager.getDailyGains();
      
      // Considérer la limite atteinte à 95% pour éviter de la dépasser
      return currentGains >= dailyLimit * 0.95;
    };
    
    // Désactiver le bot si la limite est atteinte
    const limitReached = checkLimitReached();
    if (limitReached) {
      setBotActive(false);
      localStorage.setItem('botActive', 'false');
      
      window.dispatchEvent(new CustomEvent('bot:status-change', {
        detail: { active: false }
      }));
      
      console.log("Bot désactivé car limite quotidienne atteinte");
    } 
    // Sinon, utiliser l'état stocké
    else if (storedBotState === 'true' || storedBotState === null) {
      // Le bot est actif par défaut
      setBotActive(true);
      window.dispatchEvent(new CustomEvent('bot:status-change', {
        detail: { active: true }
      }));
    } else if (storedBotState === 'false') {
      setBotActive(false);
      window.dispatchEvent(new CustomEvent('bot:status-change', {
        detail: { active: false }
      }));
    }
  }, [userData]);

  // Surveiller les changements d'état du bot
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        setBotActive(isActive);
        localStorage.setItem('botActive', isActive.toString());
      }
    };

    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
    };
  }, []);

  const manualSessions = useManualSessions({
    userData,
    dailySessionCount,
    incrementSessionCount,
    updateBalance
  });

  const handleStartSession = useCallback(async () => {
    // Vérifier si la limite quotidienne est atteinte
    if (userData) {
      const subscription = userData.subscription || 'freemium';
      const dailyLimit = 0.5; // Valeur pour freemium
      const currentGains = balanceManager.getDailyGains();
      
      if (currentGains >= dailyLimit * 0.95) {
        toast({
          title: "Limite quotidienne atteinte",
          description: "Vous avez atteint votre limite quotidienne. Revenez demain ou passez à un forfait supérieur.",
          variant: "destructive",
          duration: 4000
        });
        setShowLimitAlert(true);
        return;
      }
    }
    
    if (manualSessions.isSessionRunning) {
      toast({
        title: "Session déjà en cours",
        description: "Veuillez patienter...",
        duration: 3000
      });
      return;
    }

    setIsStartingSession(true);
    
    try {
      // Enregistrer l'horodatage de la session
      setLastSessionTimestamp(Date.now());
      
      // Démarrer la session
      await manualSessions.startSession();
    } catch (error) {
      console.error("Erreur lors du démarrage de la session:", error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer la session.",
        variant: "destructive"
      });
    } finally {
      setIsStartingSession(false);
    }
  }, [manualSessions, setShowLimitAlert, userData]);

  const handleWithdrawal = useCallback(async () => {
    if (!userData) return;
    
    // Vérifiez si le solde est suffisant pour un retrait
    const currentBalance = userData.balance || 0;
    if (currentBalance <= 0) {
      toast({
        title: "Retrait impossible",
        description: "Votre solde est insuffisant pour effectuer un retrait.",
        variant: "destructive"
      });
      return;
    }
    
    // Confirmer la demande de retrait
    const isConfirmed = window.confirm(
      `Êtes-vous sûr de vouloir retirer ${currentBalance.toFixed(2)}€ de votre compte?`
    );
    
    if (!isConfirmed) return;
    
    try {
      // Effectuer le retrait (réinitialiser le solde)
      await resetBalance();
      
      // Réinitialiser le gestionnaire de solde local
      balanceManager.reset();
      
      toast({
        title: "Retrait demandé",
        description: `Votre demande de retrait de ${currentBalance.toFixed(2)}€ a été enregistrée.`,
        duration: 5000
      });
    } catch (error) {
      console.error("Erreur lors de la demande de retrait:", error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter votre demande de retrait.",
        variant: "destructive"
      });
    }
  }, [userData, resetBalance]);

  return {
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    lastSessionTimestamp,
    isBotActive
  };
};

export default useDashboardSessions;

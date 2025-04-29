
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Download, Coins } from 'lucide-react';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';
import { toast } from '@/components/ui/use-toast';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import balanceManager from '@/utils/balance/balanceManager';

interface ActionButtonsProps {
  isStartingSession: boolean;
  onStartSession: () => void;
  onWithdrawal?: () => void;
  canStartSession: boolean;
  canWithdraw: boolean;
  subscription: string;
  isBotActive?: boolean;
  useAnimation?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  isStartingSession,
  onStartSession,
  onWithdrawal,
  canStartSession = true,
  canWithdraw = false,
  subscription = 'freemium',
  isBotActive = true,
  useAnimation = true
}) => {
  const [isLocallyProcessing, setIsLocallyProcessing] = useState(false);
  const [localBotActive, setLocalBotActive] = useState(isBotActive);
  const [limitReached, setLimitReached] = useState(() => {
    // Vérifie immédiatement si la limite est atteinte
    const userId = localStorage.getItem('current_user_id');
    if (userId) {
      const limitReachedKey = `daily_limit_reached_${userId}`;
      return localStorage.getItem(limitReachedKey) === 'true';
    }
    return false;
  });
  
  const [freemiumLimitReached, setFreemiumLimitReached] = useState(() => {
    // Vérifie immédiatement si la limite freemium est atteinte
    if (subscription !== 'freemium') return false;
    
    const userId = localStorage.getItem('current_user_id');
    if (!userId) return false;
    
    const lastSessionDate = localStorage.getItem(`last_session_date`);
    const today = new Date().toDateString();
    const limitReached = localStorage.getItem(`freemium_daily_limit_reached_${userId}`);
    
    return lastSessionDate === today && limitReached === 'true';
  });

  // Vérifie les limites quotidiennes à chaque changement du statut du bot ou de l'abonnement
  useEffect(() => {
    const checkDailyLimits = () => {
      const userId = localStorage.getItem('current_user_id');
      if (!userId) return;
      
      // Vérifier si c'est un nouveau jour pour réinitialiser les limites
      const lastSessionDate = localStorage.getItem(`last_session_date`);
      const today = new Date().toDateString();
      
      if (lastSessionDate !== today) {
        localStorage.removeItem(`daily_limit_reached_${userId}`);
        localStorage.removeItem(`freemium_daily_limit_reached_${userId}`);
        setLimitReached(false);
        setFreemiumLimitReached(false);
        return;
      }
      
      // Vérifier les limites générales
      const limitReached = localStorage.getItem(`daily_limit_reached_${userId}`) === 'true';
      setLimitReached(limitReached);
      
      // Vérifier les limites spécifiques freemium
      if (subscription === 'freemium') {
        const freemiumLimitReached = localStorage.getItem(`freemium_daily_limit_reached_${userId}`) === 'true';
        setFreemiumLimitReached(freemiumLimitReached);
      }
    };
    
    checkDailyLimits();
    
    // Écouter les changements d'état du bot
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      
      if (typeof isActive === 'boolean') {
        setLocalBotActive(isActive);
      }
    };
    
    const handleLimitReached = () => {
      setLimitReached(true);
    };
    
    // Vérifier à nouveau les limites à chaque fois que le statut du bot change
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    window.addEventListener('bot:force-status' as any, handleBotStatusChange);
    window.addEventListener('bot:limit-reached' as any, handleLimitReached);
    window.addEventListener('dashboard:limit-reached' as any, handleLimitReached);
    window.addEventListener('session:completed' as any, () => {
      setTimeout(checkDailyLimits, 500);
    });
    
    // Initialiser avec la prop
    setLocalBotActive(isBotActive);
    
    // Vérifier aussi à chaque changement de visibilité
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkDailyLimits();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('bot:force-status' as any, handleBotStatusChange);
      window.removeEventListener('bot:limit-reached' as any, handleLimitReached);
      window.removeEventListener('dashboard:limit-reached' as any, handleLimitReached);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isBotActive, subscription]);

  const handleStartAnalysis = async () => {
    const userId = localStorage.getItem('current_user_id');
    
    // Vérifier si déjà en cours de traitement
    if (!canStartSession || isStartingSession || isLocallyProcessing) {
      return;
    }
    
    // Vérifier les limites freemium
    if (subscription === 'freemium' && freemiumLimitReached) {
      toast({
        title: "Limite quotidienne atteinte",
        description: "Les comptes freemium sont limités à 1 session par jour.",
        variant: "destructive",
        duration: 5000
      });
      return;
    }
    
    // Vérifier si la limite générale est atteinte
    if (limitReached) {
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      toast({
        title: "Limite journalière atteinte",
        description: `Vous avez atteint votre limite de ${dailyLimit}€ pour aujourd'hui.`,
        variant: "destructive",
        duration: 5000
      });
      return;
    }
    
    try {
      setIsLocallyProcessing(true);
      
      if (useAnimation) {
        const terminalAnimation = createBackgroundTerminalSequence([
          "Initialisation de l'analyse vidéo..."
        ]);
        terminalAnimation.add("Traitement des données en cours...");
      }
      
      // Attendre un court instant pour l'animation visuelle
      setTimeout(() => {
        onStartSession();
        setIsLocallyProcessing(false);
      }, 200);
      
      // Si c'est un compte freemium, marquer comme limite atteinte immédiatement
      if (subscription === 'freemium' && userId) {
        localStorage.setItem(`freemium_daily_limit_reached_${userId}`, 'true');
        localStorage.setItem('last_session_date', new Date().toDateString());
        setFreemiumLimitReached(true);
        
        // Informer les autres composants
        window.dispatchEvent(new CustomEvent('freemium:limit-changed', {
          detail: { limited: true }
        }));
      }
    } catch (error) {
      console.error("Erreur lors du démarrage de l'analyse:", error);
      setIsLocallyProcessing(false);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du démarrage de l'analyse",
        variant: "destructive"
      });
    }
  };

  const handleWithdrawal = () => {
    if (!canWithdraw || !onWithdrawal) return;
    onWithdrawal();
  };

  // État visuel du bouton
  const getButtonState = () => {
    if (subscription === 'freemium' && freemiumLimitReached) {
      return {
        text: 'Limite atteinte (1/jour)',
        disabled: true,
        animate: false,
        color: 'bg-red-600'
      };
    }
    
    if (isStartingSession || isLocallyProcessing) {
      return {
        text: 'Analyse en cours...',
        disabled: true,
        animate: true,
        color: 'bg-blue-600 hover:bg-blue-600'
      };
    }
    
    if (limitReached) {
      return {
        text: 'Limite atteinte',
        disabled: true,
        animate: false,
        color: 'bg-red-600'
      };
    }
    
    if (!localBotActive) {
      return {
        text: 'Analyse en pause',
        disabled: true,
        animate: false,
        color: 'bg-gray-600'
      };
    }
    
    if (!canStartSession) {
      return {
        text: 'Lancer l\'analyse',
        disabled: true,
        animate: false,
        color: 'bg-gray-600'
      };
    }
    
    return {
      text: 'Lancer l\'analyse',
      disabled: false,
      animate: false,
      color: 'bg-blue-600 hover:bg-blue-700'
    };
  };
  
  const buttonState = getButtonState();

  return (
    <div className="flex flex-col space-y-3">
      <Button
        variant={canStartSession && !buttonState.disabled ? "default" : "secondary"}
        disabled={buttonState.disabled}
        onClick={handleStartAnalysis}
        className={`w-full flex items-center justify-center gap-2 py-6 ${buttonState.color} transition-all duration-300`}
        data-testid="analysis-button"
      >
        <Zap className={`h-5 w-5 ${buttonState.animate ? 'animate-pulse' : ''}`} />
        <span className="font-medium">
          {buttonState.text}
        </span>
      </Button>

      {onWithdrawal && (
        <Button
          variant={canWithdraw ? "outline" : "ghost"}
          onClick={handleWithdrawal}
          disabled={!canWithdraw}
          className={`w-full flex items-center justify-center gap-2 py-5 
            ${canWithdraw 
              ? 'border-yellow-700 text-yellow-400 hover:bg-yellow-950/30 hover:text-yellow-300 transition-colors duration-200' 
              : 'text-gray-400 border-gray-700 hover:bg-transparent'}`}
        >
          <Download className="h-5 w-5" />
          <span className="font-medium">Retirer</span>
          <Coins className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  );
};

export default ActionButtons;


import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Download, Coins } from 'lucide-react';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';
import { toast } from '@/components/ui/use-toast';

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
  const [limitReached, setLimitReached] = useState(false);

  // Écouter les changements d'état du bot
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      const reason = event.detail?.reason;
      
      if (typeof isActive === 'boolean') {
        setLocalBotActive(isActive);
        if (reason === 'limit_reached') {
          setLimitReached(true);
        }
      }
    };
    
    const handleLimitReached = () => {
      setLimitReached(true);
      setLocalBotActive(false);
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    window.addEventListener('bot:force-status' as any, handleBotStatusChange);
    window.addEventListener('bot:limit-reached' as any, handleLimitReached);
    window.addEventListener('dashboard:limit-reached' as any, handleLimitReached);
    
    // Initialiser avec la prop
    setLocalBotActive(isBotActive);
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('bot:force-status' as any, handleBotStatusChange);
      window.removeEventListener('bot:limit-reached' as any, handleLimitReached);
      window.removeEventListener('dashboard:limit-reached' as any, handleLimitReached);
    };
  }, [isBotActive]);

  const handleStartAnalysis = async () => {
    console.log("Début handleStartAnalysis");
    
    if (!canStartSession || isStartingSession || isLocallyProcessing) {
      console.log("Action bloquée:", {canStartSession, isStartingSession, isLocallyProcessing});
      return;
    }
    
    // Vérifier si la limite a été atteinte
    if (limitReached) {
      toast({
        title: "Limite journalière atteinte",
        description: "Vous avez atteint votre limite de gains quotidiens. Revenez demain ou passez à un forfait supérieur.",
        variant: "destructive",
        duration: 5000
      });
      return;
    }
    
    try {
      console.log("Démarrage de l'animation et de l'analyse");
      setIsLocallyProcessing(true);
      
      // Créer une séquence d'animation qui s'affiche immédiatement
      const terminalAnimation = createBackgroundTerminalSequence([
        "Initialisation de l'analyse vidéo..."
      ]);
      
      terminalAnimation.addLine("Traitement des données en cours...");
      
      // Appeler immédiatement la fonction onStartSession
      console.log("Appel de onStartSession");
      onStartSession();
      
      // Attendre un court instant avant de réinitialiser l'état local
      setTimeout(() => {
        setIsLocallyProcessing(false);
      }, 500);
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

  // Déterminer l'état visuel du bouton en fonction des différents états
  const getButtonState = () => {
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
      color: 'bg-green-600 hover:bg-green-700'  // Changé à vert pour plus de visibilité
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

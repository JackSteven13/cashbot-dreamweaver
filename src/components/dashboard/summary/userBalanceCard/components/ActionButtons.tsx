
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Download, Coins } from 'lucide-react';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';

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

  const handleStartAnalysis = async () => {
    if (!canStartSession || isStartingSession || isLocallyProcessing) {
      return;
    }
    
    // Utilisez les animations en arrière-plan pour une meilleure UX au besoin
    if (useAnimation) {
      // Créer une séquence d'animation qui n'affiche pas l'écran de chargement
      const terminalAnimation = createBackgroundTerminalSequence([
        "Initialisation de l'analyse vidéo..."
      ]);
      
      setIsLocallyProcessing(true);
      
      setTimeout(() => {
        terminalAnimation.addLine("Traitement des données en cours...");
        
        // Lancement différé de la fonction principale pour permettre aux animations de s'afficher
        setTimeout(() => {
          onStartSession();
          setIsLocallyProcessing(false);
          
          // L'animation se terminera automatiquement dans onStartSession
          // via l'événement analysis-complete qui sera déclenché par cette fonction
        }, 600);
      }, 300);
    } else {
      // Comportement standard sans animation préliminaire
      onStartSession();
    }
  };

  const handleWithdrawal = () => {
    if (!canWithdraw || !onWithdrawal) return;
    onWithdrawal();
  };

  return (
    <div className="flex flex-col space-y-3">
      <Button
        variant={canStartSession ? "default" : "secondary"}
        disabled={!canStartSession || isStartingSession || isLocallyProcessing}
        onClick={handleStartAnalysis}
        className={`w-full flex items-center justify-center gap-2 py-6 ${canStartSession ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600'}`}
      >
        <Zap className={`h-5 w-5 ${isStartingSession || isLocallyProcessing ? 'animate-pulse' : ''}`} />
        <span className="font-medium">
          {isStartingSession || isLocallyProcessing 
            ? 'Analyse en cours...' 
            : isBotActive 
              ? 'Lancer l\'analyse' 
              : 'Analyse en pause'}
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

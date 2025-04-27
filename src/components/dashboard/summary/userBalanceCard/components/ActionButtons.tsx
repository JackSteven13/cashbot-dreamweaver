
import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, ArrowUpRight, Gift, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ActionButtonsProps {
  isStartingSession: boolean; 
  onStartSession?: () => void;
  onWithdrawal?: () => void;
  canWithdraw?: boolean;
  subscription?: string;
  isBotActive?: boolean;
  useAnimation?: boolean;
  dailySessionCount?: number;
  isButtonDisabled?: boolean;
  currentBalance?: number;
  dailyLimit?: number;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  isStartingSession,
  onStartSession,
  onWithdrawal,
  canWithdraw = false,
  subscription = 'freemium',
  isBotActive = true,
  useAnimation = false,
  dailySessionCount = 0,
  isButtonDisabled = false,
  currentBalance = 0,
  dailyLimit = 0.5
}) => {
  const [localButtonDisabled, setLocalButtonDisabled] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();
  
  // Calculate if limit is reached
  const limitReached = currentBalance >= dailyLimit;
  const limitPercentage = Math.min(100, (currentBalance / dailyLimit) * 100);
  
  const handleBoostClick = useCallback(() => {
    if (!onStartSession || isButtonDisabled || localButtonDisabled || isStartingSession) {
      return;
    }
    
    // Play button click sound if animation is enabled
    if (useAnimation) {
      const buttonSound = document.getElementById('button-click') as HTMLAudioElement;
      if (buttonSound) {
        buttonSound.currentTime = 0;
        buttonSound.play().catch(error => console.log('Error playing sound:', error));
      }
    }
    
    setLocalButtonDisabled(true);
    
    try {
      onStartSession();
    } catch (e) {
      console.error('Error starting session:', e);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du démarrage de la session.',
        variant: 'destructive'
      });
    }
    
    setTimeout(() => {
      setLocalButtonDisabled(false);
    }, 2000);
  }, [onStartSession, isButtonDisabled, localButtonDisabled, isStartingSession, useAnimation, toast]);
  
  return (
    <div className="grid grid-cols-2 gap-3 mt-4">
      <Button
        variant="outline"
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 text-white"
        disabled={isStartingSession || isButtonDisabled || localButtonDisabled || limitReached || !isBotActive}
        onClick={handleBoostClick}
        ref={buttonRef}
      >
        {isStartingSession ? (
          <>
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            <span className="text-xs">Génération...</span>
          </>
        ) : (
          <>
            <Play className="mr-1 h-3 w-3" />
            <span className="text-xs">Booster ({dailySessionCount}/3)</span>
          </>
        )}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
        disabled={!canWithdraw}
        onClick={onWithdrawal}
      >
        <ArrowUpRight className="mr-1 h-3 w-3" />
        <span className="text-xs">Retirer</span>
      </Button>
    </div>
  );
};

export default ActionButtons;

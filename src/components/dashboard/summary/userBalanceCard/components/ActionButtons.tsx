
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Coins, Loader2 } from 'lucide-react';

interface ActionButtonsProps {
  isStartingSession?: boolean;
  onStartSession?: () => void;
  onWithdrawal?: () => void;
  dailySessionCount?: number;
  subscription?: string;
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
  canWithdraw?: boolean;
  useAnimation?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  isStartingSession = false,
  onStartSession,
  onWithdrawal,
  dailySessionCount = 0,
  subscription = 'freemium',
  lastSessionTimestamp = '',
  isBotActive = true,
  canWithdraw = false,
  useAnimation = false
}) => {
  // Déterminer si l'utilisateur a atteint sa limite quotidienne
  const getDailyLimit = () => {
    switch (subscription) {
      case 'elite': return 20;
      case 'gold': return 10;
      case 'starter': return 5;
      default: return 3;
    }
  };
  
  const dailyLimit = getDailyLimit();
  const hasReachedLimit = dailySessionCount >= dailyLimit;
  
  // Calculer le temps écoulé depuis la dernière session (si disponible)
  const getTimeSinceLastSession = () => {
    if (!lastSessionTimestamp) return Number.MAX_SAFE_INTEGER;
    
    const lastSession = new Date(lastSessionTimestamp).getTime();
    const now = Date.now();
    return (now - lastSession) / 1000; // en secondes
  };
  
  const timeSinceLastSession = getTimeSinceLastSession();
  const canStartNewSession = !hasReachedLimit && timeSinceLastSession > 60; // 1 minute minimum entre les sessions
  
  return (
    <div className="flex gap-2 mt-4">
      <Button
        variant="outline"
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        disabled={isStartingSession || !canStartNewSession || !isBotActive}
        onClick={onStartSession}
      >
        {isStartingSession ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Démarrage...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Démarrer
          </>
        )}
      </Button>
      
      <Button
        variant="outline"
        className="bg-green-600 hover:bg-green-700 text-white"
        onClick={onWithdrawal}
        disabled={!canWithdraw}
      >
        <Coins className="mr-2 h-4 w-4" />
        Retrait
      </Button>
    </div>
  );
};

export default ActionButtons;

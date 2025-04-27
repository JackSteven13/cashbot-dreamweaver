
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface SessionButtonProps {
  isStartingSession: boolean;
  handleStartSession: () => void;
  canStartSession?: boolean;
  dailySessionCount: number;
  subscription?: string;
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
  className?: string;
}

const SessionButton: React.FC<SessionButtonProps> = ({ 
  isStartingSession, 
  handleStartSession,
  canStartSession = true,
  dailySessionCount = 0,
  subscription = 'freemium',
  lastSessionTimestamp = '',
  isBotActive = true,
  className = ''
}) => {
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Determine daily limit based on subscription
  const getDailyLimit = useCallback(() => {
    switch (subscription) {
      case 'elite': return 15;
      case 'gold': return 10;
      case 'starter': return 5;
      case 'freemium': return 3;
      default: return 3;
    }
  }, [subscription]);

  const dailyLimit = getDailyLimit();
  const hasReachedLimit = dailySessionCount >= dailyLimit;

  // Check time since last session
  const checkLastSessionTime = useCallback(() => {
    if (!lastSessionTimestamp) {
      return true;
    }

    const lastSession = new Date(lastSessionTimestamp).getTime();
    const now = Date.now();
    const timeDiff = now - lastSession;
    
    // Minimum delay between sessions (60 seconds)
    const minTimeInterval = 60 * 1000; // 60 seconds in milliseconds
    
    if (timeDiff < minTimeInterval) {
      const remainingTime = Math.ceil((minTimeInterval - timeDiff) / 1000);
      setTimeRemaining(remainingTime);
      return false;
    }
    
    setTimeRemaining(null);
    return true;
  }, [lastSessionTimestamp]);

  // Update timer every second
  useEffect(() => {
    let timerId: number | undefined;
    
    if (timeRemaining !== null && timeRemaining > 0) {
      timerId = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timerId);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [timeRemaining]);

  // Check if user can start a session
  const canStart = useCallback(() => {
    if (!user) {
      return false;
    }
    
    if (!isBotActive) {
      return false;
    }
    
    if (hasReachedLimit) {
      return false;
    }
    
    if (!checkLastSessionTime()) {
      return false;
    }
    
    return canStartSession;
  }, [user, isBotActive, hasReachedLimit, canStartSession, checkLastSessionTime]);

  // Handle click event
  const handleClick = useCallback(() => {
    if (isStartingSession || isButtonDisabled || !canStart()) {
      if (hasReachedLimit) {
        toast({
          title: "Limite quotidienne atteinte",
          description: `Vous avez atteint la limite de ${dailyLimit} sessions pour aujourd'hui.`,
          variant: "default"
        });
      } else if (timeRemaining !== null && timeRemaining > 0) {
        toast({
          title: "Veuillez patienter",
          description: `Vous pourrez démarrer une nouvelle session dans ${timeRemaining} secondes.`,
          variant: "default"
        });
      } else if (!isBotActive) {
        toast({
          title: "Le bot est désactivé",
          description: "Le système est en maintenance, veuillez réessayer plus tard.",
          variant: "default"
        });
      }
      return;
    }
    
    setIsButtonDisabled(true);
    
    try {
      // Call start function
      handleStartSession();
      
      // Add delay before re-enabling the button
      setTimeout(() => {
        setIsButtonDisabled(false);
      }, 1500);
    } catch (error) {
      console.error("Erreur lors du démarrage de la session:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du démarrage de la session.",
        variant: "destructive"
      });
      
      setTimeout(() => {
        setIsButtonDisabled(false);
      }, 1500);
    }
  }, [isStartingSession, isButtonDisabled, canStart, hasReachedLimit, timeRemaining, isBotActive, toast, dailyLimit, handleStartSession]);

  return (
    <Button
      variant="outline"
      className={`w-full bg-blue-600 hover:bg-blue-700 text-white ${className}`}
      disabled={isStartingSession || isButtonDisabled || !canStart()}
      onClick={handleClick}
    >
      {isStartingSession ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Génération en cours...
        </>
      ) : (
        <>
          <Play className="mr-2 h-4 w-4" />
          {timeRemaining !== null && timeRemaining > 0
            ? `Disponible dans ${timeRemaining}s`
            : hasReachedLimit
              ? `Limite quotidienne atteinte (${dailySessionCount}/${dailyLimit})`
              : `Démarrer une session (${dailySessionCount}/${dailyLimit})`
          }
        </>
      )}
    </Button>
  );
};

export default SessionButton;

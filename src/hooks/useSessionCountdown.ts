
import { useState, useEffect, useCallback } from 'react';
import { calculateTimeUntilMidnight } from '@/utils/timeUtils';

export const useSessionCountdown = (dailySessionCount: number, subscription: string) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);

  // Format le temps restant en heures:minutes:secondes
  const formatTimeLeft = useCallback((milliseconds: number): string => {
    if (milliseconds <= 0) return "00:00:00";
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    // Vérifier si nous devons afficher le compte à rebours (uniquement pour freemium avec session utilisée)
    const shouldCountdown = subscription === 'freemium' && dailySessionCount >= 1;
    setIsCountingDown(shouldCountdown);
    
    if (shouldCountdown) {
      // Initialiser le temps restant jusqu'à minuit
      setTimeLeft(calculateTimeUntilMidnight());
      
      // Mettre à jour le compte à rebours chaque seconde
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          const newValue = prev - 1000;
          if (newValue <= 0) {
            clearInterval(timer);
            // Réinitialisation après le délai
            setTimeout(() => {
              window.location.reload();
            }, 1000);
            return 0;
          }
          return newValue;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [dailySessionCount, subscription]);

  return {
    timeRemaining: formatTimeLeft(timeLeft),
    isCountingDown
  };
};

export default useSessionCountdown;


import { useState, useEffect, useCallback } from 'react';
import { calculateTimeUntilMidnight, getParisTime } from '@/utils/timeUtils';

export const useSessionCountdown = (
  dailySessionCount: number, 
  subscription: string, 
  lastSessionTimestamp?: string
) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);

  // Format remaining time in hours:minutes:seconds
  const formatTimeLeft = useCallback((milliseconds: number): string => {
    if (milliseconds <= 0) return "00:00:00";
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    // Only display countdown for freemium users with at least one used session
    const shouldCountdown = subscription === 'freemium' && dailySessionCount >= 1;
    setIsCountingDown(shouldCountdown);
    
    if (shouldCountdown) {
      let initialTimeLeft: number;
      
      if (lastSessionTimestamp) {
        // Calculate remaining time on a 24h period based on last session
        // Ensure we're working with a proper Date object
        const lastSessionTime = new Date(lastSessionTimestamp).getTime();
        const currentTime = Date.now();
        const elapsedTime = currentTime - lastSessionTime;
        const fullDayMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        initialTimeLeft = Math.max(0, fullDayMs - elapsedTime);
        
        // Store last session timestamp in localStorage for persistence
        try {
          localStorage.setItem('lastSessionTimestamp', lastSessionTimestamp);
          localStorage.setItem('lastSessionTime', lastSessionTime.toString());
          localStorage.setItem('countdownEndTime', (Date.now() + initialTimeLeft).toString());
        } catch (e) {
          console.error("Failed to store countdown data in localStorage:", e);
        }
      } else {
        // Try to get stored countdown data from localStorage
        try {
          const storedEndTime = localStorage.getItem('countdownEndTime');
          if (storedEndTime) {
            const endTime = parseInt(storedEndTime, 10);
            initialTimeLeft = Math.max(0, endTime - Date.now());
          } else {
            // Fallback: Initialize time until midnight
            initialTimeLeft = calculateTimeUntilMidnight();
          }
        } catch (e) {
          console.error("Failed to retrieve countdown data from localStorage:", e);
          // Fallback to midnight
          initialTimeLeft = calculateTimeUntilMidnight();
        }
      }
      
      setTimeLeft(initialTimeLeft);
      
      // Update countdown every second
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          const newValue = prev - 1000;
          if (newValue <= 0) {
            clearInterval(timer);
            // Reset after delay
            setTimeout(() => {
              window.location.reload();
            }, 1000);
            return 0;
          }
          
          // Store current countdown in localStorage for persistence
          try {
            localStorage.setItem('countdownEndTime', (Date.now() + newValue).toString());
          } catch (e) {
            console.error("Failed to update countdown data in localStorage:", e);
          }
          
          return newValue;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [dailySessionCount, subscription, lastSessionTimestamp]);

  return {
    timeRemaining: formatTimeLeft(timeLeft),
    isCountingDown
  };
};

export default useSessionCountdown;

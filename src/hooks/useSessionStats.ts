
import { useState, useEffect } from 'react';

export const useSessionStats = (userId: string | undefined) => {
  const [lastSessionTime, setLastSessionTime] = useState<Date | null>(null);
  const [sessionCount, setSessionCount] = useState<number>(0);
  
  // Load session stats from localStorage
  useEffect(() => {
    if (userId) {
      try {
        // Last session time
        const lastSessionTimeStr = localStorage.getItem(`lastSessionTime_${userId}`);
        if (lastSessionTimeStr) {
          setLastSessionTime(new Date(lastSessionTimeStr));
        }
        
        // Session count
        const sessionCountStr = localStorage.getItem(`sessionCount_${userId}`);
        if (sessionCountStr) {
          setSessionCount(parseInt(sessionCountStr, 10));
        }
      } catch (e) {
        console.error("Error loading session stats:", e);
      }
    }
  }, [userId]);
  
  // Update last session time
  const updateLastSessionTime = () => {
    const now = new Date();
    setLastSessionTime(now);
    
    if (userId) {
      try {
        localStorage.setItem(`lastSessionTime_${userId}`, now.toISOString());
      } catch (e) {
        console.error("Error saving last session time:", e);
      }
    }
  };
  
  // Increment session count
  const incrementSessionCount = () => {
    const newCount = sessionCount + 1;
    setSessionCount(newCount);
    
    if (userId) {
      try {
        localStorage.setItem(`sessionCount_${userId}`, newCount.toString());
      } catch (e) {
        console.error("Error saving session count:", e);
      }
    }
    
    return newCount;
  };
  
  // Reset session stats
  const resetSessionStats = () => {
    setLastSessionTime(null);
    setSessionCount(0);
    
    if (userId) {
      try {
        localStorage.removeItem(`lastSessionTime_${userId}`);
        localStorage.removeItem(`sessionCount_${userId}`);
      } catch (e) {
        console.error("Error resetting session stats:", e);
      }
    }
  };
  
  return {
    lastSessionTime,
    sessionCount,
    updateLastSessionTime,
    incrementSessionCount,
    resetSessionStats
  };
};

export default useSessionStats;

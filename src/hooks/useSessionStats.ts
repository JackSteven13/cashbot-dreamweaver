
import { useState, useEffect, useRef } from 'react';

export const useSessionStats = (userId: string | undefined) => {
  const [lastSessionTime, setLastSessionTime] = useState<Date | null>(null);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const todaysGainRef = useRef<number>(0);
  const [activityLevel, setActivityLevel] = useState<number>(0);
  
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
        
        // Today's gain
        const todaysGainStr = localStorage.getItem(`todaysGain_${userId}`);
        if (todaysGainStr) {
          todaysGainRef.current = parseFloat(todaysGainStr);
        }
        
        // Activity level
        const activityLevelStr = localStorage.getItem(`activityLevel_${userId}`);
        if (activityLevelStr) {
          setActivityLevel(parseInt(activityLevelStr, 10));
        } else {
          // Default activity level if none exists
          setActivityLevel(50);
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
    todaysGainRef.current = 0;
    
    if (userId) {
      try {
        localStorage.removeItem(`lastSessionTime_${userId}`);
        localStorage.removeItem(`sessionCount_${userId}`);
        localStorage.removeItem(`todaysGain_${userId}`);
      } catch (e) {
        console.error("Error resetting session stats:", e);
      }
    }
  };
  
  // Add session result (for tracking gains)
  const addSessionResult = (gain: number) => {
    if (!isNaN(gain) && gain > 0) {
      todaysGainRef.current += gain;
      
      // Increase activity level based on gain
      const newActivityLevel = Math.min(100, activityLevel + gain * 10);
      setActivityLevel(Math.floor(newActivityLevel));
      
      // Save to localStorage
      if (userId) {
        try {
          localStorage.setItem(`todaysGain_${userId}`, todaysGainRef.current.toString());
          localStorage.setItem(`activityLevel_${userId}`, Math.floor(newActivityLevel).toString());
        } catch (e) {
          console.error("Error saving session result:", e);
        }
      }
      
      return true;
    }
    return false;
  };
  
  return {
    lastSessionTime,
    sessionCount,
    updateLastSessionTime,
    incrementSessionCount,
    resetSessionStats,
    addSessionResult,
    todaysGainRef,
    activityLevel
  };
};

export default useSessionStats;

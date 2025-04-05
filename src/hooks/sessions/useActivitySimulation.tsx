
import { useState, useEffect, useRef } from 'react';
import { triggerDashboardEvent } from '@/utils/animations';

/**
 * Hook for simulating user activity in the dashboard
 * @returns The current activity level
 */
export const useActivitySimulation = () => {
  const [activityLevel, setActivityLevel] = useState(1); // 1-5 échelle d'activité
  const activityInterval = useRef<NodeJS.Timeout | null>(null);
  const sessionInProgress = useRef(false);

  // Effect for simulating periodic visible activity
  useEffect(() => {
    const simulateActivity = () => {
      const newActivityLevel = Math.floor(Math.random() * 5) + 1;
      setActivityLevel(newActivityLevel);
      
      // Trigger an activity event for animations
      triggerDashboardEvent('activity', { level: newActivityLevel });
      
      // For high activity levels, trigger a micro-animation
      if (newActivityLevel >= 4 && !sessionInProgress.current) {
        const microGain = (Math.random() * 0.01).toFixed(2);
        triggerDashboardEvent('micro-gain', { amount: parseFloat(microGain) });
      }
    };
    
    // Start the activity interval that runs more frequently than actual sessions
    activityInterval.current = setInterval(simulateActivity, 15000);
    
    return () => {
      if (activityInterval.current) {
        clearInterval(activityInterval.current);
      }
    };
  }, []);

  return {
    activityLevel,
    setSessionInProgress: (inProgress: boolean) => {
      sessionInProgress.current = inProgress;
    }
  };
};

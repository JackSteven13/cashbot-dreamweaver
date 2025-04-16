
import { useCallback } from 'react';
import { calculateTimeUntilMidnight } from '@/utils/timeUtils';

interface UseStatsCycleManagementParams {
  setAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setRevenueCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedAdsCount: React.Dispatch<React.SetStateAction<number>>;
  setDisplayedRevenueCount: React.Dispatch<React.SetStateAction<number>>;
  dailyAdsTarget: number;
  dailyRevenueTarget: number;
}

export const useStatsCycleManagement = ({
  setAdsCount,
  setRevenueCount,
  setDisplayedAdsCount,
  setDisplayedRevenueCount,
  dailyAdsTarget,
  dailyRevenueTarget
}: UseStatsCycleManagementParams) => {
  // Schedule cycle update at midnight, Paris time
  const scheduleCycleUpdate = useCallback(() => {
    const timeUntilMidnight = calculateTimeUntilMidnight();
    
    // Convert to hours for logs
    const hoursUntilMidnight = Math.floor(timeUntilMidnight / 1000 / 60 / 60);
    const minutesUntilMidnight = Math.floor((timeUntilMidnight / 1000 / 60) % 60);
    
    console.log(`Next counter reset in ${hoursUntilMidnight} hours and ${minutesUntilMidnight} minutes`);
    
    const resetTimeout = setTimeout(() => {
      // Reset counters at midnight, Paris time
      setAdsCount(0);
      setRevenueCount(0);
      setDisplayedAdsCount(0);
      setDisplayedRevenueCount(0);
      
      // Schedule next reset
      scheduleCycleUpdate();
    }, timeUntilMidnight);
    
    return resetTimeout;
  }, [setAdsCount, setRevenueCount, setDisplayedAdsCount, setDisplayedRevenueCount]);
  
  // Drastically slowed down simulation with minimal increments
  const incrementCountersRandomly = useCallback(() => {
    // Réduire encore plus le nombre d'agents actifs (1 seul agent la plupart du temps)
    const activeAgents = Math.random() > 0.75 ? 1 : 0; // 25% du temps seulement un agent actif, sinon aucun
    
    setAdsCount(prevAdsCount => {
      // Don't exceed daily target
      if (prevAdsCount >= dailyAdsTarget) return dailyAdsTarget;
      
      let totalAdsIncrement = 0;
      
      // Simulate each agent processing ads with extremely reduced efficiency
      for (let i = 0; i < activeAgents; i++) {
        // Variable ad duration drastically increased
        const agentEfficiency = 0.4 + Math.random() * 0.3; // 40% to 70% efficiency (reduced)
        // Drastically reduce ads per agent (10x reduction)
        const adsPerAgent = Math.floor((dailyAdsTarget * 0.000005) * agentEfficiency);
        totalAdsIncrement += adsPerAgent;
      }
      
      // Limit to avoid exceeding target
      const newAdsCount = Math.min(prevAdsCount + totalAdsIncrement, dailyAdsTarget);
      
      // Variable revenue generated by ads
      setRevenueCount(prevRevenueCount => {
        if (prevRevenueCount >= dailyRevenueTarget) return dailyRevenueTarget;
        
        let totalRevenueIncrement = 0;
        
        for (let i = 0; i < totalAdsIncrement; i++) {
          // Simulate different ad values
          let adValue;
          const adTypeRandom = Math.random();
          
          if (adTypeRandom > 0.97) {
            // Premium ads (3%)
            adValue = 2.20 + Math.random() * 1.10; // 2.20€ - 3.30€
          } else if (adTypeRandom > 0.85) {
            // Medium-high ads (12%)
            adValue = 1.10 + Math.random() * 1.10; // 1.10€ - 2.20€
          } else if (adTypeRandom > 0.60) {
            // Medium ads (25%)
            adValue = 0.70 + Math.random() * 0.40; // 0.70€ - 1.10€
          } else {
            // Standard ads (60%)
            adValue = 0.45 + Math.random() * 0.25; // 0.45€ - 0.70€
          }
          
          totalRevenueIncrement += adValue;
        }
        
        // Adjust total revenue to be consistent with daily target
        const adjustmentFactor = dailyRevenueTarget / dailyAdsTarget;
        totalRevenueIncrement = totalRevenueIncrement * adjustmentFactor * 0.8;
        
        return Math.min(prevRevenueCount + totalRevenueIncrement, dailyRevenueTarget);
      });
      
      return newAdsCount;
    });
  }, [dailyAdsTarget, dailyRevenueTarget, setAdsCount, setRevenueCount]);

  return {
    scheduleCycleUpdate,
    incrementCountersRandomly
  };
};

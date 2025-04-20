import { useState, useEffect } from 'react';
import { UserData } from '@/types/userData';
import balanceManager from '@/utils/balance/balanceManager';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

interface UseAutoSessionsProps {
  userData: UserData;
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
  setShowLimitAlert: (show: boolean) => void;
}

export const useAutoSessions = ({
  userData,
  updateBalance,
  setShowLimitAlert
}: UseAutoSessionsProps) => {
  // Initialize auto session state
  const [lastAutoSessionTime, setLastAutoSessionTime] = useState<Date>(new Date());
  const [activityLevel, setActivityLevel] = useState<number>(0);
  const [isBotActive, setIsBotActive] = useState<boolean>(false);
  
  // Effect to simulate bot activity
  useEffect(() => {
    // Only activate if user has a valid profile
    if (!userData?.profile?.id) return;
    
    // Start bot after a short delay
    const timeout = setTimeout(() => {
      setIsBotActive(true);
      console.log("Bot activated for automated revenue generation");
    }, 5000);
    
    // Update activity level periodically
    const activityInterval = setInterval(() => {
      setActivityLevel(prev => {
        const newLevel = Math.min(100, prev + Math.random() * 5);
        return Math.floor(newLevel);
      });
    }, 30000);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(activityInterval);
    };
  }, [userData?.profile?.id]);
  
  // Function to generate automatic revenue
  const generateAutomaticRevenue = async (): Promise<boolean> => {
    try {
      if (!isBotActive || !userData?.profile?.id) {
        return false;
      }
      
      // Calculate a small random gain based on subscription tier
      const baseGain = 0.01; // Base gain for freemium
      
      // Adjust gain based on subscription
      let multiplier = 1;
      switch (userData.subscription) {
        case 'premium':
          multiplier = 2.5;
          break;
        case 'pro':
          multiplier = 5;
          break;
        case 'ultimate':
          multiplier = 10;
          break;
      }
      
      // Add a small random variation
      const randomFactor = 0.8 + Math.random() * 0.4; // 80% - 120%
      const gain = baseGain * multiplier * randomFactor;
      
      // Format gain to 4 decimal places for consistency
      const formattedGain = parseFloat(gain.toFixed(4));
      
      // Check if adding this gain would exceed daily limit
      const currentDailyGains = balanceManager.getDailyGains();
      const dailyLimit = balanceManager.getDailyLimit(userData.subscription);
      
      if (currentDailyGains + formattedGain > dailyLimit) {
        // We've reached the daily limit
        setShowLimitAlert(true);
        return false;
      }
      
      // Update last session time
      setLastAutoSessionTime(new Date());
      
      // Add to balance and create transaction record
      await updateBalance(formattedGain, "Analyse automatique par le robot", false);
      
      // Update daily gains counter
      balanceManager.addDailyGain(formattedGain);
      
      return true;
    } catch (error) {
      console.error("Error generating automatic revenue:", error);
      return false;
    }
  };
  
  return {
    lastAutoSessionTime,
    activityLevel,
    isBotActive,
    generateAutomaticRevenue
  };
};

export default useAutoSessions;

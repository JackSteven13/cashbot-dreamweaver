
import { useState, useRef, useEffect, useCallback } from 'react';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import balanceManager from '@/utils/balance/balanceManager';
import { calculateSessionGain, generateSessionReport } from '@/utils/sessions';

interface UseAutoSessionsProps {
  userData: any;
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
  setShowLimitAlert: (show: boolean) => void;
}

export const useAutoSessions = ({ 
  userData, 
  updateBalance, 
  setShowLimitAlert 
}: UseAutoSessionsProps) => {
  const [lastAutoSessionTime, setLastAutoSessionTime] = useState<Date | null>(null);
  const [activityLevel, setActivityLevel] = useState<number>(0);
  const [isBotActive, setIsBotActive] = useState<boolean>(true);
  
  // Refs to track state across renders
  const todaysGainsRef = useRef<number>(0);
  const sessionCountRef = useRef<number>(0);
  const lastSessionTimeRef = useRef<number>(Date.now());
  const timeSinceLastSessionRef = useRef<number>(0);
  
  // Forced updates (for testing and debugging)
  const forceUpdate = useCallback(() => {
    const forceUpdateEvent = new CustomEvent('force-balance-update');
    window.dispatchEvent(forceUpdateEvent);
  }, []);
  
  // Function to generate automatic revenue with proper error handling
  const generateAutomaticRevenue = useCallback(async (isFirst?: boolean) => {
    if (!userData?.profile?.id) return;
    
    try {
      // Get current timestamp
      const now = Date.now();
      timeSinceLastSessionRef.current = now - lastSessionTimeRef.current;
      
      // Determine subscription type and daily limit
      const subscription = userData.subscription || 'freemium';
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Calculate session gain based on subscription
      const sessionGain = calculateSessionGain(subscription);
      
      // Generate report with details
      const sessionReport = generateSessionReport('Auto', subscription);
      
      // Update total daily gains
      todaysGainsRef.current += sessionGain;
      
      // Increment session count
      sessionCountRef.current++;
      
      // Check if we're approaching daily limit
      if (todaysGainsRef.current >= dailyLimit * 0.8) {
        setShowLimitAlert(true);
      }
      
      // Update last session time
      lastSessionTimeRef.current = now;
      setLastAutoSessionTime(new Date(now));
      
      // Update the balance
      await updateBalance(sessionGain, sessionReport, isFirst);
      
      // Update local balance through the balance manager
      balanceManager.updateBalance(sessionGain);
      
      // Directly trigger a UI update
      window.dispatchEvent(new CustomEvent('balance:update', {
        detail: {
          amount: sessionGain,
          currentBalance: balanceManager.getCurrentBalance(),
          animate: true
        }
      }));
      
      // Return success with gain
      return { success: true, gain: sessionGain };
    } catch (error) {
      console.error('Error generating automatic revenue:', error);
      return { success: false, error };
    }
  }, [userData, updateBalance, setShowLimitAlert]);
  
  // Effect to handle bot activity level
  useEffect(() => {
    // Start with moderate activity level
    setActivityLevel(3);
    
    // Listen for activity level changes
    const handleActivityChange = (event: CustomEvent) => {
      const newLevel = event.detail?.level;
      if (typeof newLevel === 'number' && newLevel >= 1 && newLevel <= 5) {
        setActivityLevel(newLevel);
      }
    };
    
    window.addEventListener('bot:activity-level' as any, handleActivityChange);
    
    // Listen for bot status changes
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        setIsBotActive(isActive);
      }
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    
    // Dashboard activity heartbeat - reactivate bot if needed
    const handleHeartbeat = () => {
      if (!isBotActive) {
        console.log('Dashboard heartbeat detected - activating bot');
        setIsBotActive(true);
      }
    };
    
    window.addEventListener('dashboard:heartbeat', handleHeartbeat);
    
    // Schedule auto sessions every 3-5 minutes when bot is active
    let autoSessionInterval: NodeJS.Timeout | null = null;
    
    if (isBotActive && userData?.profile?.id) {
      autoSessionInterval = setInterval(() => {
        console.log('Triggering automatic revenue generation');
        generateAutomaticRevenue();
      }, 180000 + Math.floor(Math.random() * 120000)); // 3-5 minutes
      
      // Initial revenue generation after a short delay
      setTimeout(() => {
        console.log('Initial automatic revenue generation');
        generateAutomaticRevenue(true);
      }, 5000);
    }
    
    // Force a small gain every ~20-30 seconds to show activity
    let microGainInterval: NodeJS.Timeout | null = null;
    
    if (isBotActive && userData?.profile?.id) {
      microGainInterval = setInterval(() => {
        const microGain = 0.01 + Math.random() * 0.02; // 0.01-0.03€
        console.log('Triggering micro-gain:', microGain.toFixed(2));
        
        // Update directly through the balance manager
        balanceManager.updateBalance(microGain);
        
        // Trigger UI update
        window.dispatchEvent(new CustomEvent('balance:update', {
          detail: {
            amount: microGain,
            currentBalance: balanceManager.getCurrentBalance(),
            animate: true
          }
        }));
        
        // Trigger a dashboard activity event
        window.dispatchEvent(new CustomEvent('dashboard:activity', { 
          detail: { timestamp: Date.now(), gain: microGain }
        }));
      }, 20000 + Math.floor(Math.random() * 10000)); // 20-30 seconds
    }
    
    return () => {
      window.removeEventListener('bot:activity-level' as any, handleActivityChange);
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('dashboard:heartbeat', handleHeartbeat);
      
      if (autoSessionInterval) clearInterval(autoSessionInterval);
      if (microGainInterval) clearInterval(microGainInterval);
    };
  }, [isBotActive, userData, generateAutomaticRevenue]);
  
  return {
    lastAutoSessionTime,
    activityLevel,
    generateAutomaticRevenue,
    isBotActive,
    forceUpdate
  };
};

export default useAutoSessions;

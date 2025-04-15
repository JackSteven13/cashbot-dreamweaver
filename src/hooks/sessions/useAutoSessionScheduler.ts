import { useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import balanceManager from '@/utils/balance/balanceManager';

export const useAutoSessionScheduler = (
  todaysGainsRef: React.MutableRefObject<number>,
  generateRevenue: (isFirst?: boolean) => Promise<void>,
  userData: any,
  isBotActive: boolean
) => {
  const lastAutoSessionTime = useRef<Date>(new Date());
  const autoSessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);
  const botStatusRef = useRef(isBotActive);
  
  // Keep reference in sync with prop
  useEffect(() => {
    botStatusRef.current = isBotActive;
  }, [isBotActive]);
  
  // Set up 24/7 operation with persistent state
  useEffect(() => {
    if (!userData?.profile?.id) {
      return; // Wait for user data to be available
    }
    
    // For 24/7 operation, immediately start if bot is active
    if (isInitialLoad.current && botStatusRef.current) {
      isInitialLoad.current = false;
      console.log("Initializing 24/7 AI operation...");
      
      // Restore persisted state if available
      const lastRunTime = localStorage.getItem(`lastAutoSessionTime_${userData.profile.id}`);
      
      if (lastRunTime) {
        lastAutoSessionTime.current = new Date(lastRunTime);
        console.log(`Restored last session time: ${lastAutoSessionTime.current.toISOString()}`);
      } else {
        console.log("No previous session time found, using current time");
      }
      
      // Check when last session ran to determine timing for next session
      const now = new Date();
      const timeSinceLastSession = now.getTime() - lastAutoSessionTime.current.getTime();
      const minTimeBetweenSessions = 10000; // 10 seconds minimum
      
      // If sufficient time has passed, run an immediate session
      if (timeSinceLastSession > minTimeBetweenSessions) {
        console.log("Starting immediate session after load");
        setTimeout(() => {
          if (botStatusRef.current) {
            generateRevenue(true)
              .catch(err => console.error("Error in immediate revenue generation:", err));
          }
        }, 1500);
      }
      
      // Schedule the next automatic session based on subscription level
      scheduleNextAutoSession(userData.subscription);
    }
    
    // Set up recurring scheduling
    const intervalRef = setInterval(() => {
      if (botStatusRef.current) {
        // Check for bot activity flag in localStorage as backup
        const storedStatus = localStorage.getItem(`botActive_${userData?.profile?.id}`);
        if (storedStatus === 'false') {
          botStatusRef.current = false;
          return;
        }
        
        // Schedule session if needed
        if (!autoSessionTimerRef.current) {
          scheduleNextAutoSession(userData.subscription);
        }
      }
    }, 30000); // Check every 30 seconds for scheduling needs
    
    return () => {
      clearInterval(intervalRef);
      if (autoSessionTimerRef.current) {
        clearTimeout(autoSessionTimerRef.current);
        autoSessionTimerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.profile?.id, generateRevenue]);
  
  // Function to schedule the next auto session
  const scheduleNextAutoSession = (subscription: string) => {
    if (!botStatusRef.current) {
      return; // Don't schedule if bot is inactive
    }
    
    if (autoSessionTimerRef.current) {
      clearTimeout(autoSessionTimerRef.current);
    }
    
    // Determine interval based on subscription
    let minInterval = 15000; // 15 seconds minimum
    let maxInterval = 30000; // 30 seconds maximum
    
    // Adjust intervals based on subscription level
    switch (subscription) {
      case 'premium':
        minInterval = 10000; // 10 seconds
        maxInterval = 20000; // 20 seconds
        break;
      case 'pro':
        minInterval = 8000; // 8 seconds
        maxInterval = 15000; // 15 seconds
        break;
      case 'business':
        minInterval = 5000; // 5 seconds
        maxInterval = 12000; // 12 seconds
        break;
      default: 
        // Default freemium timing
        break;
    }
    
    // Calculate random interval within range
    const interval = Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;
    
    // Schedule next session
    autoSessionTimerRef.current = setTimeout(() => {
      if (botStatusRef.current) {
        // Update last session time
        lastAutoSessionTime.current = new Date();
        
        // Persist last run time
        if (userData?.profile?.id) {
          localStorage.setItem(
            `lastAutoSessionTime_${userData.profile.id}`,
            lastAutoSessionTime.current.toISOString()
          );
        }
        
        // Generate revenue
        generateRevenue()
          .then(() => {
            // Schedule next session after completion
            autoSessionTimerRef.current = null;
            scheduleNextAutoSession(subscription);
          })
          .catch(error => {
            console.error("Error in auto revenue generation:", error);
            // Still schedule next session despite error
            autoSessionTimerRef.current = null;
            scheduleNextAutoSession(subscription);
          });
      }
    }, interval);
    
    console.log(`Next automatic session scheduled in ${interval/1000} seconds`);
  };
  
  // Return current functions and values
  const getLastAutoSessionTime = () => lastAutoSessionTime.current.toISOString();
  
  const getCurrentPersistentBalance = () => {
    return balanceManager.getCurrentBalance();
  };
  
  return {
    lastAutoSessionTime: lastAutoSessionTime.current,
    getLastAutoSessionTime,
    getCurrentPersistentBalance
  };
};

export default useAutoSessionScheduler;

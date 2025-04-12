
import { useEffect, useRef } from 'react';
import { UserData } from '@/types/userData';

export const usePeriodicChecks = (userData: UserData | null, refreshUserData: () => Promise<boolean>) => {
  const checkIntervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (!userData) return;
    
    // Run initial check
    const initialCheck = async () => {
      await refreshUserData();
    };
    
    // Set up periodic checks
    const setupPeriodicChecks = () => {
      // Clear any existing interval
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      
      // Set new interval (checking every 5 minutes)
      checkIntervalRef.current = window.setInterval(async () => {
        await refreshUserData();
      }, 5 * 60 * 1000); // 5 minutes
    };
    
    initialCheck();
    setupPeriodicChecks();
    
    // Clean up on unmount
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [userData, refreshUserData]);
};

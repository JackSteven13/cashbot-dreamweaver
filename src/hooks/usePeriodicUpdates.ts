
import { useEffect } from 'react';

export const usePeriodicUpdates = (
  userData: any,
  generateAutomaticRevenue: (forceUpdate?: boolean) => Promise<boolean>,
  lastProcessTime: number,
  setLastProcessTime: (time: number) => void,
  lastBalanceUpdate: number,
  forceBalanceRefresh: () => void
) => {
  useEffect(() => {
    if (userData) {
      const revenueInterval = setInterval(() => {
        const now = Date.now();
        
        if (now - lastProcessTime > 40000) {
          console.log("Génération de revenus automatique périodique");
          setLastProcessTime(now);
          generateAutomaticRevenue();
        }
        
        if (now - lastBalanceUpdate > 20000) { 
          forceBalanceRefresh();
        }
      }, 40000 + Math.random() * 15000);
      
      return () => clearInterval(revenueInterval);
    }
  }, [userData, generateAutomaticRevenue, lastProcessTime, lastBalanceUpdate, forceBalanceRefresh]);
};

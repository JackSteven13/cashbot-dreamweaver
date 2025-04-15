
import { useEffect, useState } from 'react';
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import balanceManager from '@/utils/balance/balanceManager';

interface UseAutomaticRevenueProps {
  userData: UserData | null;
  updateBalance: (gain: number, report: string) => Promise<void>;
}

export const useAutomaticRevenue = ({ userData, updateBalance }: UseAutomaticRevenueProps) => {
  const [automaticRevenue, setAutomaticRevenue] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastProcessed, setLastProcessed] = useState<Date | null>(null);

  // Configure the revenue generation
  useEffect(() => {
    const interval = setInterval(() => {
      // Process automatic revenue if user has an active subscription
      if (userData && ['starter', 'gold', 'elite'].includes(userData.subscription)) {
        processAutomaticRevenue();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [userData]);

  // Calculate potential automatic revenue based on subscription
  useEffect(() => {
    if (!userData) return;
    
    const baseRevenue = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0;
    const referralBonus = (userData.referrals?.filter(r => r.status === 'active').length || 0) * 0.1;
    
    const calculatedRevenue = baseRevenue * 0.01 + referralBonus;
    setAutomaticRevenue(parseFloat(calculatedRevenue.toFixed(2)));
  }, [userData]);

  // Process automatic revenue addition
  const processAutomaticRevenue = async () => {
    if (!userData || isProcessing) return;
    
    // Check if enough time has passed since last processed
    const now = new Date();
    if (lastProcessed && now.getTime() - lastProcessed.getTime() < 3600000) {
      // Less than 1 hour since last processed
      return;
    }
    
    try {
      setIsProcessing(true);
      
      const revenueAmount = automaticRevenue;
      if (revenueAmount > 0) {
        // Update balance
        await updateBalance(revenueAmount, "Revenu automatique");
        
        // Add to daily gains
        balanceManager.addDailyGain(revenueAmount);
        
        // Update last processed time
        setLastProcessed(new Date());
      }
    } catch (error) {
      console.error("Error processing automatic revenue:", error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return {
    automaticRevenue,
    isProcessing,
    lastProcessed
  };
};

export default useAutomaticRevenue;


import { useEffect, useState, useRef } from 'react';
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import balanceManager from '@/utils/balance/balanceManager';
import { useAutomaticRevenueTransactions } from './useAutomaticRevenueTransactions';

interface UseAutomaticRevenueProps {
  userData: UserData | null;
  updateBalance: (gain: number, report: string) => Promise<void>;
}

export const useAutomaticRevenue = ({ userData, updateBalance }: UseAutomaticRevenueProps) => {
  const [automaticRevenue, setAutomaticRevenue] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastProcessed, setLastProcessed] = useState<Date | null>(null);
  const processingTimeoutRef = useRef<number | null>(null);
  const { recordAutomaticTransaction } = useAutomaticRevenueTransactions();

  // Calculate potential automatic revenue based on subscription
  useEffect(() => {
    if (!userData) return;
    
    const baseRevenue = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0;
    const referralBonus = (userData.referrals?.filter(r => r.status === 'active').length || 0) * 0.1;
    
    const calculatedRevenue = baseRevenue * 0.01 + referralBonus;
    setAutomaticRevenue(parseFloat(calculatedRevenue.toFixed(2)));
  }, [userData]);

  // Configure the revenue generation - this runs every 2-3 minutes
  useEffect(() => {
    const scheduleNextRevenue = () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      
      // Random interval between 120-180 seconds (2-3 minutes)
      const nextInterval = Math.floor(Math.random() * 60000) + 120000;
      
      processingTimeoutRef.current = window.setTimeout(() => {
        // Process automatic revenue if user has an active subscription
        if (userData && ['starter', 'gold', 'elite'].includes(userData.subscription)) {
          processAutomaticRevenue();
        }
        // Schedule the next revenue generation
        scheduleNextRevenue();
      }, nextInterval);
    };
    
    // Start the process
    scheduleNextRevenue();
    
    // Clean up on unmount
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, [userData]);

  // Process automatic revenue addition
  const processAutomaticRevenue = async () => {
    if (!userData || isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      const revenueAmount = automaticRevenue;
      if (revenueAmount > 0) {
        console.log(`Processing automatic revenue: ${revenueAmount}€`);
        
        // Update balance
        await updateBalance(revenueAmount, "Revenu automatique");
        
        // Record the transaction explicitly
        recordAutomaticTransaction(revenueAmount);
        
        // Add to daily gains
        balanceManager.addDailyGain(revenueAmount);
        
        // Update last processed time
        setLastProcessed(new Date());
        
        // Dispatch event for animations and UI updates
        window.dispatchEvent(new CustomEvent('automatic:revenue', { 
          detail: { 
            amount: revenueAmount, 
            timestamp: Date.now(),
            animate: true
          }
        }));
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

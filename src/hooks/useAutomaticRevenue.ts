
import { useState, useEffect, useCallback, useRef } from 'react';
import { UserData } from '@/types/userData';
import useAutomaticRevenueTransactions from './useAutomaticRevenueTransactions';

interface AutomaticRevenueProps {
  userData: UserData | null;
  updateBalance: (gain: number, report: string) => Promise<void>;
}

export const useAutomaticRevenue = ({ userData, updateBalance }: AutomaticRevenueProps) => {
  const [lastRevenueTime, setLastRevenueTime] = useState<Date | null>(null);
  const [automaticRevenue, setAutomaticRevenue] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const generationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { recordAutomaticTransaction } = useAutomaticRevenueTransactions();
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
    };
  }, []);
  
  // Function to generate automatic revenue
  const processAutomaticRevenue = useCallback(async () => {
    if (isGenerating || !userData) return;
    
    setIsGenerating(true);
    
    try {
      const now = new Date();
      const subscription = userData.subscription || 'freemium';
      
      // Calculate a random gain amount based on subscription level
      let baseAmount = 0;
      
      switch (subscription) {
        case 'premium':
          baseAmount = 0.2;
          break;
        case 'professional':
          baseAmount = 0.4;
          break;
        case 'freemium':
        default:
          baseAmount = 0.1;
          break;
      }
      
      // Add some randomness to the gain amount (±20%)
      const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
      const gain = parseFloat((baseAmount * randomFactor).toFixed(2));
      
      console.log(`Generating automatic revenue: ${gain}€`);
      
      // Update UI with the generated revenue
      setAutomaticRevenue(prev => parseFloat((prev + gain).toFixed(2)));
      setLastRevenueTime(now);
      
      // Trigger the balance update animation
      window.dispatchEvent(new CustomEvent('automatic:revenue', { 
        detail: { amount: gain, automatic: true, timestamp: now.getTime() }
      }));
      
      // Record the transaction
      await recordAutomaticTransaction(gain);
      
      // Update the balance
      await updateBalance(gain, "Revenu automatique");
      
    } catch (error) {
      console.error("Error generating automatic revenue:", error);
    } finally {
      setIsGenerating(false);
      
      // Schedule the next revenue generation (2-3 minutes)
      const nextInterval = 120000 + Math.random() * 60000; // 2-3 minutes
      
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
      
      generationTimeoutRef.current = setTimeout(() => {
        processAutomaticRevenue();
      }, nextInterval);
    }
  }, [isGenerating, userData, updateBalance, recordAutomaticTransaction]);
  
  // Set up the initial timer for revenue generation
  useEffect(() => {
    if (userData && !isGenerating) {
      console.log("Setting up automatic revenue generation");
      
      // Initial random delay (10-30 seconds) to start the process
      const initialDelay = 10000 + Math.random() * 20000;
      
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
      
      generationTimeoutRef.current = setTimeout(() => {
        processAutomaticRevenue();
      }, initialDelay);
    }
    
    return () => {
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
    };
  }, [userData, isGenerating, processAutomaticRevenue]);
  
  // Listen for dashboard heartbeat to ensure revenue generation stays active
  useEffect(() => {
    const handleHeartbeat = () => {
      // If it's been more than 5 minutes since the last revenue generation, force a new one
      if (lastRevenueTime && (new Date().getTime() - lastRevenueTime.getTime() > 300000)) {
        console.log("Heartbeat detected long pause in revenue generation, restarting...");
        processAutomaticRevenue();
      }
    };
    
    window.addEventListener('dashboard:heartbeat', handleHeartbeat);
    
    return () => {
      window.removeEventListener('dashboard:heartbeat', handleHeartbeat);
    };
  }, [lastRevenueTime, processAutomaticRevenue]);
  
  return { automaticRevenue, lastRevenueTime, processAutomaticRevenue };
};

export default useAutomaticRevenue;

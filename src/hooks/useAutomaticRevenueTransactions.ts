
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook to manage automatic revenue transactions
 * Ensures that every automatic revenue is properly recorded as a transaction
 */
export const useAutomaticRevenueTransactions = () => {
  const { user } = useAuth();
  const [lastTransactionTime, setLastTransactionTime] = useState<Date | null>(null);
  const intervalRef = useRef<number | null>(null);
  const isProcessing = useRef(false);
  
  // Create a transaction for automatic revenue
  const recordAutomaticTransaction = useCallback(async (amount: number) => {
    if (!user || isProcessing.current || amount <= 0) return;
    
    try {
      isProcessing.current = true;
      
      // Insert the transaction into the database
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          gain: amount,
          report: 'Revenu automatique',
          date: new Date().toISOString().split('T')[0]
        });
      
      if (error) {
        console.error("Error recording automatic transaction:", error);
        return;
      }
      
      // Update last transaction time
      setLastTransactionTime(new Date());
      
      // Trigger an event to refresh the transactions list
      window.dispatchEvent(new CustomEvent('transactions:refresh', { 
        detail: { timestamp: Date.now() }
      }));
      
      // Trigger an event for balance update animation
      window.dispatchEvent(new CustomEvent('balance:update', { 
        detail: { gain: amount, automatic: true }
      }));
      
      console.log(`Automatic revenue transaction recorded: ${amount}€`);
    } catch (error) {
      console.error("Failed to record automatic transaction:", error);
    } finally {
      isProcessing.current = false;
    }
  }, [user]);
  
  // Listen for automatic revenue events
  useEffect(() => {
    const handleAutomaticRevenue = (event: Event) => {
      if (event instanceof CustomEvent && event.detail) {
        const { amount } = event.detail;
        if (typeof amount === 'number' && amount > 0) {
          recordAutomaticTransaction(amount);
        }
      }
    };
    
    window.addEventListener('automatic:revenue', handleAutomaticRevenue as EventListener);
    
    return () => {
      window.removeEventListener('automatic:revenue', handleAutomaticRevenue as EventListener);
    };
  }, [recordAutomaticTransaction]);
  
  return {
    recordAutomaticTransaction,
    lastTransactionTime
  };
};

export default useAutomaticRevenueTransactions;


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
  const processingQueue = useRef<Array<number>>([]);
  
  // Process the queue periodically to handle any pending transactions
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      if (processingQueue.current.length > 0 && !isProcessing.current) {
        const amount = processingQueue.current.shift();
        if (amount && amount > 0) {
          recordAutomaticTransaction(amount);
        }
      }
    }, 5000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Create a transaction for automatic revenue
  const recordAutomaticTransaction = useCallback(async (amount: number) => {
    if (!user) {
      // Queue the transaction for when the user is available
      processingQueue.current.push(amount);
      return;
    }
    
    if (isProcessing.current) {
      // Queue the transaction for later processing
      processingQueue.current.push(amount);
      return;
    }
    
    if (amount <= 0) return;
    
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
        })
        .select();
      
      if (error) {
        console.error("Error recording automatic transaction:", error);
        // Re-queue the transaction on error
        processingQueue.current.push(amount);
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
      
      console.log(`Automatic revenue transaction recorded: ${amount}€`, data);
    } catch (error) {
      console.error("Failed to record automatic transaction:", error);
      // Re-queue the transaction on error
      processingQueue.current.push(amount);
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
    lastTransactionTime,
    queueLength: processingQueue.current.length
  };
};

export default useAutomaticRevenueTransactions;

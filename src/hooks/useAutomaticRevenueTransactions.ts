
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription/constants';
import balanceManager from '@/utils/balance/balanceManager';

/**
 * Hook to manage automatic revenue transactions
 * Ensures that every automatic revenue is properly recorded as a transaction
 * and respects daily limits
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
  
  // Vérifier si le gain respecte la limite quotidienne de façon stricte
  const respectsDailyLimit = useCallback(async (userId: string, subscription: string, potentialGain: number): Promise<{allowed: boolean, adjustedGain: number}> => {
    // Récupérer la limite quotidienne basée sur l'abonnement
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Obtenir la date d'aujourd'hui au format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // Récupérer les transactions d'aujourd'hui depuis la base de données pour vérification stricte
    const { data: todaysTransactions } = await supabase
      .from('transactions')
      .select('gain')
      .eq('user_id', userId)
      .like('date', `${today}%`);
    
    // Calculer les gains totaux d'aujourd'hui
    const todaysGains = (todaysTransactions || []).reduce((sum, tx) => sum + (tx.gain || 0), 0);
    
    console.log(`Vérification limite journalière: ${todaysGains.toFixed(3)}€/${dailyLimit}€, gain potentiel: ${potentialGain.toFixed(3)}€`);
    
    // STRICT: Si déjà à 98% du maximum, ne pas autoriser plus de gains du tout
    if (todaysGains >= dailyLimit * 0.98) {
      console.log(`LIMITE STRICTE ATTEINTE: ${todaysGains.toFixed(3)}€/${dailyLimit}€`);
      // Déclencher un événement pour informer les autres composants
      window.dispatchEvent(new CustomEvent('daily-limit:reached', { 
        detail: { subscription, limit: dailyLimit, currentGains: todaysGains }
      }));
      
      // Mettre à jour les gains quotidiens dans le gestionnaire local
      balanceManager.setDailyGains(todaysGains);
      
      return { allowed: false, adjustedGain: 0 };
    }
    
    // Si le gain dépasse la limite, l'ajuster strictement
    if (todaysGains + potentialGain > dailyLimit) {
      const adjustedGain = Math.max(0, Math.min(dailyLimit - todaysGains, dailyLimit * 0.05));
      
      // Si l'ajustement est insignifiant (<1 centime), ne pas autoriser le gain
      if (adjustedGain < 0.01) {
        return { allowed: false, adjustedGain: 0 };
      }
      
      console.log(`Gain ajusté: ${potentialGain.toFixed(3)}€ -> ${adjustedGain.toFixed(3)}€`);
      return { allowed: true, adjustedGain: Number(adjustedGain.toFixed(3)) };
    }
    
    // Gain autorisé sans ajustement
    return { allowed: true, adjustedGain: potentialGain };
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
      
      // Format today's date consistently
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Récupérer l'abonnement actuel de l'utilisateur
      const { data: userData } = await supabase
        .from('user_balances')
        .select('subscription')
        .eq('id', user.id)
        .single();
      
      const subscription = userData?.subscription || 'freemium';
      
      // STRICT: Vérifier si le gain respecte la limite quotidienne avec DB query
      const { allowed, adjustedGain } = await respectsDailyLimit(user.id, subscription, amount);
      
      // Si le gain n'est pas autorisé ou est ajusté à zéro, ne pas créer de transaction
      if (!allowed || adjustedGain <= 0) {
        console.log(`Gain automatique refusé: limite journalière atteinte pour ${subscription}`);
        isProcessing.current = false;
        
        // Déclencher un événement pour indiquer que la limite est atteinte
        window.dispatchEvent(new CustomEvent('bot:limit-reached', { 
          detail: { subscription, timestamp: Date.now() }
        }));
        
        return;
      }
      
      // Si le gain a été ajusté, utiliser la valeur ajustée
      const finalAmount = adjustedGain;
      
      // Mettre à jour la valeur des gains journaliers dans le gestionnaire de solde
      balanceManager.addDailyGain(finalAmount);
      
      // Insert the transaction into the database
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          gain: finalAmount,
          report: 'Revenu automatique',
          date: formattedDate,
          created_at: today.toISOString() // Include full timestamp
        })
        .select();
      
      if (error) {
        console.error("Error recording automatic transaction:", error);
        // Re-queue the transaction on error
        processingQueue.current.push(amount);
        return;
      }
      
      console.log(`Automatic transaction recorded successfully: ${finalAmount}€`, data);
      
      // Update last transaction time
      setLastTransactionTime(today);
      
      // Trigger multiple events to ensure proper synchronization
      window.dispatchEvent(new CustomEvent('transactions:refresh', { 
        detail: { timestamp: Date.now() }
      }));
      
      // Trigger an event for balance update animation
      window.dispatchEvent(new CustomEvent('balance:update', { 
        detail: { gain: finalAmount, automatic: true }
      }));
      
      // Nouvelle notification pour informer que les transactions ont été mises à jour
      window.dispatchEvent(new CustomEvent('transactions:updated', { 
        detail: { gain: finalAmount, timestamp: Date.now() }
      }));
      
      // Délai court avant de mettre à jour les transactions pour laisser le temps à la base de données de se mettre à jour
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('transactions:refresh', { 
          detail: { timestamp: Date.now() + 100 }
        }));
      }, 300);
    } catch (error) {
      console.error("Failed to record automatic transaction:", error);
      // Re-queue the transaction on error
      processingQueue.current.push(amount);
    } finally {
      isProcessing.current = false;
    }
  }, [user, respectsDailyLimit]);
  
  // Listen for automatic revenue events
  useEffect(() => {
    const handleAutomaticRevenue = (event: Event) => {
      if (event instanceof CustomEvent && event.detail) {
        const { amount } = event.detail;
        if (typeof amount === 'number' && amount > 0) {
          console.log(`Recording automatic revenue transaction: ${amount}€`);
          recordAutomaticTransaction(amount);
        }
      }
    };
    
    window.addEventListener('automatic:revenue', handleAutomaticRevenue as EventListener);
    window.addEventListener('dashboard:micro-gain', handleAutomaticRevenue as EventListener);
    
    return () => {
      window.removeEventListener('automatic:revenue', handleAutomaticRevenue as EventListener);
      window.removeEventListener('dashboard:micro-gain', handleAutomaticRevenue as EventListener);
    };
  }, [recordAutomaticTransaction]);
  
  return {
    recordAutomaticTransaction,
    lastTransactionTime,
    queueLength: processingQueue.current.length
  };
};

export default useAutomaticRevenueTransactions;

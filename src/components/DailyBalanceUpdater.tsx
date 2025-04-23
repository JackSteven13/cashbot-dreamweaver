
import { useEffect } from 'react';
import { useDailyReset } from '@/hooks/useDailyReset';
import balanceManager from '@/utils/balance/balanceManager';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

/**
 * Component that handles automatic balance updates and daily resets
 * This component doesn't render anything but handles background processes
 */
const DailyBalanceUpdater = () => {
  const { resetAtMidnight } = useDailyReset();
  const { user } = useAuth();

  // Check for missed daily reset when component mounts
  useEffect(() => {
    // Check if we've already reset today
    const lastResetDate = localStorage.getItem('lastDailyGainsReset');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // If last reset was not today, force a reset
    if (lastResetDate !== today) {
      console.log('Daily reset needed on mount - last reset:', lastResetDate);
      resetAtMidnight();
    }
  }, [resetAtMidnight]);

  // Set up background balance incrementation process
  useEffect(() => {
    if (!user) return;
    
    const userId = user.id;
    const subscription = localStorage.getItem(`subscription_${userId}`) || 'freemium';
    
    // Don't increment for freemium users when not interacting with the app
    if (subscription === 'freemium') return;
    
    // Determine increment rate based on subscription
    const getRatePerMinute = () => {
      switch (subscription) {
        case 'starter': return 0.002; // ~2.88€ per day
        case 'gold': return 0.005;    // ~7.2€ per day
        case 'elite': return 0.008;   // ~11.52€ per day
        default: return 0;
      }
    };
    
    const ratePerMinute = getRatePerMinute();
    
    // Only proceed if we have a positive rate
    if (ratePerMinute <= 0) return;
    
    console.log(`Setting up automatic balance incrementation for ${subscription} user at ${ratePerMinute}€ per minute`);
    
    // Set up an interval to update the balance every minute
    const intervalId = setInterval(async () => {
      try {
        // Get current daily gains
        const dailyGains = balanceManager.getDailyGains();
        
        // Get daily limit based on subscription
        const getDailyLimit = () => {
          switch (subscription) {
            case 'starter': return 2.5;
            case 'gold': return 7.5;
            case 'elite': return 12;
            default: return 0.5;
          }
        };
        
        const dailyLimit = getDailyLimit();
        
        // Only increment if we haven't reached the daily limit
        if (dailyGains < dailyLimit) {
          // Calculate how much we can add without exceeding the daily limit
          const amountToAdd = Math.min(ratePerMinute, dailyLimit - dailyGains);
          
          if (amountToAdd > 0) {
            // Update the local balance
            balanceManager.updateBalance(amountToAdd);
            balanceManager.addDailyGain(amountToAdd);
            
            console.log(`Auto-incremented balance by ${amountToAdd}€ (Daily: ${dailyGains + amountToAdd}€ / ${dailyLimit}€)`);
            
            // Update database in the background (don't wait for it to complete)
            supabase
              .from('user_balances')
              .update({ 
                balance: balanceManager.getCurrentBalance(),
                updated_at: new Date().toISOString()
              })
              .eq('id', userId)
              .then(({ error }) => {
                if (error) console.error('Error updating balance in database:', error);
              });
              
            // Add transaction record (don't wait for it to complete)
            supabase
              .from('transactions')
              .insert({
                user_id: userId,
                gain: amountToAdd,
                report: 'Gain passif automatique',
                date: new Date().toISOString().split('T')[0]
              })
              .then(({ error }) => {
                if (error) console.error('Error adding transaction record:', error);
              });
              
            // Dispatch event for UI components
            window.dispatchEvent(new CustomEvent('balance:update', {
              detail: {
                amount: amountToAdd,
                newBalance: balanceManager.getCurrentBalance(),
                animate: false,
                userId
              }
            }));
          }
        } else {
          console.log(`Daily limit reached (${dailyGains}€ / ${dailyLimit}€), skipping auto-increment`);
        }
      } catch (error) {
        console.error('Error in automatic balance incrementation:', error);
      }
    }, 60000); // Every minute
    
    return () => clearInterval(intervalId);
  }, [user]);

  // Listen for app resume events
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!user) return;
      
      if (document.visibilityState === 'visible') {
        console.log('App resumed from background, syncing data...');
        
        // Sync user data when app becomes visible again
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            const userId = session.user.id;
            
            // Get current local balance
            const localBalance = balanceManager.getCurrentBalance();
            
            // Get database balance
            const { data, error } = await supabase
              .from('user_balances')
              .select('balance, subscription')
              .eq('id', userId)
              .maybeSingle();
              
            if (error) {
              console.error('Error fetching balance from database:', error);
              return;
            }
            
            if (data) {
              const dbBalance = data.balance;
              
              // Use highest balance to avoid user frustration
              const finalBalance = Math.max(localBalance, dbBalance);
              
              if (Math.abs(finalBalance - localBalance) > 0.01) {
                console.log(`Syncing balance from database: ${localBalance}€ -> ${finalBalance}€`);
                balanceManager.forceBalanceSync(finalBalance, userId);
                
                // Update the UI
                window.dispatchEvent(new CustomEvent('balance:force-update', {
                  detail: {
                    newBalance: finalBalance,
                    userId,
                    animate: true
                  }
                }));
                
                // Only show a toast if there's a significant increase
                if (finalBalance - localBalance > 0.1) {
                  toast({
                    title: "Gains passifs",
                    description: `Vous avez généré ${(finalBalance - localBalance).toFixed(2)}€ pendant votre absence`,
                    duration: 4000
                  });
                }
              }
            }
          }
        } catch (error) {
          console.error('Error syncing data on resume:', error);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // This component doesn't render anything
  return null;
};

export default DailyBalanceUpdater;


import { useEffect } from 'react';
import { UserData } from '@/types/userData';
import { supabase } from "@/integrations/supabase/client";

export const useMidnightReset = (
  userData: UserData,
  incrementSessionCount: () => Promise<void>,
  updateBalance: (gain: number, report: string) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void
) => {
  // Reset sessions and balances every 14 days at midnight Paris time
  useEffect(() => {
    const checkMidnightReset = async () => {
      try {
        const now = new Date();
        const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
        
        // 1. Check if it's midnight in Paris
        if (parisTime.getHours() === 0 && parisTime.getMinutes() === 0) {
          // 2. Check if it's a 14-day interval (1st, 15th, 29th of month)
          if ([1, 15, 29].includes(parisTime.getDate())) {
            console.log("14-day reset triggered at Paris midnight on day:", parisTime.getDate());
            
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            
            try {
              // Reset session count for all users
              const { error: updateError } = await supabase
                .from('user_balances')
                .update({ 
                  daily_session_count: 0,
                  updated_at: new Date().toISOString()
                })
                .eq('id', session.user.id);
                
              if (updateError) {
                console.error("Error resetting session count:", updateError);
              }
              
              await incrementSessionCount(); // This will reset to 0 in our function
              
              // Also reset balance for freemium accounts
              if (userData.subscription === 'freemium') {
                const { error: balanceError } = await supabase
                  .from('user_balances')
                  .update({ 
                    balance: 0,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', session.user.id)
                  .eq('subscription', 'freemium');
                  
                if (balanceError) {
                  console.error("Error resetting freemium balance:", balanceError);
                }
                
                await updateBalance(0, ''); // This will reset balance to 0
                setShowLimitAlert(false);
              }
            } catch (error) {
              console.error("Error in bi-weekly reset:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error checking reset:", error);
      }
    };
    
    // Check every minute for reset
    const resetInterval = setInterval(checkMidnightReset, 60000);
    
    return () => clearInterval(resetInterval);
  }, [userData.subscription, incrementSessionCount, updateBalance, setShowLimitAlert]);
};

export default useMidnightReset;

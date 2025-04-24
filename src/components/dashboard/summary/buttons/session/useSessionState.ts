
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSessionState = (
  userId?: string,
  subscription = 'freemium',
  dailySessionCount = 0
) => {
  const [forceDisabled, setForceDisabled] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [lastDbCheck, setLastDbCheck] = useState(0);

  const checkDatabaseSessionCount = async () => {
    if (!userId || isValidating || Date.now() - lastDbCheck < 5000) return;
    
    try {
      setIsValidating(true);
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .like('created_at', `${today}%`)
        .like('report', '%Session%');
      
      if (!error && data) {
        const actualSessionCount = data.length;
        
        if (subscription === 'freemium' && actualSessionCount >= 1) {
          console.log("DB check: Freemium limit reached", actualSessionCount);
          setForceDisabled(true);
          localStorage.setItem(`freemium_daily_limit_reached_${userId}`, 'true');
          localStorage.setItem(`last_session_date_${userId}`, new Date().toDateString());
          
          if (actualSessionCount > dailySessionCount) {
            localStorage.setItem(`dailySessionCount_${userId}`, String(actualSessionCount));
          }
        }
      }
      
      setLastDbCheck(Date.now());
    } catch (err) {
      console.error("Error checking DB session count:", err);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    const checkFreemiumLimit = () => {
      if (subscription === 'freemium') {
        const limitReached = localStorage.getItem(`freemium_daily_limit_reached_${userId}`);
        const lastSessionDate = localStorage.getItem(`last_session_date_${userId}`);
        const today = new Date().toDateString();
        
        if (lastSessionDate !== today) {
          localStorage.removeItem(`freemium_daily_limit_reached_${userId}`);
          setForceDisabled(false);
        } else if (limitReached === 'true' || dailySessionCount >= 1) {
          setForceDisabled(true);
        } else {
          setForceDisabled(false);
          checkDatabaseSessionCount();
        }
      } else {
        setForceDisabled(false);
      }
    };
    
    checkFreemiumLimit();
    
    const intervalId = setInterval(checkFreemiumLimit, 5000);
    return () => clearInterval(intervalId);
  }, [subscription, dailySessionCount, userId]);

  return {
    forceDisabled,
    isValidating,
    lastDbCheck
  };
};

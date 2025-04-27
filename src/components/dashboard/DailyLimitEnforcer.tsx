
import { FC, useEffect } from 'react';
import balanceManager from '@/utils/balance/balanceManager';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { useAuth } from '@/hooks/useAuth';

/**
 * This component doesn't render anything but acts as a global limit enforcer
 * It runs checks to ensure the daily limit is never exceeded
 */
const DailyLimitEnforcer: FC = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user?.id) return;
    
    // Make sure balance manager has the current user ID
    balanceManager.setUserId(user.id);
    
    // Function to check and enforce daily limits
    const enforceLimit = () => {
      // Get current subscription from localStorage
      const currentSubscription = localStorage.getItem('currentSubscription') || 'freemium';
      
      // Get daily limit for the subscription
      const dailyLimit = SUBSCRIPTION_LIMITS[currentSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Get current daily gains
      const dailyGains = balanceManager.getDailyGains();
      
      // If daily gains exceed the limit by any amount, enforce the limit
      if (dailyGains > dailyLimit) {
        console.warn(`🛑 DAILY LIMIT ENFORCER: Gains (${dailyGains}€) exceed limit (${dailyLimit}€). Enforcing limit.`);
        
        // Set daily gains to exactly the limit
        balanceManager.setDailyGains(dailyLimit * 0.999);
        
        // Mark limit as reached
        localStorage.setItem(`daily_limit_reached_${user.id}`, 'true');
        
        if (currentSubscription === 'freemium') {
          localStorage.setItem(`freemium_daily_limit_reached_${user.id}`, 'true');
        }
        
        // Broadcast enforcement event
        window.dispatchEvent(new CustomEvent('daily-limit:enforced', {
          detail: {
            userId: user.id,
            originalGains: dailyGains,
            enforcedGains: dailyLimit * 0.999,
            limit: dailyLimit
          }
        }));
      }
    };
    
    // Run immediately
    enforceLimit();
    
    // Then check periodically
    const intervalId = setInterval(enforceLimit, 15000); // Check every 15 seconds
    
    // Listen for balance updates to check immediately
    const handleBalanceUpdate = () => {
      enforceLimit();
    };
    
    window.addEventListener('balance:update', handleBalanceUpdate);
    window.addEventListener('balance:forced-sync', handleBalanceUpdate);
    window.addEventListener('daily-limit:check-all', handleBalanceUpdate);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('balance:update', handleBalanceUpdate);
      window.removeEventListener('balance:forced-sync', handleBalanceUpdate);
      window.removeEventListener('daily-limit:check-all', handleBalanceUpdate);
    };
  }, [user]);
  
  // This component doesn't render anything
  return null;
};

export default DailyLimitEnforcer;

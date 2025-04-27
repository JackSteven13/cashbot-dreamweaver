
import { useState, useEffect, useRef } from 'react';
import { useUserSession } from '@/hooks/useUserSession';
import { toast } from '@/components/ui/use-toast';
import balanceManager from '@/utils/balance/balanceManager';

export const useDashboardInitialization = () => {
  const { userData, session } = useUserSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const initAttemptsRef = useRef(0);
  
  // Initialize dashboard data
  useEffect(() => {
    if (isInitialized || !userData) return;
    
    const initDashboard = async () => {
      try {
        // Limit init attempts
        if (initAttemptsRef.current > 2) return;
        initAttemptsRef.current++;
        
        console.info("Initial load of dashboard data");
        
        // Get user information
        const { profile } = userData;
        let displayName = profile?.full_name || profile?.username || "Utilisateur";
        
        // Set user display name
        setUsername(displayName);
        
        // Initialize balance manager
        if (profile?.id) {
          balanceManager.setUserId(profile.id);
          
          // Get balance from userData if available
          if (userData.balance !== undefined && !isNaN(userData.balance)) {
            balanceManager.forceBalanceSync(userData.balance, profile.id);
          }
          
          // Otherwise try to load from localStorage
          else {
            const cachedBalance = parseFloat(localStorage.getItem(`lastKnownBalance_${profile.id}`) || '0');
            if (cachedBalance > 0) {
              balanceManager.forceBalanceSync(cachedBalance, profile.id);
            }
          }
        }
        
        // Mark initialization as complete
        setIsInitialized(true);
        setIsLoading(false);
        
        // Notify user when ready
        setTimeout(() => {
          toast({
            title: `Bienvenue, ${displayName}!`,
            description: "Votre tableau de bord est prêt.",
            duration: 3000,
          });
        }, 1000);
      } catch (error) {
        console.error("Failed to initialize dashboard:", error);
        setIsLoading(false);
      }
    };
    
    initDashboard();
  }, [userData, isInitialized]);
  
  return {
    isInitialized,
    username,
    userData,
    isLoading
  };
};

export default useDashboardInitialization;

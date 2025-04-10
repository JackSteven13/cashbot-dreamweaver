import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserSession } from './useUserSession';
import { balanceManager } from '@/utils/balance/balanceManager';
import { getCurrentSession } from '@/utils/auth/sessionUtils';

export const useBalanceLoader = (setIsNewUser: (isNew: boolean) => void) => {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Charger le solde depuis la base de données
  const loadBalance = async (userId?: string) => {
    setIsLoading(true);
    
    try {
      // Si userId n'est pas fourni, obtenir l'ID de l'utilisateur actif
      let userIdToUse = userId;
      
      if (!userIdToUse) {
        const session = await getCurrentSession();
        if (!session) {
          console.error("No active session found");
          setIsLoading(false);
          return null;
        }
        userIdToUse = session.user.id;
      }
      
      // Now load balance with the resolved userIdToUse
      const { data, error } = await supabase
        .from('user_balances')
        .select('*')
        .eq('id', userIdToUse)
        .maybeSingle();
      
      if (error) {
        console.error("Error loading balance:", error);
        setIsLoading(false);
        return null;
      }
      
      let balanceData;
      let isNewUser = false;
      
      if (data) {
        // Existing user found with balance record
        balanceData = data;
        
        // Initialiser le gestionnaire de solde
        balanceManager.initialize(data.balance || 0, userIdToUse);
        
        // Obtenir le solde du gestionnaire (peut être plus élevé si enregistré en localStorage)
        const managerBalance = balanceManager.getCurrentBalance();
        
        // Mettre à jour l'état
        setBalance(managerBalance);
        
        console.log(`[useBalanceLoader] Balance loaded for ${userIdToUse}: DB=${data.balance}, Manager=${managerBalance}`);
      } else {
        // No balance record found - new user
        balanceData = { 
          balance: 0, 
          subscription: 'freemium',
          daily_session_count: 0
        };
        setBalance(0);
        isNewUser = true;
        setIsNewUser(true);
        
        // Create initial balance record for new user
        try {
          const { error: insertError } = await supabase
            .from('user_balances')
            .insert([
              { id: userIdToUse, balance: 0, subscription: 'freemium' }
            ]);
            
          if (insertError) {
            console.error("Error creating balance record:", insertError);
          } else {
            console.log("Created new balance record for user");
          }
        } catch (err) {
          console.error("Error initializing user balance:", err);
        }
      }
      
      setIsLoading(false);
      return { balanceData, isNewUser };
      
    } catch (error) {
      console.error("Error in loadBalance:", error);
      setIsLoading(false);
      return null;
    }
  };
  
  // Initialiser et s'abonner aux mises à jour du solde
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const initializeBalance = async () => {
      const session = await getCurrentSession();
      if (session?.user?.id) {
        // S'abonner aux mises à jour du gestionnaire de solde
        unsubscribe = balanceManager.subscribe((state) => {
          console.log(`[useBalanceLoader] Balance updated to: ${state.currentBalance}`);
          setBalance(state.currentBalance);
        });
        
        // S'abonner aux événements de réinitialisation du solde
        const handleBalanceReset = (event: CustomEvent) => {
          if (event.detail?.userId === session.user.id) {
            loadBalance(session.user.id);
          }
        };
        
        window.addEventListener('balance:reset', handleBalanceReset as EventListener);
        return () => {
          if (unsubscribe) unsubscribe();
          window.removeEventListener('balance:reset', handleBalanceReset as EventListener);
        };
      }
    };
    
    initializeBalance();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return {
    balance,
    isLoading,
    isUpdating,
    loadBalance
  };
};

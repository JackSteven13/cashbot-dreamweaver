
import { useState, useEffect } from 'react';
import { useUserSession } from './useUserSession';
import { 
  checkAccountDormancy,
  calculateDormancyPenalties,
  applyDormancyPenalties,
  calculateReactivationFee,
  reactivateAccount
} from '@/utils/balance/dormancyUtils';
import { toast } from '@/components/ui/use-toast';

export const useDormancyCheck = (subscription: string, refreshUserData: () => Promise<boolean>) => {
  const [isDormant, setIsDormant] = useState(false);
  const [dormancyData, setDormancyData] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { session } = useUserSession();

  // Check for dormancy on component mount
  useEffect(() => {
    const checkDormancy = async () => {
      if (!session) return;
      
      setIsChecking(true);
      
      try {
        const dormancyStatus = await checkAccountDormancy(session.user.id);
        
        if (dormancyStatus.isDormant) {
          // Calculate penalties
          const penalties = calculateDormancyPenalties(
            dormancyStatus.originalBalance || 0,
            dormancyStatus.dormancyDays || 0
          );
          
          // Calculate reactivation fee
          const reactivationFee = calculateReactivationFee(dormancyStatus.subscription || 'freemium');
          
          setIsDormant(true);
          setDormancyData({
            ...dormancyStatus,
            ...penalties,
            reactivationFee
          });
          
          // Apply penalties to the account
          await applyDormancyPenalties(
            session.user.id,
            dormancyStatus.originalBalance || 0,
            penalties.remainingBalance,
            penalties.penalties
          );
        } else {
          setIsDormant(false);
          setDormancyData(null);
        }
      } catch (error) {
        console.error("Error checking dormancy:", error);
      } finally {
        setIsChecking(false);
      }
    };
    
    if (subscription && subscription !== 'freemium') {
      checkDormancy();
    }
  }, [session, subscription]);

  // Function to handle account reactivation
  const handleReactivate = async () => {
    if (!session || !dormancyData) return;
    
    try {
      const result = await reactivateAccount(session.user.id, dormancyData.subscription);
      
      if (result.success) {
        toast({
          title: "Compte réactivé",
          description: result.message,
        });
        
        setIsDormant(false);
        setDormancyData(null);
        
        // Refresh user data
        await refreshUserData();
      } else {
        toast({
          title: "Erreur",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error reactivating account:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la réactivation de votre compte.",
        variant: "destructive"
      });
    }
  };

  return {
    isDormant,
    dormancyData,
    isChecking,
    handleReactivate
  };
};

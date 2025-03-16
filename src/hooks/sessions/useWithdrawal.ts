
import { useRef } from 'react';
import { UserData } from '@/types/userData';
import { toast } from '@/components/ui/use-toast';

export const useWithdrawal = (
  userData: UserData,
  resetBalance: () => Promise<void>
) => {
  const sessionInProgress = useRef(false);
  const operationLock = useRef(false);

  const handleWithdrawal = async () => {
    // Prevent multiple concurrent operations
    if (sessionInProgress.current || operationLock.current) return;
    
    try {
      operationLock.current = true;
      sessionInProgress.current = true;
      
      // Process withdrawal only if sufficient balance (at least 20€) and not freemium account
      if (userData.balance >= 20 && userData.subscription !== 'freemium') {
        // Reset balance to 0 to simulate withdrawal
        await resetBalance();
      } else if (userData.subscription === 'freemium') {
        toast({
          title: "Compte freemium",
          description: "Les retraits ne sont pas disponibles avec un compte freemium. Passez à un forfait supérieur.",
          variant: "destructive"
        });
      } else if (userData.balance < 20) {
        toast({
          title: "Solde insuffisant",
          description: "Vous devez avoir au moins 20€ pour effectuer un retrait.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du retrait. Veuillez réessayer plus tard.",
        variant: "destructive"
      });
    } finally {
      sessionInProgress.current = false;
      // Release operation lock after a delay
      setTimeout(() => {
        operationLock.current = false;
      }, 1000);
    }
  };

  return {
    handleWithdrawal
  };
};

export default useWithdrawal;

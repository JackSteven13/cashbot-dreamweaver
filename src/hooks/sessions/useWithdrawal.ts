
import { useRef, useState } from 'react';
import { UserData } from '@/types/userData';
import { toast } from '@/components/ui/use-toast';

export const useWithdrawal = (
  userData: UserData,
  resetBalance: () => Promise<void>
) => {
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);
  const operationLock = useRef(false);
  const withdrawalAttempts = useRef(0);
  const maxAttempts = 3;

  const handleWithdrawal = async () => {
    // Prevent multiple concurrent operations
    if (isProcessingWithdrawal || operationLock.current) {
      console.log("Withdrawal operation already in progress, please wait");
      return;
    }
    
    try {
      operationLock.current = true;
      setIsProcessingWithdrawal(true);
      
      console.log("Starting withdrawal process with balance:", userData.balance);
      
      // Process withdrawal only if sufficient balance (at least 20€) and not freemium account
      if (userData.balance >= 20 && userData.subscription !== 'freemium') {
        toast({
          title: "Traitement en cours",
          description: "Votre demande de retrait est en cours de traitement...",
        });
        
        try {
          // Reset balance to 0 to simulate withdrawal
          await resetBalance();
          toast({
            title: "Retrait effectué",
            description: `Votre retrait de ${userData.balance.toFixed(2)}€ a été effectué avec succès.`
          });
          withdrawalAttempts.current = 0; // Reset attempts on success
        } catch (error) {
          console.error("Error processing withdrawal:", error);
          withdrawalAttempts.current += 1;
          
          if (withdrawalAttempts.current < maxAttempts) {
            toast({
              title: "Nouvelle tentative",
              description: "Réessai du retrait en cours...",
            });
            // Retry once after a short delay
            setTimeout(() => handleWithdrawal(), 1000);
          } else {
            withdrawalAttempts.current = 0; // Reset attempts counter
            toast({
              title: "Échec du retrait",
              description: "Nous n'avons pas pu traiter votre retrait. Veuillez réessayer plus tard.",
              variant: "destructive"
            });
          }
        }
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
      console.error("Error in withdrawal process:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du retrait. Veuillez réessayer plus tard.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingWithdrawal(false);
      // Release operation lock after a delay
      setTimeout(() => {
        operationLock.current = false;
      }, 1000);
    }
  };

  return {
    handleWithdrawal,
    isProcessingWithdrawal
  };
};

export default useWithdrawal;

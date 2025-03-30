
import { useRef, useState, useEffect } from 'react';
import { UserData } from '@/types/userData';
import { toast } from '@/components/ui/use-toast';
import { calculateWithdrawalFee } from '@/utils/referral/withdrawalUtils';

interface WithdrawalFees {
  earlyFee: number; // 50% pour les retraits dans les premiers 6 mois
  standardFee: number; // 15% après les 6 premiers mois
  minimumWithdrawalAmount: number; // Maintenu à 100€
  withdrawalFrequency: number; // Nombre de jours entre les retraits autorisés (30 jours)
  processingDays: string; // Délai de traitement (7-30 jours)
}

export const useWithdrawal = (
  userData: UserData,
  resetBalance: () => Promise<void>
) => {
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);
  const operationLock = useRef(false);
  const withdrawalAttempts = useRef(0);
  const maxAttempts = 3;
  
  // Nouvelles stratégies de retrait
  const withdrawalRules: WithdrawalFees = {
    earlyFee: 0.5, // 50% pour les retraits dans les premiers 6 mois
    standardFee: 0.15, // 15% après les 6 premiers mois
    minimumWithdrawalAmount: 100, // Maintenu à 100€
    withdrawalFrequency: 30, // Une fois par mois (30 jours)
    processingDays: "7-30 jours"
  };
  
  // État pour suivre si l'utilisateur peut faire un retrait (fréquence)
  const [canWithdraw, setCanWithdraw] = useState(true);
  const [lastWithdrawalDate, setLastWithdrawalDate] = useState<Date | null>(null);
  const [daysUntilNextWithdrawal, setDaysUntilNextWithdrawal] = useState(0);
  
  // Vérifier si l'utilisateur a effectué un retrait récemment
  useEffect(() => {
    // On pourrait stocker cette information dans la base de données
    // Pour l'instant, on utilise le localStorage
    const lastWithdrawal = localStorage.getItem(`lastWithdrawal_${userData.username}`);
    
    if (lastWithdrawal) {
      const withdrawalDate = new Date(lastWithdrawal);
      setLastWithdrawalDate(withdrawalDate);
      
      const today = new Date();
      const diffTime = today.getTime() - withdrawalDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < withdrawalRules.withdrawalFrequency) {
        setCanWithdraw(false);
        setDaysUntilNextWithdrawal(withdrawalRules.withdrawalFrequency - diffDays);
      } else {
        setCanWithdraw(true);
        setDaysUntilNextWithdrawal(0);
      }
    }
  }, [userData.username, withdrawalRules.withdrawalFrequency]);

  const handleWithdrawal = async () => {
    // Prevent multiple concurrent operations
    if (isProcessingWithdrawal || operationLock.current) {
      console.log("Withdrawal operation already in progress, please wait");
      return;
    }
    
    // Vérifier si l'utilisateur peut faire un retrait (fréquence)
    if (!canWithdraw) {
      toast({
        title: "Fréquence de retrait limitée",
        description: `Vous pouvez effectuer un retrait une fois par mois. Prochain retrait possible dans ${daysUntilNextWithdrawal} jour${daysUntilNextWithdrawal > 1 ? 's' : ''}.`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      operationLock.current = true;
      setIsProcessingWithdrawal(true);
      
      console.log("Starting withdrawal process with balance:", userData.balance);
      
      // Process withdrawal only if sufficient balance (at least 100€) and not freemium account
      if (userData.balance >= withdrawalRules.minimumWithdrawalAmount && userData.subscription !== 'freemium') {
        // Calculer les frais selon l'ancienneté du compte
        const registerDate = userData.registeredAt || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const fee = calculateWithdrawalFee(registerDate);
        const feeAmount = userData.balance * fee;
        const netAmount = userData.balance - feeAmount;
        
        toast({
          title: "Traitement en cours",
          description: `Votre demande de retrait est en cours de traitement. Délai: ${withdrawalRules.processingDays}.`,
        });
        
        try {
          // Reset balance to 0 to simulate withdrawal
          await resetBalance();
          
          // Enregistrer la date du retrait
          localStorage.setItem(`lastWithdrawal_${userData.username}`, new Date().toISOString());
          setLastWithdrawalDate(new Date());
          setCanWithdraw(false);
          setDaysUntilNextWithdrawal(withdrawalRules.withdrawalFrequency);
          
          toast({
            title: "Retrait programmé",
            description: `Votre retrait de ${netAmount.toFixed(2)}€ (après frais de ${(fee * 100).toFixed(0)}%: ${feeAmount.toFixed(2)}€) sera traité dans ${withdrawalRules.processingDays}.`
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
      } else if (userData.balance < withdrawalRules.minimumWithdrawalAmount) {
        toast({
          title: "Solde insuffisant",
          description: `Vous devez avoir au moins ${withdrawalRules.minimumWithdrawalAmount}€ pour effectuer un retrait.`,
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
    isProcessingWithdrawal,
    canWithdraw,
    daysUntilNextWithdrawal,
    withdrawalRules
  };
};

export default useWithdrawal;

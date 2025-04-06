import { useRef, useState, useEffect } from 'react';
import { UserData } from '@/types/userData';
import { toast } from '@/components/ui/use-toast';
import { calculateWithdrawalFee, getWithdrawalThreshold, isWithdrawalAllowed } from '@/utils/referral/withdrawalUtils';

interface WithdrawalRules {
  minimumWithdrawalAmount: number; // Montant minimum pour retirer
  withdrawalFrequency: number;     // Nombre de jours entre les retraits autorisés
  processingDays: string;          // Délai de traitement
}

export const useWithdrawal = (
  userData: UserData,
  resetBalance: () => Promise<void>
) => {
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);
  const operationLock = useRef(false);
  const withdrawalAttempts = useRef(0);
  const maxAttempts = 3;
  
  const withdrawalRules: WithdrawalRules = {
    minimumWithdrawalAmount: getWithdrawalThreshold(userData.subscription),
    withdrawalFrequency: 30, // Une fois par mois (30 jours)
    processingDays: "7-30 jours"
  };
  
  const [canWithdraw, setCanWithdraw] = useState(true);
  const [lastWithdrawalDate, setLastWithdrawalDate] = useState<Date | null>(null);
  const [daysUntilNextWithdrawal, setDaysUntilNextWithdrawal] = useState(0);
  
  useEffect(() => {
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
    if (isProcessingWithdrawal || operationLock.current) {
      console.log("Withdrawal operation already in progress, please wait");
      return;
    }
    
    const referralCount = userData.referrals?.filter(ref => ref.active !== false)?.length || 0;
    
    const minAmount = getWithdrawalThreshold(userData.subscription);
    if (userData.balance < minAmount) {
      toast({
        title: "Solde insuffisant",
        description: `Le montant minimum de retrait est de ${minAmount}€. Votre solde actuel est de ${userData.balance.toFixed(2)}€.`,
        variant: "destructive"
      });
      return;
    }
    
    if (!isWithdrawalAllowed(userData.subscription, referralCount)) {
      toast({
        title: "Retrait impossible",
        description: "Les comptes freemium doivent parrainer au moins une personne pour pouvoir effectuer un retrait.",
        variant: "destructive"
      });
      return;
    }
    
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
      
      let currentBalance = userData.balance;
      
      try {
        const storedHighestBalance = localStorage.getItem('highestBalance');
        const storedCurrentBalance = localStorage.getItem('currentBalance');
        const storedLastKnownBalance = localStorage.getItem('lastKnownBalance');
        
        if (storedHighestBalance) {
          const parsedHighest = parseFloat(storedHighestBalance);
          if (!isNaN(parsedHighest) && parsedHighest > currentBalance) {
            currentBalance = parsedHighest;
          }
        }
        
        if (storedCurrentBalance) {
          const parsedCurrent = parseFloat(storedCurrentBalance);
          if (!isNaN(parsedCurrent) && parsedCurrent > currentBalance) {
            currentBalance = parsedCurrent;
          }
        }
        
        if (storedLastKnownBalance) {
          const parsedLastKnown = parseFloat(storedLastKnownBalance);
          if (!isNaN(parsedLastKnown) && parsedLastKnown > currentBalance) {
            currentBalance = parsedLastKnown;
          }
        }
        
        console.log("Using maximum balance for withdrawal:", currentBalance);
      } catch (e) {
        console.error("Failed to read persisted balance for withdrawal:", e);
      }
      
      console.log("Starting withdrawal process with balance:", currentBalance);
      
      if (currentBalance >= withdrawalRules.minimumWithdrawalAmount) {
        const registerDate = userData.registeredAt || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const fee = calculateWithdrawalFee(registerDate, userData.subscription);
        const feeAmount = currentBalance * fee;
        const netAmount = currentBalance - feeAmount;
        
        toast({
          title: "Traitement en cours",
          description: `Votre demande de retrait est en cours de traitement. Délai: ${withdrawalRules.processingDays}.`,
        });
        
        try {
          await resetBalance();
          
          localStorage.setItem(`lastWithdrawal_${userData.username}`, new Date().toISOString());
          setLastWithdrawalDate(new Date());
          setCanWithdraw(false);
          setDaysUntilNextWithdrawal(withdrawalRules.withdrawalFrequency);
          
          toast({
            title: "Retrait programmé",
            description: `Votre retrait de ${netAmount.toFixed(2)}€ (après frais de ${(fee * 100).toFixed(0)}%: ${feeAmount.toFixed(2)}€) sera traité dans ${withdrawalRules.processingDays}.`
          });
          withdrawalAttempts.current = 0;
          
          localStorage.removeItem('highestBalance');
          localStorage.removeItem('currentBalance');
          localStorage.removeItem('lastKnownBalance');
        } catch (error) {
          console.error("Error processing withdrawal:", error);
          withdrawalAttempts.current += 1;
          
          if (withdrawalAttempts.current < maxAttempts) {
            toast({
              title: "Nouvelle tentative",
              description: "Réessai du retrait en cours...",
            });
            setTimeout(() => handleWithdrawal(), 1000);
          } else {
            withdrawalAttempts.current = 0;
            toast({
              title: "Échec du retrait",
              description: "Nous n'avons pas pu traiter votre retrait. Veuillez réessayer plus tard.",
              variant: "destructive"
            });
          }
        }
      } else {
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

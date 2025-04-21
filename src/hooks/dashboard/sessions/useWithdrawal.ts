
import { useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import { resetUserBalance } from '@/utils/balance/resetBalance';

export interface UseWithdrawalProps {
  userData: any;
  resetBalance: () => Promise<void>;
}

export const useWithdrawal = ({ userData, resetBalance }: UseWithdrawalProps) => {
  const withdrawalInProgressRef = useRef(false);

  const handleWithdrawal = async () => {
    if (withdrawalInProgressRef.current) return;

    try {
      withdrawalInProgressRef.current = true;

      if (!userData?.balance || userData.balance < 10) {
        toast({
          title: "Retrait impossible",
          description: "Vous devez avoir au moins 10€ pour effectuer un retrait.",
          variant: "destructive"
        });
        return;
      }

      if (!window.confirm(`Êtes-vous sûr de vouloir retirer ${userData.balance.toFixed(2)}€ sur votre compte bancaire?`)) {
        return;
      }

      if (userData?.profile?.id) {
        const result = await resetUserBalance(userData.profile.id, userData.balance);

        if (result.success) {
          await resetBalance();

          toast({
            title: "Retrait effectué",
            description: `${userData.balance.toFixed(2)}€ ont été retirés avec succès. Le transfert sera visible sur votre compte bancaire sous 1 à 3 jours ouvrés.`,
          });
        } else {
          throw new Error("Le retrait a échoué");
        }
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du traitement du retrait.",
        variant: "destructive"
      });
    } finally {
      withdrawalInProgressRef.current = false;
    }
  };

  return { handleWithdrawal };
};

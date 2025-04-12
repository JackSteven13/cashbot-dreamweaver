
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ArrowUp } from 'lucide-react';
import { getWithdrawalThreshold, canWithdraw } from '@/utils/referral/withdrawalUtils';

interface WithdrawButtonProps {
  onClick: () => void;
  isButtonDisabled?: boolean;
  isWithdrawing?: boolean;
  currentBalance: number;
  subscription: string;
}

export const WithdrawButton: React.FC<WithdrawButtonProps> = ({
  onClick,
  isButtonDisabled = false,
  isWithdrawing = false,
  currentBalance = 0,
  subscription = 'freemium'
}) => {
  const { toast } = useToast();
  const [canWithdrawFunds, setCanWithdrawFunds] = useState(false);
  
  // Vérifier si l'utilisateur peut retirer ses fonds
  useEffect(() => {
    const threshold = getWithdrawalThreshold(subscription);
    const withdrawalAllowed = currentBalance >= threshold;
    setCanWithdrawFunds(withdrawalAllowed);
  }, [currentBalance, subscription]);
  
  // Montrer un message informatif lors du clic si le retrait n'est pas possible
  const handleClick = () => {
    if (!canWithdrawFunds) {
      const threshold = getWithdrawalThreshold(subscription);
      toast({
        title: "Retrait impossible",
        description: `Vous devez atteindre ${threshold}€ pour retirer vos gains. Votre solde actuel est de ${currentBalance.toFixed(2)}€.`,
        variant: "destructive",
        duration: 5000
      });
      return;
    }
    
    // Si le retrait est possible, déclencher l'action
    onClick();
  };

  return (
    <Button 
      variant="outline" 
      size="lg"
      className={`w-full sm:w-auto ${!canWithdrawFunds ? 'opacity-70' : ''}`}
      onClick={handleClick}
      disabled={isButtonDisabled || isWithdrawing}
    >
      <ArrowUp className="mr-2 h-4 w-4" />
      {isWithdrawing ? 'Retrait en cours...' : 'Retirer'}
    </Button>
  );
};


import React from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatPrice } from '@/utils/balance/limitCalculations';

interface WithdrawalButtonProps {
  onClick?: () => void;
  balance: number;
  withdrawalThreshold?: number;
  isPending?: boolean;
  subscription?: string;
}

const WithdrawalButton: React.FC<WithdrawalButtonProps> = ({
  onClick,
  balance = 0,
  withdrawalThreshold = 200,
  isPending = false,
  subscription = 'freemium'
}) => {
  // Vérifier si le retrait est possible
  const canWithdraw = balance >= withdrawalThreshold;
  
  // Déterminer le message d'infobulle approprié
  const getTooltipMessage = () => {
    if (isPending) return "Traitement en cours...";
    if (!canWithdraw) return `Minimum de retrait: ${formatPrice(withdrawalThreshold)}`;
    if (!onClick) return "La fonctionnalité de retrait n'est pas encore disponible";
    return "Retirer vos gains";
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Button
              onClick={onClick}
              disabled={!canWithdraw || !onClick || isPending}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
              variant="default"
              size="lg"
            >
              {isPending ? (
                <div className="flex items-center">
                  <span className="loading loading-spinner loading-xs mr-2"></span>
                  <span>Traitement...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  {canWithdraw ? (
                    <Wallet className="mr-2 h-5 w-5" />
                  ) : (
                    <Lock className="mr-2 h-5 w-5" />
                  )}
                  <span>Retirer</span>
                </div>
              )}
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipMessage()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default WithdrawalButton;

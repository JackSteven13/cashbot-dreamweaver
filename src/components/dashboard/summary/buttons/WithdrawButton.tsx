
import React from 'react';
import { ArrowUpCircle, InfoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WithdrawButtonProps {
  isWithdrawing: boolean;
  isButtonDisabled: boolean;
  onClick: () => void;
  minWithdrawalAmount?: number;
  currentBalance?: number;
}

export const WithdrawButton: React.FC<WithdrawButtonProps> = ({
  isWithdrawing,
  isButtonDisabled,
  onClick,
  minWithdrawalAmount = 5,
  currentBalance = 0
}) => {
  const isMobile = useIsMobile();
  const iconSize = isMobile ? 16 : 18;
  const insufficientBalance = currentBalance < minWithdrawalAmount;
  const showTooltip = insufficientBalance && !isWithdrawing;
  
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full relative">
            <Button 
              variant="outline"
              className={`w-full border-slate-500 text-slate-600 hover:bg-slate-50 shadow-sm whitespace-normal py-1.5 transition-all duration-300 ${
                isButtonDisabled || insufficientBalance ? 'opacity-60 cursor-not-allowed' : 'hover:border-[#9b87f5] hover:text-[#9b87f5]'
              }`}
              disabled={isWithdrawing || isButtonDisabled || insufficientBalance}
              onClick={onClick}
              size={isMobile ? "sm" : "default"}
            >
              <ArrowUpCircle className="mr-1.5" size={iconSize} />
              {isWithdrawing ? (
                <span className="flex items-center">
                  <span className="animate-spin h-3 w-3 mr-1.5 border-2 border-slate-500 border-t-transparent rounded-full"></span>
                  <span className="text-sm">Traitement</span>
                </span>
              ) : (
                <span>Retirer</span>
              )}
            </Button>
            
            {showTooltip && (
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                <InfoIcon size={16} className="text-amber-500" />
              </div>
            )}
          </div>
        </TooltipTrigger>
        {insufficientBalance && (
          <TooltipContent side="bottom" align="center" className="max-w-[220px] text-center">
            <p>Solde minimum de {minWithdrawalAmount}€ requis pour retirer</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

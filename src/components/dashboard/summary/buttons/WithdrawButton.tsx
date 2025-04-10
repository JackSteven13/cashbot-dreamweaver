
import React from 'react';
import { ArrowUpCircle, InfoIcon, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface WithdrawButtonProps {
  isWithdrawing: boolean;
  isButtonDisabled: boolean;
  onClick: () => void;
  minWithdrawalAmount?: number;
  currentBalance?: number;
  onShareReferral?: () => void;
}

export const WithdrawButton: React.FC<WithdrawButtonProps> = ({
  isWithdrawing,
  isButtonDisabled,
  onClick,
  minWithdrawalAmount = 5,
  currentBalance = 0,
  onShareReferral
}) => {
  const isMobile = useIsMobile();
  const iconSize = isMobile ? 16 : 18;
  const insufficientBalance = currentBalance < minWithdrawalAmount;
  const showTooltip = insufficientBalance && !isWithdrawing;
  
  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShareReferral) {
      onShareReferral();
    }
  };
  
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
              <div className="absolute -right-1 -top-1 z-10">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 p-0 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <InfoIcon size={10} className="text-amber-500" />
                      <span className="sr-only">Plus d'informations</span>
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-72 p-3 bg-white border border-amber-100 shadow-lg">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-amber-800 text-sm">Solde minimum requis</h4>
                      <p className="text-xs text-gray-600">
                        Vous avez besoin d'un solde de <span className="font-bold">{minWithdrawalAmount}€</span> pour effectuer un retrait. Votre solde actuel est de <span className="font-bold">{currentBalance.toFixed(2)}€</span>.
                      </p>
                      <div className="bg-blue-50 p-2 rounded-md border border-blue-100 mt-2">
                        <p className="text-xs font-medium text-blue-800 flex items-center">
                          <Share2 className="h-3 w-3 mr-1 text-blue-600" />
                          Augmentez vos revenus rapidement
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          Partagez votre lien de parrainage pour gagner 20% de commission!
                        </p>
                        <Button 
                          size="sm" 
                          className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-xs py-1 px-2 h-auto"
                          onClick={handleShareClick}
                        >
                          Partager mon lien
                        </Button>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
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


import React, { useState } from 'react';
import { ArrowUpCircle, InfoIcon, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { getWithdrawalThreshold } from '@/utils/referral/withdrawalUtils';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  subscription?: string;
}

export const WithdrawButton: React.FC<WithdrawButtonProps> = ({
  isWithdrawing,
  isButtonDisabled,
  onClick,
  minWithdrawalAmount = 5,
  currentBalance = 0,
  subscription = 'freemium'
}) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const iconSize = isMobile ? 16 : 18;
  
  // Obtenir le seuil de retrait réel basé sur l'abonnement
  const withdrawalThreshold = getWithdrawalThreshold(subscription);
  const insufficientBalance = currentBalance < withdrawalThreshold;
  const showTooltip = insufficientBalance && !isWithdrawing;
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  
  // Navigation vers la page de parrainage
  const handleGoToReferrals = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/dashboard/referrals');
  };
  
  return (
    <TooltipProvider delayDuration={300}>
      <div className="w-full relative">
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          
          {insufficientBalance && (
            <TooltipContent side="bottom" align="center" className="max-w-[220px] text-center">
              <p>Solde minimum de {withdrawalThreshold}€ requis pour retirer</p>
            </TooltipContent>
          )}
        </Tooltip>
        
        {showTooltip && (
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <Button
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center h-6 w-6 p-0 hover:bg-slate-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsInfoOpen(!isInfoOpen);
                }}
              >
                <InfoIcon size={16} className="text-amber-500" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent side="top" align="center" className="w-80 bg-white border-amber-200 p-4 shadow-lg">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Users className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">Atteignez votre seuil de retrait plus rapidement !</h4>
                    <p className="text-sm text-slate-600">
                      Parrainez des amis et gagnez <span className="font-medium text-green-600">20-50%</span> de leurs abonnements annuels sans limite de filleuls.
                    </p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-md p-2 text-xs text-blue-800">
                  <p>💡 Chaque parrainage actif vous rapporte des revenus passifs, même pendant votre sommeil !</p>
                </div>
                <div className="pt-1">
                  <Button 
                    size="sm" 
                    variant="default" 
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    onClick={handleGoToReferrals}
                  >
                    Commencer à parrainer
                  </Button>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        )}
      </div>
    </TooltipProvider>
  );
};

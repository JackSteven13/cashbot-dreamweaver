
import React from 'react';
import { ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface WithdrawButtonProps {
  isWithdrawing: boolean;
  isButtonDisabled: boolean;
  onClick: () => void;
}

export const WithdrawButton: React.FC<WithdrawButtonProps> = ({
  isWithdrawing,
  isButtonDisabled,
  onClick
}) => {
  const isMobile = useIsMobile();
  const iconSize = isMobile ? 16 : 18;
  
  return (
    <Button 
      variant="outline"
      className="w-full border-slate-500 text-slate-600 hover:bg-slate-50 shadow-sm whitespace-normal py-1.5 transition-all duration-300 hover:border-[#9b87f5] hover:text-[#9b87f5]"
      disabled={isWithdrawing || isButtonDisabled}
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
  );
};

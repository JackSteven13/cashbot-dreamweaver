
import React from 'react';
import { ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  return (
    <Button 
      size="lg" 
      variant="outline"
      className="w-full border-slate-500 text-slate-600 hover:bg-slate-50 shadow-sm whitespace-normal h-auto py-2 transition-all duration-300 hover:border-[#9b87f5] hover:text-[#9b87f5]"
      disabled={isWithdrawing || isButtonDisabled}
      onClick={onClick}
    >
      <ArrowUpCircle className="mr-2 h-4 w-4 flex-shrink-0" />
      {isWithdrawing ? (
        <span className="flex items-center">
          <span className="animate-spin h-4 w-4 mr-2 border-2 border-slate-500 border-t-transparent rounded-full"></span>
          Traitement...
        </span>
      ) : (
        <span>Retirer les fonds</span>
      )}
    </Button>
  );
};

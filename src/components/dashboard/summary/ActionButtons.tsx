
import React from 'react';
import { ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionButtonsProps {
  canStartSession: boolean;
  isButtonDisabled: boolean;
  isStartingSession: boolean;
  isWithdrawing: boolean;
  onBoostClick: () => void;
  onWithdraw: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  canStartSession,
  isButtonDisabled,
  isStartingSession,
  isWithdrawing,
  onBoostClick,
  onWithdraw
}) => {
  return (
    <div className="flex gap-2 mb-6">
      <Button 
        size="lg" 
        className={`flex-1 ${canStartSession && !isButtonDisabled ? 'bg-[#2d5f8a] hover:bg-[#1e3a5f] text-white' : 'bg-gray-300 hover:bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        disabled={!canStartSession || isButtonDisabled || isStartingSession}
        onClick={onBoostClick}
      >
        {isStartingSession ? "Traitement en cours..." : "▶️ Boost manuel"}
      </Button>
      
      <Button 
        size="lg" 
        variant="outline"
        className="flex-1 border-[#2d5f8a] text-[#2d5f8a] hover:bg-[#e2e8f0]"
        disabled={isWithdrawing || isButtonDisabled}
        onClick={onWithdraw}
      >
        <ArrowUpCircle className="mr-2 h-4 w-4" />
        {isWithdrawing ? "Traitement..." : "Retirer les fonds"}
      </Button>
    </div>
  );
};

export default ActionButtons;

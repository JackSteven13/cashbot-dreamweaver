
import React from 'react';
import { ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface ActionButtonsProps {
  canStartSession: boolean;
  isButtonDisabled: boolean;
  isStartingSession: boolean;
  isWithdrawing: boolean;
  subscription: string;
  onBoostClick: () => void;
  onWithdraw: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  canStartSession,
  isButtonDisabled,
  isStartingSession,
  isWithdrawing,
  subscription,
  onBoostClick,
  onWithdraw
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-6">
      {canStartSession ? (
        <Button 
          size="lg" 
          className="w-full bg-[#2d5f8a] hover:bg-[#1e3a5f] text-white"
          disabled={isButtonDisabled || isStartingSession}
          onClick={onBoostClick}
        >
          {isStartingSession ? "Traitement en cours..." : "▶️ Boost manuel"}
        </Button>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Button 
            size="lg" 
            className="w-full bg-gray-300 hover:bg-gray-300 text-gray-500 cursor-not-allowed"
            disabled={true}
          >
            ▶️ Boost manuel
          </Button>
          {subscription === 'freemium' && (
            <Link to="/offres" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Passer à l'offre Pro
              </Button>
            </Link>
          )}
        </div>
      )}
      
      <Button 
        size="lg" 
        variant="outline"
        className="w-full border-[#2d5f8a] text-[#2d5f8a] hover:bg-[#e2e8f0]"
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

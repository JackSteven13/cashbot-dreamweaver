
import React from 'react';
import { BoostButton } from './buttons/BoostButton';
import { WithdrawButton } from './buttons/WithdrawButton';
import { OffersButton } from './buttons/OffersButton';
import { useActionButtons } from '@/hooks/useActionButtons';
import { getWithdrawalThreshold } from '@/utils/referral/withdrawalUtils';

interface ActionButtonsProps {
  canStartSession: boolean;
  isButtonDisabled: boolean;
  isStartingSession: boolean;
  isWithdrawing: boolean;
  subscription: string;
  currentBalance: number;
  dailyLimit: number;
  onBoostClick: () => void;
  onWithdraw: () => void;
  isBotActive?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  canStartSession,
  isButtonDisabled,
  isStartingSession,
  isWithdrawing,
  subscription,
  currentBalance,
  dailyLimit,
  onBoostClick,
  onWithdraw,
  isBotActive = true
}) => {
  const {
    effectiveSubscription,
    effectiveLimit,
    limitReached,
    limitPercentage,
    canStartSessionNow,
    buttonRef,
    handleBoostClick
  } = useActionButtons({
    subscription,
    dailyLimit,
    currentBalance,
    isButtonDisabled,
    isStartingSession,
    isWithdrawing,
    onBoostClick,
    onWithdraw
  });
  
  // Obtenir le seuil minimum de retrait pour l'abonnement
  const withdrawalThreshold = getWithdrawalThreshold(subscription);
  // Vérifier si le solde est suffisant pour un retrait
  const canWithdraw = currentBalance >= withdrawalThreshold;
  
  return (
    <>
      <div className="grid grid-cols-1 gap-3 mb-6">
        {/* Main button row with improved layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="w-full">
            <BoostButton 
              canStartSession={canStartSessionNow && canStartSession}
              limitReached={limitReached}
              limitPercentage={limitPercentage}
              isStartingSession={isStartingSession}
              isButtonDisabled={isButtonDisabled}
              buttonRef={buttonRef}
              onClick={handleBoostClick}
            />
          </div>
          
          <div className="w-full">
            <WithdrawButton 
              isWithdrawing={isWithdrawing}
              isButtonDisabled={isButtonDisabled || !canWithdraw}
              onClick={onWithdraw}
            />
          </div>
        </div>

        {/* Access to offers button always visible */}
        <div className="mt-1">
          <OffersButton limitReached={limitReached} />
        </div>
      </div>
      
      {/* Audio elements for sound effects */}
      <audio id="button-click" src="/sounds/button-click.mp3" preload="auto" />
      <audio id="cash-register" src="/sounds/cash-register.mp3" preload="auto" />
    </>
  );
};

export default ActionButtons;

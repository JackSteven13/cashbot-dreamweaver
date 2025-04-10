
import React from 'react';
import { BoostButton } from './buttons/BoostButton';
import { WithdrawButton } from './buttons/WithdrawButton';
import { OffersButton } from './buttons/OffersButton';
import { useActionButtons } from '@/hooks/useActionButtons';
import { Separator } from '@/components/ui/separator';
import { getWithdrawalThreshold } from '@/utils/referral/withdrawalUtils';

interface ActionButtonsProps {
  isStartingSession: boolean;
  isButtonDisabled: boolean;
  isWithdrawing: boolean;
  subscription: string;
  effectiveSubscription: string;
  dailyLimit: number;
  canStartSession: boolean;
  onBoostClick: () => void;
  onWithdraw: () => void;
  remainingSessions: number | string;
  lastSessionTimestamp?: string;
  currentBalance: number;
  isBotActive?: boolean;
  onShareReferral?: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  isStartingSession,
  isButtonDisabled,
  isWithdrawing,
  subscription,
  effectiveSubscription,
  dailyLimit,
  canStartSession,
  onBoostClick,
  onWithdraw,
  remainingSessions,
  lastSessionTimestamp,
  currentBalance,
  isBotActive = true,
  onShareReferral
}) => {
  const {
    effectiveLimit,
    limitReached,
    limitPercentage,
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
  
  const withdrawalThreshold = getWithdrawalThreshold(subscription);
  
  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-3">
        <BoostButton
          ref={buttonRef}
          isStartingSession={isStartingSession}
          isButtonDisabled={isButtonDisabled || limitReached}
          onClick={handleBoostClick}
          remainingSessions={remainingSessions}
          lastSessionTimestamp={lastSessionTimestamp}
          subscription={effectiveSubscription}
          limitPercentage={limitPercentage}
          canStartSession={canStartSession}
          isBotActive={isBotActive}
        />
        
        <WithdrawButton
          isWithdrawing={isWithdrawing}
          isButtonDisabled={isButtonDisabled}
          onClick={onWithdraw}
          minWithdrawalAmount={withdrawalThreshold}
          currentBalance={currentBalance}
          onShareReferral={onShareReferral}
        />
      </div>
      
      <Separator className="my-4 bg-slate-700" />
      
      <OffersButton subscription={subscription} />
    </div>
  );
};

export default ActionButtons;

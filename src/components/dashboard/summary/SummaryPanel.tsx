
import React, { useState, useEffect, useRef } from 'react';
import ActionButtons from './ActionButtons';
import UserBalanceCard from './userBalanceCard/UserBalanceCard';
import ReferralCard from './ReferralCard';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscription';
import { calculateLimitPercentage } from '@/utils/balance/limitCalculations';

interface SummaryPanelProps {
  balance: number;
  referralLink: string;
  isStartingSession: boolean;
  handleStartSession: () => void;
  handleWithdrawal?: () => void;
  isNewUser?: boolean;
  subscription: string;
  dailySessionCount?: number;
  canStartSession?: boolean;
  referralCount?: number;
  referralBonus?: number;
  lastSessionTimestamp?: string;
  isBotActive?: boolean;
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({
  balance,
  referralLink,
  isStartingSession,
  handleStartSession,
  handleWithdrawal,
  isNewUser = false,
  subscription = 'freemium',
  dailySessionCount = 0,
  canStartSession = true,
  referralCount = 0,
  referralBonus = 0,
  lastSessionTimestamp,
  isBotActive = true
}) => {
  // Calcul du forfait effectif (tenant compte des essais, etc.)
  const effectiveSubscription = getEffectiveSubscription(subscription);
  const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Calcul du pourcentage de la limite atteint
  const limitPercentage = calculateLimitPercentage(balance, dailyLimit);
  
  // Référence au bouton (pour dévérouillage éventuel)
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Vérifier si le solde dépasse la limite journalière
  const limitReached = balance >= dailyLimit;
  
  // État pour suivre si le retrait est en cours
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  
  // Gérer le retrait en capturant l'état transitoire
  const handleWithdrawalWithState = () => {
    setIsWithdrawing(true);
    
    // Appeler le handler original s'il existe
    if (handleWithdrawal) {
      handleWithdrawal();
    }
    
    // Réinitialiser l'état après un délai
    setTimeout(() => {
      setIsWithdrawing(false);
    }, 3000);
  };

  return (
    <div className="summary-panel space-y-4">
      <UserBalanceCard 
        displayBalance={balance}
        subscription={subscription}
        dailyLimit={dailyLimit}
        limitPercentage={limitPercentage}
        referralCount={referralCount}
        referralBonus={referralBonus}
        botActive={isBotActive}
      />
      
      <ActionButtons
        canStartSession={canStartSession}
        isButtonDisabled={isStartingSession || false}
        isStartingSession={isStartingSession || false}
        isWithdrawing={isWithdrawing}
        subscription={subscription}
        currentBalance={balance}
        dailyLimit={dailyLimit}
        onBoostClick={handleStartSession}
        onWithdraw={handleWithdrawalWithState}
        isBotActive={isBotActive}
      />
      
      <ReferralCard 
        referralLink={referralLink}
        referralCount={referralCount}
        subscription={subscription}
      />
    </div>
  );
};

export default SummaryPanel;

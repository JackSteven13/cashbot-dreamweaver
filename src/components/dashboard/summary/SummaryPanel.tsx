
import React, { useState, useEffect, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import UserBalanceCard from './UserBalanceCard';
import ActionButtons from './ActionButtons';
import ReferralLink from './ReferralLink';
import SystemTerminal from './SystemTerminal';
import WelcomeMessage from './WelcomeMessage';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscriptionUtils';

interface SummaryPanelProps {
  balance: number;
  referralLink: string;
  isStartingSession: boolean;
  handleStartSession: () => void;
  isNewUser?: boolean;
  subscription: string;
  handleWithdrawal?: () => void;
  dailySessionCount?: number;
  canStartSession?: boolean;
  referralCount?: number;
  referralBonus?: number;
}

const SummaryPanel = ({ 
  balance, 
  referralLink, 
  isStartingSession, 
  handleStartSession,
  isNewUser = false,
  subscription,
  handleWithdrawal,
  dailySessionCount = 0,
  canStartSession = true,
  referralCount = 0,
  referralBonus = 0
}: SummaryPanelProps) => {
  
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(Math.max(0, balance));
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [effectiveSubscription, setEffectiveSubscription] = useState(subscription);
  const [effectiveDailyLimit, setEffectiveDailyLimit] = useState(
    SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5
  );
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestBalanceRef = useRef(balance);
  
  useEffect(() => {
    console.log("Balance prop changed to:", balance);
    latestBalanceRef.current = balance;
    setDisplayBalance(Math.max(0, balance));
  }, [balance]);
  
  useEffect(() => {
    // Vérifier si le mode Pro temporaire est activé
    const proTrialActive = localStorage.getItem('proTrialActive') === 'true';
    const proTrialExpires = localStorage.getItem('proTrialExpires');
    
    if (proTrialActive && proTrialExpires) {
      const expiryTime = parseInt(proTrialExpires, 10);
      const now = Date.now();
      
      if (now < expiryTime) {
        setEffectiveSubscription('pro');
        setEffectiveDailyLimit(SUBSCRIPTION_LIMITS['pro']);
      } else {
        // Si expiré, nettoyer le localStorage
        localStorage.removeItem('proTrialActive');
        localStorage.removeItem('proTrialExpires');
        setEffectiveSubscription(subscription);
        setEffectiveDailyLimit(SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5);
      }
    } else {
      setEffectiveSubscription(subscription);
      setEffectiveDailyLimit(SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5);
    }
    
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [subscription]);
  
  // Cette variable doit être calculée avec la limite effective, pas la limite de base
  const currentlyCanStartSession = canStartSession && (latestBalanceRef.current < effectiveDailyLimit);
  
  const onWithdraw = () => {
    if (isButtonDisabled || isWithdrawing) return;
    
    setIsButtonDisabled(true);
    setIsWithdrawing(true);
    
    try {
      if (handleWithdrawal) {
        handleWithdrawal();
      } else {
        if (subscription === 'freemium' && effectiveSubscription === 'freemium') {
          toast({
            title: "Demande refusée",
            description: "Les retraits sont disponibles uniquement pour les abonnements payants. Veuillez mettre à niveau votre compte.",
            variant: "destructive"
          });
        } else if (displayBalance < 100) {
          toast({
            title: "Montant insuffisant",
            description: "Le montant minimum de retrait est de 100€. Continuez à gagner plus de revenus.",
            variant: "destructive"
          });
        } else {
          const fee = 0.15;
          const feeAmount = displayBalance * fee;
          const netAmount = displayBalance - feeAmount;
          
          toast({
            title: "Demande de retrait acceptée",
            description: `Votre retrait de ${netAmount.toFixed(2)}€ (après frais de ${(fee * 100).toFixed(0)}%) sera traité dans 10-15 jours ouvrables.`,
          });
        }
      }
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du retrait. Veuillez réessayer plus tard.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setIsWithdrawing(false);
        setIsButtonDisabled(false);
      }, 2000);
    }
  };

  const onBoostClick = () => {
    if (isButtonDisabled || isStartingSession || !currentlyCanStartSession) return;
    
    // Utiliser la limite effective pour la vérification
    if (latestBalanceRef.current >= effectiveDailyLimit) {
      toast({
        title: "Limite journalière atteinte",
        description: `Vous avez atteint votre limite de gain journalier de ${effectiveDailyLimit}€. Revenez demain ou passez à un forfait supérieur.`,
        variant: "destructive"
      });
      return;
    }
    
    setIsButtonDisabled(true);
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    handleStartSession();
    
    clickTimeoutRef.current = setTimeout(() => {
      setIsButtonDisabled(false);
    }, 3000);
  };
  
  const remainingSessions = subscription === 'freemium' && effectiveSubscription === 'freemium' 
    ? Math.max(0, 1 - dailySessionCount!) 
    : 'illimitées';

  return (
    <div className="bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-8">
      <WelcomeMessage isNewUser={isNewUser} />
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <UserBalanceCard 
            displayBalance={displayBalance}
            subscription={effectiveSubscription}
            dailyLimit={effectiveDailyLimit}
            sessionsDisplay={subscription === 'freemium' && effectiveSubscription === 'freemium'
              ? `${remainingSessions} session${remainingSessions !== 1 ? 's' : ''} restante${remainingSessions !== 1 ? 's' : ''}`
              : 'Sessions illimitées'}
            referralCount={referralCount}
            referralBonus={referralBonus}
          />
          
          <ActionButtons 
            canStartSession={currentlyCanStartSession}
            isButtonDisabled={isButtonDisabled}
            isStartingSession={isStartingSession}
            isWithdrawing={isWithdrawing}
            subscription={subscription}
            currentBalance={displayBalance}
            dailyLimit={effectiveDailyLimit}
            onBoostClick={onBoostClick}
            onWithdraw={onWithdraw}
          />
          
          <ReferralLink referralLink={referralLink} />
        </div>
        
        <SystemTerminal 
          isNewUser={isNewUser}
          dailyLimit={effectiveDailyLimit}
          subscription={subscription}
          remainingSessions={remainingSessions}
          referralCount={referralCount}
          displayBalance={displayBalance}
          referralBonus={referralBonus}
        />
      </div>
    </div>
  );
};

export default SummaryPanel;

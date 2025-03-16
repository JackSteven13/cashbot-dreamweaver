
import React, { useState, useEffect, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import UserBalanceCard from './UserBalanceCard';
import ActionButtons from './ActionButtons';
import ReferralLink from './ReferralLink';
import SystemTerminal from './SystemTerminal';
import WelcomeMessage from './WelcomeMessage';
import { SUBSCRIPTION_LIMITS } from './constants';

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
  referralCount = 0
}: SummaryPanelProps) => {
  
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(Math.max(0, balance));
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update the displayed balance when the balance prop changes
  useEffect(() => {
    console.log("Balance prop changed to:", balance);
    setDisplayBalance(Math.max(0, balance));
  }, [balance]);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);
  
  const onWithdraw = () => {
    if (isButtonDisabled || isWithdrawing) return;
    
    setIsButtonDisabled(true);
    setIsWithdrawing(true);
    
    try {
      // Simulate withdrawal process
      if (handleWithdrawal) {
        handleWithdrawal();
      } else {
        // Fallback if handleWithdrawal is not provided
        if (subscription === 'freemium') {
          toast({
            title: "Demande refusée",
            description: "Les retraits sont disponibles uniquement pour les abonnements payants. Veuillez mettre à niveau votre compte.",
            variant: "destructive"
          });
        } else if (displayBalance < 100) { // Mise à jour du montant minimum
          toast({
            title: "Montant insuffisant",
            description: "Le montant minimum de retrait est de 100€. Continuez à gagner plus de revenus.",
            variant: "destructive"
          });
        } else {
          // Calculer les frais de retrait (simplification)
          const fee = 0.15; // Taux standard par défaut
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
      // Re-enable button and reset withdrawal state after a delay
      setTimeout(() => {
        setIsWithdrawing(false);
        setIsButtonDisabled(false);
      }, 2000);
    }
  };

  // Handle boost button click with debounce to prevent multiple rapid clicks
  const onBoostClick = () => {
    if (isButtonDisabled || isStartingSession || !canStartSession) return;
    
    // Disable button immediately
    setIsButtonDisabled(true);
    
    // Clear any existing timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    // Call the handleStartSession function
    handleStartSession();
    
    // Re-enable button after a delay
    clickTimeoutRef.current = setTimeout(() => {
      setIsButtonDisabled(false);
    }, 3000);
  };

  // Obtenir la limite de gain pour l'abonnement actuel
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Calculer les sessions restantes
  const remainingSessions = subscription === 'freemium' ? Math.max(0, 1 - dailySessionCount!) : 'illimitées';
  const sessionsDisplay = subscription === 'freemium' 
    ? `${remainingSessions} session${remainingSessions !== 1 ? 's' : ''} restante${remainingSessions !== 1 ? 's' : ''}`
    : 'Sessions illimitées';

  return (
    <div className="neuro-panel mb-8">
      <WelcomeMessage isNewUser={isNewUser} />
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column */}
        <div className="flex-1">
          <UserBalanceCard 
            displayBalance={displayBalance}
            subscription={subscription}
            dailyLimit={dailyLimit}
            sessionsDisplay={sessionsDisplay}
            referralCount={referralCount}
          />
          
          <ActionButtons 
            canStartSession={canStartSession}
            isButtonDisabled={isButtonDisabled}
            isStartingSession={isStartingSession}
            isWithdrawing={isWithdrawing}
            onBoostClick={onBoostClick}
            onWithdraw={onWithdraw}
          />
          
          <ReferralLink referralLink={referralLink} />
        </div>
        
        {/* Right Column - AI Terminal */}
        <SystemTerminal 
          isNewUser={isNewUser}
          dailyLimit={dailyLimit}
          subscription={subscription}
          remainingSessions={remainingSessions}
          referralCount={referralCount}
          displayBalance={displayBalance}
        />
      </div>
    </div>
  );
};

export default SummaryPanel;

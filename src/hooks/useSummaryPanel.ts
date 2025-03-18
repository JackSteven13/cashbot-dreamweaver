
import { useState, useEffect, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscriptionUtils';

interface UseSummaryPanelProps {
  balance: number;
  subscription: string;
  handleWithdrawal?: () => void;
  handleStartSession: () => void;
}

export const useSummaryPanel = ({
  balance,
  subscription,
  handleWithdrawal,
  handleStartSession
}: UseSummaryPanelProps) => {
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

  const onBoostClick = (canStartSession: boolean) => {
    // Vérifier si c'est un utilisateur en mode Pro temporaire
    const proTrialActive = localStorage.getItem('proTrialActive') === 'true';
    const proTrialExpires = localStorage.getItem('proTrialExpires');
    let currentEffectiveLimit = effectiveDailyLimit;
    
    if (proTrialActive && proTrialExpires) {
      const expiryTime = parseInt(proTrialExpires, 10);
      const now = Date.now();
      
      if (now < expiryTime) {
        // Si en mode Pro, utiliser la limite Pro
        currentEffectiveLimit = SUBSCRIPTION_LIMITS['pro'];
      }
    }
    
    const currentlyCanStartSession = canStartSession && (latestBalanceRef.current < currentEffectiveLimit);
    
    if (isButtonDisabled || isWithdrawing || !currentlyCanStartSession) return;
    
    // Utiliser la limite effective pour la vérification
    if (latestBalanceRef.current >= currentEffectiveLimit) {
      toast({
        title: "Limite journalière atteinte",
        description: `Vous avez atteint votre limite de gain journalier de ${currentEffectiveLimit}€. Revenez demain ou passez à un forfait supérieur.`,
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
  
  const calculateRemainingSessions = (subscriptionType: string, dailySessionCount = 0) => {
    return subscriptionType === 'freemium' && effectiveSubscription === 'freemium' 
      ? Math.max(0, 1 - dailySessionCount) 
      : 'illimitées';
  };
  
  const getCurrentlyCanStartSession = (canStartSession: boolean) => {
    // Vérifier si utilisateur est en mode Pro temporaire
    const proTrialActive = localStorage.getItem('proTrialActive') === 'true';
    const proTrialExpires = localStorage.getItem('proTrialExpires');
    let currentEffectiveLimit = effectiveDailyLimit;
    
    if (proTrialActive && proTrialExpires) {
      const expiryTime = parseInt(proTrialExpires, 10);
      const now = Date.now();
      
      if (now < expiryTime) {
        // Si en mode Pro, utiliser la limite Pro
        currentEffectiveLimit = SUBSCRIPTION_LIMITS['pro'];
      }
    }
    
    return canStartSession && (latestBalanceRef.current < currentEffectiveLimit);
  };

  return {
    displayBalance,
    isButtonDisabled,
    isWithdrawing,
    effectiveSubscription,
    effectiveDailyLimit,
    latestBalanceRef,
    onWithdraw,
    onBoostClick,
    calculateRemainingSessions,
    getCurrentlyCanStartSession
  };
};

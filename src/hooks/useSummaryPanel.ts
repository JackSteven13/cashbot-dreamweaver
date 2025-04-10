
import { useState, useEffect, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscriptionUtils';
import { 
  isWithdrawalAllowed, 
  getWithdrawalThreshold, 
  calculateReferralToReachThreshold 
} from '@/utils/referral/withdrawalUtils';

interface UseSummaryPanelProps {
  balance: number;
  subscription: string;
  handleWithdrawal?: () => void;
  handleStartSession: () => void;
  referralCount?: number;
}

export const useSummaryPanel = ({
  balance,
  subscription,
  handleWithdrawal,
  handleStartSession,
  referralCount = 0
}: UseSummaryPanelProps) => {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(Math.max(0, balance));
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [effectiveSubscription, setEffectiveSubscription] = useState(subscription);
  const [effectiveDailyLimit, setEffectiveDailyLimit] = useState(
    SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5
  );
  const [withdrawalThreshold, setWithdrawalThreshold] = useState(
    getWithdrawalThreshold(subscription)
  );
  const [referralSuggestion, setReferralSuggestion] = useState<{
    amountNeeded: number;
    estimatedReferrals: number;
  } | null>(null);
  
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestBalanceRef = useRef(balance);
  
  useEffect(() => {
    console.log("Balance prop changed to:", balance);
    latestBalanceRef.current = balance;
    setDisplayBalance(Math.max(0, balance));
    
    // Calculer les suggestions de parrainage
    const suggestion = calculateReferralToReachThreshold(subscription, balance);
    setReferralSuggestion(suggestion);
    
    // Mettre à jour le seuil de retrait
    const threshold = getWithdrawalThreshold(subscription);
    setWithdrawalThreshold(threshold);
  }, [balance, subscription]);
  
  useEffect(() => {
    // Vérifier l'abonnement effectif (avec essai Pro)
    const effectiveSub = getEffectiveSubscription(subscription);
    console.log("Abonnement effectif:", effectiveSub, "Original:", subscription);
    setEffectiveSubscription(effectiveSub);
    
    // Mettre à jour la limite journalière effective
    const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    console.log("Limite journalière effective:", limit);
    setEffectiveDailyLimit(limit);
    
    // Mettre à jour le seuil de retrait
    const threshold = getWithdrawalThreshold(effectiveSub);
    setWithdrawalThreshold(threshold);
    
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
      // Vérifier le seuil minimum de retrait
      if (displayBalance < withdrawalThreshold) {
        toast({
          title: "Montant insuffisant",
          description: `Le montant minimum de retrait est de ${withdrawalThreshold}€. Votre solde actuel est de ${displayBalance.toFixed(2)}€.`,
          variant: "destructive"
        });
        setIsWithdrawing(false);
        setIsButtonDisabled(false);
        return;
      }
      
      // Vérifier si les retraits sont autorisés pour cet abonnement avec ce nombre de parrainages
      const withdrawalAllowed = isWithdrawalAllowed(subscription, referralCount);
      if (!withdrawalAllowed) {
        if (subscription === 'freemium') {
          toast({
            title: "Retrait impossible",
            description: "Les utilisateurs freemium doivent parrainer au moins une personne pour pouvoir retirer leurs fonds.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Demande refusée",
            description: "Les retraits sont disponibles uniquement pour les abonnements payants ou avec parrainages. Veuillez mettre à niveau votre compte.",
            variant: "destructive"
          });
        }
        setIsWithdrawing(false);
        setIsButtonDisabled(false);
        return;
      }
      
      if (handleWithdrawal) {
        handleWithdrawal();
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
    // Utiliser la limite effective pour la vérification
    const currentlyCanStartSession = canStartSession && (latestBalanceRef.current < effectiveDailyLimit);
    
    if (isButtonDisabled || isWithdrawing || !currentlyCanStartSession) return;
    
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
  
  const calculateRemainingSessions = (subscriptionType: string, dailySessionCount = 0): number | string => {
    return subscriptionType === 'freemium' && effectiveSubscription === 'freemium' 
      ? Math.max(0, 1 - dailySessionCount) 
      : 'illimitées';
  };
  
  const getCurrentlyCanStartSession = (canStartSession: boolean): boolean => {
    return canStartSession && (latestBalanceRef.current < effectiveDailyLimit);
  };

  return {
    displayBalance,
    isButtonDisabled,
    isWithdrawing,
    effectiveSubscription,
    effectiveDailyLimit,
    withdrawalThreshold,
    latestBalanceRef,
    referralSuggestion,
    onWithdraw,
    onBoostClick,
    calculateRemainingSessions,
    getCurrentlyCanStartSession
  };
};

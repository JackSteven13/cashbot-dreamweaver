import { useRef, useState, useEffect } from 'react';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscriptionUtils';
import { createMoneyParticles } from '@/utils/animations';

interface UseActionButtonsProps {
  subscription: string;
  dailyLimit: number;
  currentBalance: number;
  isButtonDisabled: boolean;
  isStartingSession: boolean;
  isWithdrawing: boolean;
  onBoostClick: () => void;
  onWithdraw: () => void;
}

export const useActionButtons = ({
  subscription,
  dailyLimit,
  currentBalance,
  isButtonDisabled,
  isStartingSession,
  isWithdrawing,
  onBoostClick,
  onWithdraw
}: UseActionButtonsProps) => {
  const [effectiveSubscription, setEffectiveSubscription] = useState(subscription);
  const [effectiveLimit, setEffectiveLimit] = useState(dailyLimit);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    const effectiveSub = getEffectiveSubscription(subscription);
    console.log("ActionButtons - Abonnement effectif:", effectiveSub);
    setEffectiveSubscription(effectiveSub);
    
    const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    console.log("ActionButtons - Limite effective:", limit);
    setEffectiveLimit(limit);
    
    audioRef.current = new Audio('/sounds/button-click.mp3');
    successAudioRef.current = new Audio('/sounds/cash-register.mp3');
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (successAudioRef.current) {
        successAudioRef.current.pause();
        successAudioRef.current = null;
      }
    };
  }, [subscription, dailyLimit]);
  
  const limitReached = currentBalance >= effectiveLimit;
  
  const limitPercentage = Math.min(100, (currentBalance / effectiveLimit) * 100);
  
  const canStartSessionNow = effectiveSubscription !== 'freemium' ? !limitReached : true;
  
  const handleBoostClick = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Error playing audio:", e));
    }
    
    if (buttonRef.current) {
      createMoneyParticles(buttonRef.current, 8);
    }
    
    setTimeout(() => {
      if (successAudioRef.current) {
        successAudioRef.current.currentTime = 0;
        successAudioRef.current.play().catch(e => console.error("Error playing success audio:", e));
      }
    }, 1000);
    
    onBoostClick();
  };

  return {
    effectiveSubscription,
    effectiveLimit,
    limitReached,
    limitPercentage,
    canStartSessionNow,
    buttonRef,
    handleBoostClick
  };
};


import React, { useEffect, useState, useRef } from 'react';
import { ArrowUpCircle, Clock, PlayCircle, AlertTriangle, Activity, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscriptionUtils';
import { createMoneyParticles } from '@/utils/animations';

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
  onWithdraw
}) => {
  const [effectiveSubscription, setEffectiveSubscription] = useState(subscription);
  const [effectiveLimit, setEffectiveLimit] = useState(dailyLimit);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Vérifier l'abonnement effectif et la limite journalière
  useEffect(() => {
    const effectiveSub = getEffectiveSubscription(subscription);
    console.log("ActionButtons - Abonnement effectif:", effectiveSub);
    setEffectiveSubscription(effectiveSub);
    
    // Utiliser la limite correspondant à l'abonnement effectif
    const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    console.log("ActionButtons - Limite effective:", limit);
    setEffectiveLimit(limit);
    
    // Initialize audio elements
    audioRef.current = new Audio('/sounds/button-click.mp3');
    successAudioRef.current = new Audio('/sounds/cash-register.mp3');
    
    return () => {
      // Cleanup audio resources
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
  
  // Vérifier si la limite est atteinte - check against the actual current balance
  const limitReached = currentBalance >= effectiveLimit;
  
  // Calculer le pourcentage de la limite atteinte pour l'affichage visuel
  const limitPercentage = Math.min(100, (currentBalance / effectiveLimit) * 100);
  
  // Vérifier si on peut démarrer une session en tenant compte de l'abonnement effectif
  const canStartSessionNow = effectiveSubscription !== 'freemium' ? !limitReached : canStartSession;
  
  // Handle boost click with animations
  const handleBoostClick = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Error playing audio:", e));
    }
    
    // Create money particles using the utility function
    if (buttonRef.current) {
      createMoneyParticles(buttonRef.current, 15);
    }
    
    // Play success sound after the process is "complete"
    setTimeout(() => {
      if (successAudioRef.current) {
        successAudioRef.current.currentTime = 0;
        successAudioRef.current.play().catch(e => console.error("Error playing success audio:", e));
      }
    }, 1000);
    
    onBoostClick();
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-3 mb-6">
        {/* Rangée de boutons principale avec layout amélioré */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="w-full">
            {canStartSessionNow && !limitReached ? (
              <Button 
                ref={buttonRef}
                size="lg" 
                className={`w-full bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] hover:from-[#8B5CF6] hover:to-[#6C53AF] text-white relative overflow-hidden shadow-md ${isStartingSession ? 'boost-button-active' : 'boost-button-pulse'}`}
                disabled={isButtonDisabled || isStartingSession || limitReached}
                onClick={handleBoostClick}
              >
                {/* Indicateur visuel de progression vers la limite */}
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-white/50" 
                  style={{ width: `${limitPercentage}%` }}
                />
                
                {isStartingSession ? (
                  <span className="flex items-center">
                    <Activity className="animate-pulse mr-2 h-5 w-5" />
                    <span className="processing-dots">Analyse en cours</span>
                  </span>
                ) : limitReached ? (
                  <span className="flex items-center">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Limite journalière atteinte
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Zap className="mr-2 h-5 w-5" />
                    Boost manuel
                  </span>
                )}
                
                {/* Glow effect when inactive but ready */}
                {!isStartingSession && !limitReached && (
                  <span className="absolute inset-0 rounded-md blur opacity-25 bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] animate-pulse"></span>
                )}
              </Button>
            ) : (
              <Button 
                size="lg" 
                className="w-full bg-slate-300 hover:bg-slate-300 text-slate-600 cursor-not-allowed shadow-md"
                disabled={true}
              >
                {limitReached ? (
                  <span className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Limite journalière atteinte
                  </span>
                ) : (
                  <span className="flex items-center">
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Boost manuel
                  </span>
                )}
              </Button>
            )}
          </div>
          
          <div className="w-full">
            <Button 
              size="lg" 
              variant="outline"
              className="w-full border-slate-500 text-slate-600 hover:bg-slate-50 shadow-sm whitespace-normal h-auto py-2 transition-all duration-300 hover:border-[#9b87f5] hover:text-[#9b87f5]"
              disabled={isWithdrawing || isButtonDisabled}
              onClick={onWithdraw}
            >
              <ArrowUpCircle className="mr-2 h-4 w-4 flex-shrink-0" />
              {isWithdrawing ? (
                <span className="flex items-center">
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-slate-500 border-t-transparent rounded-full"></span>
                  Traitement...
                </span>
              ) : (
                <span>Retirer les fonds</span>
              )}
            </Button>
          </div>
        </div>

        {/* Bouton d'accès aux offres toujours visible */}
        <div className="mt-1">
          <Link to="/offres" className="w-full block">
            <Button 
              size="lg" 
              className="w-full bg-gradient-to-r from-[#1A1F2C] to-[#1e3a5f] hover:from-[#1e3a5f] hover:to-[#1A1F2C] text-white shadow-md transition-all duration-300 transform hover:scale-105"
            >
              {limitReached ? "Augmenter votre limite" : "Voir les offres disponibles"}
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Audio elements for sound effects */}
      <audio id="button-click" src="/sounds/button-click.mp3" preload="auto" />
      <audio id="cash-register" src="/sounds/cash-register.mp3" preload="auto" />
    </>
  );
};

export default ActionButtons;

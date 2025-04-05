
import React, { useEffect, useRef, useState } from 'react';
import { Bot, BotOff } from 'lucide-react';

interface BalanceDisplayProps {
  displayBalance: number;
  balanceAnimating: boolean;
  animatedBalance: number;
  previousBalance: number;
  referralBonus?: number;
  totalGeneratedBalance?: number;
  isBotActive?: boolean;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  displayBalance,
  balanceAnimating,
  animatedBalance,
  previousBalance,
  referralBonus = 0,
  totalGeneratedBalance = 0,
  isBotActive = true
}) => {
  // Ensure we have valid numbers for displaying
  const safeReferralBonus = referralBonus ?? 0;
  const safeTotalGeneratedBalance = totalGeneratedBalance ?? (displayBalance * 1.2);
  
  // Gestion de l'état local du solde pour les animations
  const [localDisplayBalance, setLocalDisplayBalance] = useState(displayBalance);
  
  // Format numbers safely
  const formattedBalance = localDisplayBalance.toFixed(2);
  const formattedAnimatedBalance = animatedBalance.toFixed(2);
  const formattedPreviousBalance = previousBalance.toFixed(2);
  const formattedTotalGenerated = safeTotalGeneratedBalance.toFixed(2);
  const formattedReferralBonus = safeReferralBonus.toFixed(2);
  
  // Calculate if gain happened
  const isGain = animatedBalance > previousBalance;
  
  // Ref pour la fonction d'animation
  const balanceRef = useRef<HTMLDivElement>(null);

  // State local pour suivre l'état du bot
  const [localBotActive, setLocalBotActive] = useState(isBotActive);
  
  // Mettre à jour le solde local quand le solde externe change
  useEffect(() => {
    setLocalDisplayBalance(displayBalance);
  }, [displayBalance]);
  
  // Ajouter la classe pour le ciblage des animations
  useEffect(() => {
    if (balanceRef.current) {
      balanceRef.current.classList.add('balance-display');
    }
  }, []);
  
  // Écouter les événements de changement d'état du bot
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        console.log(`BalanceDisplay received bot status update: ${isActive ? 'active' : 'inactive'}`);
        setLocalBotActive(isActive);
      }
    };
    
    // Écouter les mises à jour forcées du solde
    const handleForceBalanceUpdate = (event: CustomEvent) => {
      const newBalance = event.detail?.newBalance;
      if (typeof newBalance === 'number') {
        console.log("Force balance update received:", newBalance);
        // Immédiatement mettre à jour l'affichage sans attente
        setLocalDisplayBalance(newBalance);
      }
    };
    
    // Écouter les mises à jour normales du solde pour l'animation
    const handleBalanceUpdate = (event: CustomEvent) => {
      const amount = event.detail?.amount;
      const currentBalance = event.detail?.currentBalance;
      if (typeof amount === 'number' && typeof currentBalance === 'number') {
        // Plutôt que de simplement mettre à jour le solde, nous allons animer
        console.log(`Balance update received: +${amount} to ${currentBalance}`);
        const startVal = localDisplayBalance;
        const endVal = currentBalance;
        animateBalance(startVal, endVal, 1000); // 1 seconde d'animation
      }
    };
    
    // Fonction pour animer le changement de solde
    const animateBalance = (start: number, end: number, duration: number) => {
      const startTime = Date.now();
      
      const updateFrame = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        
        if (elapsed < duration) {
          const progress = elapsed / duration;
          const currentValue = start + (end - start) * progress;
          setLocalDisplayBalance(currentValue);
          requestAnimationFrame(updateFrame);
        } else {
          setLocalDisplayBalance(end);
        }
      };
      
      requestAnimationFrame(updateFrame);
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    window.addEventListener('balance:force-update' as any, handleForceBalanceUpdate);
    window.addEventListener('balance:update' as any, handleBalanceUpdate);
    
    // Synchroniser avec la prop isBotActive au montage et lorsqu'elle change
    setLocalBotActive(isBotActive);
    
    // Récupérer le solde dans le localStorage si disponible
    const storedBalance = localStorage.getItem('currentBalance');
    if (storedBalance) {
      const parsedBalance = parseFloat(storedBalance);
      if (!isNaN(parsedBalance) && parsedBalance > localDisplayBalance) {
        console.log("Restoring balance from localStorage:", parsedBalance);
        setLocalDisplayBalance(parsedBalance);
      }
    }
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('balance:force-update' as any, handleForceBalanceUpdate);
      window.removeEventListener('balance:update' as any, handleBalanceUpdate);
    };
  }, [isBotActive, localDisplayBalance]);

  // Function to toggle bot status manually (useful for debugging)
  const handleBotToggle = () => {
    const newStatus = !localBotActive;
    setLocalBotActive(newStatus);
    
    // Dispatch global event to sync state across components
    window.dispatchEvent(new CustomEvent('bot:external-status-change', {
      detail: { active: newStatus }
    }));
  };
  
  return (
    <div className="pt-4 pb-6 text-center" ref={balanceRef}>
      <div className="relative">
        <h3 className="text-md opacity-80 mb-1">Solde actuel</h3>
        <div className="flex items-center justify-center">
          <div className="text-5xl font-bold">
            <span className={`transition-colors duration-300 ${balanceAnimating ? (isGain ? 'text-green-300' : 'text-red-300') : 'text-white'}`}>
              {balanceAnimating ? formattedAnimatedBalance : formattedBalance}
            </span>
            <span className="text-2xl ml-0.5">€</span>
          </div>
        </div>
        
        <div className="text-xs text-green-300 mt-2">
          <div className="flex flex-wrap justify-center gap-1 px-2">
            <span>Bonus parrainage: {formattedReferralBonus}€</span>
            <span className="hidden sm:inline">|</span>
            <span>Total généré: {formattedTotalGenerated}€</span>
          </div>
        </div>
        
        {/* Amélioration de l'indicateur de l'état du bot avec option de clic pour basculer */}
        <div 
          className="mt-3 flex items-center justify-center gap-1 cursor-pointer" 
          onClick={handleBotToggle}
          title="Cliquez pour activer/désactiver le bot"
        >
          {localBotActive ? (
            <>
              <Bot size={14} className="text-blue-500" />
              <span className="text-xs text-blue-400 blink-activity">
                Analyse en cours
              </span>
            </>
          ) : (
            <>
              <BotOff size={14} className="text-red-500" />
              <span className="text-xs text-red-300">
                Analyse inactive
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceDisplay;

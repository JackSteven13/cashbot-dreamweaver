
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
  const lastAmountRef = useRef<number>(0);
  const highestBalanceRef = useRef<number>(displayBalance);
  
  // Restore from localStorage when component mounts
  useEffect(() => {
    try {
      const storedBalance = localStorage.getItem('currentBalance');
      if (storedBalance) {
        const parsedBalance = parseFloat(storedBalance);
        if (!isNaN(parsedBalance) && parsedBalance >= 0) {
          console.log(`[BalanceDisplay] Restoring balance from localStorage: ${parsedBalance}`);
          highestBalanceRef.current = parsedBalance;
          setLocalDisplayBalance(parsedBalance);
          
          // Déclencher un événement de synchronisation pour informer les autres composants
          window.dispatchEvent(new CustomEvent('balance:sync-request', { 
            detail: { balance: parsedBalance }
          }));
        }
      }
    } catch (e) {
      console.error("Failed to restore balance from localStorage:", e);
    }
  }, []);
  
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
    if (displayBalance > highestBalanceRef.current) {
      // Si le solde affiché est plus élevé que notre plus haut solde, mettre à jour
      console.log(`[BalanceDisplay] Updating local balance from ${highestBalanceRef.current} to higher value ${displayBalance}`);
      highestBalanceRef.current = displayBalance;
      setLocalDisplayBalance(displayBalance);
      
      // Persister dans localStorage
      try {
        localStorage.setItem('currentBalance', displayBalance.toString());
        localStorage.setItem('lastKnownBalance', displayBalance.toString());
        localStorage.setItem('highestBalance', displayBalance.toString());
      } catch (e) {
        console.error("Failed to persist display balance:", e);
      }
    } else {
      // Si le solde externe est plus petit, vérifier localStorage avant de mettre à jour
      try {
        const storedBalance = localStorage.getItem('highestBalance') || localStorage.getItem('currentBalance');
        if (storedBalance) {
          const parsedBalance = parseFloat(storedBalance);
          if (!isNaN(parsedBalance)) {
            // Toujours utiliser la valeur maximale entre le stockage local et l'état actuel
            const maxBalance = Math.max(parsedBalance, highestBalanceRef.current, localDisplayBalance);
            if (maxBalance > localDisplayBalance) {
              console.log(`[BalanceDisplay] Using higher balance value: ${maxBalance}`);
              highestBalanceRef.current = maxBalance;
              setLocalDisplayBalance(maxBalance);
            }
          }
        }
      } catch (e) {
        console.error("Failed to check localStorage balance:", e);
      }
    }
  }, [displayBalance, localDisplayBalance]);
  
  // Ajouter la classe pour le ciblage des animations
  useEffect(() => {
    if (balanceRef.current) {
      balanceRef.current.classList.add('balance-display');
    }
  }, []);
  
  // Écouter les événements de changement d'état du bot et de solde
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        console.log(`[BalanceDisplay] Received bot status update: ${isActive ? 'active' : 'inactive'}`);
        setLocalBotActive(isActive);
      }
    };
    
    // Écouter les mises à jour forcées du solde
    const handleForceBalanceUpdate = (event: CustomEvent) => {
      const newBalance = event.detail?.newBalance;
      if (typeof newBalance === 'number' && newBalance >= 0) {
        // Ne mettre à jour que si le nouveau solde est plus élevé
        if (newBalance > highestBalanceRef.current) {
          console.log(`[BalanceDisplay] Force balance update received: ${newBalance}`);
          highestBalanceRef.current = newBalance;
          setLocalDisplayBalance(newBalance);
          
          // Sauvegarder la nouvelle valeur dans localStorage
          try {
            localStorage.setItem('currentBalance', newBalance.toString());
            localStorage.setItem('lastKnownBalance', newBalance.toString());
            localStorage.setItem('highestBalance', newBalance.toString());
          } catch (e) {
            console.error("Failed to save forced balance update to localStorage:", e);
          }
        } else {
          console.log(`[BalanceDisplay] Ignored lower balance update: ${newBalance} < ${highestBalanceRef.current}`);
        }
      }
    };
    
    // Écouter les mises à jour normales du solde pour l'animation
    const handleBalanceUpdate = (event: CustomEvent) => {
      const amount = event.detail?.amount;
      const currentBalance = event.detail?.currentBalance;
      
      if (typeof amount === 'number') {
        lastAmountRef.current = amount;
      }
      
      // Calculer le solde après mise à jour
      let newBalance = localDisplayBalance;
      
      if (typeof currentBalance === 'number' && currentBalance >= 0) {
        // Garantir que le solde ne diminue jamais
        newBalance = Math.max(highestBalanceRef.current, localDisplayBalance, currentBalance);
      } else if (typeof amount === 'number') {
        // Ajouter le montant au solde actuel
        newBalance = localDisplayBalance + amount;
      }
      
      // Ne mettre à jour que si le nouveau solde est plus élevé
      if (newBalance > highestBalanceRef.current) {
        console.log(`[BalanceDisplay] Animating balance update: ${localDisplayBalance} to ${newBalance}`);
        highestBalanceRef.current = newBalance;
        
        // Plutôt que de simplement mettre à jour le solde, nous allons animer
        animateBalance(localDisplayBalance, newBalance, 1000); // 1 seconde d'animation
      } else {
        console.log(`[BalanceDisplay] Ignored lower balance update: ${newBalance} <= ${highestBalanceRef.current}`);
      }
    };
    
    // Fonction pour animer le changement de solde
    const animateBalance = (start: number, end: number, duration: number) => {
      // N'animer que vers le haut
      if (end <= start) return;
      
      // Sauvegarder immédiatement dans localStorage
      try {
        localStorage.setItem('currentBalance', end.toString());
        localStorage.setItem('lastKnownBalance', end.toString());
        localStorage.setItem('highestBalance', end.toString());
      } catch (e) {
        console.error("Failed to save animated balance to localStorage:", e);
      }
      
      const startTime = Date.now();
      
      const updateFrame = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        
        if (elapsed < duration) {
          const progress = elapsed / duration;
          const currentValue = start + (end - start) * progress;
          setLocalDisplayBalance(parseFloat(currentValue.toFixed(2)));
          requestAnimationFrame(updateFrame);
        } else {
          setLocalDisplayBalance(parseFloat(end.toFixed(2)));
          
          // Après avoir terminé l'animation, déclencher un événement pour synchroniser les autres composants
          window.dispatchEvent(new CustomEvent('balance:local-update', {
            detail: { balance: end }
          }));
        }
      };
      
      requestAnimationFrame(updateFrame);
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    window.addEventListener('balance:force-update' as any, handleForceBalanceUpdate);
    window.addEventListener('balance:update' as any, handleBalanceUpdate);
    
    // Synchroniser avec la prop isBotActive au montage et lorsqu'elle change
    setLocalBotActive(isBotActive);
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('balance:force-update' as any, handleForceBalanceUpdate);
      window.removeEventListener('balance:update' as any, handleBalanceUpdate);
    };
  }, [isBotActive, localDisplayBalance]);

  // Function to toggle bot status manually
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

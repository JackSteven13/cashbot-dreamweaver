
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
      // Toujours privilégier 'highestBalance' pour une constance dans l'affichage
      const storedHighestBalance = localStorage.getItem('highestBalance');
      const storedBalance = localStorage.getItem('currentBalance');
      
      if (storedHighestBalance) {
        const parsedHighestBalance = parseFloat(storedHighestBalance);
        if (!isNaN(parsedHighestBalance)) {
          console.log(`[BalanceDisplay] Restoring from highest balance: ${parsedHighestBalance}`);
          highestBalanceRef.current = parsedHighestBalance;
          setLocalDisplayBalance(parsedHighestBalance);
        }
      } else if (storedBalance) {
        const parsedBalance = parseFloat(storedBalance);
        if (!isNaN(parsedBalance) && parsedBalance >= 0) {
          console.log(`[BalanceDisplay] Restoring balance from localStorage: ${parsedBalance}`);
          highestBalanceRef.current = parsedBalance;
          setLocalDisplayBalance(parsedBalance);
          
          // Assurer la cohérence en créant aussi 'highestBalance'
          localStorage.setItem('highestBalance', parsedBalance.toString());
        }
      }
      
      // Déclencher un événement de synchronisation pour informer les autres composants
      window.dispatchEvent(new CustomEvent('balance:sync-request'));
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
    // Ne jamais permettre une baisse du solde affiché
    if (displayBalance > localDisplayBalance) {
      console.log(`[BalanceDisplay] Updating display balance from ${localDisplayBalance} to higher value ${displayBalance}`);
      setLocalDisplayBalance(displayBalance);
      
      // Mettre à jour aussi notre référence du maximum
      if (displayBalance > highestBalanceRef.current) {
        highestBalanceRef.current = displayBalance;
        
        // Persister dans localStorage
        try {
          localStorage.setItem('highestBalance', displayBalance.toString());
          localStorage.setItem('currentBalance', displayBalance.toString());
          localStorage.setItem('lastKnownBalance', displayBalance.toString());
        } catch (e) {
          console.error("Failed to persist display balance:", e);
        }
      }
    } else {
      console.log(`[BalanceDisplay] Ignoring lower balance update: ${displayBalance} < ${localDisplayBalance}`);
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
        if (newBalance > localDisplayBalance || newBalance > highestBalanceRef.current) {
          console.log(`[BalanceDisplay] Force balance update received: ${newBalance}`);
          
          const updatedBalance = Math.max(newBalance, localDisplayBalance, highestBalanceRef.current);
          highestBalanceRef.current = updatedBalance;
          
          // Utiliser animation pour transitions douces
          animateBalance(localDisplayBalance, updatedBalance, 800);
          
          // Sauvegarder la nouvelle valeur dans localStorage
          try {
            localStorage.setItem('currentBalance', updatedBalance.toString());
            localStorage.setItem('lastKnownBalance', updatedBalance.toString());
            localStorage.setItem('highestBalance', updatedBalance.toString());
          } catch (e) {
            console.error("Failed to save forced balance update to localStorage:", e);
          }
        } else {
          console.log(`[BalanceDisplay] Ignored lower balance update: ${newBalance} < ${Math.max(localDisplayBalance, highestBalanceRef.current)}`);
        }
      }
    };
    
    // Gestionnaire pour la synchronisation forcée des soldes
    const handleForceSyncBalance = (event: CustomEvent) => {
      const syncedBalance = event.detail?.balance;
      if (typeof syncedBalance === 'number' && syncedBalance > 0) {
        // Ne mettre à jour que si le solde synchronisé est plus élevé
        if (syncedBalance > localDisplayBalance || syncedBalance > highestBalanceRef.current) {
          console.log(`[BalanceDisplay] Force sync balance update: ${syncedBalance}`);
          
          const updatedBalance = Math.max(syncedBalance, localDisplayBalance, highestBalanceRef.current);
          highestBalanceRef.current = updatedBalance;
          
          // Utiliser animation pour transitions douces
          animateBalance(localDisplayBalance, updatedBalance, 800);
          
          // Sauvegarder dans localStorage
          localStorage.setItem('highestBalance', updatedBalance.toString());
          localStorage.setItem('currentBalance', updatedBalance.toString());
          localStorage.setItem('lastKnownBalance', updatedBalance.toString());
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
      if (newBalance > localDisplayBalance || newBalance > highestBalanceRef.current) {
        console.log(`[BalanceDisplay] Animating balance update: ${localDisplayBalance} to ${newBalance}`);
        
        // Mettre à jour notre référence du maximum
        highestBalanceRef.current = Math.max(newBalance, highestBalanceRef.current);
        
        // Plutôt que de simplement mettre à jour le solde, nous allons animer
        animateBalance(localDisplayBalance, newBalance, 1000); // 1 seconde d'animation
      } else {
        console.log(`[BalanceDisplay] Ignored lower balance update: ${newBalance} <= ${Math.max(localDisplayBalance, highestBalanceRef.current)}`);
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
        localStorage.setItem('highestBalance', Math.max(end, highestBalanceRef.current).toString());
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
    window.addEventListener('balance:force-sync' as any, handleForceSyncBalance);
    
    // Synchroniser avec la prop isBotActive au montage et lorsqu'elle change
    setLocalBotActive(isBotActive);
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('balance:force-update' as any, handleForceBalanceUpdate);
      window.removeEventListener('balance:update' as any, handleBalanceUpdate);
      window.removeEventListener('balance:force-sync' as any, handleForceSyncBalance);
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
            <span className={`transition-colors duration-300 ${balanceAnimating ? (isGain ? 'text-green-300' : 'text-white') : 'text-white'}`}>
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
